from django.urls import re_path
from . import chat

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<application_id>[^/]+)/$', chat.ChatConsumer.as_asgi()),
]
