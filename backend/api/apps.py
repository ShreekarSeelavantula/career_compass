from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    verbose_name = 'API'

    def ready(self):
        """Initialize API when app is ready"""
        from es.indices import initialize_indices
        try:
            initialize_indices()
        except Exception as e:
            print(f"Warning: Failed to initialize Elasticsearch indices: {e}")
