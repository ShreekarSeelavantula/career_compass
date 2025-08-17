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
      storage.setSession(token, user.id);
      
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
      storage.setSession(token, user.id);
      
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

  // User profile route
  app.get('/api/me', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await storage.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      headline: user.headline,
      location: user.location,
      skills: user.skills,
      resume_file_path: user.resume_file_path
    });
  });

  // Jobs routes
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  app.get('/api/jobs/recommendations', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const recommendations = await storage.getJobRecommendations(user.id);
      res.json(recommendations);
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

  app.post('/api/jobs', (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
  });

  // Applications routes
  app.get('/api/applications', async (req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  app.get('/api/applications/me', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const applications = await storage.getApplicationsByUser(user.id);
      res.json(applications);
    } catch (error) {
      console.error('Get user applications error:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  app.post('/api/applications', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { job_id } = req.body;
      if (!job_id) {
        return res.status(400).json({ error: 'Job ID is required' });
      }

      const job = await storage.getJob(job_id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const application = await storage.createApplication({
        seeker_id: user.id,
        job_id: job_id,
        status: "applied",
        scores: {
          bm25: 0.5,
          semantic: 0.7,
          rule_boost: 0.1,
          final: 0.8
        }
      });

      res.json(application);
    } catch (error) {
      console.error('Create application error:', error);
      res.status(500).json({ error: 'Failed to create application' });
    }
  });

  // Interviews routes
  app.get('/api/interviews/me', (req, res) => {
    // Return empty array for interviews
    res.json([]);
  });

  // Job search route
  app.get('/api/jobs/search', async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const jobs = await storage.searchJobs(query);
      res.json(jobs);
    } catch (error) {
      console.error('Search jobs error:', error);
      res.status(500).json({ error: 'Failed to search jobs' });
    }
  });

  // Profile update route
  app.put('/api/me', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const updates = req.body;
      // Remove sensitive fields that shouldn't be updated this way
      delete updates.id;
      delete updates.password_hash;
      delete updates.created_at;

      const updatedUser = await storage.updateUser(user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        headline: updatedUser.headline,
        location: updatedUser.location,
        skills: updatedUser.skills,
        experience_years: updatedUser.experience_years,
        resume_file_path: updatedUser.resume_file_path
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Resume upload route
  app.post('/api/me/resume', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // For demo purposes, simulate successful resume upload
      const resumePath = `/uploads/resume_${user.id}_${Date.now()}.pdf`;
      
      const updatedUser = await storage.updateUser(user.id, {
        resume_file_path: resumePath,
        resume_text: 'Sample resume content for demo purposes'
      });

      res.json({ 
        message: 'Resume uploaded successfully',
        resume_file_path: resumePath
      });
    } catch (error) {
      console.error('Resume upload error:', error);
      res.status(500).json({ error: 'Failed to upload resume' });
    }
  });

  // Chat/WebSocket will be handled separately
  app.use('/ws', (req, res) => {
    res.status(404).json({ error: 'WebSocket connections not yet implemented' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
