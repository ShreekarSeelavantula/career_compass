import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from elasticsearch.exceptions import NotFoundError
from .client import get_elasticsearch_client
from .indices import USERS_INDEX, JOBS_INDEX, APPLICATIONS_INDEX, INTERVIEWS_INDEX, EVENTS_INDEX

class BaseRepository:
    def __init__(self, index_name: str):
        self.index_name = index_name
        self.client = get_elasticsearch_client()
    
    def create(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        if not self.client:
            raise Exception("Elasticsearch client not available")
        
        doc_id = document.get('id')
        if not doc_id:
            doc_id = str(uuid.uuid4())
            document['id'] = doc_id
        
        response = self.client.index(
            index=self.index_name,
            id=doc_id,
            body=document,
            refresh='wait_for'
        )
        
        return document
    
    def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        if not self.client:
            return None
        
        try:
            response = self.client.get(
                index=self.index_name,
                id=doc_id
            )
            return response['_source']
        except NotFoundError:
            return None
    
    def update(self, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update document"""
        if not self.client:
            return None
        
        try:
            self.client.update(
                index=self.index_name,
                id=doc_id,
                body={'doc': updates},
                refresh='wait_for'
            )
            return self.get_by_id(doc_id)
        except NotFoundError:
            return None
    
    def delete(self, doc_id: str) -> bool:
        """Delete document"""
        if not self.client:
            return False
        
        try:
            self.client.delete(
                index=self.index_name,
                id=doc_id,
                refresh='wait_for'
            )
            return True
        except NotFoundError:
            return False
    
    def search(self, query: Dict[str, Any], size: int = 50) -> List[Dict[str, Any]]:
        """Search documents"""
        if not self.client:
            return []
        
        try:
            response = self.client.search(
                index=self.index_name,
                body=query,
                size=size
            )
            return [hit['_source'] for hit in response['hits']['hits']]
        except Exception as e:
            print(f"Search error: {e}")
            return []

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(USERS_INDEX)
    
    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        query = {
            "query": {
                "term": {"email.keyword": email}
            }
        }
        results = self.search(query)
        return results[0] if results else None
    
    def search_candidates(self, query: str = "", skills: List[str] = None, 
                         location: str = "", min_experience: int = None) -> List[Dict[str, Any]]:
        """Search for job seekers"""
        must_clauses = [{"term": {"role": "seeker"}}]
        
        if query:
            must_clauses.append({
                "multi_match": {
                    "query": query,
                    "fields": ["full_name^2", "headline^2", "resume_text", "skills"],
                    "type": "best_fields"
                }
            })
        
        if skills:
            must_clauses.append({
                "terms": {"skills": skills}
            })
        
        if location:
            must_clauses.append({
                "term": {"location.keyword": location}
            })
        
        if min_experience is not None:
            must_clauses.append({
                "range": {"experience_years": {"gte": min_experience}}
            })
        
        search_query = {
            "query": {"bool": {"must": must_clauses}},
            "sort": [{"updated_at": {"order": "desc"}}]
        }
        
        return self.search(search_query, size=100)

class JobRepository(BaseRepository):
    def __init__(self):
        super().__init__(JOBS_INDEX)
    
    def get_by_recruiter(self, recruiter_id: str) -> List[Dict[str, Any]]:
        """Get jobs by recruiter"""
        query = {
            "query": {"term": {"recruiter_id": recruiter_id}},
            "sort": [{"created_at": {"order": "desc"}}]
        }
        return self.search(query)
    
    def search_jobs(self, query: str = "", location: str = "", 
                   employment_type: str = "") -> List[Dict[str, Any]]:
        """Search open jobs"""
        must_clauses = [{"term": {"status": "open"}}]
        
        if query:
            must_clauses.append({
                "multi_match": {
                    "query": query,
                    "fields": ["title^3", "description^2", "company^2", "skills_required"],
                    "type": "best_fields"
                }
            })
        
        if location:
            must_clauses.append({
                "term": {"location.keyword": location}
            })
        
        if employment_type:
            must_clauses.append({
                "term": {"employment_type": employment_type}
            })
        
        search_query = {
            "query": {"bool": {"must": must_clauses}},
            "sort": [{"created_at": {"order": "desc"}}]
        }
        
        return self.search(search_query, size=100)
    
    def get_open_jobs(self) -> List[Dict[str, Any]]:
        """Get all open jobs"""
        query = {
            "query": {"term": {"status": "open"}},
            "sort": [{"created_at": {"order": "desc"}}]
        }
        return self.search(query, size=200)

class ApplicationRepository(BaseRepository):
    def __init__(self):
        super().__init__(APPLICATIONS_INDEX)
    
    def get_by_seeker(self, seeker_id: str) -> List[Dict[str, Any]]:
        """Get applications by job seeker"""
        query = {
            "query": {"term": {"seeker_id": seeker_id}},
            "sort": [{"created_at": {"order": "desc"}}]
        }
        return self.search(query)
    
    def get_by_job(self, job_id: str) -> List[Dict[str, Any]]:
        """Get applications for a job"""
        query = {
            "query": {"term": {"job_id": job_id}},
            "sort": [{"scores.final": {"order": "desc"}}]
        }
        return self.search(query)
    
    def get_by_jobs(self, job_ids: List[str]) -> List[Dict[str, Any]]:
        """Get applications for multiple jobs"""
        query = {
            "query": {"terms": {"job_id": job_ids}},
            "sort": [{"created_at": {"order": "desc"}}]
        }
        return self.search(query)
    
    def get_by_job_and_seeker(self, job_id: str, seeker_id: str) -> Optional[Dict[str, Any]]:
        """Get application by job and seeker"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"job_id": job_id}},
                        {"term": {"seeker_id": seeker_id}}
                    ]
                }
            }
        }
        results = self.search(query)
        return results[0] if results else None

