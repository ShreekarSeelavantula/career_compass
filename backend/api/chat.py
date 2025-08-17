import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from datetime import datetime
import asyncio

from es.repositories import ApplicationRepository, UserRepository
from common.utils import generate_uuid

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.application_repo = ApplicationRepository()
        self.user_repo = UserRepository()
        self.room_group_name = None
        self.application_id = None
        self.user_id = None

    async def connect(self):
        self.application_id = self.scope['url_route']['kwargs']['application_id']
        self.room_group_name = f'chat_{self.application_id}'
        
        # Get user from token (simplified - you'd need proper auth middleware)
        self.user_id = self.scope.get('user_id')
        
        if not self.user_id:
            await self.close()
            return
        
        # Verify user has access to this chat
        try:
            application = await self.get_application(self.application_id)
            user = await self.get_user(self.user_id)
            
            if not application or not user:
                await self.close()
                return
            
            # Check if user is either the job seeker or recruiter for this application
            if user['role'] == 'seeker' and application['seeker_id'] != self.user_id:
                await self.close()
                return
            elif user['role'] == 'recruiter':
                job = await self.get_job(application['job_id'])
                if not job or job['recruiter_id'] != self.user_id:
                    await self.close()
                    return
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection',
                'message': 'Connected to chat'
            }))
            
        except Exception as e:
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        if self.room_group_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'chat_message':
                message_content = text_data_json.get('message', '').strip()
                
                if not message_content:
                    return
                
                # Get user info
                user = await self.get_user(self.user_id)
                if not user:
                    return
                
                # Create message data
                message_data = {
                    'id': generate_uuid(),
                    'application_id': self.application_id,
                    'sender_id': self.user_id,
                    'sender_name': user['full_name'],
                    'sender_role': user['role'],
                    'content': message_content,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                # Store message (you might want to create a MessageRepository)
                # For now, we'll just broadcast it
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_data
                    }
                )
            
            elif message_type == 'typing':
                # Handle typing indicators
                user = await self.get_user(self.user_id)
                if user:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'typing_indicator',
                            'user_id': self.user_id,
                            'user_name': user['full_name'],
                            'is_typing': text_data_json.get('is_typing', False)
                        }
                    )
                    
        except json.JSONDecodeError:
            pass

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message']
        }))

    async def typing_indicator(self, event):
        # Don't send typing indicator back to the sender
        if event['user_id'] != self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'is_typing': event['is_typing']
            }))

    @database_sync_to_async
    def get_application(self, application_id):
        try:
            return self.application_repo.get_by_id(application_id)
        except:
            return None

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return self.user_repo.get_by_id(user_id)
        except:
            return None

    @database_sync_to_async
    def get_job(self, job_id):
        try:
            from es.repositories import JobRepository
            job_repo = JobRepository()
            return job_repo.get_by_id(job_id)
        except:
            return None

# URL routing for WebSocket
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<application_id>[^/]+)/$', ChatConsumer.as_asgi()),
]

# Create routing.py file
routing_content = '''from django.urls import re_path
from . import chat

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<application_id>[^/]+)/$', chat.ChatConsumer.as_asgi()),
]
'''

# REST API endpoints for chat history
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
def get_chat_history(request, application_id):
    """Get chat history for an application"""
    try:
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify user has access to this chat
        application_repo = ApplicationRepository()
        user_repo = UserRepository()
        
        application = application_repo.get_by_id(application_id)
        if not application:
            return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user = user_repo.get_by_id(user_id)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check access permissions
        if user['role'] == 'seeker' and application['seeker_id'] != user_id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        elif user['role'] == 'recruiter':
            from es.repositories import JobRepository
            job_repo = JobRepository()
            job = job_repo.get_by_id(application['job_id'])
            if not job or job['recruiter_id'] != user_id:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # For now, return empty chat history
        # In a real implementation, you'd have a MessageRepository
        return Response({
            'messages': [],
            'application_id': application_id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
