import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';

interface ChatMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
}

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  applicationId: string;
}

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map<string, ClientConnection[]>();

  wss.on('connection', (ws: WebSocket, request) => {
    const url = parse(request.url || '', true);
    const pathParts = url.pathname?.split('/') || [];
    
    if (pathParts[1] !== 'ws' || pathParts[2] !== 'chat') {
      ws.close(4000, 'Invalid path');
      return;
    }

    const applicationId = pathParts[3];
    if (!applicationId) {
      ws.close(4000, 'Missing application ID');
      return;
    }

    // In a real implementation, you would verify authentication here
    const userId = url.query.userId as string;
    if (!userId) {
      ws.close(4001, 'Authentication required');
      return;
    }

    // Add client to room
    if (!clients.has(applicationId)) {
      clients.set(applicationId, []);
    }
    
    const connection: ClientConnection = { ws, userId, applicationId };
    clients.get(applicationId)!.push(connection);

    console.log(`Client ${userId} connected to chat ${applicationId}`);

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to chat'
    }));

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat_message') {
          const chatMessage: ChatMessage = {
            id: generateId(),
            applicationId,
            senderId: userId,
            senderName: message.senderName || 'User',
            senderRole: message.senderRole || 'user',
            content: message.content,
            timestamp: new Date().toISOString()
          };

          // Broadcast to all clients in the room
          const roomClients = clients.get(applicationId) || [];
          roomClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'message',
                message: chatMessage
              }));
            }
          });
        }
        
        if (message.type === 'typing') {
          // Broadcast typing indicator to other clients
          const roomClients = clients.get(applicationId) || [];
          roomClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN && client.userId !== userId) {
              client.ws.send(JSON.stringify({
                type: 'typing',
                userId,
                isTyping: message.isTyping
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from room
      const roomClients = clients.get(applicationId);
      if (roomClients) {
        const index = roomClients.findIndex(c => c.ws === ws);
        if (index !== -1) {
          roomClients.splice(index, 1);
        }
        
        if (roomClients.length === 0) {
          clients.delete(applicationId);
        }
      }
      
      console.log(`Client ${userId} disconnected from chat ${applicationId}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
