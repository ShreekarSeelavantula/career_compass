from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import json

from es.repositories import UserRepository
from storage.files import FileStorage
from ml.resume_parser import ResumeParser
from ml.embeddings import EmbeddingGenerator
from common.utils import generate_uuid

user_repo = UserRepository()
file_storage = FileStorage()
resume_parser = ResumeParser()
embedding_generator = EmbeddingGenerator()

@api_view(['PUT'])
def update_profile(request):
    """Update user profile"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data
        
        # Update allowed fields
        allowed_fields = ['full_name', 'headline', 'skills', 'experience_years', 'location']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if update_data:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            updated_user = user_repo.update(user_id, update_data)
            
            # Remove password hash from response
            user_response = {k: v for k, v in updated_user.items() if k != 'password_hash'}
            return Response(user_response, status=status.HTTP_200_OK)
        
        return Response({'message': 'No fields to update'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def upload_resume(request):
    """Upload and parse resume"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if 'resume' not in request.FILES:
            return Response({'error': 'Resume file is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        resume_file = request.FILES['resume']
        
        # Validate file type
        allowed_extensions = ['.pdf', '.docx']
        file_extension = resume_file.name.lower().split('.')[-1]
        if f'.{file_extension}' not in allowed_extensions:
            return Response({'error': 'Only PDF and DOCX files are allowed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique filename
        filename = f"resumes/{user_id}_{generate_uuid()}.{file_extension}"
        
        # Save file
        file_path = file_storage.save_file(resume_file, filename)
        
        # Parse resume
        resume_text = resume_parser.extract_text(resume_file)
        if not resume_text:
            return Response({'error': 'Failed to extract text from resume'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract skills and other information
        parsed_data = resume_parser.parse_resume(resume_text)
        
        # Generate embeddings
        resume_embedding = embedding_generator.generate_embedding(resume_text)
        
        # Update user with resume data
        update_data = {
            'resume_file_path': file_path,
            'resume_text': resume_text,
            'resume_vec': resume_embedding,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Update skills if found in resume
        if parsed_data.get('skills'):
            update_data['skills'] = list(set(user.get('skills', []) + parsed_data['skills']))
        
        # Update experience if found in resume
        if parsed_data.get('experience_years') and not user.get('experience_years'):
            update_data['experience_years'] = parsed_data['experience_years']
        
        updated_user = user_repo.update(user_id, update_data)
        
        # Remove password hash from response
        user_response = {k: v for k, v in updated_user.items() if k != 'password_hash'}
        
        return Response({
            'user': user_response,
            'parsed_data': parsed_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def search_candidates(request):
    """Search candidates (for recruiters)"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'recruiter':
            return Response({'error': 'Only recruiters can search candidates'}, status=status.HTTP_403_FORBIDDEN)
        
        query = request.GET.get('q', '')
        skills = request.GET.get('skills', '').split(',') if request.GET.get('skills') else []
        location = request.GET.get('location', '')
        min_experience = request.GET.get('min_experience')
        
        # Search candidates
        candidates = user_repo.search_candidates(
            query=query,
            skills=skills,
            location=location,
            min_experience=int(min_experience) if min_experience else None
        )
        
        # Remove sensitive information
        for candidate in candidates:
            candidate.pop('password_hash', None)
            candidate.pop('resume_text', None)
            candidate.pop('resume_vec', None)
        
        return Response(candidates, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
