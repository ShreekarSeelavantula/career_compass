import { type User, type InsertUser, type Job, type InsertJob, type Application, type InsertApplication } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  searchJobs(query: string): Promise<Job[]>;
  getJobRecommendations(userId: string): Promise<Job[]>;
  
  // Applications
  getApplications(): Promise<Application[]>;
  getApplicationsByUser(userId: string): Promise<Application[]>;
  getApplicationsByJob(jobId: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;
  private applications: Map<string, Application>;
  private sessions: Map<string, string>; // token -> userId

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.sessions = new Map();
    
    // Add some sample jobs
    this.seedData();
  }

  private seedData() {
    // Sample jobs for demo
    const sampleJobs: Job[] = [
      {
        id: randomUUID(),
        recruiter_id: "system",
        title: "Senior Software Engineer",
        description: "We're looking for a Senior Software Engineer to join our growing team. You'll work on building scalable web applications using React, Node.js, and modern technologies.",
        company: "TechCorp Inc",
        skills_required: ["React", "Node.js", "TypeScript", "PostgreSQL"],
        min_exp: 3,
        location: "San Francisco, CA",
        employment_type: "full-time",
        status: "open",
        created_at: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        recruiter_id: "system",
        title: "Frontend Developer",
        description: "Join our frontend team to build beautiful and responsive user interfaces. Experience with React and modern CSS frameworks required.",
        company: "StartupXYZ",
        skills_required: ["React", "CSS", "JavaScript", "Tailwind"],
        min_exp: 2,
        location: "New York, NY",
        employment_type: "full-time",
        status: "open",
        created_at: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        recruiter_id: "system",
        title: "Full Stack Developer",
        description: "We need a versatile full-stack developer to work on both frontend and backend systems. Python and React experience preferred.",
        company: "InnovateLabs",
        skills_required: ["Python", "React", "Django", "AWS"],
        min_exp: 4,
        location: "Remote",
        employment_type: "contract",
        status: "open",
        created_at: new Date().toISOString(),
      }
    ];

    sampleJobs.forEach(job => this.jobs.set(job.id, job));
  }

  setSession(token: string, userId: string) {
    this.sessions.set(token, userId);
  }

  getUserByToken(token: string): Promise<User | undefined> {
    const userId = this.sessions.get(token);
    if (!userId) return Promise.resolve(undefined);
    return this.getUser(userId);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      password_hash: insertUser.password, // This would be hashed in real implementation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      skills: insertUser.skills || [],
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      ...insertJob,
      id,
      recruiter_id: "system", // Would use actual recruiter ID
      created_at: new Date().toISOString(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async searchJobs(query: string): Promise<Job[]> {
    const allJobs = await this.getJobs();
    if (!query.trim()) return allJobs;
    
    return allJobs.filter(job => 
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.description.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase()) ||
      job.skills_required.some(skill => 
        skill.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  async getJobRecommendations(userId: string): Promise<Job[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    const allJobs = await this.getJobs();
    
    // Simple recommendation: match jobs based on user skills
    return allJobs.filter(job => 
      job.skills_required.some(skill => 
        user.skills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      )
    ).slice(0, 5); // Return top 5 recommendations
  }

  // Applications
  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async getApplicationsByUser(userId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      app => app.seeker_id === userId
    );
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      app => app.job_id === jobId
    );
  }

  async createApplication(insertApp: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const application: Application = {
      ...insertApp,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "applied",
      scores: {
        bm25: 0.5,
        semantic: 0.7,
        rule_boost: 0.1,
        final: 0.8
      }
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined> {
    const app = this.applications.get(id);
    if (!app) return undefined;
    
    const updatedApp = { ...app, ...updates };
    this.applications.set(id, updatedApp);
    return updatedApp;
  }
}

export const storage = new MemStorage();
