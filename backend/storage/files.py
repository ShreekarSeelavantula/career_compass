import os
import uuid
from typing import Optional
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import UploadedFile

class FileStorage:
    def __init__(self):
        self.storage_backend = settings.FILE_STORAGE_BACKEND
        if self.storage_backend == 'local':
            self.storage = FileSystemStorage(location=settings.MEDIA_ROOT)
        elif self.storage_backend == 's3':
            # Initialize S3 storage if needed
            try:
                import boto3
                from storages.backends.s3boto3 import S3Boto3Storage
                self.storage = S3Boto3Storage()
            except ImportError:
                # Fallback to local storage
                self.storage = FileSystemStorage(location=settings.MEDIA_ROOT)
        else:
            self.storage = FileSystemStorage(location=settings.MEDIA_ROOT)
    
    def save_file(self, file: UploadedFile, filename: str = None) -> str:
        """Save uploaded file and return the file path"""
        if not filename:
            # Generate unique filename
            file_extension = os.path.splitext(file.name)[1]
            filename = f"{uuid.uuid4()}{file_extension}"
        
        # Ensure the filename is unique
        filename = self.storage.get_available_name(filename)
        
        # Save the file
        file_path = self.storage.save(filename, file)
        
        return file_path
    
    def get_file_url(self, file_path: str) -> str:
        """Get URL for accessing the file"""
        if self.storage_backend == 's3':
            return self.storage.url(file_path)
        else:
            return f"{settings.MEDIA_URL}{file_path}"
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file"""
        try:
            if self.storage.exists(file_path):
                self.storage.delete(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False
    
    def file_exists(self, file_path: str) -> bool:
        """Check if file exists"""
        return self.storage.exists(file_path)
    
    def get_file_size(self, file_path: str) -> Optional[int]:
        """Get file size in bytes"""
        try:
            return self.storage.size(file_path)
        except Exception:
            return None

class ResumeFileStorage(FileStorage):
    """Specialized storage for resume files"""
    
    def save_resume(self, file: UploadedFile, user_id: str) -> str:
        """Save resume file with user-specific naming"""
        file_extension = os.path.splitext(file.name)[1].lower()
        
        # Validate file extension
        allowed_extensions = ['.pdf', '.docx', '.doc']
        if file_extension not in allowed_extensions:
            raise ValueError(f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
        
        # Validate file size (5MB limit)
        max_size = 5 * 1024 * 1024  # 5MB
        if file.size > max_size:
            raise ValueError("File size too large. Maximum allowed: 5MB")
        
        # Generate filename
        filename = f"resumes/{user_id}_{uuid.uuid4()}{file_extension}"
        
        return self.save_file(file, filename)
    
    def get_resume_url(self, file_path: str) -> str:
        """Get URL for resume file"""
        return self.get_file_url(file_path)

# Global instances
file_storage = FileStorage()
resume_storage = ResumeFileStorage()