class InterviewRepository(BaseRepository):
    def __init__(self):
        super().__init__(INTERVIEWS_INDEX)
    
    def get_by_recruiter(self, recruiter_id: str) -> List[Dict[str, Any]]:
        """Get interviews by recruiter"""
        query = {
            "query": {"term": {"recruiter_id": recruiter_id}},
            "sort": [{"start_time": {"order": "asc"}}]
        }
        return self.search(query)
    
    def get_by_seeker(self, seeker_id: str) -> List[Dict[str, Any]]:
        """Get interviews by job seeker"""
        query = {
            "query": {"term": {"seeker_id": seeker_id}},
            "sort": [{"start_time": {"order": "asc"}}]
        }
        return self.search(query)
    
    def get_by_recruiter_and_date_range(self, recruiter_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get interviews by recruiter within date range"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"recruiter_id": recruiter_id}},
                        {
                            "range": {
                                "start_time": {
                                    "gte": start_date.isoformat(),
                                    "lte": end_date.isoformat()
                                }
                            }
                        }
                    ]
                }
            },
            "sort": [{"start_time": {"order": "asc"}}]
        }
        return self.search(query)
    
    def get_by_seeker_and_date_range(self, seeker_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get interviews by seeker within date range"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"seeker_id": seeker_id}},
                        {
                            "range": {
                                "start_time": {
                                    "gte": start_date.isoformat(),
                                    "lte": end_date.isoformat()
                                }
                            }
                        }
                    ]
                }
            },
            "sort": [{"start_time": {"order": "asc"}}]
        }
        return self.search(query)

class EventRepository(BaseRepository):
    def __init__(self):
        super().__init__(EVENTS_INDEX)
    
    def log_event(self, actor_id: str, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Log an event"""
        event = {
            "id": str(uuid.uuid4()),
            "actor_id": actor_id,
            "type": event_type,
            "payload": payload,
            "ts": datetime.utcnow().isoformat()
        }
        return self.create(event)
    
    def get_events_by_actor(self, actor_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get events by actor"""
        query = {
            "query": {"term": {"actor_id": actor_id}},
            "sort": [{"ts": {"order": "desc"}}]
        }
        return self.search(query, size=limit)
    
    def get_events_by_type(self, event_type: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get events by type"""
        query = {
            "query": {"term": {"type": event_type}},
            "sort": [{"ts": {"order": "desc"}}]
        }
        return self.search(query, size=limit)
