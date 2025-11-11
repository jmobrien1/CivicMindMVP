// Reference: javascript_database and javascript_log_in_with_replit integrations
import {
  users,
  documents,
  faqs,
  conversations,
  messages,
  tickets,
  analyticsEvents,
  departmentRouting,
  auditLogs,
  policyConfigs,
  flaggedResponses,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type Faq,
  type InsertFaq,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Ticket,
  type InsertTicket,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  type DepartmentRouting,
  type InsertDepartmentRouting,
  type AuditLog,
  type InsertAuditLog,
  type PolicyConfig,
  type InsertPolicyConfig,
  type FlaggedResponse,
  type InsertFlaggedResponse,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocuments(category?: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentById(id: string): Promise<Document | undefined>;
  updateDocument(id: string, document: Partial<Document>): Promise<Document>;
  createDocumentVersion(originalId: string, updates: Partial<InsertDocument>): Promise<Document>;
  getDocumentVersions(documentId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
  searchDocuments(query: string): Promise<Document[]>;

  // FAQ operations
  createFaq(faq: InsertFaq): Promise<Faq>;
  getFaqs(): Promise<Faq[]>;
  getFaq(id: string): Promise<Faq | undefined>;
  updateFaq(id: string, faq: Partial<Faq>): Promise<Faq>;
  deleteFaq(id: string): Promise<void>;

  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationBySessionId(sessionId: string): Promise<Conversation | undefined>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
  updateMessage(id: string, message: Partial<Message>): Promise<Message>;

  // Ticket operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTickets(): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  updateTicket(id: string, ticket: Partial<Ticket>): Promise<Ticket>;

  // Analytics operations
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(startDate?: Date, endDate?: Date): Promise<AnalyticsEvent[]>;

  // Department routing operations
  getDepartmentRouting(): Promise<DepartmentRouting[]>;
  getDepartmentByCategory(category: string): Promise<DepartmentRouting | undefined>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  listAuditLogs(filters: {
    severity?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    reviewedOnly?: boolean;
  }): Promise<AuditLog[]>;
  markAuditLogReviewed(id: string, reviewedBy: string, notes: string): Promise<AuditLog>;

  // Flagged response operations
  createFlaggedResponse(flagged: InsertFlaggedResponse): Promise<FlaggedResponse>;
  getPendingFlags(): Promise<FlaggedResponse[]>;
  updateFlagStatus(id: string, updates: { status?: string; reviewedBy?: string; reviewNotes?: string }): Promise<FlaggedResponse>;
  getFlagsForMessage(messageId: string): Promise<FlaggedResponse[]>;

  // Policy config operations
  getActiveConfigs(): Promise<PolicyConfig[]>;
  upsertPolicyConfig(config: InsertPolicyConfig): Promise<PolicyConfig>;
  deactivatePolicyConfig(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [doc] = await db.insert(documents).values(document).returning();
    return doc;
  }

  async getDocuments(category?: string): Promise<Document[]> {
    const now = new Date();
    const baseConditions = [
      eq(documents.isActive, true),
      sql`(${documents.expiresAt} IS NULL OR ${documents.expiresAt} > ${now})`
    ];

    if (category && category !== "all") {
      return await db
        .select()
        .from(documents)
        .where(and(eq(documents.category, category), ...baseConditions))
        .orderBy(desc(documents.createdAt));
    }
    return await db
      .select()
      .from(documents)
      .where(and(...baseConditions))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async updateDocument(id: string, documentData: Partial<Document>): Promise<Document> {
    const [updated] = await db
      .update(documents)
      .set(documentData)
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async createDocumentVersion(originalId: string, updates: Partial<InsertDocument>): Promise<Document> {
    const original = await this.getDocumentById(originalId);
    if (!original) {
      throw new Error("Original document not found");
    }

    const newVersion = original.version + 1;

    const [newDoc] = await db.insert(documents).values({
      ...updates,
      version: newVersion,
      previousVersionId: originalId,
      isActive: true,
    } as InsertDocument).returning();

    await db.update(documents)
      .set({ isActive: false })
      .where(eq(documents.id, originalId));

    return newDoc;
  }

  async getDocumentVersions(documentId: string): Promise<Document[]> {
    const versions: Document[] = [];
    let currentId: string | null = documentId;

    while (currentId) {
      const doc = await this.getDocumentById(currentId);
      if (!doc) break;
      
      versions.push(doc);
      currentId = doc.previousVersionId;
    }

    return versions.reverse();
  }

  async deleteDocument(id: string): Promise<void> {
    await db.update(documents).set({ isActive: false }).where(eq(documents.id, id));
  }

  async searchDocuments(query: string): Promise<Document[]> {
    // Extract keywords from query (remove common stop words)
    const stopWords = ['when', 'where', 'what', 'how', 'is', 'are', 'the', 'a', 'an', 'do', 'does', 'can', 'i', 'you', 'about', 'for'];
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    if (keywords.length === 0) {
      // No meaningful keywords, return all active documents
      return await db
        .select()
        .from(documents)
        .where(eq(documents.isActive, true))
        .orderBy(desc(documents.createdAt))
        .limit(5);
    }

    // Search for documents containing ANY of the keywords
    const searchConditions = keywords.map(keyword => 
      sql`${documents.content} ILIKE ${`%${keyword}%`}`
    );

    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.isActive, true),
          sql`(${sql.join(searchConditions, sql` OR `)})`
        )
      )
      .orderBy(desc(documents.createdAt))
      .limit(5);
  }

  // FAQ operations
  async createFaq(faq: InsertFaq): Promise<Faq> {
    const [newFaq] = await db.insert(faqs).values(faq).returning();
    return newFaq;
  }

  async getFaqs(): Promise<Faq[]> {
    return await db
      .select()
      .from(faqs)
      .where(eq(faqs.isActive, true))
      .orderBy(faqs.order, desc(faqs.createdAt));
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    const [faq] = await db.select().from(faqs).where(eq(faqs.id, id));
    return faq;
  }

  async updateFaq(id: string, faqData: Partial<Faq>): Promise<Faq> {
    const [faq] = await db
      .update(faqs)
      .set({ ...faqData, updatedAt: new Date() })
      .where(eq(faqs.id, id))
      .returning();
    return faq;
  }

  async deleteFaq(id: string): Promise<void> {
    await db.update(faqs).set({ isActive: false }).where(eq(faqs.id, id));
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [conv] = await db.insert(conversations).values(conversation).returning();
    return conv;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.sessionId, sessionId));
    return conv;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(message).returning();
    return msg;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async getAllMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt));
  }

  async updateMessage(id: string, messageData: Partial<Message>): Promise<Message> {
    const [msg] = await db
      .update(messages)
      .set(messageData)
      .where(eq(messages.id, id))
      .returning();
    return msg;
  }

  // Ticket operations
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async getTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async updateTicket(id: string, ticketData: Partial<Ticket>): Promise<Ticket> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...ticketData, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  // Analytics operations
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [analyticsEvent] = await db.insert(analyticsEvents).values(event).returning();
    return analyticsEvent;
  }

  async getAnalyticsEvents(startDate?: Date, endDate?: Date): Promise<AnalyticsEvent[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, startDate),
            sql`${analyticsEvents.createdAt} <= ${endDate}`
          )
        )
        .orderBy(desc(analyticsEvents.createdAt));
    }
    return await db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt));
  }

  // Department routing operations
  async getDepartmentRouting(): Promise<DepartmentRouting[]> {
    return await db
      .select()
      .from(departmentRouting)
      .where(eq(departmentRouting.isActive, true));
  }

  async getDepartmentByCategory(category: string): Promise<DepartmentRouting | undefined> {
    const departments = await db
      .select()
      .from(departmentRouting)
      .where(eq(departmentRouting.isActive, true));
    
    return departments.find(dept => 
      dept.categories?.some(cat => cat.toLowerCase() === category.toLowerCase())
    );
  }

  // Audit log operations
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }

  async listAuditLogs(filters: {
    severity?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    reviewedOnly?: boolean;
  }): Promise<AuditLog[]> {
    const conditions = [];

    if (filters.severity) {
      conditions.push(eq(auditLogs.severity, filters.severity));
    }
    if (filters.eventType) {
      conditions.push(eq(auditLogs.eventType, filters.eventType));
    }
    if (filters.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filters.endDate}`);
    }
    if (filters.reviewedOnly) {
      conditions.push(sql`${auditLogs.reviewedAt} IS NOT NULL`);
    }

    const query = db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt));

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  async markAuditLogReviewed(id: string, reviewedBy: string, notes: string): Promise<AuditLog> {
    const [log] = await db
      .update(auditLogs)
      .set({
        reviewedBy,
        reviewNotes: notes,
        reviewedAt: new Date(),
      })
      .where(eq(auditLogs.id, id))
      .returning();
    return log;
  }

  // Flagged response operations
  async createFlaggedResponse(flaggedData: InsertFlaggedResponse): Promise<FlaggedResponse> {
    const [flagged] = await db.insert(flaggedResponses).values(flaggedData).returning();
    return flagged;
  }

  async getPendingFlags(): Promise<FlaggedResponse[]> {
    return await db
      .select()
      .from(flaggedResponses)
      .where(eq(flaggedResponses.status, 'pending'))
      .orderBy(desc(flaggedResponses.createdAt));
  }

  async updateFlagStatus(
    id: string,
    updates: { status?: string; reviewedBy?: string; reviewNotes?: string }
  ): Promise<FlaggedResponse> {
    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.reviewedBy) {
      updateData.reviewedBy = updates.reviewedBy;
      updateData.reviewedAt = new Date();
    }
    if (updates.reviewNotes) updateData.reviewNotes = updates.reviewNotes;

    const [flagged] = await db
      .update(flaggedResponses)
      .set(updateData)
      .where(eq(flaggedResponses.id, id))
      .returning();
    return flagged;
  }

  async getFlagsForMessage(messageId: string): Promise<FlaggedResponse[]> {
    return await db
      .select()
      .from(flaggedResponses)
      .where(eq(flaggedResponses.messageId, messageId))
      .orderBy(desc(flaggedResponses.createdAt));
  }

  // Policy config operations
  async getActiveConfigs(): Promise<PolicyConfig[]> {
    return await db
      .select()
      .from(policyConfigs)
      .where(eq(policyConfigs.isActive, true))
      .orderBy(desc(policyConfigs.updatedAt));
  }

  async upsertPolicyConfig(configData: InsertPolicyConfig): Promise<PolicyConfig> {
    const [config] = await db
      .insert(policyConfigs)
      .values(configData)
      .onConflictDoUpdate({
        target: policyConfigs.name,
        set: {
          ...configData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return config;
  }

  async deactivatePolicyConfig(id: string): Promise<void> {
    await db
      .update(policyConfigs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(policyConfigs.id, id));
  }

  // Get all messages for sentiment analytics
  async getAllMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt));
  }
}

export const storage = new DatabaseStorage();
