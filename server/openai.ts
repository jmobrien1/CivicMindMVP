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
  detectedLanguage?: string;
}

export async function generateChatResponse(
  userMessage: string,
  context: ChatContext
): Promise<ChatResponse> {
  try {
    const detectedLanguage = detectLanguage(userMessage);
    
    // Build context from documents and previous messages
    const documentContext = context.documents
      .map(doc => `Document: ${doc.title}\nCategory: ${doc.category}\nContent: ${doc.content.substring(0, 500)}...`)
      .join("\n\n");

    const conversationHistory = context.previousMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");

    const languageInstruction = detectedLanguage === 'es' 
      ? '\n\nIMPORTANT: The user is asking in Spanish. You MUST respond in Spanish (Español).'
      : '\n\nIMPORTANT: Respond in English.';

    const systemPrompt = `You are a helpful municipal AI assistant for the Town of West Newbury. Your role is to:
1. Answer the CURRENT question using ONLY the provided documents
2. Be accurate - sources will be cited automatically by the system
3. Provide actionable next steps when you lack complete information
4. Include friendly follow-up prompts to encourage exploration
5. Never make up information
6. Be friendly, professional, and helpful

Available Documents:
${documentContext}

${conversationHistory ? `Previous Conversation (for context only - do NOT repeat previous answers):\n${conversationHistory}\n` : ''}

Response Guidelines:
- IMPORTANT: Answer the user's CURRENT question, not previous topics from the conversation history
- Only use information from the provided documents that relates to the current question
- Each question should get a fresh, relevant answer based on the documents
- DO NOT include citations, sources, or "(Source: ...)" text in your response - the system adds citations automatically
- When you lack specific information (like an address or specific case), provide helpful next steps:
  * Suggest visiting the town website (wnewbury.org)
  * Recommend calling the appropriate department with the phone number
  * Suggest speaking with a staff member
- End responses with friendly follow-up prompts when appropriate, such as:
  * "Would you like to see upcoming Select Board meetings?"
  * "Would you like information about other town services?"
  * "Can I help you with anything else about West Newbury?"
- Format responses clearly with line breaks for readability${languageInstruction}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again or contact staff directly.";

    // Extract citations from the response
    // Include documents if their title OR significant keywords appear in the response
    const citations = context.documents
      .filter(doc => {
        const lowerContent = content.toLowerCase();
        const lowerTitle = doc.title.toLowerCase();
        
        // Check if title appears in response
        if (lowerContent.includes(lowerTitle)) {
          return true;
        }
        
        // For structured knowledge, check if key terms appear
        // E.g., "Trash & Recycling" contains "trash" and "recycling"
        const titleWords = lowerTitle.split(/\s+/).filter(w => w.length > 3);
        const matchingWords = titleWords.filter(word => lowerContent.includes(word));
        
        // If 2+ significant words from title appear in content, include it
        if (matchingWords.length >= 2) {
          return true;
        }
        
        // Also include if document content appears in response
        const contentWords = doc.content.toLowerCase().split(/\s+/).slice(0, 20);
        const contentMatches = contentWords.filter(word => word.length > 4 && lowerContent.includes(word));
        return contentMatches.length >= 3;
      })
      .map(doc => ({
        documentId: doc.id,
        documentTitle: doc.title,
        excerpt: doc.content.substring(0, 100) + "...",
        sourceUrl: doc.fileUrl || undefined
      }));

    // Simple category detection
    const category = detectCategory(userMessage);

    return {
      content,
      citations: citations.length > 0 ? citations : undefined,
      category,
      wasSuccessful: true,
      detectedLanguage,
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
  } catch (error: any) {
    // Replit AI integration doesn't support moderation endpoint - skip gracefully
    if (error?.message?.includes("not supported") || error?.status === 400) {
      console.log("Content moderation not supported by AI provider - skipping");
      return { flagged: false, categories: [] };
    }
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

function detectLanguage(text: string): string {
  const spanishIndicators = [
    /\b(dónde|cuándo|cómo|qué|quién|por qué|cuántos|cuál)\b/i,
    /\b(el|la|los|las|un|una|unos|unas)\b/i,
    /\b(está|están|hay|tiene|son|es|puedo|puede)\b/i,
    /\b(basura|reciclaje|permiso|impuestos|escuela|horario)\b/i,
    /[áéíóúñ¿¡]/i,
  ];

  const spanishMatches = spanishIndicators.filter(regex => regex.test(text)).length;
  
  return spanishMatches >= 2 ? 'es' : 'en';
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  reason?: string;
}

export async function analyzeSentiment(text: string, wasHelpful?: boolean | null): Promise<SentimentAnalysis> {
  const startTime = Date.now();
  
  try {
    if (wasHelpful === true) {
      console.log('[Sentiment] Using explicit positive feedback');
      return { sentiment: 'positive', score: 75 };
    }
    if (wasHelpful === false) {
      console.log('[Sentiment] Using explicit negative feedback');
      return { sentiment: 'negative', score: -75 };
    }

    console.log('[Sentiment] Analyzing text with GPT-4o...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis assistant. Analyze the sentiment of citizen feedback about municipal services. Respond with ONLY a JSON object in this exact format: {\"sentiment\": \"positive\" or \"neutral\" or \"negative\", \"score\": number from -100 to 100, \"reason\": \"brief explanation\"}"
        },
        {
          role: "user",
          content: `Analyze the sentiment of this feedback: "${text}"`
        }
      ],
      max_completion_tokens: 100,
    });

    const content = response.choices[0]?.message?.content || '{"sentiment": "neutral", "score": 0}';
    
    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch (parseError) {
      console.error('[Sentiment] JSON parse error:', parseError);
      console.error('[Sentiment] Raw response:', content);
      throw new Error('Failed to parse sentiment response');
    }
    
    const result = {
      sentiment: parsed.sentiment || 'neutral',
      score: Math.max(-100, Math.min(100, parsed.score || 0)),
      reason: parsed.reason,
    };

    const processingTime = Date.now() - startTime;
    console.log(`[Sentiment] Analysis complete in ${processingTime}ms: ${result.sentiment} (${result.score})`);
    
    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[Sentiment] Analysis failed after ${processingTime}ms:`, error);
    
    return { sentiment: 'neutral', score: 0, reason: 'Fallback due to processing error' };
  }
}

