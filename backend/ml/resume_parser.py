import re
import PyPDF2
import docx
from io import BytesIO
from typing import Dict, List, Optional
import spacy
from datetime import datetime

class ResumeParser:
    def __init__(self):
        try:
            # Load spaCy model for NLP
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback if spaCy model not installed
            self.nlp = None
        
        # Predefined skills dictionary
        self.skills_keywords = {
            'programming': [
                'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
                'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css', 'sass', 'less'
            ],
            'frameworks': [
                'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'spring', 'express',
                'node.js', 'nodejs', 'laravel', 'rails', 'asp.net', 'tensorflow', 'pytorch',
                'keras', 'scikit-learn', 'pandas', 'numpy'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
                'oracle', 'sqlite', 'dynamodb', 'firestore'
            ],
            'cloud': [
                'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins',
                'terraform', 'ansible', 'vagrant'
            ],
            'tools': [
                'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack',
                'figma', 'sketch', 'adobe', 'photoshop', 'illustrator'
            ]
        }
        
        # Flatten skills for easier matching
        self.all_skills = []
        for category in self.skills_keywords.values():
            self.all_skills.extend(category)
    
    def extract_text(self, file) -> str:
        """Extract text from PDF or DOCX file"""
        try:
            file.seek(0)  # Reset file pointer
            content = file.read()
            file_stream = BytesIO(content)
            
            filename = getattr(file, 'name', '')
            
            if filename.lower().endswith('.pdf'):
                return self._extract_pdf_text(file_stream)
            elif filename.lower().endswith('.docx'):
                return self._extract_docx_text(file_stream)
            else:
                raise ValueError("Unsupported file format")
                
        except Exception as e:
            print(f"Error extracting text: {str(e)}")
            return ""
    
    def _extract_pdf_text(self, file_stream: BytesIO) -> str:
        """Extract text from PDF"""
        try:
            pdf_reader = PyPDF2.PdfReader(file_stream)
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            print(f"Error extracting PDF text: {str(e)}")
            return ""
    
    def _extract_docx_text(self, file_stream: BytesIO) -> str:
        """Extract text from DOCX"""
        try:
            doc = docx.Document(file_stream)
            text = ""
            
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text.strip()
            
        except Exception as e:
            print(f"Error extracting DOCX text: {str(e)}")
            return ""
    
    def parse_resume(self, text: str) -> Dict:
        """Parse resume text and extract structured information"""
        if not text:
            return {}
        
        text_lower = text.lower()
        
        result = {
            'skills': self._extract_skills(text_lower),
            'experience_years': self._extract_experience_years(text),
            'education': self._extract_education(text),
            'contact_info': self._extract_contact_info(text),
            'sections': self._identify_sections(text)
        }
        
        return result
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text"""
        found_skills = []
        
        for skill in self.all_skills:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text):
                found_skills.append(skill)
        
        # Remove duplicates and return
        return list(set(found_skills))
    
    def _extract_experience_years(self, text: str) -> Optional[int]:
        """Extract years of experience from resume text"""
        # Common patterns for experience
        experience_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'(\d+)\+?\s*years?\s*in',
            r'experience.*?(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience',
        ]
        
        text_lower = text.lower()
        
        for pattern in experience_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                try:
                    # Return the maximum years found
                    years = [int(match) for match in matches if match.isdigit()]
                    if years:
                        return max(years)
                except ValueError:
                    continue
        
        # Try to infer from job dates
        return self._infer_experience_from_dates(text)
    
    def _infer_experience_from_dates(self, text: str) -> Optional[int]:
        """Infer experience years from job dates in resume"""
        # Look for date patterns like "2020-2023", "Jan 2020 - Dec 2023", etc.
        date_patterns = [
            r'(\d{4})\s*[-–]\s*(\d{4})',
            r'(\d{4})\s*[-–]\s*present',
            r'(\d{4})\s*[-–]\s*current',
        ]
        
        current_year = datetime.now().year
        total_experience = 0
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    start_year = int(match[0])
                    end_year = current_year if match[1].lower() in ['present', 'current'] else int(match[1])
                    
                    if start_year <= end_year <= current_year:
                        total_experience += (end_year - start_year)
                except (ValueError, IndexError):
                    continue
        
        return total_experience if total_experience > 0 else None
    
    def _extract_education(self, text: str) -> List[str]:
        """Extract education information"""
        education_keywords = [
            'bachelor', 'master', 'phd', 'doctorate', 'degree', 'university',
            'college', 'institute', 'school', 'certification', 'certified'
        ]
        
        education_info = []
        lines = text.split('\n')
        
        for line in lines:
            line_lower = line.lower().strip()
            if any(keyword in line_lower for keyword in education_keywords):
                if len(line.strip()) > 10:  # Filter out too short lines
                    education_info.append(line.strip())
        
        return education_info[:5]  # Limit to 5 entries
    
    def _extract_contact_info(self, text: str) -> Dict[str, str]:
        """Extract contact information"""
        contact_info = {}
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact_info['email'] = emails[0]
        
        # Phone pattern
        phone_pattern = r'[\+]?[1-9]?[0-9]{0,3}[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}'
        phones = re.findall(phone_pattern, text)
        if phones:
            contact_info['phone'] = phones[0]
        
        # LinkedIn pattern
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin_matches = re.findall(linkedin_pattern, text, re.IGNORECASE)
        if linkedin_matches:
            contact_info['linkedin'] = linkedin_matches[0]
        
        return contact_info
    
    def _identify_sections(self, text: str) -> Dict[str, bool]:
        """Identify common resume sections"""
        sections = {
            'experience': False,
            'education': False,
            'skills': False,
            'projects': False,
            'certifications': False,
            'awards': False
        }
        
        text_lower = text.lower()
        
        section_keywords = {
            'experience': ['experience', 'work history', 'employment', 'career'],
            'education': ['education', 'academic', 'degree', 'university'],
            'skills': ['skills', 'technical skills', 'competencies', 'proficiencies'],
            'projects': ['projects', 'portfolio', 'work samples'],
            'certifications': ['certifications', 'certificates', 'licensed'],
            'awards': ['awards', 'achievements', 'honors', 'recognition']
        }
        
        for section, keywords in section_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                sections[section] = True
        
        return sections
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities using spaCy (if available)"""
        if not self.nlp or not text:
            return {}
        
        doc = self.nlp(text)
        entities = {
            'organizations': [],
            'locations': [],
            'dates': [],
            'persons': []
        }
        
        for ent in doc.ents:
            if ent.label_ == "ORG":
                entities['organizations'].append(ent.text)
            elif ent.label_ in ["GPE", "LOC"]:
                entities['locations'].append(ent.text)
            elif ent.label_ == "DATE":
                entities['dates'].append(ent.text)
            elif ent.label_ == "PERSON":
                entities['persons'].append(ent.text)
        
        # Remove duplicates
        for key in entities:
            entities[key] = list(set(entities[key]))
        
        return entities
