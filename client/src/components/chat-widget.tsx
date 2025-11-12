import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, User, FileText } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  wasHelpful?: boolean | null;
  citations?: Array<{
    documentId: string;
    documentTitle: string;
    excerpt: string;
  }>;
}

interface ChatWidgetProps {
  isOpenExternal?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMessage?: string;
}

export function ChatWidget({ isOpenExternal, onOpenChange, initialMessage }: ChatWidgetProps = {}) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : isOpenInternal;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setIsOpenInternal(open);
    }
  };
  
  // Handle initial message when chat opens
  useEffect(() => {
    if (isOpen && initialMessage && !input) {
      setInput(initialMessage);
    }
  }, [isOpen, initialMessage]);

  const { data: messages = [], refetch } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", sessionId],
    enabled: isOpen,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest("POST", "/api/chat", {
        message,
        sessionId,
      });
    },
    onSuccess: () => {
      refetch();
      setInput("");
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async ({ messageId, helpful }: { messageId: string; helpful: boolean }) => {
      return await apiRequest("POST", "/api/feedback", {
        messageId,
        wasHelpful: helpful,
      });
    },
    onSuccess: () => {
      refetch();
    },
  });

  const createTicket = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/tickets", {
        sessionId,
        email,
      });
    },
  });

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessage.isPending]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !sendMessage.isPending) {
      sendMessage.mutate(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) {
    return (
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover-elevate active-elevate-2"
        onClick={() => setIsOpen(true)}
        data-testid="button-chat-open"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] flex flex-col shadow-2xl z-50" data-testid="chat-widget">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium text-sm" data-testid="text-chat-title">West Newbury Assistant</div>
            <div className="text-xs text-muted-foreground">Ask about town services</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          data-testid="button-chat-close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Welcome! I can help you with:
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Trash & recycling schedules</p>
              <p>• Permit requirements</p>
              <p>• Office hours & contact info</p>
              <p>• Property tax information</p>
              <p>• Local ordinances & bylaws</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  message.role === "user" ? "bg-primary" : "bg-muted"
                }`}>
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-primary" />
                  )}
                </div>

                <div>
                  <div
                    className={`rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    }`}
                    data-testid={`message-${message.role}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {message.role === "assistant" && message.citations && message.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-start gap-1">
                          <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Sources:</span>
                            {message.citations.map((citation, idx) => (
                              <div key={idx} className="mt-1">
                                <a
                                  href="#"
                                  className="underline hover:text-foreground"
                                  data-testid={`citation-${idx}`}
                                >
                                  {citation.documentTitle}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Was this helpful?</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${message.wasHelpful === true ? "text-primary" : ""}`}
                        onClick={() => submitFeedback.mutate({ messageId: message.id, helpful: true })}
                        data-testid={`button-helpful-${message.id}`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${message.wasHelpful === false ? "text-destructive" : ""}`}
                        onClick={() => submitFeedback.mutate({ messageId: message.id, helpful: false })}
                        data-testid={`button-not-helpful-${message.id}`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sendMessage.isPending && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[80%]">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
            disabled={sendMessage.isPending}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            rows={1}
            data-testid="input-chat"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || sendMessage.isPending}
            data-testid="button-chat-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              const email = window.prompt("Please provide your email for a staff member to follow up:");
              if (email) {
                createTicket.mutate(email);
              }
            }}
            data-testid="button-speak-to-person"
          >
            Speak to a person
          </Button>
        </div>
      </div>
    </Card>
  );
}
