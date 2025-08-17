import * as fs from 'fs';
import * as path from 'path';

export interface ParsedResumeData {
  skills: string[];
  experience_years?: number;
  education: string[];
  contact_info: {
    email?: string;
    phone?: string;
    linkedin?: string;
  };
}

export class ResumeParser {
  private skillsKeywords: string[] = [
    'javascript', 'typescript', 'python', 'java', 'react', 'nodejs', 'express',
    'django', 'flask', 'spring', 'mysql', 'postgresql', 'mongodb', 'redis',
    'aws', 'azure', 'docker', 'kubernetes', 'git', 'html', 'css', 'angular',
    'vue', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala'
  ];

  async extractText(filePath: string): Promise<string> {
    // This is a simplified implementation
    // In production, you would use libraries like pdf2pic, mammoth, etc.
    try {
      if (filePath.endsWith('.txt')) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      // For PDF/DOCX, return placeholder for now
      // You would integrate with actual parsing libraries
      return "Sample resume text content for parsing";
    } catch (error) {
      console.error('Error extracting text:', error);
      return '';
    }
  }

  parseResume(text: string): ParsedResumeData {
    const lowerText = text.toLowerCase();
    
    return {
      skills: this.extractSkills(lowerText),
      experience_years: this.extractExperienceYears(text),
      education: this.extractEducation(text),
      contact_info: this.extractContactInfo(text)
    };
  }

  private extractSkills(text: string): string[] {
    const foundSkills: string[] = [];
    
    for (const skill of this.skillsKeywords) {
      const regex = new RegExp(`\\b${skill}\\b`, 'i');
      if (regex.test(text)) {
        foundSkills.push(skill);
      }
    }
    
    return foundSkills;
  }

  private extractExperienceYears(text: string): number | undefined {
    const patterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
      /(\d+)\+?\s*years?\s*in/i,
      /experience.*?(\d+)\+?\s*years?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return undefined;
  }

  private extractEducation(text: string): string[] {
    const educationKeywords = [
      'bachelor', 'master', 'phd', 'degree', 'university', 'college'
    ];
    
    const lines = text.split('\n');
    const education: string[] = [];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (educationKeywords.some(keyword => lowerLine.includes(keyword))) {
        education.push(line.trim());
      }
    }
    
    return education.slice(0, 3); // Limit to 3 entries
  }

  private extractContactInfo(text: string): ParsedResumeData['contact_info'] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /[\+]?[1-9]?[0-9]{0,3}[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/;
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/i;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const linkedinMatch = text.match(linkedinRegex);

    return {
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      linkedin: linkedinMatch ? linkedinMatch[0] : undefined
    };
  }
}
