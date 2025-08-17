import { elasticsearchClient } from './client';

export const INDICES = {
  USERS: 'users',
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  INTERVIEWS: 'interviews',
  EVENTS: 'events',
};

export const MAPPINGS = {
  [INDICES.USERS]: {
    properties: {
      id: { type: 'keyword' },
      role: { type: 'keyword' },
      email: { type: 'keyword' },
      password_hash: { type: 'keyword' },
      full_name: { type: 'text' },
      headline: { type: 'text' },
      skills: { type: 'keyword' },
      experience_years: { type: 'integer' },
      location: { type: 'keyword' },
      resume_file_path: { type: 'keyword' },
      resume_text: { type: 'text' },
      resume_vec: { 
        type: 'dense_vector', 
        dims: 384, 
        index: true, 
        similarity: 'cosine' 
      },
      created_at: { type: 'date' },
      updated_at: { type: 'date' }
    }
  },
  [INDICES.JOBS]: {
    properties: {
      id: { type: 'keyword' },
      recruiter_id: { type: 'keyword' },
      title: { type: 'text' },
      description: { type: 'text' },
      company: { type: 'keyword' },
      skills_required: { type: 'keyword' },
      min_exp: { type: 'integer' },
      location: { type: 'keyword' },
      employment_type: { type: 'keyword' },
      job_vec: { 
        type: 'dense_vector', 
        dims: 384, 
        index: true, 
        similarity: 'cosine' 
      },
      created_at: { type: 'date' },
      status: { type: 'keyword' }
    }
  },
  [INDICES.APPLICATIONS]: {
    properties: {
      id: { type: 'keyword' },
      job_id: { type: 'keyword' },
      seeker_id: { type: 'keyword' },
      status: { type: 'keyword' },
      scores: {
        type: 'object',
        properties: {
          bm25: { type: 'float' },
          semantic: { type: 'float' },
          rule_boost: { type: 'float' },
          final: { type: 'float' }
        }
      },
      created_at: { type: 'date' },
      updated_at: { type: 'date' }
    }
  },
  [INDICES.INTERVIEWS]: {
    properties: {
      id: { type: 'keyword' },
      job_id: { type: 'keyword' },
      seeker_id: { type: 'keyword' },
      recruiter_id: { type: 'keyword' },
      start_time: { type: 'date' },
      end_time: { type: 'date' },
      meeting_link: { type: 'keyword' },
      status: { type: 'keyword' },
      notes: { type: 'text' }
    }
  },
  [INDICES.EVENTS]: {
    properties: {
      id: { type: 'keyword' },
      actor_id: { type: 'keyword' },
      type: { type: 'keyword' },
      payload: { type: 'object' },
      ts: { type: 'date' }
    }
  }
};

export async function initializeIndices(): Promise<boolean> {
  const client = elasticsearchClient;
  
  try {
    for (const [index, mapping] of Object.entries(MAPPINGS)) {
      await client.createIndex(index, mapping);
    }
    console.log('All indices initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize indices:', error);
    return false;
  }
}
