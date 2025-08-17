import jwt
from django.conf import settings
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from es.repositories import UserRepository
import logging

logger = logging.getLogger(__name__)

class JWTAuthenticationMiddleware(MiddlewareMixin):
    """Middleware to handle JWT authentication for API requests"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.user_repo = UserRepository()
        super().__init__(get_response)
    
    def process_request(self, request):
        # Skip authentication for auth endpoints
        if request.path.startswith('/api/auth/'):
            return None
        
        # Skip authentication for non-API requests
        if not request.path.startswith('/api/'):
            return None
        
        # Skip authentication for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return None
        
        # Get authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Extract token
        token = auth_header.split(' ')[1]
        
        try:
            # Decode JWT token
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get('user_id')
            
            if not user_id:
                return JsonResponse({'error': 'Invalid token'}, status=401)
            
            # Get user from Elasticsearch
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return JsonResponse({'error': 'User not found'}, status=401)
            
            # Add user info to request
            request.user_id = user_id
            request.user_role = user.get('role')
            request.user_data = user
            
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return JsonResponse({'error': 'Authentication failed'}, status=500)
        
        return None

class CORSMiddleware(MiddlewareMixin):
    """Middleware to handle CORS headers"""
    
    def process_response(self, request, response):
        # Allow requests from the frontend
        origin = request.META.get('HTTP_ORIGIN')
        if origin and (origin.startswith('http://localhost') or origin.startswith('http://127.0.0.1')):
            response['Access-Control-Allow-Origin'] = origin
        elif settings.DEBUG:
            response['Access-Control-Allow-Origin'] = '*'
        
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'  # 24 hours
        
        return response

class RequestLoggingMiddleware(MiddlewareMixin):
    """Middleware to log API requests"""
    
    def process_request(self, request):
        if request.path.startswith('/api/') and settings.DEBUG:
            user_id = getattr(request, 'user_id', 'Anonymous')
            logger.info(f"{request.method} {request.path} - User: {user_id}")
        return None
    
    def process_response(self, request, response):
        if request.path.startswith('/api/') and settings.DEBUG:
            user_id = getattr(request, 'user_id', 'Anonymous')
            logger.info(f"{request.method} {request.path} - {response.status_code} - User: {user_id}")
        return response

class SecurityHeadersMiddleware(MiddlewareMixin):
    """Middleware to add security headers"""
    
    def process_response(self, request, response):
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy for API responses
        if request.path.startswith('/api/'):
            response['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none';"
        
        return response

class RateLimitMiddleware(MiddlewareMixin):
    """Basic rate limiting middleware"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.requests = {}  # In production, use Redis or database
        super().__init__(get_response)
    
    def process_request(self, request):
        if not settings.RATE_LIMIT_ENABLED:
            return None
        
        if not request.path.startswith('/api/'):
            return None
        
        # Get client IP
        ip = self.get_client_ip(request)
        current_time = time.time()
        
        # Clean old entries
        self.cleanup_old_requests(current_time)
        
        # Check rate limit
        if ip in self.requests:
            request_times = self.requests[ip]
            recent_requests = [t for t in request_times if current_time - t < settings.RATE_LIMIT_WINDOW]
            
            if len(recent_requests) >= settings.RATE_LIMIT_REQUESTS:
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'retry_after': settings.RATE_LIMIT_WINDOW
                }, status=429)
            
            self.requests[ip] = recent_requests + [current_time]
        else:
            self.requests[ip] = [current_time]
        
        return None
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def cleanup_old_requests(self, current_time):
        for ip in list(self.requests.keys()):
            self.requests[ip] = [t for t in self.requests[ip] if current_time - t < settings.RATE_LIMIT_WINDOW]
            if not self.requests[ip]:
                del self.requests[ip]

class ErrorHandlingMiddleware(MiddlewareMixin):
    """Middleware to handle and log errors"""
    
    def process_exception(self, request, exception):
        if request.path.startswith('/api/'):
            logger.error(f"API Error: {exception}", exc_info=True)
            
            if settings.DEBUG:
                return JsonResponse({
                    'error': 'Internal server error',
                    'detail': str(exception)
                }, status=500)
            else:
                return JsonResponse({
                    'error': 'Internal server error'
                }, status=500)
        
        return None

# Import time for rate limiting
import time
