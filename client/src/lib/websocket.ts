import type { Message } from "@shared/schema";

interface WebSocketOptions {
  onMessage?: (message: Message) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketOptions;

  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.options = options;
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = (event) => {
        console.log("WebSocket connected");
        this.options.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.options.onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        this.options.onError?.(event);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.options.onClose?.();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function createChatWebSocket(applicationId: string, options: WebSocketOptions): WebSocketClient {
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat/${applicationId}/`;
  return new WebSocketClient(wsUrl, options);
}
