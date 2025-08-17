import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// This storage interface is kept for compatibility but the actual
// data storage is handled by Django backend with Elasticsearch

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, string>; // token -> userId

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
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
}

export const storage = new MemStorage();
