import uuid
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

def generate_uuid() -> str:
    """Generate a UUID4 string"""
    return str(uuid.uuid4())

def get_current_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat()

def parse_timestamp(timestamp_str: str) -> Optional[datetime]:
    """Parse ISO timestamp string to datetime object"""
    try:
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return None

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def truncate_text(text: str, max_length: int = 100, suffix: str = '...') -> str:
    """Truncate text to specified length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

def extract_keywords(text: str, min_length: int = 3) -> List[str]:
    """Extract keywords from text"""
    # Remove punctuation and convert to lowercase
    cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
    
    # Split into words and filter
    words = [word for word in cleaned.split() if len(word) >= min_length]
    
    # Remove common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might',
        'can', 'must', 'shall', 'this', 'that', 'these', 'those'
    }
    
    keywords = [word for word in words if word not in stop_words]
    
    # Remove duplicates while preserving order
    unique_keywords = []
    seen = set()
    for keyword in keywords:
        if keyword not in seen:
            unique_keywords.append(keyword)
            seen.add(keyword)
    
    return unique_keywords

def calculate_percentage(part: Union[int, float], total: Union[int, float]) -> float:
    """Calculate percentage safely"""
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)

def normalize_score(score: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Normalize score to specified range"""
    return max(min_val, min(max_val, score))

def deep_merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merge two dictionaries"""
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dicts(result[key], value)
        else:
            result[key] = value
    
    return result

def flatten_dict(d: Dict[str, Any], parent_key: str = '', sep: str = '.') -> Dict[str, Any]:
    """Flatten nested dictionary"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def validate_uuid(uuid_string: str) -> bool:
    """Validate UUID string format"""
    try:
        uuid.UUID(uuid_string)
        return True
    except ValueError:
        return False

def clean_html(text: str) -> str:
    """Remove HTML tags from text"""
    import re
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)

def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    
    while size >= 1024.0 and i < len(size_names) - 1:
        size /= 1024.0
        i += 1
    
    return f"{size:.1f} {size_names[i]}"

def extract_domain_from_email(email: str) -> Optional[str]:
    """Extract domain from email address"""
    try:
        return email.split('@')[1]
    except (IndexError, AttributeError):
        return None

def is_business_hours(dt: datetime = None) -> bool:
    """Check if given datetime is within business hours (9 AM - 5 PM, Mon-Fri)"""
    if dt is None:
        dt = datetime.now()
    
    # Check if it's a weekday (Monday = 0, Sunday = 6)
    if dt.weekday() >= 5:  # Saturday or Sunday
        return False
    
    # Check if it's between 9 AM and 5 PM
    return 9 <= dt.hour < 17

def paginate_results(items: List[Any], page: int = 1, per_page: int = 20) -> Dict[str, Any]:
    """Paginate a list of items"""
    total = len(items)
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated_items = items[start:end]
    
    total_pages = (total + per_page - 1) // per_page
    
    return {
        'items': paginated_items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': total_pages,
            'has_prev': page > 1,
            'has_next': page < total_pages
        }
    }
