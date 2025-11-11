import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default("admin"), // "admin" or "super_admin"
  municipalityName: varchar("municipality_name", { length: 200 }), // e.g., "Amesbury, MA"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  faqs: many(faqs),
  tickets: many(tickets),
}));

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Documents in knowledge base
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  filename: varchar("filename", { length: 500 }).notNull(),
  fileUrl: text("file_url"), // Path to stored file
  content: text("content").notNull(), // Extracted text content
  summary: text("summary"), // AI-generated summary
  keyInsights: jsonb("key_insights"), // Array of key points extracted by AI
  category: varchar("category", { length: 100 }), // "Budget", "Bylaws", "Permits", etc.
  department: varchar("department", { length: 100 }), // "Town Clerk", "DPW", etc.
  tags: text("tags").array(), // Additional tags for search
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  version: integer("version").notNull().default(1), // Document version number
  previousVersionId: varchar("previous_version_id"), // Reference to previous version
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Manually curated FAQs
export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }), // "Trash", "Permits", "Taxes", etc.
  order: integer("order").default(0), // Display order
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const faqsRelations = relations(faqs, ({ one }) => ({
  createdByUser: one(users, {
    fields: [faqs.createdBy],
    references: [users.id],
  }),
}));

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

// Conversations (chat sessions)
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 500 }), // Anonymous session ID
  userEmail: varchar("user_email", { length: 255 }), // Optional, if user provides it
  ipAddress: varchar("ip_address", { length: 45 }), // For rate limiting
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

// Individual messages in conversations
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  citations: jsonb("citations"), // Array of {documentId, documentTitle, excerpt}
  wasHelpful: boolean("was_helpful"), // User feedback
  feedbackText: text("feedback_text"), // Optional text feedback
  flaggedAsPii: boolean("flagged_as_pii").default(false),
  flaggedAsInappropriate: boolean("flagged_as_inappropriate").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Tickets (escalated questions)
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }),
  userPhone: varchar("user_phone", { length: 50 }),
  question: text("question").notNull(),
  context: jsonb("context"), // Previous messages for context
  category: varchar("category", { length: 100 }), // Auto-detected category
  department: varchar("department", { length: 100 }), // Routed to department
  departmentEmail: varchar("department_email", { length: 255 }), // Email address to route to
  status: varchar("status", { length: 50 }).notNull().default("open"), // "open", "in_progress", "resolved"
  assignedTo: varchar("assigned_to").references(() => users.id),
  notes: text("notes"), // Staff notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ticketsRelations = relations(tickets, ({ one }) => ({
  conversation: one(conversations, {
    fields: [tickets.conversationId],
    references: [conversations.id],
  }),
  assignedToUser: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
  }),
}));

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

// Analytics events
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: varchar("event_type", { length: 100 }).notNull(), // "query", "ticket_created", "document_uploaded", etc.
  category: varchar("category", { length: 100 }), // Query category/topic
  wasSuccessful: boolean("was_successful"), // Whether query was answered
  wasHelpful: boolean("was_helpful"), // User feedback
  responseTime: integer("response_time"), // In milliseconds
  metadata: jsonb("metadata"), // Additional data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("analytics_event_type_idx").on(table.eventType),
  index("analytics_category_idx").on(table.category),
  index("analytics_created_at_idx").on(table.createdAt),
]);

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

// Department routing configuration
export const departmentRouting = pgTable("department_routing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  department: varchar("department", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  categories: text("categories").array(), // Categories this department handles
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepartmentRoutingSchema = createInsertSchema(departmentRouting).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DepartmentRouting = typeof departmentRouting.$inferSelect;
export type InsertDepartmentRouting = z.infer<typeof insertDepartmentRoutingSchema>;
