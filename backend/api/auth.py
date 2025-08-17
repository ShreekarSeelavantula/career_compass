import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import json
import hashlib
import secrets

from common.security import hash_password, verify_password
from es.repositories import UserRepository
from common.utils import generate_uuid

user_repo = UserRepository()

def generate_jwt_token(user_data):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'role': user_data['role'],
        'exp': datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION_DELTA),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_jwt_token(token):
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name', 'role']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        existing_user = user_repo.get_by_email(data['email'])
        if existing_user:
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate role
        if data['role'] not in ['seeker', 'recruiter', 'admin']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user_data = {
            'id': generate_uuid(),
            'email': data['email'],
            'password_hash': hash_password(data['password']),
            'full_name': data['full_name'],
            'role': data['role'],
            'headline': data.get('headline', ''),
            'skills': data.get('skills', []),
            'experience_years': data.get('experience_years'),
            'location': data.get('location', ''),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Save user to Elasticsearch
        created_user = user_repo.create(user_data)
        
        # Generate JWT token
        token = generate_jwt_token(created_user)
        
        # Remove password hash from response
        user_response = {k: v for k, v in created_user.items() if k != 'password_hash'}
        
        return Response({
            'user': user_response,
            'token': token
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user"""
    try:
        data = request.data
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user by email
        user = user_repo.get_by_email(email)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify password
        if not verify_password(password, user['password_hash']):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate JWT token
        token = generate_jwt_token(user)
        
        # Remove password hash from response
        user_response = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return Response({
            'user': user_response,
            'token': token
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def logout(request):
    """Logout user (client-side token removal)"""
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

@api_view(['GET'])
def me(request):
    """Get current user profile"""
    try:
        # Get user from token (middleware should set this)
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Remove password hash from response
        user_response = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return Response(user_response, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
