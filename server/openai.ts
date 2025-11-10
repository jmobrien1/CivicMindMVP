// Reference: javascript_openai_ai_integrations integration
import OpenAI from "openai";
import type { Document, Message } from "@shared/schema";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface ChatContext {
  documents: Document[];
  previousMessages: Message[];
}

export interface ChatResponse {
  content: string;
  citations?: Array<{
    documentId: string;
    documentTitle: string;
    excerpt: string;
  }>;
  category?: string;
  wasSuccessful: boolean;
}

export async function generateChatResponse(
  userMessage: string,
  context: ChatContext
): Promise<ChatResponse> {
  try {
    // Build context from documents and previous messages
    const documentContext = context.documents
      .map(doc => `Document: ${doc.title}\nCategory: ${doc.category}\nContent: ${doc.content.substring(0, 500)}...`)
      .join("\n\n");

    const conversationHistory = context.previousMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");

    const systemPrompt = `You are a helpful municipal AI assistant for a town government. Your role is to:
1. Answer questions about town services using ONLY the provided documents
2. Be accurate and cite your sources
3. If you don't know something, say so and suggest contacting staff
4. Never make up information
5. Be friendly and professional
6. Keep answers concise and clear

Available Documents:
${documentContext}

${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n` : ''}

Rules:
- Only use information from the provided documents
- If asked about something not in the documents, politely say you don't have that information
- Suggest "Would you like to speak with a staff member?" for complex questions
- Format responses clearly with line breaks for readability`;

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again or contact staff directly.";

    // Extract citations from the response (simple heuristic)
    const citations = context.documents
      .filter(doc => content.toLowerCase().includes(doc.title.toLowerCase()))
      .map(doc => ({
        documentId: doc.id,
        documentTitle: doc.title,
        excerpt: doc.content.substring(0, 100) + "..."
      }));

    // Simple category detection
    const category = detectCategory(userMessage);

    return {
      content,
      citations: citations.length > 0 ? citations : undefined,
      category,
      wasSuccessful: true,
    };
  } catch (error) {
    console.error("OpenAI chat error:", error);
    return {
      content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact staff directly for assistance.",
      wasSuccessful: false,
    };
  }
}

export async function moderateContent(text: string): Promise<{ flagged: boolean; categories: string[] }> {
  try {
    const moderation = await openai.moderations.create({
      input: text,
    });

    const result = moderation.results[0];
    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category, _]) => category);

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
    };
  } catch (error) {
    console.error("Moderation error:", error);
    return { flagged: false, categories: [] };
  }
}

function detectCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("trash") || lowerQuery.includes("garbage") || lowerQuery.includes("recycl")) {
    return "Trash & Recycling";
  }
  if (lowerQuery.includes("permit") || lowerQuery.includes("building") || lowerQuery.includes("construction")) {
    return "Permits";
  }
  if (lowerQuery.includes("tax") || lowerQuery.includes("payment") || lowerQuery.includes("bill")) {
    return "Taxes";
  }
  if (lowerQuery.includes("school") || lowerQuery.includes("education") || lowerQuery.includes("student")) {
    return "Schools";
  }
  if (lowerQuery.includes("hours") || lowerQuery.includes("open") || lowerQuery.includes("contact")) {
    return "General Info";
  }
  
  return "General";
}
