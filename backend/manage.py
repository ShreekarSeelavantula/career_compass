#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Custom commands for the AI Talent Match platform
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        # Initialize Elasticsearch indices
        if command == 'init_es':
            from es.indices import initialize_indices
            from es.client import check_elasticsearch_connection
            
            print("Checking Elasticsearch connection...")
            if check_elasticsearch_connection():
                print("✓ Connected to Elasticsearch")
                print("Initializing indices...")
                if initialize_indices():
                    print("✓ All indices initialized successfully")
                else:
                    print("✗ Failed to initialize some indices")
                    sys.exit(1)
            else:
                print("✗ Failed to connect to Elasticsearch")
                sys.exit(1)
            return
        
        # Check system status
        elif command == 'status':
            from es.client import check_elasticsearch_connection
            from ml.embeddings import EmbeddingGenerator
            
            print("=== AI Talent Match System Status ===")
            
            # Check Elasticsearch
            print("\n1. Elasticsearch Connection:")
            if check_elasticsearch_connection():
                print("   ✓ Connected")
            else:
                print("   ✗ Not connected")
            
            # Check ML models
            print("\n2. ML Models:")
            try:
                embedding_gen = EmbeddingGenerator()
                if embedding_gen.is_model_available():
                    print("   ✓ Embedding model available")
                else:
                    print("   ⚠ Using fallback embedding method")
            except Exception as e:
                print(f"   ✗ Error: {e}")
            
            # Check file storage
            print("\n3. File Storage:")
            try:
                from django.conf import settings
                import os
                if os.path.exists(settings.MEDIA_ROOT):
                    print("   ✓ Media directory exists")
                else:
                    print("   ✗ Media directory not found")
            except Exception as e:
                print(f"   ✗ Error: {e}")
            
            print("\n=== End Status ===")
            return
        
        # Load sample data (for development)
        elif command == 'load_sample_data':
            print("Loading sample data...")
            # This would be implemented to load test data
            print("Sample data loading not implemented yet")
            return
    
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
