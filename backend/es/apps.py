from django.apps import AppConfig


class EsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'es'
    verbose_name = 'Elasticsearch'

    def ready(self):
        """Initialize Elasticsearch when app is ready"""
        try:
            from .client import check_elasticsearch_connection
            from .indices import initialize_indices
            
            if check_elasticsearch_connection():
                print("ES: Connected to Elasticsearch successfully")
                if initialize_indices():
                    print("ES: All indices initialized successfully")
                else:
                    print("ES: Warning - Some indices failed to initialize")
            else:
                print("ES: Warning - Elasticsearch connection failed")
        except Exception as e:
            print(f"ES: Error during initialization: {e}")
