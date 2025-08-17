from django.urls import path, include
from . import auth, users, jobs, applications, interviews, chat

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', auth.register, name='register'),
    path('auth/login/', auth.login, name='login'),
    path('auth/logout/', auth.logout, name='logout'),
    path('me/', auth.me, name='me'),
    
    # User endpoints
    path('me/update/', users.update_profile, name='update_profile'),
    path('me/resume/', users.upload_resume, name='upload_resume'),
    path('candidates/search/', users.search_candidates, name='search_candidates'),
    
    # Job endpoints
    path('jobs/', jobs.create_job, name='create_job'),
    path('jobs/mine/', jobs.get_jobs, name='get_jobs'),
    path('jobs/search/', jobs.search_jobs, name='search_jobs'),
    path('jobs/recommendations/', jobs.get_recommendations, name='get_recommendations'),
    path('jobs/<str:job_id>/', jobs.update_job, name='update_job'),
    path('jobs/<str:job_id>/delete/', jobs.delete_job, name='delete_job'),
    
    # Application endpoints
    path('jobs/<str:job_id>/apply/', applications.apply_to_job, name='apply_to_job'),
    path('applications/me/', applications.get_my_applications, name='get_my_applications'),
    path('applications/jobs/', applications.get_job_applications, name='get_job_applications'),
    path('applications/jobs/<str:job_id>/', applications.get_job_applications_by_id, name='get_job_applications_by_id'),
    path('applications/<str:application_id>/status/', applications.update_application_status, name='update_application_status'),
    path('jobs/<str:job_id>/rank/', applications.bulk_rank_candidates, name='bulk_rank_candidates'),
    
    # Interview endpoints
    path('interviews/', interviews.schedule_interview, name='schedule_interview'),
    path('interviews/me/', interviews.get_my_interviews, name='get_my_interviews'),
    path('interviews/<str:interview_id>/', interviews.update_interview, name='update_interview'),
    path('interviews/<str:interview_id>/cancel/', interviews.cancel_interview, name='cancel_interview'),
    path('interviews/availability/', interviews.get_interview_availability, name='get_interview_availability'),
    
    # Chat endpoints
    path('chat/<str:application_id>/history/', chat.get_chat_history, name='get_chat_history'),
]
