import hashlib
import secrets
import bcrypt
from typing import Optional

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)

def hash_data(data: str, salt: Optional[str] = None) -> str:
    """Hash arbitrary data with optional salt"""
    if salt is None:
        salt = secrets.token_hex(16)
    
    combined = f"{data}{salt}"
    hashed = hashlib.sha256(combined.encode('utf-8')).hexdigest()
    return f"{salt}${hashed}"

def verify_data_hash(data: str, hashed_data: str) -> bool:
    """Verify data against its hash"""
    try:
        salt, expected_hash = hashed_data.split('$', 1)
        combined = f"{data}{salt}"
        actual_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()
        return secrets.compare_digest(expected_hash, actual_hash)
    except Exception:
        return False

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    import unicodedata
    
    # Normalize unicode
    filename = unicodedata.normalize('NFKD', filename)
    
    # Remove special characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    
    # Replace spaces with underscores
    filename = re.sub(r'\s+', '_', filename)
    
    # Limit length
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = f"{name[:90]}.{ext}" if ext else name[:100]
    
    return filename

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    return True, "Password is strong"
