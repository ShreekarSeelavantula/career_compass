from django.apps import AppConfig


class CommonConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'common'
    verbose_name = 'Common Utilities'

    def ready(self):
        """Initialize common utilities when app is ready"""
        try:
            # Perform any common initialization here
            print("Common: Utilities initialized successfully")
        except Exception as e:
            print(f"Common: Warning - Failed to initialize utilities: {e}")
