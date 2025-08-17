import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy all API requests to Django backend
  app.use('/api', (req, res) => {
    const proxyUrl = `http://localhost:8000${req.originalUrl}`;
    
    const options = {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'localhost:8000'
      }
    };

    if (req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
      options.headers['Content-Type'] = 'application/json';
    }

    fetch(proxyUrl, options)
      .then(response => {
        res.status(response.status);
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        return response.text();
      })
      .then(data => {
        res.send(data);
      })
      .catch(error => {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
      });
  });

  // WebSocket proxy for chat
  app.use('/ws', (req, res) => {
    res.status(404).json({ error: 'WebSocket connections should use Django backend directly' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
