from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import json

from es.repositories import JobRepository, UserRepository
from ml.embeddings import EmbeddingGenerator
from ml.ranking import RankingService
from common.utils import generate_uuid

job_repo = JobRepository()
user_repo = UserRepository()
embedding_generator = EmbeddingGenerator()
ranking_service = RankingService()

@api_view(['POST'])
def create_job(request):
    """Create a new job posting"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'recruiter':
            return Response({'error': 'Only recruiters can create jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        
        # Validate required fields
        required_fields = ['title', 'description', 'company']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create job text for embedding
        job_text = f"{data['title']} {data['description']} {' '.join(data.get('skills_required', []))}"
        job_embedding = embedding_generator.generate_embedding(job_text)
        
        # Create job data
        job_data = {
            'id': generate_uuid(),
            'recruiter_id': user_id,
            'title': data['title'],
            'description': data['description'],
            'company': data['company'],
            'skills_required': data.get('skills_required', []),
            'min_exp': data.get('min_exp'),
            'location': data.get('location', ''),
            'employment_type': data.get('employment_type', 'full-time'),
            'job_vec': job_embedding,
            'created_at': datetime.utcnow().isoformat(),
            'status': 'open'
        }
        
        # Save job to Elasticsearch
        created_job = job_repo.create(job_data)
        
        return Response(created_job, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_jobs(request):
    """Get jobs for current recruiter"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'recruiter':
            return Response({'error': 'Only recruiters can view their jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        jobs = job_repo.get_by_recruiter(user_id)
        return Response(jobs, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def search_jobs(request):
    """Search jobs for job seekers"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'seeker':
            return Response({'error': 'Only job seekers can search jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        query = request.GET.get('q', '')
        location = request.GET.get('location', '')
        employment_type = request.GET.get('employment_type', '')
        
        # Search jobs
        jobs = job_repo.search_jobs(
            query=query,
            location=location,
            employment_type=employment_type
        )
        
        # If user has resume, calculate match scores
        if user.get('resume_vec'):
            for job in jobs:
                if job.get('job_vec'):
                    # Calculate hybrid score
                    score = ranking_service.calculate_hybrid_score(
                        resume_text=user.get('resume_text', ''),
                        resume_vec=user['resume_vec'],
                        job_text=f"{job['title']} {job['description']}",
                        job_vec=job['job_vec'],
                        resume_skills=user.get('skills', []),
                        job_skills=job.get('skills_required', []),
                        resume_exp=user.get('experience_years'),
                        job_min_exp=job.get('min_exp'),
                        same_location=(user.get('location', '').lower() == job.get('location', '').lower())
                    )
                    job['matchScore'] = score * 100  # Convert to percentage
        
        return Response(jobs, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_recommendations(request):
    """Get job recommendations for job seekers"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'seeker':
            return Response({'error': 'Only job seekers can get recommendations'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all open jobs
        jobs = job_repo.get_open_jobs()
        
        # If user has resume, calculate match scores and sort by relevance
        if user.get('resume_vec'):
            scored_jobs = []
            for job in jobs:
                if job.get('job_vec'):
                    # Calculate hybrid score
                    score = ranking_service.calculate_hybrid_score(
                        resume_text=user.get('resume_text', ''),
                        resume_vec=user['resume_vec'],
                        job_text=f"{job['title']} {job['description']}",
                        job_vec=job['job_vec'],
                        resume_skills=user.get('skills', []),
                        job_skills=job.get('skills_required', []),
                        resume_exp=user.get('experience_years'),
                        job_min_exp=job.get('min_exp'),
                        same_location=(user.get('location', '').lower() == job.get('location', '').lower())
                    )
                    job['matchScore'] = score * 100  # Convert to percentage
                    scored_jobs.append(job)
            
            # Sort by match score and return top recommendations
            scored_jobs.sort(key=lambda x: x.get('matchScore', 0), reverse=True)
            return Response(scored_jobs[:10], status=status.HTTP_200_OK)
        else:
            # Return recent jobs if no resume
            return Response(jobs[:10], status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_job(request, job_id):
    """Update a job posting"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        job = job_repo.get_by_id(job_id)
        if not job:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user owns this job
        if job['recruiter_id'] != user_id:
            return Response({'error': 'You can only update your own jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        
        # Update allowed fields
        allowed_fields = ['title', 'description', 'company', 'skills_required', 'min_exp', 'location', 'employment_type', 'status']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # If job content changed, regenerate embedding
        if any(field in update_data for field in ['title', 'description', 'skills_required']):
            job_text = f"{update_data.get('title', job['title'])} {update_data.get('description', job['description'])} {' '.join(update_data.get('skills_required', job.get('skills_required', [])))}"
            update_data['job_vec'] = embedding_generator.generate_embedding(job_text)
        
        if update_data:
            updated_job = job_repo.update(job_id, update_data)
            return Response(updated_job, status=status.HTTP_200_OK)
        
        return Response({'message': 'No fields to update'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_job(request, job_id):
    """Delete a job posting"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        job = job_repo.get_by_id(job_id)
        if not job:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user owns this job
        if job['recruiter_id'] != user_id:
            return Response({'error': 'You can only delete your own jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        job_repo.delete(job_id)
        return Response({'message': 'Job deleted successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
