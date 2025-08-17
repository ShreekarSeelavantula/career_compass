import { esClient } from './client';
import { INDICES } from './indices';
import type { User, Job, Application, Interview } from '@shared/schema';

export class BaseRepository<T> {
  constructor(protected index: string) {}

  async create(document: T): Promise<T> {
    const response = await esClient.index({
      index: this.index,
      id: (document as any).id,
      body: document,
      refresh: 'wait_for'
    });
    return document;
  }

  async getById(id: string): Promise<T | null> {
    try {
      const response = await esClient.get({
        index: this.index,
        id
      });
      return response._source as T;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    try {
      await esClient.update({
        index: this.index,
        id,
        body: { doc: updates },
        refresh: 'wait_for'
      });
      return this.getById(id);
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await esClient.delete({
        index: this.index,
        id,
        refresh: 'wait_for'
      });
      return true;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async search(query: any): Promise<T[]> {
    const response = await esClient.search({
      index: this.index,
      body: query
    });
    return response.hits.hits.map(hit => hit._source as T);
  }
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(INDICES.USERS);
  }

  async getByEmail(email: string): Promise<User | null> {
    const results = await this.search({
      query: {
        term: { email }
      }
    });
    return results.length > 0 ? results[0] : null;
  }

  async searchCandidates(query: string, skills: string[], location?: string): Promise<User[]> {
    const must: any[] = [
      { term: { role: 'seeker' } }
    ];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['full_name', 'headline', 'resume_text', 'skills']
        }
      });
    }

    if (skills.length > 0) {
      must.push({
        terms: { skills }
      });
    }

    if (location) {
      must.push({
        term: { location }
      });
    }

    return this.search({
      query: { bool: { must } },
      size: 50
    });
  }
}

export class JobRepository extends BaseRepository<Job> {
  constructor() {
    super(INDICES.JOBS);
  }

  async getByRecruiter(recruiterId: string): Promise<Job[]> {
    return this.search({
      query: {
        term: { recruiter_id: recruiterId }
      },
      sort: [{ created_at: { order: 'desc' } }]
    });
  }

  async searchJobs(query?: string, location?: string, employmentType?: string): Promise<Job[]> {
    const must: any[] = [
      { term: { status: 'open' } }
    ];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^2', 'description', 'company', 'skills_required']
        }
      });
    }

    if (location) {
      must.push({
        term: { location }
      });
    }

    if (employmentType) {
      must.push({
        term: { employment_type: employmentType }
      });
    }

    return this.search({
      query: { bool: { must } },
      sort: [{ created_at: { order: 'desc' } }],
      size: 50
    });
  }

  async getOpenJobs(): Promise<Job[]> {
    return this.search({
      query: {
        term: { status: 'open' }
      },
      sort: [{ created_at: { order: 'desc' } }],
      size: 100
    });
  }
}

export class ApplicationRepository extends BaseRepository<Application> {
  constructor() {
    super(INDICES.APPLICATIONS);
  }

  async getBySeeker(seekerId: string): Promise<Application[]> {
    return this.search({
      query: {
        term: { seeker_id: seekerId }
      },
      sort: [{ created_at: { order: 'desc' } }]
    });
  }

  async getByJob(jobId: string): Promise<Application[]> {
    return this.search({
      query: {
        term: { job_id: jobId }
      },
      sort: [{ 'scores.final': { order: 'desc' } }]
    });
  }

  async getByJobs(jobIds: string[]): Promise<Application[]> {
    return this.search({
      query: {
        terms: { job_id: jobIds }
      },
      sort: [{ created_at: { order: 'desc' } }]
    });
  }

  async getByJobAndSeeker(jobId: string, seekerId: string): Promise<Application | null> {
    const results = await this.search({
      query: {
        bool: {
          must: [
            { term: { job_id: jobId } },
            { term: { seeker_id: seekerId } }
          ]
        }
      }
    });
    return results.length > 0 ? results[0] : null;
  }
}

export class InterviewRepository extends BaseRepository<Interview> {
  constructor() {
    super(INDICES.INTERVIEWS);
  }

  async getByRecruiter(recruiterId: string): Promise<Interview[]> {
    return this.search({
      query: {
        term: { recruiter_id: recruiterId }
      },
      sort: [{ start_time: { order: 'asc' } }]
    });
  }

  async getBySeeker(seekerId: string): Promise<Interview[]> {
    return this.search({
      query: {
        term: { seeker_id: seekerId }
      },
      sort: [{ start_time: { order: 'asc' } }]
    });
  }
}