export interface DocumentSummary {
  summary: string;
  keyInsights: string[];
  suggestedTags: string[];
}

export async function summarizeDocument(
  title: string,
  content: string,
  category?: string
): Promise<DocumentSummary> {
  try {
    const truncatedContent = content.substring(0, 12000);
    
    const systemPrompt = `You are an expert at summarizing municipal documents like budgets, meeting minutes, policies, and regulations.

Your task is to create a concise summary and extract key insights from the provided document.

Return your response in this exact JSON format:
{
  "summary": "A 2-3 paragraph summary of the document's main content",
  "keyInsights": ["First key point or decision", "Second key point", "Third key point"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

Focus on:
- Main decisions, budget allocations, or policy changes
- Important dates, deadlines, or timelines
- Financial figures and amounts
- Action items or requirements
- Public impact and changes to services

Keep the summary clear and factual. Extract 3-8 key insights.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Document Title: ${title}\nCategory: ${category || "General"}\n\nContent:\n${truncatedContent}` 
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 800,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    return {
      summary: result.summary || "Summary unavailable",
      keyInsights: Array.isArray(result.keyInsights) ? result.keyInsights : [],
      suggestedTags: Array.isArray(result.suggestedTags) ? result.suggestedTags.slice(0, 5) : [],
    };
  } catch (error) {
    console.error("Document summarization error:", error);
    return {
      summary: "Summary generation failed. Please review the document manually.",
      keyInsights: [],
      suggestedTags: [],
    };
  }
}
