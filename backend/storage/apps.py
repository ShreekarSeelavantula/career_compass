from django.apps import AppConfig


class StorageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'storage'
    verbose_name = 'Storage'

    def ready(self):
        """Initialize storage when app is ready"""
        try:
            from django.conf import settings
            import os
            
            # Create necessary directories
            os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
            os.makedirs(os.path.join(settings.MEDIA_ROOT, 'resumes'), exist_ok=True)
            
            print("Storage: Directories initialized successfully")
        except Exception as e:
            print(f"Storage: Warning - Failed to initialize directories: {e}")
