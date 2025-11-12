import type { InsertTicket, DepartmentRouting } from "@shared/schema";

interface ServiceRequestDetection {
  needsHumanHelp: boolean;
  category?: string;
  department?: string;
  departmentEmail?: string;
  reason?: string;
}

const SERVICE_REQUEST_KEYWORDS = [
  "complaint",
  "complain",
  "report",
  "issue",
  "problem",
  "broken",
  "not working",
  "doesn't work",
  "can't",
  "unable to",
  "help me",
  "speak to someone",
  "talk to",
  "contact",
  "call me",
  "email me",
  "escalate",
  "urgent",
  "emergency"
];

const CATEGORY_KEYWORDS = {
  trash: ["trash", "garbage", "recycling", "pickup", "collection", "waste", "bin"],
  tax: ["tax", "payment", "bill", "excise", "property tax", "water bill"],
  permits: ["permit", "building", "construction", "renovation", "inspection", "zoning"],
  health: ["health", "septic", "food", "restaurant", "sanitation"],
  licenses: ["license", "certificate", "dog", "marriage", "birth", "death"],
  planning: ["planning", "subdivision", "development", "site plan"],
  roads: ["road", "street", "pothole", "snow", "plowing"],
  water: ["water", "sewer", "leak", "shut off"]
};

export function detectServiceRequest(
  message: string,
  departments: DepartmentRouting[]
): ServiceRequestDetection {
  const lowerMessage = message.toLowerCase();
  
  // Check if message contains service request keywords
  const hasServiceKeyword = SERVICE_REQUEST_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (!hasServiceKeyword) {
    return { needsHumanHelp: false };
  }
  
  // Detect category
  let detectedCategory: string | undefined;
  let highestMatchCount = 0;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchCount = keywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length;
    
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      detectedCategory = category;
    }
  }
  
  // Route to appropriate department based on category
  let targetDepartment: DepartmentRouting | undefined;
  
  if (detectedCategory) {
    targetDepartment = departments.find(dept => 
      dept.categories?.includes(detectedCategory)
    );
  }
  
  // Default to general inquiry if no specific department found
  if (!targetDepartment) {
    targetDepartment = departments.find(dept => 
      dept.department === "General Inquiry"
    );
  }
  
  return {
    needsHumanHelp: true,
    category: detectedCategory || "general",
    department: targetDepartment?.department,
    departmentEmail: targetDepartment?.email,
    reason: "Service request detected - requires human assistance"
  };
}

export function createTicketData(
  message: string,
  conversationId: string,
  detection: ServiceRequestDetection,
  previousMessages: any[]
): InsertTicket {
  return {
    conversationId,
    userEmail: "citizen@wnewbury.org", // Default, can be updated if user provides
    question: message,
    context: { previousMessages: previousMessages.slice(-3) },
    category: detection.category || undefined,
    department: detection.department || undefined,
    departmentEmail: detection.departmentEmail || undefined,
    status: "open"
  };
}

export function generateTicketResponse(ticket: { id: string; department?: string | null }): string {
  const expectedResponse = "1-2 business days";
  
  return `I've created a service request for you (Ticket #${ticket.id.slice(0, 8)}). ${
    ticket.department 
      ? `This has been routed to the ${ticket.department}.` 
      : "Our team will review your request."
  }

You can expect a response within ${expectedResponse}. A town staff member will contact you directly to address your concern.

Is there anything else I can help you with?`;
}
