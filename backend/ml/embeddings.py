import numpy as np
from typing import List, Union
import os

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

class EmbeddingGenerator:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or os.environ.get('SENTENCE_TRANSFORMER_MODEL', 'all-MiniLM-L6-v2')
        self.model = None
        self.embedding_dim = int(os.environ.get('EMBEDDING_DIMENSION', '384'))
        
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.model = SentenceTransformer(self.model_name)
                print(f"Loaded SentenceTransformer model: {self.model_name}")
            except Exception as e:
                print(f"Failed to load SentenceTransformer model: {e}")
                self.model = None
        else:
            print("SentenceTransformers not available. Using fallback embedding.")
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for given text"""
        if not text or not text.strip():
            return [0.0] * self.embedding_dim
        
        if self.model is not None:
            try:
                # Clean and preprocess text
                cleaned_text = self._preprocess_text(text)
                
                # Generate embedding
                embedding = self.model.encode(cleaned_text)
                
                # Ensure it's a list of floats
                return embedding.tolist()
                
            except Exception as e:
                print(f"Error generating embedding: {e}")
                return self._fallback_embedding(text)
        else:
            return self._fallback_embedding(text)
    
    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a batch of texts"""
        if self.model is not None:
            try:
                # Clean and preprocess texts
                cleaned_texts = [self._preprocess_text(text) for text in texts]
                
                # Generate embeddings
                embeddings = self.model.encode(cleaned_texts)
                
                # Convert to list of lists
                return [emb.tolist() for emb in embeddings]
                
            except Exception as e:
                print(f"Error generating batch embeddings: {e}")
                return [self._fallback_embedding(text) for text in texts]
        else:
            return [self._fallback_embedding(text) for text in texts]
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text before embedding generation"""
        if not text:
            return ""
        
        # Basic cleaning
        text = text.strip()
        
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Truncate if too long (most models have token limits)
        max_length = 500  # Approximate token limit
        words = text.split()
        if len(words) > max_length:
            text = ' '.join(words[:max_length])
        
        return text
    
    def _fallback_embedding(self, text: str) -> List[float]:
        """Generate a simple fallback embedding when the model is not available"""
        # This is a very basic approach - in production you might want a better fallback
        
        # Simple word-based features
        words = text.lower().split()
        
        # Create a basic feature vector
        features = [0.0] * self.embedding_dim
        
        if words:
            # Simple hash-based features
            for i, word in enumerate(words[:50]):  # Limit to first 50 words
                hash_val = hash(word) % self.embedding_dim
                features[hash_val] += 1.0 / len(words)
        
        # Normalize
        norm = np.linalg.norm(features)
        if norm > 0:
            features = [f / norm for f in features]
        
        return features
    
    def cosine_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        if not embedding1 or not embedding2:
            return 0.0
        
        try:
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            
            # Ensure result is between -1 and 1
            return max(-1.0, min(1.0, similarity))
            
        except Exception as e:
            print(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    def find_most_similar(self, query_embedding: List[float], 
                         candidate_embeddings: List[List[float]], 
                         top_k: int = 5) -> List[tuple]:
        """Find the most similar embeddings to a query embedding"""
        similarities = []
        
        for i, candidate_embedding in enumerate(candidate_embeddings):
            similarity = self.cosine_similarity(query_embedding, candidate_embedding)
            similarities.append((i, similarity))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings generated by this model"""
        return self.embedding_dim
    
    def is_model_available(self) -> bool:
        """Check if the embedding model is available"""
        return self.model is not None

# Utility functions for common embedding operations
def calculate_similarity_matrix(embeddings: List[List[float]]) -> List[List[float]]:
    """Calculate similarity matrix for a list of embeddings"""
    generator = EmbeddingGenerator()
    n = len(embeddings)
    similarity_matrix = [[0.0] * n for _ in range(n)]
    
    for i in range(n):
        for j in range(i, n):
            if i == j:
                similarity_matrix[i][j] = 1.0
            else:
                sim = generator.cosine_similarity(embeddings[i], embeddings[j])
                similarity_matrix[i][j] = sim
                similarity_matrix[j][i] = sim
    
    return similarity_matrix

def cluster_embeddings(embeddings: List[List[float]], threshold: float = 0.7) -> List[List[int]]:
    """Simple clustering of embeddings based on similarity threshold"""
    generator = EmbeddingGenerator()
    n = len(embeddings)
    clusters = []
    used = [False] * n
    
    for i in range(n):
        if used[i]:
            continue
        
        cluster = [i]
        used[i] = True
        
        for j in range(i + 1, n):
            if used[j]:
                continue
            
            similarity = generator.cosine_similarity(embeddings[i], embeddings[j])
            if similarity >= threshold:
                cluster.append(j)
                used[j] = True
        
        clusters.append(cluster)
    
    return clusters
