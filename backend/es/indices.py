from .client import create_index_if_not_exists
import logging

logger = logging.getLogger(__name__)

# Index mappings following the specification
USERS_MAPPING = {
    "properties": {
        "id": {"type": "keyword"},
        "role": {"type": "keyword"},
        "email": {"type": "keyword"},
        "password_hash": {"type": "keyword"},
        "full_name": {"type": "text"},
        "headline": {"type": "text"},
        "skills": {"type": "keyword"},
        "experience_years": {"type": "integer"},
        "location": {"type": "keyword"},
        "resume_file_path": {"type": "keyword"},
        "resume_text": {
            "type": "text",
            "analyzer": "custom_text_analyzer"
        },
        "resume_vec": {
            "type": "dense_vector",
            "dims": 384,
            "index": True,
            "similarity": "cosine"
        },
        "created_at": {"type": "date"},
        "updated_at": {"type": "date"}
    }
}

JOBS_MAPPING = {
    "properties": {
        "id": {"type": "keyword"},
        "recruiter_id": {"type": "keyword"},
        "title": {
            "type": "text",
            "analyzer": "custom_text_analyzer"
        },
        "description": {
            "type": "text",
            "analyzer": "custom_text_analyzer"
        },
        "company": {"type": "keyword"},
        "skills_required": {"type": "keyword"},
        "min_exp": {"type": "integer"},
        "location": {"type": "keyword"},
        "employment_type": {"type": "keyword"},
        "job_vec": {
            "type": "dense_vector",
            "dims": 384,
            "index": True,
            "similarity": "cosine"
        },
        "created_at": {"type": "date"},
        "status": {"type": "keyword"}
    }
}

APPLICATIONS_MAPPING = {
    "properties": {
        "id": {"type": "keyword"},
        "job_id": {"type": "keyword"},
        "seeker_id": {"type": "keyword"},
        "status": {"type": "keyword"},
        "scores": {
            "type": "object",
            "properties": {
                "bm25": {"type": "float"},
                "semantic": {"type": "float"},
                "rule_boost": {"type": "float"},
                "final": {"type": "float"}
            }
        },
        "created_at": {"type": "date"},
        "updated_at": {"type": "date"}
    }
}

INTERVIEWS_MAPPING = {
    "properties": {
        "id": {"type": "keyword"},
        "job_id": {"type": "keyword"},
        "seeker_id": {"type": "keyword"},
        "recruiter_id": {"type": "keyword"},
        "start_time": {"type": "date"},
        "end_time": {"type": "date"},
        "meeting_link": {"type": "keyword"},
        "status": {"type": "keyword"},
        "notes": {"type": "text"}
    }
}

EVENTS_MAPPING = {
    "properties": {
        "id": {"type": "keyword"},
        "actor_id": {"type": "keyword"},
        "type": {"type": "keyword"},
        "payload": {"type": "object"},
        "ts": {"type": "date"}
    }
}

# Index names
USERS_INDEX = "users"
JOBS_INDEX = "jobs"
APPLICATIONS_INDEX = "applications"
INTERVIEWS_INDEX = "interviews"
EVENTS_INDEX = "events"

def create_all_indices():
    """Create all required indices with their mappings"""
    indices = [
        (USERS_INDEX, USERS_MAPPING),
        (JOBS_INDEX, JOBS_MAPPING),
        (APPLICATIONS_INDEX, APPLICATIONS_MAPPING),
        (INTERVIEWS_INDEX, INTERVIEWS_MAPPING),
        (EVENTS_INDEX, EVENTS_MAPPING)
    ]
    
    success_count = 0
    for index_name, mapping in indices:
        if create_index_if_not_exists(index_name, mapping):
            success_count += 1
        else:
            logger.error(f"Failed to create index: {index_name}")
    
    if success_count == len(indices):
        logger.info("All indices created successfully")
        return True
    else:
        logger.error(f"Only {success_count}/{len(indices)} indices created successfully")
        return False

def get_index_mapping(index_name: str):
    """Get mapping for a specific index"""
    mappings = {
        USERS_INDEX: USERS_MAPPING,
        JOBS_INDEX: JOBS_MAPPING,
        APPLICATIONS_INDEX: APPLICATIONS_MAPPING,
        INTERVIEWS_INDEX: INTERVIEWS_MAPPING,
        EVENTS_INDEX: EVENTS_MAPPING
    }
    return mappings.get(index_name)

def update_index_mapping(index_name: str, new_fields: dict):
    """Update index mapping with new fields"""
    from .client import get_elasticsearch_client
    
    client = get_elasticsearch_client()
    if not client:
        logger.error("Elasticsearch client not available")
        return False
    
    try:
        client.indices.put_mapping(
            index=index_name,
            body={"properties": new_fields}
        )
        logger.info(f"Updated mapping for index: {index_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to update mapping for {index_name}: {e}")
        return False

def get_index_stats(index_name: str = None):
    """Get statistics for indices"""
    from .client import get_elasticsearch_client
    
    client = get_elasticsearch_client()
    if not client:
        logger.error("Elasticsearch client not available")
        return None
    
    try:
        if index_name:
            return client.indices.stats(index=index_name)
        else:
            # Get stats for all our indices
            indices = [USERS_INDEX, JOBS_INDEX, APPLICATIONS_INDEX, INTERVIEWS_INDEX, EVENTS_INDEX]
            return client.indices.stats(index=','.join(indices))
    except Exception as e:
        logger.error(f"Failed to get index stats: {e}")
        return None

def reindex_data(source_index: str, dest_index: str):
    """Reindex data from source to destination index"""
    from .client import get_elasticsearch_client
    
    client = get_elasticsearch_client()
    if not client:
        logger.error("Elasticsearch client not available")
        return False
    
    try:
        body = {
            "source": {"index": source_index},
            "dest": {"index": dest_index}
        }
        
        response = client.reindex(body=body, wait_for_completion=True)
        logger.info(f"Reindexed from {source_index} to {dest_index}")
        return True
    except Exception as e:
        logger.error(f"Failed to reindex from {source_index} to {dest_index}: {e}")
        return False

# Initialize indices on module import
def initialize_indices():
    """Initialize all indices - called during Django startup"""
    try:
        return create_all_indices()
    except Exception as e:
        logger.error(f"Failed to initialize indices: {e}")
        return False
