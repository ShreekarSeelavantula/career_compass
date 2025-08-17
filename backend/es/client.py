from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError, RequestError
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class ElasticsearchClient:
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ElasticsearchClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self._client = self._create_client()
    
    def _create_client(self):
        """Create Elasticsearch client"""
        try:
            # Build connection configuration
            config = {
                'hosts': [{'host': settings.ELASTICSEARCH_HOST, 'port': settings.ELASTICSEARCH_PORT}],
                'timeout': 30,
                'max_retries': 3,
                'retry_on_timeout': True
            }
            
            # Add authentication if provided
            if settings.ELASTICSEARCH_USERNAME and settings.ELASTICSEARCH_PASSWORD:
                config['http_auth'] = (settings.ELASTICSEARCH_USERNAME, settings.ELASTICSEARCH_PASSWORD)
            
            client = Elasticsearch(**config)
            
            # Test connection
            if client.ping():
                logger.info("Successfully connected to Elasticsearch")
                return client
            else:
                logger.error("Failed to ping Elasticsearch")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create Elasticsearch client: {e}")
            return None
    
    def get_client(self):
        """Get Elasticsearch client instance"""
        if self._client is None:
            self._client = self._create_client()
        return self._client
    
    def is_connected(self):
        """Check if connected to Elasticsearch"""
        try:
            return self._client is not None and self._client.ping()
        except:
            return False
    
    def close(self):
        """Close Elasticsearch connection"""
        if self._client:
            try:
                self._client.close()
            except:
                pass
            self._client = None

# Singleton instance
es_client = ElasticsearchClient()

def get_elasticsearch_client():
    """Get the global Elasticsearch client"""
    return es_client.get_client()

def check_elasticsearch_connection():
    """Check if Elasticsearch is available"""
    return es_client.is_connected()

def create_index_if_not_exists(index_name: str, mapping: dict):
    """Create index with mapping if it doesn't exist"""
    client = get_elasticsearch_client()
    if not client:
        logger.error("Elasticsearch client not available")
        return False
    
    try:
        if not client.indices.exists(index=index_name):
            response = client.indices.create(
                index=index_name,
                body={
                    "mappings": mapping,
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0,
                        "analysis": {
                            "analyzer": {
                                "custom_text_analyzer": {
                                    "type": "custom",
                                    "tokenizer": "standard",
                                    "filter": ["lowercase", "stop", "snowball"]
                                }
                            }
                        }
                    }
                }
            )
            logger.info(f"Created index: {index_name}")
            return True
        else:
            logger.info(f"Index already exists: {index_name}")
            return True
            
    except Exception as e:
        logger.error(f"Failed to create index {index_name}: {e}")
        return False

def delete_index(index_name: str):
    """Delete an index"""
    client = get_elasticsearch_client()
    if not client:
        logger.error("Elasticsearch client not available")
        return False
    
    try:
        if client.indices.exists(index=index_name):
            client.indices.delete(index=index_name)
            logger.info(f"Deleted index: {index_name}")
            return True
        else:
            logger.info(f"Index does not exist: {index_name}")
            return True
            
    except Exception as e:
        logger.error(f"Failed to delete index {index_name}: {e}")
        return False

def refresh_index(index_name: str):
    """Refresh an index to make recent changes searchable"""
    client = get_elasticsearch_client()
    if not client:
        return False
    
    try:
        client.indices.refresh(index=index_name)
        return True
    except Exception as e:
        logger.error(f"Failed to refresh index {index_name}: {e}")
        return False

def bulk_index_documents(index_name: str, documents: list):
    """Bulk index multiple documents"""
    client = get_elasticsearch_client()
    if not client:
        logger.error("Elasticsearch client not available")
        return False
    
    try:
        from elasticsearch.helpers import bulk
        
        actions = []
        for doc in documents:
            action = {
                "_index": index_name,
                "_id": doc.get('id'),
                "_source": doc
            }
            actions.append(action)
        
        if actions:
            success, failed = bulk(client, actions)
            logger.info(f"Bulk indexed {success} documents to {index_name}")
            if failed:
                logger.warning(f"Failed to index {len(failed)} documents")
            return True
        else:
            logger.info("No documents to index")
            return True
            
    except Exception as e:
        logger.error(f"Failed to bulk index documents to {index_name}: {e}")
        return False
