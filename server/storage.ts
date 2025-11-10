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
    if (category && category !== "all") {
      return await db
        .select()
        .from(documents)
        .where(and(eq(documents.category, category), eq(documents.isActive, true)))
        .orderBy(desc(documents.createdAt));
    }
    return await db
      .select()
      .from(documents)
      .where(eq(documents.isActive, true))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.update(documents).set({ isActive: false }).where(eq(documents.id, id));
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.isActive, true),
          sql`${documents.content} ILIKE ${'%' + query + '%'}`
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
}

export const storage = new DatabaseStorage();
