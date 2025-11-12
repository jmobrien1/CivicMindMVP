import { useState, useEffect, useRef } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Send, HelpCircle, Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SAMPLE_QUESTIONS = [
  "When is trash and recycling pickup for my house, and are there any holiday delays?",
  "When are property taxes due and how can I pay?",
  "What are town office hours and where is Town Hall?",
  "How do I contact the Board of Health about trash and recycling?",
  "When does the Select Board usually meet?",
];

export default function ResidentPage() {
  const { setRole, residentSessionId, setResidentSessionId } = useDemo();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => residentSessionId || nanoid());

  useEffect(() => {
    if (!residentSessionId) {
      setResidentSessionId(sessionId);
    }
  }, [sessionId, residentSessionId, setResidentSessionId]);

  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again or contact town staff at (978) 363-1100.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setInput(question);
    handleSendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleBackToHome = () => {
    setRole("resident");
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F0E9] to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToHome} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-[#004422]" />
              <div>
                <h1 className="font-medium text-lg">West Newbury Assistant</h1>
                <p className="text-xs text-muted-foreground">Resident Portal</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/transparency">How this AI works →</a>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8 h-full">
          {/* Chat Area */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <Card className="flex-1 flex flex-col p-6 min-h-[600px]">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-[#004422]/10 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="h-8 w-8 text-[#004422]" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Ask about West Newbury Services</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Get instant answers about trash schedules, office hours, tax deadlines, meeting schedules, and more.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try a sample question from the right, or type your own below.
                  </p>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 && (
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${message.role}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-[#004422] text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.role === "user" ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
                  className="resize-none"
                  rows={2}
                  disabled={isLoading}
                  data-testid="input-chat"
                />
                <Button
                  onClick={() => handleSendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="flex-shrink-0 h-[72px] w-[72px] bg-[#004422] hover:bg-[#003318]"
                  data-testid="button-chat-send"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Sample Questions Sidebar */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Common Questions</h3>
              <div className="space-y-2">
                {SAMPLE_QUESTIONS.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left h-auto py-3 px-4 whitespace-normal justify-start hover-elevate"
                    onClick={() => handleSampleQuestion(question)}
                    disabled={isLoading}
                    data-testid={`button-sample-question-${index}`}
                  >
                    <span className="text-sm">{question}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <Card className="p-4">
              <h3 className="font-medium mb-2 text-sm">Need More Help?</h3>
              <p className="text-xs text-muted-foreground mb-3">
                For complex issues or urgent matters, contact town staff directly.
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="font-medium">Town Hall</p>
                  <p className="text-muted-foreground">(978) 363-1100</p>
                </div>
                <div>
                  <p className="font-medium">Hours</p>
                  <p className="text-muted-foreground">Mon-Thu: 8 AM-4:30 PM<br />Fri: 8 AM-Noon</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
