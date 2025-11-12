import { Meeting } from "@shared/schema";
import { format } from "date-fns";

export interface MeetingQuery {
  isMeetingQuery: boolean;
  boardName?: string;
  queryType?: "next" | "upcoming" | "all";
}

const MEETING_KEYWORDS = [
  "meeting",
  "board meeting",
  "select board",
  "planning board",
  "town meeting",
  "agenda",
];

const BOARD_NAMES = {
  "select board": "Select Board",
  "planning board": "Planning Board",
  "selectboard": "Select Board",
  "planningboard": "Planning Board",
};

const SERVICE_KEYWORDS = [
  "trash",
  "recycling",
  "garbage",
  "waste",
  "pickup",
  "collection",
  "tax",
  "payment",
  "bill",
  "office hours",
  "town hall hours",
  "permit",
  "license",
];

export function detectMeetingQuery(message: string): MeetingQuery {
  const lowerMessage = message.toLowerCase();
  
  // Check for explicit meeting keywords OR board names first
  const hasMeetingKeyword = MEETING_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // If no meeting keywords, check if it's a service request and skip
  if (!hasMeetingKeyword) {
    const hasServiceKeyword = SERVICE_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    // Service query without meeting keywords = not a meeting query
    if (hasServiceKeyword) {
      return { isMeetingQuery: false };
    }
    
    // No meeting keywords and no service keywords = not a meeting query
    return { isMeetingQuery: false };
  }
  
  // Has meeting keywords = likely a meeting query (even if service terms present)
  // Example: "When does Select Board discuss trash?" should still be detected

  let boardName: string | undefined;
  for (const [keyword, name] of Object.entries(BOARD_NAMES)) {
    if (lowerMessage.includes(keyword)) {
      boardName = name;
      break;
    }
  }

  const isNextQuery = lowerMessage.includes("next") || 
                      lowerMessage.includes("when is") || 
                      lowerMessage.includes("when does") ||
                      lowerMessage.includes("when will");
  const isUpcomingQuery = lowerMessage.includes("upcoming") || 
                          lowerMessage.includes("schedule") ||
                          lowerMessage.includes("calendar");

  let queryType: "next" | "upcoming" | "all" = "all";
  if (isNextQuery && boardName) {
    queryType = "next";
  } else if (isUpcomingQuery || isNextQuery) {
    queryType = "upcoming";
  }

  return {
    isMeetingQuery: true,
    boardName,
    queryType,
  };
}

export function formatMeetingResponse(
  meetings: Meeting | Meeting[] | null,
  queryType: "next" | "upcoming" | "all"
): string {
  if (!meetings || (Array.isArray(meetings) && meetings.length === 0)) {
    return "I don't have any upcoming meetings scheduled at this time. For the most current information, please check the town website or contact Town Hall at (978) 363-1100.";
  }

  if (!Array.isArray(meetings)) {
    meetings = [meetings];
  }

  if (queryType === "next" && meetings.length === 1) {
    const meeting = meetings[0];
    const dateStr = format(new Date(meeting.meetingDate), "EEEE, MMMM d, yyyy 'at' h:mm a");
    
    return `The next ${meeting.boardName} meeting is scheduled for ${dateStr} at ${meeting.location}.${
      meeting.agenda ? `\n\nAgenda:\n${meeting.agenda}` : ""
    }${
      meeting.agendaUrl ? `\n\nFull agenda: ${meeting.agendaUrl}` : ""
    }\n\nIs there anything else I can help you with?`;
  }

  const meetingsList = meetings
    .map(meeting => {
      const dateStr = format(new Date(meeting.meetingDate), "EEEE, MMMM d, yyyy 'at' h:mm a");
      return `• **${meeting.boardName}** - ${dateStr}\n  Location: ${meeting.location}${
        meeting.agenda ? `\n  Agenda: ${meeting.agenda.substring(0, 150)}${meeting.agenda.length > 150 ? '...' : ''}` : ""
      }`;
    })
    .join("\n\n");

  return `Here are the upcoming meetings:\n\n${meetingsList}\n\nFor complete agendas and the most current information, please visit the town website or contact Town Hall at (978) 363-1100.`;
}
