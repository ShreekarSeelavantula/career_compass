import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Phone, Video, MoreVertical, Paperclip } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  applicationId: string;
  recipientName: string;
  recipientRole: string;
  jobTitle: string;
  companyName: string;
  className?: string;
}

export default function ChatInterface({
  applicationId,
  recipientName,
  recipientRole,
  jobTitle,
  companyName,
  className
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { sendMessage, isConnected } = useWebSocket(`/ws/chat/${applicationId}/`, {
    onMessage: (data) => {
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'typing') {
        setRecipientTyping(data.is_typing);
      }
    },
    onOpen: () => {
      console.log('Connected to chat');
    },
    onError: (error) => {
      console.error('Chat connection error:', error);
    }
  });

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected && user) {
      sendMessage({
        type: 'chat_message',
        content: newMessage.trim(),
        senderName: user.full_name,
        senderRole: user.role
      });

      setNewMessage("");
      handleStopTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendMessage({
        type: 'typing',
        is_typing: true
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendMessage({
        type: 'typing',
        is_typing: false
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) return null;

  return (
    <Card className={cn("flex flex-col h-[600px]", className)} data-testid="chat-interface">
      {/* Chat Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-white">
              {getUserInitials(recipientName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg" data-testid="recipient-name">
              {recipientName}
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Badge variant="outline" className="text-xs">
                {recipientRole}
              </Badge>
              <span>•</span>
              <span data-testid="job-title">{jobTitle}</span>
              <span>•</span>
              <span data-testid="company-name">{companyName}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" data-testid="voice-call-button">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid="video-call-button">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid="chat-menu-button">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4" data-testid="messages-container">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500" data-testid="no-messages">
                <p>Start your conversation</p>
                <p className="text-sm">Send a message to {recipientName}</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.senderId === user.id;
                const showDate = index === 0 || 
                  formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "flex items-end space-x-2",
                        isCurrentUser ? "justify-end" : "justify-start"
                      )}
                      data-testid={`message-${message.id}`}
                    >
                      {!isCurrentUser && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-200">
                            {getUserInitials(message.senderName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                          isCurrentUser 
                            ? "chat-message-sent bg-primary text-white" 
                            : "chat-message-received bg-gray-100 text-gray-900"
                        )}
                      >
                        {!isCurrentUser && (
                          <div className="text-xs text-gray-500 mb-1">
                            {message.senderName}
                          </div>
                        )}
                        <div data-testid="message-content">{message.content}</div>
                        <div
                          className={cn(
                            "text-xs mt-1",
                            isCurrentUser ? "text-blue-100" : "text-gray-400"
                          )}
                          data-testid="message-time"
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {recipientTyping && (
              <div className="flex items-end space-x-2" data-testid="typing-indicator">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-gray-200">
                    {getUserInitials(recipientName)}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" data-testid="attach-file-button">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${recipientName}...`}
              disabled={!isConnected}
              className="pr-12"
              data-testid="message-input"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            size="sm"
            data-testid="send-message-button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {!isConnected && (
          <div className="text-xs text-red-500 mt-2" data-testid="connection-status">
            Disconnected - trying to reconnect...
          </div>
        )}
      </div>
    </Card>
  );
}
