import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSchema, loginSchema, type User } from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      const token = randomUUID(); // Simple token for demo
      
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          headline: user.headline,
          location: user.location,
          skills: user.skills
        }, 
        token 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: 'Invalid registration data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(email);
      
      if (!user || user.password_hash !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = randomUUID(); // Simple token for demo
      
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          headline: user.headline,
          location: user.location,
          skills: user.skills
        }, 
        token 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: 'Invalid login data' });
    }
  });

  // Jobs routes - placeholder for now
  app.get('/api/jobs', (req, res) => {
    res.json([]);
  });

  app.post('/api/jobs', (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
  });

  // Applications routes - placeholder for now
  app.get('/api/applications', (req, res) => {
    res.json([]);
  });

  app.post('/api/applications', (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
  });

  // Chat/WebSocket will be handled separately
  app.use('/ws', (req, res) => {
    res.status(404).json({ error: 'WebSocket connections not yet implemented' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
