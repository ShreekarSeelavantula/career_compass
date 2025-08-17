from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import json

from es.repositories import ApplicationRepository, JobRepository, UserRepository
from ml.ranking import RankingService
from common.utils import generate_uuid

application_repo = ApplicationRepository()
job_repo = JobRepository()
user_repo = UserRepository()
ranking_service = RankingService()

@api_view(['POST'])
def apply_to_job(request, job_id):
    """Apply to a job"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'seeker':
            return Response({'error': 'Only job seekers can apply to jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        job = job_repo.get_by_id(job_id)
        if not job:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if job['status'] != 'open':
            return Response({'error': 'This job is no longer accepting applications'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already applied
        existing_application = application_repo.get_by_job_and_seeker(job_id, user_id)
        if existing_application:
            return Response({'error': 'You have already applied to this job'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate match scores
        scores = {'bm25': 0.0, 'semantic': 0.0, 'rule_boost': 0.0, 'final': 0.0}
        
        if user.get('resume_vec') and job.get('job_vec'):
            # Calculate hybrid score
            final_score = ranking_service.calculate_hybrid_score(
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
            
            # Break down scores (simplified)
            scores = {
                'bm25': ranking_service.calculate_bm25_score(user.get('resume_text', ''), f"{job['title']} {job['description']}"),
                'semantic': ranking_service.calculate_semantic_score(user['resume_vec'], job['job_vec']),
                'rule_boost': ranking_service.calculate_rule_boost(
                    user.get('skills', []), job.get('skills_required', []),
                    user.get('experience_years'), job.get('min_exp'),
                    user.get('location', '').lower() == job.get('location', '').lower()
                ),
                'final': final_score
            }
        
        # Create application
        application_data = {
            'id': generate_uuid(),
            'job_id': job_id,
            'seeker_id': user_id,
            'status': 'applied',
            'scores': scores,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        created_application = application_repo.create(application_data)
        
        return Response(created_application, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_my_applications(request):
    """Get applications for current job seeker"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'seeker':
            return Response({'error': 'Only job seekers can view their applications'}, status=status.HTTP_403_FORBIDDEN)
        
        applications = application_repo.get_by_seeker(user_id)
        
        # Enrich with job data
        for application in applications:
            job = job_repo.get_by_id(application['job_id'])
            if job:
                application['job'] = job
        
        return Response(applications, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_job_applications(request):
    """Get applications for recruiter's jobs"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'recruiter':
            return Response({'error': 'Only recruiters can view job applications'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all recruiter's jobs
        jobs = job_repo.get_by_recruiter(user_id)
        job_ids = [job['id'] for job in jobs]
        
        # Get applications for these jobs
        applications = application_repo.get_by_jobs(job_ids)
        
        # Enrich with job and seeker data
        for application in applications:
            job = job_repo.get_by_id(application['job_id'])
            if job:
                application['job'] = job
            
            seeker = user_repo.get_by_id(application['seeker_id'])
            if seeker:
                # Remove sensitive data
                seeker_data = {k: v for k, v in seeker.items() if k not in ['password_hash', 'resume_text', 'resume_vec']}
                application['seeker'] = seeker_data
        
        return Response(applications, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_job_applications_by_id(request, job_id):
    """Get applications for a specific job"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        job = job_repo.get_by_id(job_id)
        if not job:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user owns this job
        if job['recruiter_id'] != user_id:
            return Response({'error': 'You can only view applications for your own jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        applications = application_repo.get_by_job(job_id)
        
        # Sort by final score (highest first)
        applications.sort(key=lambda x: x.get('scores', {}).get('final', 0), reverse=True)
        
        # Enrich with seeker data
        for application in applications:
            seeker = user_repo.get_by_id(application['seeker_id'])
            if seeker:
                # Remove sensitive data
                seeker_data = {k: v for k, v in seeker.items() if k not in ['password_hash', 'resume_text', 'resume_vec']}
                application['seeker'] = seeker_data
        
        return Response(applications, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_application_status(request, application_id):
    """Update application status (for recruiters)"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'recruiter':
            return Response({'error': 'Only recruiters can update application status'}, status=status.HTTP_403_FORBIDDEN)
        
        application = application_repo.get_by_id(application_id)
        if not application:
            return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)
        
        job = job_repo.get_by_id(application['job_id'])
        if not job or job['recruiter_id'] != user_id:
            return Response({'error': 'You can only update applications for your own jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        new_status = data.get('status')
        
        if new_status not in ['applied', 'screening', 'shortlisted', 'interviewed', 'offered', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        update_data = {
            'status': new_status,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        updated_application = application_repo.update(application_id, update_data)
        
        return Response(updated_application, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def bulk_rank_candidates(request, job_id):
    """Re-rank all candidates for a job"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        job = job_repo.get_by_id(job_id)
        if not job:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user owns this job
        if job['recruiter_id'] != user_id:
            return Response({'error': 'You can only rank candidates for your own jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        applications = application_repo.get_by_job(job_id)
        
        updated_count = 0
        for application in applications:
            seeker = user_repo.get_by_id(application['seeker_id'])
            if seeker and seeker.get('resume_vec') and job.get('job_vec'):
                # Recalculate scores
                final_score = ranking_service.calculate_hybrid_score(
                    resume_text=seeker.get('resume_text', ''),
                    resume_vec=seeker['resume_vec'],
                    job_text=f"{job['title']} {job['description']}",
                    job_vec=job['job_vec'],
                    resume_skills=seeker.get('skills', []),
                    job_skills=job.get('skills_required', []),
                    resume_exp=seeker.get('experience_years'),
                    job_min_exp=job.get('min_exp'),
                    same_location=(seeker.get('location', '').lower() == job.get('location', '').lower())
                )
                
                scores = {
                    'bm25': ranking_service.calculate_bm25_score(seeker.get('resume_text', ''), f"{job['title']} {job['description']}"),
                    'semantic': ranking_service.calculate_semantic_score(seeker['resume_vec'], job['job_vec']),
                    'rule_boost': ranking_service.calculate_rule_boost(
                        seeker.get('skills', []), job.get('skills_required', []),
                        seeker.get('experience_years'), job.get('min_exp'),
                        seeker.get('location', '').lower() == job.get('location', '').lower()
                    ),
                    'final': final_score
                }
                
                application_repo.update(application['id'], {
                    'scores': scores,
                    'updated_at': datetime.utcnow().isoformat()
                })
                updated_count += 1
        
        return Response({
            'message': f'Re-ranked {updated_count} applications',
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
