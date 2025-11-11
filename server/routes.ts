import type { Express, Request, Response } from "express";
import multer from "multer";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { generateChatResponse, moderateContent, summarizeDocument, analyzeSentiment } from "./openai";
import { extractTextFromImage, isImageFile, getOCRPoolStatus } from "./ocr";
import { ocrRateLimiter, getRateLimiterStats } from "./rate-limiter";
import { detectPii, redactPii } from "./utils/pii-detector";
import { rateLimiter } from "./utils/rate-limiter";
import { guardrails } from "./guardrails";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createRequire } from "module";

// pdf-parse is a CommonJS module
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export async function registerRoutes(app: Express) {
  await setupAuth(app);

  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const claims = user.claims;
    
    const dbUser = await storage.getUser(claims.sub);
    res.json(dbUser);
  });

  // ===== CHAT ENDPOINTS =====
  
  app.post("/api/chat", rateLimiter({ max: 20, windowMs: 60 * 1000 }), async (req, res) => {
    try {
      const { message, sessionId } = req.body;

      if (!message || !sessionId) {
        return res.status(400).json({ error: "Message and sessionId are required" });
      }

      // PII detection
      const piiCheck = detectPii(message);
      if (piiCheck.hasPii) {
        return res.status(400).json({
          error: "Your message contains sensitive personal information. Please remove it and try again.",
          piiTypes: piiCheck.types,
        });
      }

      // Content moderation
      const moderation = await moderateContent(message);
      if (moderation.flagged) {
        return res.status(400).json({
          error: "Your message was flagged by our content moderation system.",
          categories: moderation.categories,
        });
      }

      // Get or create conversation
      let conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        conversation = await storage.createConversation({
          sessionId,
        });
      }

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
      });

      // Get context: recent messages and relevant documents
      const previousMessages = await storage.getMessages(conversation.id);
      const documents = await storage.searchDocuments(message);

      // Generate AI response
      const startTime = Date.now();
      const aiResponse = await generateChatResponse(message, {
        documents,
        previousMessages: previousMessages.slice(-5), // Last 5 messages for context
      });
      const responseTime = Date.now() - startTime;

      // Create a placeholder message to get an ID for guardrails check
      const placeholderMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Processing...",
        citations: [],
      });

      // Run guardrails check on AI response
      const guardrailCheck = await guardrails.checkResponse(
        aiResponse.content,
        placeholderMessage.id,
        conversation.id,
        JSON.stringify({ userQuery: message, documents: documents.slice(0, 3) })
      );

      // Handle blocked responses
      if (guardrailCheck.wasBlocked) {
        // Update the placeholder message with error
        await storage.updateMessage(placeholderMessage.id, {
          content: "I apologize, but I cannot provide a response to this query as it may violate our content policies. Our team has been notified and will review this interaction. Please try rephrasing your question or contact support for assistance.",
        });

        // Log failed response
        await storage.createAnalyticsEvent({
          eventType: "query",
          category: "blocked_response",
          wasSuccessful: false,
          responseTime,
          metadata: { 
            sessionId,
            reason: guardrailCheck.reason,
            biasTypes: guardrailCheck.biasDetected?.biasTypes,
          },
        });

        return res.status(200).json({
          message: await storage.getMessage(placeholderMessage.id),
          citations: [],
          wasBlocked: true,
          reason: guardrailCheck.reason,
        });
      }

      // Use rewritten content if available, otherwise use original
      const finalContent = guardrailCheck.rewrittenContent || aiResponse.content;

      // Update the placeholder message with final content
      const assistantMessage = await storage.updateMessage(placeholderMessage.id, {
        content: finalContent,
        citations: aiResponse.citations,
      });

      // Log analytics event
      await storage.createAnalyticsEvent({
        eventType: "query",
        category: aiResponse.category,
        wasSuccessful: aiResponse.wasSuccessful,
        responseTime,
        metadata: { sessionId },
      });

      res.json({
        message: assistantMessage,
        citations: aiResponse.citations,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const conversation = await storage.getConversationBySessionId(sessionId);
      
      if (!conversation) {
        return res.json([]);
      }

      const messages = await storage.getMessages(conversation.id);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // ===== FEEDBACK ENDPOINTS =====
  
  app.post("/api/feedback", async (req, res) => {
    try {
      const { messageId, wasHelpful, comment } = req.body;

      if (!messageId || typeof wasHelpful !== "boolean") {
        return res.status(400).json({ error: "messageId and wasHelpful are required" });
      }

      // Analyze sentiment from feedback
      const sentimentData = await analyzeSentiment(comment || "", wasHelpful);

      await storage.updateMessage(messageId, {
        wasHelpful,
        feedbackText: comment,
        sentiment: sentimentData.sentiment,
        sentimentScore: sentimentData.score,
      });

      // Log analytics event
      await storage.createAnalyticsEvent({
        eventType: "feedback",
        category: wasHelpful ? "positive" : "negative",
        metadata: { 
          messageId, 
          sentiment: sentimentData.sentiment,
          sentimentScore: sentimentData.score,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Feedback error:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // ===== TICKET ENDPOINTS =====
  
  app.post("/api/tickets", async (req, res) => {
    try {
      const { sessionId, email, userName, userPhone } = req.body;

      if (!sessionId || !email) {
        return res.status(400).json({ error: "sessionId and email are required" });
      }

      // Get conversation to extract question
      const conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getMessages(conversation.id);
      const lastUserMessage = messages.reverse().find(m => m.role === "user");
      const question = lastUserMessage?.content || "No question found";

      const ticket = await storage.createTicket({
        question,
        userEmail: email,
        userName,
        userPhone,
        status: "open",
      });

      // Log analytics event
      await storage.createAnalyticsEvent({
        eventType: "ticket_created",
        metadata: { ticketId: ticket.id },
      });

      res.json(ticket);
    } catch (error) {
      console.error("Ticket creation error:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  app.get("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      const tickets = await storage.getTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Get tickets error:", error);
      res.status(500).json({ error: "Failed to get tickets" });
    }
  });

  app.patch("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, assignedTo } = req.body;

      const ticket = await storage.updateTicket(id, {
        status,
        assignedTo,
      });

      res.json(ticket);
    } catch (error) {
      console.error("Update ticket error:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  // ===== DOCUMENT ENDPOINTS =====
  
  app.post("/api/documents", isAuthenticated, ocrRateLimiter.middleware(), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      let content = "";
      let title = file.originalname;
      let ocrProcessed = false;
      let ocrConfidence = 0;

      // Extract text from PDF
      if (file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(file.buffer);
        content = pdfData.text;
        title = file.originalname.replace(".pdf", "");
      } else if (file.mimetype === "text/plain") {
        content = file.buffer.toString("utf-8");
      } else if (file.mimetype.startsWith("image/") || await isImageFile(file.originalname)) {
        // Handle image uploads with OCR
        const ocrResult = await extractTextFromImage(file.buffer);
        content = ocrResult.text;
        ocrProcessed = true;
        ocrConfidence = ocrResult.confidence;
        title = file.originalname.substring(0, file.originalname.lastIndexOf('.')) || file.originalname;
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload PDF, TXT, or image files." });
      }

      // Auto-generate summary and key insights
      let summary: string | undefined;
      let keyInsights: any[] | undefined;
      let suggestedTags: string[] = [];

      if (content.length > 500) {
        const summaryData = await summarizeDocument(title, content, req.body.category || "General");
        summary = summaryData.summary;
        keyInsights = summaryData.keyInsights;
        suggestedTags = summaryData.suggestedTags;
      }

      const document = await storage.createDocument({
        title,
        filename: file.originalname,
        content,
        summary,
        keyInsights,
        category: req.body.category || "General",
        department: req.body.department,
        tags: suggestedTags.length > 0 ? suggestedTags : undefined,
        fileUrl: `/uploads/${file.originalname}`,
        isActive: true,
        ocrProcessed,
        ocrConfidence: ocrProcessed ? ocrConfidence : undefined,
      });

      res.json(document);
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.get("/api/documents", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const documents = await storage.getDocuments(category);
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDocument(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.post("/api/documents/:id/regenerate-summary", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const summaryData = await summarizeDocument(document.title, document.content, document.category || "General");
      
      const updated = await storage.updateDocument(id, {
        summary: summaryData.summary,
        keyInsights: summaryData.keyInsights,
        tags: summaryData.suggestedTags,
      });

      res.json(updated);
    } catch (error) {
      console.error("Regenerate summary error:", error);
      res.status(500).json({ error: "Failed to regenerate summary" });
    }
  });

  app.post("/api/documents/:id/new-version", isAuthenticated, ocrRateLimiter.middleware(), upload.single("file"), async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      let content = "";
      let title = file.originalname;

      if (file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(file.buffer);
        content = pdfData.text;
        title = file.originalname.replace(".pdf", "");
      } else if (file.mimetype === "text/plain") {
        content = file.buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      let summary: string | undefined;
      let keyInsights: any[] | undefined;
      let suggestedTags: string[] = [];

      if (content.length > 500) {
        const summaryData = await summarizeDocument(title, content, req.body.category || "General");
        summary = summaryData.summary;
        keyInsights = summaryData.keyInsights;
        suggestedTags = summaryData.suggestedTags;
      }

      const newVersion = await storage.createDocumentVersion(id, {
        title,
        filename: file.originalname,
        content,
        summary,
        keyInsights,
        category: req.body.category,
        department: req.body.department,
        tags: suggestedTags.length > 0 ? suggestedTags : undefined,
        fileUrl: `/uploads/${file.originalname}`,
      });

      res.json(newVersion);
    } catch (error) {
      console.error("Create version error:", error);
      res.status(500).json({ error: "Failed to create new version" });
    }
  });

  app.get("/api/documents/:id/versions", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const versions = await storage.getDocumentVersions(id);
      res.json(versions);
    } catch (error) {
      console.error("Get versions error:", error);
      res.status(500).json({ error: "Failed to get document versions" });
    }
  });

  app.patch("/api/documents/:id/expiration", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { expiresAt } = req.body;

      const updated = await storage.updateDocument(id, {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update expiration error:", error);
      res.status(500).json({ error: "Failed to update expiration date" });
    }
  });

  // ===== FAQ ENDPOINTS =====
  
  app.post("/api/faqs", isAuthenticated, async (req, res) => {
    try {
      const { question, answer, category, order } = req.body;

      if (!question || !answer) {
        return res.status(400).json({ error: "Question and answer are required" });
      }

      const faq = await storage.createFaq({
        question,
        answer,
        category,
        isActive: true,
        order: order || 0,
      });

      res.json(faq);
    } catch (error) {
      console.error("Create FAQ error:", error);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await storage.getFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("Get FAQs error:", error);
      res.status(500).json({ error: "Failed to get FAQs" });
    }
  });

  app.patch("/api/faqs/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { question, answer, category, order, isActive } = req.body;

      const faq = await storage.updateFaq(id, {
        question,
        answer,
        category,
        order,
        isActive,
      });

      res.json(faq);
    } catch (error) {
      console.error("Update FAQ error:", error);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  app.delete("/api/faqs/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFaq(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete FAQ error:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // ===== MONITORING ENDPOINTS =====
  
  app.get("/api/system/status", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ error: "Unauthorized - super admin only" });
      }

      const status = {
        ocr: {
          pool: getOCRPoolStatus(),
        },
        rateLimit: getRateLimiterStats(),
        timestamp: new Date().toISOString(),
      };

      res.json(status);
    } catch (error) {
      console.error("System status error:", error);
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // ===== ANALYTICS ENDPOINTS =====
  
  app.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const allEvents = await storage.getAnalyticsEvents(monthAgo, now);
      const todayEvents = allEvents.filter(e => e.createdAt && e.createdAt >= today);
      const weekEvents = allEvents.filter(e => e.createdAt && e.createdAt >= weekAgo);

      const queryEvents = allEvents.filter(e => e.eventType === "query");
      const successfulQueries = queryEvents.filter(e => e.wasSuccessful);

      const tickets = await storage.getTickets();
      const openTickets = tickets.filter(t => t.status === "open").length;

      const documents = await storage.getDocuments();
      const faqs = await storage.getFaqs();

      const feedbackEvents = allEvents.filter(e => e.eventType === "feedback");
      const positiveFeedback = feedbackEvents.filter(e => e.category === "positive").length;
      const totalFeedback = feedbackEvents.length;

      // Hourly queries for last 24 hours
      const hourlyQueries = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        const hourStr = hour.getHours().toString().padStart(2, "0") + ":00";
        const count = todayEvents.filter(e => {
          if (!e.createdAt) return false;
          return e.createdAt.getHours() === hour.getHours() && e.eventType === "query";
        }).length;
        return { hour: hourStr, count };
      });

      // Category breakdown
      const categoryCount = new Map<string, number>();
      queryEvents.forEach(e => {
        if (e.category) {
          categoryCount.set(e.category, (categoryCount.get(e.category) || 0) + 1);
        }
      });
      const categoryBreakdown = Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const avgResponseTime = queryEvents.length > 0
        ? queryEvents.reduce((sum, e) => sum + (e.responseTime || 0), 0) / queryEvents.length
        : 0;

      res.json({
        todayQueries: todayEvents.filter(e => e.eventType === "query").length,
        weekQueries: weekEvents.filter(e => e.eventType === "query").length,
        monthQueries: queryEvents.length,
        answerRate: queryEvents.length > 0 ? successfulQueries.length / queryEvents.length : 0,
        avgResponseTime,
        satisfactionRate: totalFeedback > 0 ? positiveFeedback / totalFeedback : 0,
        openTickets,
        documentsCount: documents.length,
        faqsCount: faqs.length,
        hourlyQueries,
        categoryBreakdown,
        recentActivity: [], // Could populate with recent events
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const events = await storage.getAnalyticsEvents(thirtyDaysAgo, now);
      const queryEvents = events.filter(e => e.eventType === "query");
      const successfulQueries = queryEvents.filter(e => e.wasSuccessful);

      const feedbackEvents = events.filter(e => e.eventType === "feedback");
      const positiveFeedback = feedbackEvents.filter(e => e.category === "positive").length;

      // Get all messages with sentiment data
      const allMessages = await storage.getAllMessages();
      const messagesWithSentiment = allMessages.filter(m => m.sentiment);
      
      // Sentiment distribution
      const sentimentCounts = {
        positive: messagesWithSentiment.filter(m => m.sentiment === 'positive').length,
        neutral: messagesWithSentiment.filter(m => m.sentiment === 'neutral').length,
        negative: messagesWithSentiment.filter(m => m.sentiment === 'negative').length,
      };

      const sentimentDistribution = [
        { name: "Positive", value: sentimentCounts.positive, color: "hsl(var(--chart-1))" },
        { name: "Neutral", value: sentimentCounts.neutral, color: "hsl(var(--chart-3))" },
        { name: "Negative", value: sentimentCounts.negative, color: "hsl(var(--chart-5))" },
      ];

      // Average sentiment score
      const avgSentimentScore = messagesWithSentiment.length > 0
        ? messagesWithSentiment.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) / messagesWithSentiment.length
        : 0;

      // Query trends (last 30 days)
      const queryTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayEvents = queryEvents.filter(e => {
          if (!e.createdAt) return false;
          return e.createdAt.toDateString() === date.toDateString();
        });
        return {
          date: dateStr,
          queries: dayEvents.length,
          answered: dayEvents.filter(e => e.wasSuccessful).length,
        };
      });

      // Top categories
      const categoryCount = new Map<string, number>();
      queryEvents.forEach(e => {
        if (e.category) {
          categoryCount.set(e.category, (categoryCount.get(e.category) || 0) + 1);
        }
      });
      const topCategories = Array.from(categoryCount.entries())
        .map(([category, count]) => ({
          category,
          count,
          color: `hsl(var(--chart-${Math.floor(Math.random() * 5) + 1}))`,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Hourly distribution
      const hourlyCount = new Map<number, number>();
      queryEvents.forEach(e => {
        if (e.createdAt) {
          const hour = e.createdAt.getHours();
          hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1);
        }
      });
      const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
        hour: i.toString().padStart(2, "0") + ":00",
        count: hourlyCount.get(i) || 0,
      }));

      // Response time distribution
      const responseTimeRanges = [
        { range: "< 1s", min: 0, max: 1000 },
        { range: "1-2s", min: 1000, max: 2000 },
        { range: "2-3s", min: 2000, max: 3000 },
        { range: "3-5s", min: 3000, max: 5000 },
        { range: "> 5s", min: 5000, max: Infinity },
      ];
      const responseTimeDistribution = responseTimeRanges.map(range => ({
        range: range.range,
        count: queryEvents.filter(e => {
          const rt = e.responseTime || 0;
          return rt >= range.min && rt < range.max;
        }).length,
      }));

      const avgResponseTime = queryEvents.length > 0
        ? queryEvents.reduce((sum, e) => sum + (e.responseTime || 0), 0) / queryEvents.length
        : 0;

      res.json({
        overview: {
          totalQueries: queryEvents.length,
          queriesChange: 0,
          avgResponseTime,
          responseTimeChange: 0,
          satisfactionRate: feedbackEvents.length > 0 ? positiveFeedback / feedbackEvents.length : 0,
          satisfactionChange: 0,
          answerRate: queryEvents.length > 0 ? successfulQueries.length / queryEvents.length : 0,
          answerRateChange: 0,
          avgSentimentScore,
        },
        queryTrends,
        topCategories,
        hourlyDistribution,
        responseTimeDistribution,
        feedbackDistribution: [
          { name: "Positive", value: positiveFeedback },
          { name: "Negative", value: feedbackEvents.length - positiveFeedback },
        ],
        sentimentDistribution,
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  app.get("/api/transparency", async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const events = await storage.getAnalyticsEvents(thirtyDaysAgo, now);
      const queryEvents = events.filter(e => e.eventType === "query");
      const successfulQueries = queryEvents.filter(e => e.wasSuccessful);

      const feedbackEvents = events.filter(e => e.eventType === "feedback");
      const positiveFeedback = feedbackEvents.filter(e => e.category === "positive").length;

      // Top topics
      const categoryCount = new Map<string, number>();
      queryEvents.forEach(e => {
        if (e.category) {
          categoryCount.set(e.category, (categoryCount.get(e.category) || 0) + 1);
        }
      });
      const topTopics = Array.from(categoryCount.entries())
        .map(([topic, count]) => ({
          topic,
          count,
          percentage: Math.round((count / queryEvents.length) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Daily queries (last 7 days)
      const dailyQueries = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const count = queryEvents.filter(e => {
          if (!e.createdAt) return false;
          return e.createdAt.toDateString() === date.toDateString();
        }).length;
        return { date: dateStr, count };
      });

      const avgResponseTime = queryEvents.length > 0
        ? queryEvents.reduce((sum, e) => sum + (e.responseTime || 0), 0) / queryEvents.length
        : 0;

      res.json({
        totalQueries: queryEvents.length,
        totalQuestionsAnswered: successfulQueries.length,
        averageResponseTime: avgResponseTime,
        satisfactionRate: feedbackEvents.length > 0 ? positiveFeedback / feedbackEvents.length : 0,
        topTopics,
        dailyQueries,
        lastUpdated: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error("Transparency error:", error);
      res.status(500).json({ error: "Failed to get transparency data" });
    }
  });

  // ===== ADMIN DASHBOARD ENDPOINTS =====

  // Get flagged responses with filters
  app.get("/api/admin/flagged-responses", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user is admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }

      const { status, severity, flagType } = req.query;
      
      // Get all flagged responses (not just pending)
      let flaggedResponses = await storage.getAllFlags();
      
      // Apply filters
      if (status && status !== 'all') {
        flaggedResponses = flaggedResponses.filter(f => f.status === status);
      }
      if (severity && severity !== 'all') {
        flaggedResponses = flaggedResponses.filter(f => f.severity === severity);
      }
      if (flagType && flagType !== 'all') {
        flaggedResponses = flaggedResponses.filter(f => f.flagType === flagType);
      }

      res.json(flaggedResponses);
    } catch (error) {
      console.error("Get flagged responses error:", error);
      res.status(500).json({ error: "Failed to fetch flagged responses" });
    }
  });

  // Update flagged response status
  app.patch("/api/admin/flagged-responses/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      const updated = await storage.updateFlagStatus(id, {
        status,
        reviewedBy: user.claims.sub,
        reviewNotes,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update flagged response error:", error);
      res.status(500).json({ error: "Failed to update flagged response" });
    }
  });

  // Get audit logs with filters
  app.get("/api/admin/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }

      const { severity, eventType, startDate, endDate, reviewedOnly } = req.query;

      const logs = await storage.listAuditLogs({
        severity: severity as string,
        eventType: eventType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        reviewedOnly: reviewedOnly === 'true',
      });

      res.json(logs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Mark audit log as reviewed
  app.patch("/api/admin/audit-logs/:id/review", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }

      const { id } = req.params;
      const { notes } = req.body;

      const reviewed = await storage.markAuditLogReviewed(id, user.claims.sub, notes || '');

      res.json(reviewed);
    } catch (error) {
      console.error("Review audit log error:", error);
      res.status(500).json({ error: "Failed to review audit log" });
    }
  });

  // Get policy configurations
  app.get("/api/admin/policy-configs", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }

      const configs = await storage.getActiveConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Get policy configs error:", error);
      res.status(500).json({ error: "Failed to fetch policy configurations" });
    }
  });

  // Create or update policy configuration
  app.post("/api/admin/policy-configs", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Unauthorized - Super admin access required" });
      }

      const { name, configType, configValue, description } = req.body;

      const config = await storage.upsertPolicyConfig({
        name,
        configType,
        configValue,
        description,
        isActive: true,
      });

      // Invalidate guardrails cache when config changes
      guardrails.invalidateCache();

      res.json(config);
    } catch (error) {
      console.error("Update policy config error:", error);
      res.status(500).json({ error: "Failed to update policy configuration" });
    }
  });

  // Get dashboard statistics
  app.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }

      const [flaggedResponses, auditLogs] = await Promise.all([
        storage.getAllFlags(),
        storage.listAuditLogs({}),
      ]);

      // Calculate statistics
      const stats = {
        totalFlagged: flaggedResponses.length,
        pendingReview: flaggedResponses.filter(f => f.status === 'pending').length,
        blockedResponses: flaggedResponses.filter(f => f.wasBlocked).length,
        autoRewrites: auditLogs.filter(l => l.eventType === 'bias_auto_rewrite').length,
        severityBreakdown: {
          high: flaggedResponses.filter(f => f.severity === 'high').length,
          medium: flaggedResponses.filter(f => f.severity === 'medium').length,
          low: flaggedResponses.filter(f => f.severity === 'low').length,
        },
        biasTypeBreakdown: flaggedResponses.reduce((acc, f) => {
          f.biasTypes?.forEach(type => {
            acc[type] = (acc[type] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        recentEvents: auditLogs.slice(0, 10),
      };

      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
}
