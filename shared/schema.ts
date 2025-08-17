import { z } from "zod";

// User schemas
export const userRoles = ["seeker", "recruiter", "admin"] as const;

export const userSchema = z.object({
  id: z.string(),
  role: z.enum(userRoles),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  headline: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience_years: z.number().optional(),
  location: z.string().optional(),
  resume_file_path: z.string().optional(),
  resume_text: z.string().optional(),
  resume_vec: z.array(z.number()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const insertUserSchema = userSchema.omit({
  id: true,
  password_hash: true,
  created_at: true,
  updated_at: true,
}).extend({
  password: z.string().min(8),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Job schemas
export const jobStatuses = ["open", "closed"] as const;
export const employmentTypes = ["full-time", "part-time", "contract", "internship"] as const;

export const jobSchema = z.object({
  id: z.string(),
  recruiter_id: z.string(),
  title: z.string(),
  description: z.string(),
  company: z.string(),
  skills_required: z.array(z.string()).default([]),
  min_exp: z.number().optional(),
  location: z.string().optional(),
  employment_type: z.enum(employmentTypes).optional(),
  job_vec: z.array(z.number()).optional(),
  created_at: z.string().datetime(),
  status: z.enum(jobStatuses).default("open"),
});

export const insertJobSchema = jobSchema.omit({
  id: true,
  recruiter_id: true,
  created_at: true,
});

export type Job = z.infer<typeof jobSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;

// Application schemas
export const applicationStatuses = [
  "applied",
  "screening",
  "shortlisted",
  "interviewed",
  "offered",
  "rejected"
] as const;

export const applicationScoreSchema = z.object({
  bm25: z.number(),
  semantic: z.number(),
  rule_boost: z.number(),
  final: z.number(),
});

export const applicationSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  seeker_id: z.string(),
  status: z.enum(applicationStatuses).default("applied"),
  scores: applicationScoreSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const insertApplicationSchema = applicationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type Application = z.infer<typeof applicationSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type ApplicationScore = z.infer<typeof applicationScoreSchema>;

// Interview schemas
export const interviewStatuses = [
  "scheduled",
  "rescheduled", 
  "cancelled",
  "completed"
] as const;

export const interviewSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  seeker_id: z.string(),
  recruiter_id: z.string(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  meeting_link: z.string().optional(),
  status: z.enum(interviewStatuses).default("scheduled"),
  notes: z.string().optional(),
});

export const insertInterviewSchema = interviewSchema.omit({
  id: true,
});

export type Interview = z.infer<typeof interviewSchema>;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

// Event/Analytics schemas
export const eventSchema = z.object({
  id: z.string(),
  actor_id: z.string(),
  type: z.string(),
  payload: z.record(z.any()),
  ts: z.string().datetime(),
});

export type Event = z.infer<typeof eventSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = insertUserSchema;

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

// Chat message schema
export const messageSchema = z.object({
  id: z.string(),
  application_id: z.string(),
  sender_id: z.string(),
  content: z.string(),
  timestamp: z.string().datetime(),
});

export type Message = z.infer<typeof messageSchema>;
