from django.apps import AppConfig


class MlConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ml'
    verbose_name = 'Machine Learning'

    def ready(self):
        """Initialize ML components when app is ready"""
        try:
            from .embeddings import EmbeddingGenerator
            # Initialize embedding generator to download models if needed
            embedding_gen = EmbeddingGenerator()
            if embedding_gen.is_model_available():
                print("ML: Embedding model loaded successfully")
            else:
                print("ML: Using fallback embedding method")
        except Exception as e:
            print(f"ML: Warning - Failed to initialize embedding model: {e}")
