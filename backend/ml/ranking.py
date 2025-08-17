import math
import re
from typing import List, Dict, Any, Optional
from collections import Counter
import numpy as np

from .embeddings import EmbeddingGenerator

class RankingService:
    def __init__(self):
        self.embedding_generator = EmbeddingGenerator()
        
        # Weights for hybrid scoring
        self.bm25_weight = 0.4
        self.semantic_weight = 0.5
        self.rule_boost_weight = 0.1
        
        # BM25 parameters
        self.k1 = 1.5
        self.b = 0.75
    
    def calculate_hybrid_score(self,
                             resume_text: str,
                             resume_vec: List[float],
                             job_text: str,
                             job_vec: List[float],
                             resume_skills: List[str],
                             job_skills: List[str],
                             resume_exp: Optional[int] = None,
                             job_min_exp: Optional[int] = None,
                             same_location: bool = False) -> float:
        """Calculate the final hybrid score combining all ranking factors"""
        
        # Calculate individual scores
        bm25_score = self.calculate_bm25_score(resume_text, job_text)
        semantic_score = self.calculate_semantic_score(resume_vec, job_vec)
        rule_boost = self.calculate_rule_boost(resume_skills, job_skills, resume_exp, job_min_exp, same_location)
        
        # Combine scores with weights
        final_score = (
            self.bm25_weight * bm25_score +
            self.semantic_weight * semantic_score +
            self.rule_boost_weight * rule_boost
        )
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, final_score))
    
    def calculate_bm25_score(self, resume_text: str, job_text: str) -> float:
        """Calculate BM25 score between resume and job description"""
        if not resume_text or not job_text:
            return 0.0
        
        # Preprocess texts
        resume_tokens = self._tokenize_and_clean(resume_text)
        job_tokens = self._tokenize_and_clean(job_text)
        
        if not resume_tokens or not job_tokens:
            return 0.0
        
        # Calculate term frequencies
        resume_tf = Counter(resume_tokens)
        job_tf = Counter(job_tokens)
        
        # Use job terms as query
        query_terms = set(job_tokens)
        
        # Calculate average document length (simplified)
        avg_doc_length = (len(resume_tokens) + len(job_tokens)) / 2
        doc_length = len(resume_tokens)
        
        score = 0.0
        
        for term in query_terms:
            # Term frequency in document (resume)
            tf = resume_tf.get(term, 0)
            
            if tf > 0:
                # IDF calculation (simplified - in real implementation you'd use corpus statistics)
                # For now, we'll use a simple heuristic based on term rarity
                idf = self._calculate_simple_idf(term, [resume_text, job_text])
                
                # BM25 formula
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * (doc_length / avg_doc_length))
                
                score += idf * (numerator / denominator)
        
        # Normalize score
        max_possible_score = len(query_terms) * 10  # Rough normalization
        return min(1.0, score / max_possible_score) if max_possible_score > 0 else 0.0
    
    def calculate_semantic_score(self, resume_vec: List[float], job_vec: List[float]) -> float:
        """Calculate semantic similarity score using embeddings"""
        if not resume_vec or not job_vec:
            return 0.0
        
        similarity = self.embedding_generator.cosine_similarity(resume_vec, job_vec)
        
        # Convert from [-1, 1] to [0, 1] range
        return (similarity + 1) / 2
    
    def calculate_rule_boost(self,
                           resume_skills: List[str],
                           job_skills: List[str],
                           resume_exp: Optional[int] = None,
                           job_min_exp: Optional[int] = None,
                           same_location: bool = False) -> float:
        """Calculate rule-based boost score"""
        
        # Skills overlap using Jaccard similarity
        skills_score = self._jaccard_similarity(
            [skill.lower() for skill in resume_skills],
            [skill.lower() for skill in job_skills]
        )
        
        # Experience match score
        exp_score = self._calculate_experience_score(resume_exp, job_min_exp)
        
        # Location bonus
        location_score = 1.0 if same_location else 0.8
        
        # Weighted combination of rule-based factors
        rule_score = (
            0.6 * skills_score +
            0.3 * exp_score +
            0.1 * location_score
        )
        
        return rule_score
    
    def _tokenize_and_clean(self, text: str) -> List[str]:
        """Tokenize and clean text for BM25 calculation"""
        if not text:
            return []
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation and split into words
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = text.split()
        
        # Remove very short tokens and common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'
        }
        
        tokens = [token for token in tokens if len(token) > 2 and token not in stop_words]
        
        return tokens
    
    def _calculate_simple_idf(self, term: str, documents: List[str]) -> float:
        """Calculate a simple IDF score"""
        # Count documents containing the term
        doc_count = sum(1 for doc in documents if term.lower() in doc.lower())
        
        if doc_count == 0:
            return 0.0
        
        # Simple IDF calculation
        return math.log(len(documents) / doc_count)
    
    def _jaccard_similarity(self, set1: List[str], set2: List[str]) -> float:
        """Calculate Jaccard similarity between two lists"""
        if not set1 and not set2:
            return 1.0  # Both empty sets are considered identical
        
        if not set1 or not set2:
            return 0.0  # One empty, one non-empty
        
        # Convert to sets for intersection and union
        s1 = set(set1)
        s2 = set(set2)
        
        intersection = len(s1.intersection(s2))
        union = len(s1.union(s2))
        
        return intersection / union if union > 0 else 0.0
    
    def _calculate_experience_score(self, resume_exp: Optional[int], job_min_exp: Optional[int]) -> float:
        """Calculate experience match score"""
        if resume_exp is None or job_min_exp is None:
            return 0.5  # Neutral score when data is missing
        
        if resume_exp >= job_min_exp:
            # Candidate meets or exceeds requirements
            if resume_exp <= job_min_exp + 2:
                return 1.0  # Perfect match
            else:
                # Slight penalty for being overqualified
                excess = resume_exp - job_min_exp - 2
                penalty = min(0.3, excess * 0.05)  # Max 30% penalty
                return 1.0 - penalty
        else:
            # Candidate doesn't meet minimum requirements
            deficit = job_min_exp - resume_exp
            penalty = min(0.8, deficit * 0.2)  # Max 80% penalty
            return 1.0 - penalty
    
    def rank_candidates(self, 
                       candidates: List[Dict[str, Any]], 
                       job_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Rank a list of candidates for a given job"""
        
        job_text = f"{job_data.get('title', '')} {job_data.get('description', '')}"
        job_vec = job_data.get('job_vec', [])
        job_skills = job_data.get('skills_required', [])
        job_min_exp = job_data.get('min_exp')
        job_location = job_data.get('location', '').lower()
        
        ranked_candidates = []
        
        for candidate in candidates:
            resume_text = candidate.get('resume_text', '')
            resume_vec = candidate.get('resume_vec', [])
            resume_skills = candidate.get('skills', [])
            resume_exp = candidate.get('experience_years')
            candidate_location = candidate.get('location', '').lower()
            
            # Calculate hybrid score
            score = self.calculate_hybrid_score(
                resume_text=resume_text,
                resume_vec=resume_vec,
                job_text=job_text,
                job_vec=job_vec,
                resume_skills=resume_skills,
                job_skills=job_skills,
                resume_exp=resume_exp,
                job_min_exp=job_min_exp,
                same_location=(candidate_location == job_location)
            )
            
            # Add score to candidate data
            candidate_with_score = candidate.copy()
            candidate_with_score['match_score'] = score
            
            ranked_candidates.append(candidate_with_score)
        
        # Sort by score (descending)
        ranked_candidates.sort(key=lambda x: x['match_score'], reverse=True)
        
        return ranked_candidates
    
    def rank_jobs_for_candidate(self,
                               candidate_data: Dict[str, Any],
                               jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Rank a list of jobs for a given candidate"""
        
        resume_text = candidate_data.get('resume_text', '')
        resume_vec = candidate_data.get('resume_vec', [])
        resume_skills = candidate_data.get('skills', [])
        resume_exp = candidate_data.get('experience_years')
        candidate_location = candidate_data.get('location', '').lower()
        
        ranked_jobs = []
        
        for job in jobs:
            job_text = f"{job.get('title', '')} {job.get('description', '')}"
            job_vec = job.get('job_vec', [])
            job_skills = job.get('skills_required', [])
            job_min_exp = job.get('min_exp')
            job_location = job.get('location', '').lower()
            
            # Calculate hybrid score
            score = self.calculate_hybrid_score(
                resume_text=resume_text,
                resume_vec=resume_vec,
                job_text=job_text,
                job_vec=job_vec,
                resume_skills=resume_skills,
                job_skills=job_skills,
                resume_exp=resume_exp,
                job_min_exp=job_min_exp,
                same_location=(candidate_location == job_location)
            )
            
            # Add score to job data
            job_with_score = job.copy()
            job_with_score['match_score'] = score
            
            ranked_jobs.append(job_with_score)
        
        # Sort by score (descending)
        ranked_jobs.sort(key=lambda x: x['match_score'], reverse=True)
        
        return ranked_jobs
    
    def explain_score(self,
                     resume_text: str,
                     resume_vec: List[float],
                     job_text: str,
                     job_vec: List[float],
                     resume_skills: List[str],
                     job_skills: List[str],
                     resume_exp: Optional[int] = None,
                     job_min_exp: Optional[int] = None,
                     same_location: bool = False) -> Dict[str, Any]:
        """Provide detailed explanation of how the score was calculated"""
        
        # Calculate individual components
        bm25_score = self.calculate_bm25_score(resume_text, job_text)
        semantic_score = self.calculate_semantic_score(resume_vec, job_vec)
        rule_boost = self.calculate_rule_boost(resume_skills, job_skills, resume_exp, job_min_exp, same_location)
        
        # Calculate final score
        final_score = self.calculate_hybrid_score(
            resume_text, resume_vec, job_text, job_vec,
            resume_skills, job_skills, resume_exp, job_min_exp, same_location
        )
        
        # Detailed breakdown
        explanation = {
            'final_score': final_score,
            'components': {
                'bm25': {
                    'score': bm25_score,
                    'weight': self.bm25_weight,
                    'weighted_score': bm25_score * self.bm25_weight,
                    'description': 'Keyword matching between resume and job description'
                },
                'semantic': {
                    'score': semantic_score,
                    'weight': self.semantic_weight,
                    'weighted_score': semantic_score * self.semantic_weight,
                    'description': 'Semantic similarity based on meaning and context'
                },
                'rule_boost': {
                    'score': rule_boost,
                    'weight': self.rule_boost_weight,
                    'weighted_score': rule_boost * self.rule_boost_weight,
                    'description': 'Rule-based factors (skills, experience, location)'
                }
            },
            'factors': {
                'skills_match': self._jaccard_similarity(
                    [s.lower() for s in resume_skills],
                    [s.lower() for s in job_skills]
                ),
                'experience_match': self._calculate_experience_score(resume_exp, job_min_exp),
                'location_match': same_location,
                'matching_skills': list(set([s.lower() for s in resume_skills]) & 
                                      set([s.lower() for s in job_skills])),
                'missing_skills': list(set([s.lower() for s in job_skills]) - 
                                     set([s.lower() for s in resume_skills]))
            }
        }
        
        return explanation
