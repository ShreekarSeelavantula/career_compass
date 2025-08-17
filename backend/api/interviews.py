from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import json
import uuid

from es.repositories import InterviewRepository, ApplicationRepository, JobRepository, UserRepository
from common.utils import generate_uuid

interview_repo = InterviewRepository()
application_repo = ApplicationRepository()
job_repo = JobRepository()
user_repo = UserRepository()

def generate_meeting_link():
    """Generate a meeting link (placeholder - integrate with actual video service)"""
    meeting_id = str(uuid.uuid4())[:8]
    return f"https://meet.example.com/{meeting_id}"

@api_view(['POST'])
def schedule_interview(request):
    """Schedule an interview"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user or user['role'] != 'recruiter':
            return Response({'error': 'Only recruiters can schedule interviews'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        
        # Validate required fields
        required_fields = ['job_id', 'seeker_id', 'start_time', 'end_time']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        job_id = data['job_id']
        seeker_id = data['seeker_id']
        
        # Verify job exists and belongs to recruiter
        job = job_repo.get_by_id(job_id)
        if not job:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if job['recruiter_id'] != user_id:
            return Response({'error': 'You can only schedule interviews for your own jobs'}, status=status.HTTP_403_FORBIDDEN)
        
        # Verify seeker exists
        seeker = user_repo.get_by_id(seeker_id)
        if not seeker or seeker['role'] != 'seeker':
            return Response({'error': 'Job seeker not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify application exists
        application = application_repo.get_by_job_and_seeker(job_id, seeker_id)
        if not application:
            return Response({'error': 'No application found for this job and candidate'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validate datetime format
        try:
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            return Response({'error': 'Invalid datetime format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate interview duration
        if end_time <= start_time:
            return Response({'error': 'End time must be after start time'}, status=status.HTTP_400_BAD_REQUEST)
        
        duration = end_time - start_time
        if duration > timedelta(hours=4):
            return Response({'error': 'Interview duration cannot exceed 4 hours'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate meeting link
        meeting_link = data.get('meeting_link') or generate_meeting_link()
        
        # Create interview
        interview_data = {
            'id': generate_uuid(),
            'job_id': job_id,
            'seeker_id': seeker_id,
            'recruiter_id': user_id,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'meeting_link': meeting_link,
            'status': 'scheduled',
            'notes': data.get('notes', '')
        }
        
        created_interview = interview_repo.create(interview_data)
        
        # Update application status to interviewed if it's not already
        if application['status'] in ['applied', 'screening', 'shortlisted']:
            application_repo.update(application['id'], {
                'status': 'interviewed',
                'updated_at': datetime.utcnow().isoformat()
            })
        
        return Response(created_interview, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_my_interviews(request):
    """Get interviews for current user"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if user['role'] == 'recruiter':
            interviews = interview_repo.get_by_recruiter(user_id)
        elif user['role'] == 'seeker':
            interviews = interview_repo.get_by_seeker(user_id)
        else:
            return Response({'error': 'Invalid user role'}, status=status.HTTP_403_FORBIDDEN)
        
        # Enrich with additional data
        for interview in interviews:
            job = job_repo.get_by_id(interview['job_id'])
            if job:
                interview['job'] = job
            
            if user['role'] == 'recruiter':
                seeker = user_repo.get_by_id(interview['seeker_id'])
                if seeker:
                    # Remove sensitive data
                    seeker_data = {k: v for k, v in seeker.items() if k not in ['password_hash', 'resume_text', 'resume_vec']}
                    interview['seeker'] = seeker_data
            else:
                recruiter = user_repo.get_by_id(interview['recruiter_id'])
                if recruiter:
                    # Remove sensitive data
                    recruiter_data = {k: v for k, v in recruiter.items() if k not in ['password_hash']}
                    interview['recruiter'] = recruiter_data
        
        return Response(interviews, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_interview(request, interview_id):
    """Update an interview"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        interview = interview_repo.get_by_id(interview_id)
        if not interview:
            return Response({'error': 'Interview not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user = user_repo.get_by_id(user_id)
        
        # Only recruiter who created interview or the seeker can update it
        if user['role'] == 'recruiter':
            if interview['recruiter_id'] != user_id:
                return Response({'error': 'You can only update your own interviews'}, status=status.HTTP_403_FORBIDDEN)
        elif user['role'] == 'seeker':
            if interview['seeker_id'] != user_id:
                return Response({'error': 'You can only update your own interviews'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Invalid user role'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        update_data = {}
        
        # Update allowed fields based on user role
        if user['role'] == 'recruiter':
            allowed_fields = ['start_time', 'end_time', 'meeting_link', 'status', 'notes']
        else:
            allowed_fields = ['status']  # Job seekers can only update status (e.g., to reschedule)
        
        for field in allowed_fields:
            if field in data:
                if field in ['start_time', 'end_time']:
                    try:
                        update_data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00')).isoformat()
                    except ValueError:
                        return Response({'error': f'Invalid {field} format'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    update_data[field] = data[field]
        
        # Validate status
        if 'status' in update_data:
            valid_statuses = ['scheduled', 'rescheduled', 'cancelled', 'completed']
            if update_data['status'] not in valid_statuses:
                return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        if update_data:
            updated_interview = interview_repo.update(interview_id, update_data)
            return Response(updated_interview, status=status.HTTP_200_OK)
        
        return Response({'message': 'No fields to update'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def cancel_interview(request, interview_id):
    """Cancel an interview"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        interview = interview_repo.get_by_id(interview_id)
        if not interview:
            return Response({'error': 'Interview not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user = user_repo.get_by_id(user_id)
        
        # Only recruiter who created interview or the seeker can cancel it
        if user['role'] == 'recruiter':
            if interview['recruiter_id'] != user_id:
                return Response({'error': 'You can only cancel your own interviews'}, status=status.HTTP_403_FORBIDDEN)
        elif user['role'] == 'seeker':
            if interview['seeker_id'] != user_id:
                return Response({'error': 'You can only cancel your own interviews'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Invalid user role'}, status=status.HTTP_403_FORBIDDEN)
        
        # Update status to cancelled instead of deleting
        updated_interview = interview_repo.update(interview_id, {
            'status': 'cancelled'
        })
        
        return Response({'message': 'Interview cancelled successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_interview_availability(request):
    """Get available time slots for interviews"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = user_repo.get_by_id(user_id)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get date range from query params
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if not start_date or not end_date:
            return Response({'error': 'start_date and end_date are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user's interviews in the date range
        if user['role'] == 'recruiter':
            interviews = interview_repo.get_by_recruiter_and_date_range(user_id, start_dt, end_dt)
        else:
            interviews = interview_repo.get_by_seeker_and_date_range(user_id, start_dt, end_dt)
        
        # Filter out cancelled interviews
        active_interviews = [i for i in interviews if i['status'] != 'cancelled']
        
        # Generate available slots (this is a simplified version)
        available_slots = []
        current_date = start_dt.date()
        end_date = end_dt.date()
        
        while current_date <= end_date:
            # Generate slots from 9 AM to 5 PM (business hours)
            for hour in range(9, 17):
                slot_start = datetime.combine(current_date, datetime.min.time().replace(hour=hour))
                slot_end = slot_start + timedelta(hours=1)
                
                # Check if slot conflicts with existing interviews
                has_conflict = any(
                    datetime.fromisoformat(interview['start_time']) < slot_end and
                    datetime.fromisoformat(interview['end_time']) > slot_start
                    for interview in active_interviews
                )
                
                if not has_conflict:
                    available_slots.append({
                        'start_time': slot_start.isoformat(),
                        'end_time': slot_end.isoformat()
                    })
            
            current_date += timedelta(days=1)
        
        return Response({
            'available_slots': available_slots,
            'busy_slots': [
                {
                    'start_time': interview['start_time'],
                    'end_time': interview['end_time']
                } for interview in active_interviews
            ]
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
