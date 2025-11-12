import { storage } from "./storage";
import type { InsertStructuredKnowledge } from "../shared/schema";

// West Newbury structured knowledge data from the requirements
export const westNewburyKnowledge: Omit<InsertStructuredKnowledge, "id" | "createdAt" | "updatedAt">[] = [
  {
    slug: "trash-recycling-schedule",
    topic: "Trash & Recycling Schedule",
    keywords: ["trash", "recycling", "pickup", "collection", "garbage", "waste", "cart", "barrel", "holiday", "delay"],
    category: "Services",
    priority: 10,
    isActive: true,
    content: {
      answer: "Trash is collected once per week, and recycling is collected every other week on the same day as trash. Barrels must be placed curbside by 6:00 AM. Collection is delayed by one day after holidays. Each household has two 65-gallon carts (one for trash and one for recycling). Bulk items are collected six times per year.",
      details: {
        trashFrequency: "Weekly",
        recyclingFrequency: "Every other week on trash day",
        timeRequired: "6:00 AM curbside placement",
        holidayPolicy: "Delayed by one day after holidays",
        cartInfo: "Two 65-gallon carts per household",
        bulkCollection: "Six times per year",
      },
      contact: {
        department: "Board of Health",
        phone: "(978) 363-1100 ext. 1118",
        address: "381 Main Street, West Newbury, MA 01985",
      },
      source: "wnewbury.org - Board of Health",
      sourceUrl: "https://wnewbury.org/board-of-health",
    },
  },
  {
    slug: "office-hours-location",
    topic: "Town Office Hours & Location",
    keywords: ["office", "hours", "town hall", "location", "address", "phone", "open", "closed", "contact"],
    category: "Contact",
    priority: 10,
    isActive: true,
    content: {
      answer: "Town Hall is located at 381 Main Street, West Newbury, MA 01985. Office hours are Monday through Thursday 8:00 AM to 4:30 PM, and Friday 8:00 AM to Noon. Main phone: (978) 363-1100.",
      details: {
        address: "381 Main Street, West Newbury, MA 01985",
        phone: "(978) 363-1100",
        hours: {
          "Monday-Thursday": "8:00 AM - 4:30 PM",
          Friday: "8:00 AM - 12:00 PM (Noon)",
        },
      },
      source: "wnewbury.org - Town Office",
      sourceUrl: "https://wnewbury.org/town-office",
    },
  },
  {
    slug: "property-tax-info",
    topic: "Property Tax Information",
    keywords: ["property tax", "taxes", "tax bill", "payment", "due date", "treasurer", "collector", "quarterly", "fy25"],
    category: "Finance",
    priority: 10,
    isActive: true,
    content: {
      answer: "Property taxes are due quarterly on August 1, November 1, February 1, and May 1. If a due date falls on a weekend or holiday, payment is due the next business day. The FY25 tax rate is $10.80. Payments are handled by the Treasurer/Collector in the Finance Department.",
      details: {
        dueDates: ["August 1", "November 1", "February 1", "May 1"],
        fy25TaxRate: "$10.80",
        weekendHolidayPolicy: "Due next business day if date falls on weekend/holiday",
        department: "Treasurer/Collector (Finance Department)",
      },
      contact: {
        department: "Finance Department",
        phone: "(978) 363-1100 ext. 1113",
        hours: "Mon-Thu 8 AM-4:30 PM, Fri 8 AM-Noon",
      },
      source: "wnewbury.org - Finance Department",
      sourceUrl: "https://wnewbury.org/finance",
    },
  },
  {
    slug: "select-board-meetings",
    topic: "Select Board Meetings",
    keywords: ["select board", "meeting", "schedule", "when", "time", "location", "agenda"],
    category: "Meetings",
    priority: 10,
    isActive: true,
    content: {
      answer: "Select Board meetings occur every other Thursday (subject to holiday variations) and are scheduled at 5:30 PM in the First Floor Hearing Room at Town Office Building, 381 Main Street.",
      details: {
        frequency: "Every other Thursday",
        time: "5:30 PM",
        location: "First Floor Hearing Room, 381 Main Street",
        notes: "Subject to holiday variations",
      },
      source: "wnewbury.org - Select Board",
      sourceUrl: "https://wnewbury.org/select-board",
    },
  },
  {
    slug: "board-of-health-contact",
    topic: "Board of Health Contact Information",
    keywords: ["board of health", "health", "septic", "well", "sanitation", "contact", "rachel navarro", "paul sevigny"],
    category: "Contact",
    priority: 8,
    isActive: true,
    content: {
      answer: "Board of Health office is located at 381 Main Street. Contact Rachel Navarro (Admin Assistant) at (978) 363-1100 ext. 1118, or Paul Sevigny (Health Agent) at ext. 1119 (cell: 978-833-7458). Scott Berkenbush is the Recycling Coordinator.",
      details: {
        address: "381 Main Street, West Newbury, MA 01985",
        staff: [
          { name: "Rachel Navarro", title: "Admin Assistant", phone: "(978) 363-1100 ext. 1118" },
          { name: "Paul Sevigny", title: "Health Agent", phone: "(978) 363-1100 ext. 1119", cell: "(978) 833-7458" },
          { name: "Scott Berkenbush", title: "Recycling Coordinator" },
        ],
      },
      source: "wnewbury.org - Board of Health",
      sourceUrl: "https://wnewbury.org/board-of-health",
    },
  },
  {
    slug: "town-clerk-services",
    topic: "Town Clerk Services & Permits",
    keywords: ["town clerk", "permit", "license", "dog license", "burial", "raffle", "business certificate", "vital records"],
    category: "Services",
    priority: 7,
    isActive: true,
    content: {
      answer: "Town Clerk office is open Monday through Thursday 8:00 AM to 4:30 PM, and Friday 8:00 AM to Noon. Phone: (978) 363-1100 ext. 1110. The Town Clerk handles permits for telephone poles, burials, gasoline storage, dog licenses, raffles/bazaars, and business certificates.",
      details: {
        phone: "(978) 363-1100 ext. 1110",
        hours: "Mon-Thu 8 AM-4:30 PM, Fri 8 AM-Noon",
        permits: [
          "Telephone pole permits",
          "Burial permits",
          "Gasoline storage permits",
          "Dog licenses",
          "Raffle & bazaar permits",
          "Business certificates",
        ],
      },
      source: "wnewbury.org - Town Clerk",
    },
  },
  {
    slug: "dpw-services",
    topic: "Department of Public Works (DPW)",
    keywords: ["dpw", "public works", "highway", "roads", "snow", "plow", "facilities", "butch hills", "brian richard"],
    category: "Services",
    priority: 7,
    isActive: true,
    content: {
      answer: "DPW main phone: (978) 363-1100 ext. 1135. Highway Superintendent Richard 'Butch' Hills ext. 1120, Facilities Manager Brian Richard ext. 1129. For after-hours emergencies, call (978) 363-1213.",
      details: {
        mainPhone: "(978) 363-1100 ext. 1135",
        emergencyPhone: "(978) 363-1213",
        staff: [
          { name: "Richard 'Butch' Hills", title: "Highway Superintendent", phone: "ext. 1120" },
          { name: "Brian Richard", title: "Facilities Manager", phone: "ext. 1129" },
        ],
      },
      source: "wnewbury.org - DPW",
    },
  },
  {
    slug: "water-department",
    topic: "Water Department",
    keywords: ["water", "bill", "billing", "meter", "usage", "jodi bertrand", "mark marlowe"],
    category: "Services",
    priority: 6,
    isActive: true,
    content: {
      answer: "Water Department hours: Monday through Thursday 8:30 AM to 2:30 PM. Phone: (978) 363-1100 ext. 1127. Contact Jodi Bertrand (ext. 127) or Mark Marlowe (ext. 128).",
      details: {
        phone: "(978) 363-1100 ext. 1127",
        hours: "Mon-Thu 8:30 AM-2:30 PM",
        staff: [
          { name: "Jodi Bertrand", phone: "ext. 127" },
          { name: "Mark Marlowe", phone: "ext. 128" },
        ],
      },
      source: "wnewbury.org - Water Department",
    },
  },
  {
    slug: "police-department",
    topic: "Police Department",
    keywords: ["police", "cops", "law enforcement", "safety", "emergency", "non-emergency"],
    category: "Public Safety",
    priority: 9,
    isActive: true,
    content: {
      answer: "West Newbury Police Department is located at Public Safety Complex, 401 Main Street. For emergencies, call 911. For non-emergency matters, call (978) 363-1212. The department was accredited in October 2024.",
      details: {
        address: "Public Safety Complex, 401 Main Street",
        emergency: "911",
        nonEmergency: "(978) 363-1212",
        accreditation: "Accredited October 2024",
      },
      source: "wnewbury.org - Police Department",
      sourceUrl: "https://wnewbury.org/public-safety",
    },
  },
  {
    slug: "fire-department",
    topic: "Fire Department",
    keywords: ["fire", "emergency", "prevention", "inspection", "smoke detector"],
    category: "Public Safety",
    priority: 9,
    isActive: true,
    content: {
      answer: "West Newbury Fire Department is located at 403 Main Street. For fire emergencies, call 911. For non-emergency matters and fire prevention, call (978) 363-1112.",
      details: {
        address: "403 Main Street",
        emergency: "911",
        nonEmergency: "(978) 363-1112",
        prevention: "(978) 363-1112",
      },
      source: "wnewbury.org - Fire Department",
      sourceUrl: "https://wnewbury.org/fire-department",
    },
  },
  {
    slug: "sage-center",
    topic: "Council on Aging - SAGE Center",
    keywords: ["senior", "elderly", "council on aging", "sage", "programs", "mahjong", "lunch"],
    category: "Programs",
    priority: 6,
    isActive: true,
    content: {
      answer: "SAGE Center (Council on Aging) is located at 381 Main Street. Phone: (978) 363-1104. Offers Mahjong Wednesdays 1-4 PM, Lunch & Learn series on senior safety & scams, and other programs for seniors.",
      details: {
        phone: "(978) 363-1104",
        address: "381 Main Street",
        programs: [
          "Mahjong Wednesdays 1-4 PM",
          "Lunch & Learn series (senior safety & scams)",
          "Various senior programs",
        ],
      },
      source: "wnewbury.org - SAGE Center",
    },
  },
  {
    slug: "library",
    topic: "G.A.R. Memorial Library",
    keywords: ["library", "books", "programs", "events", "book sale", "gar"],
    category: "Programs",
    priority: 5,
    isActive: true,
    content: {
      answer: "G.A.R. Memorial Library is located at 490 Main Street. Phone: (978) 363-1105. The library hosts book sales, virtual programs, kite-building workshops, and other community events.",
      details: {
        address: "490 Main Street",
        phone: "(978) 363-1105",
        programs: ["Book sales", "Virtual programs", "Kite-building workshops", "Community events"],
      },
      source: "wnewbury.org - Library",
    },
  },
];

export async function seedDemoData() {
  console.log("[DEMO SEED] Starting demo data seeding...");

  // Check if already seeded
  const existingKnowledge = await storage.getAllStructuredKnowledge();
  if (existingKnowledge.length > 0) {
    console.log("[DEMO SEED] Data already seeded, skipping.");
    return;
  }

  // Seed structured knowledge
  for (const knowledge of westNewburyKnowledge) {
    await storage.createStructuredKnowledge(knowledge);
  }

  console.log(`[DEMO SEED] Seeded ${westNewburyKnowledge.length} structured knowledge entries.`);

  // Seed sample tickets for staff demo
  const sampleTickets = [
    {
      question: "My recycling was not picked up this week. Can someone help?",
      userEmail: "resident1@example.com",
      userName: "Sarah Johnson",
      userPhone: "(978) 555-0101",
      department: "Board of Health",
      status: "open" as const,
    },
    {
      question: "There's a pothole on Main Street near the library that needs repair.",
      userEmail: "resident2@example.com",
      userName: "Mike Chen",
      userPhone: "(978) 555-0102",
      department: "Department of Public Works",
      status: "open" as const,
    },
    {
      question: "Can I get more information about the building permit process for a deck addition?",
      userEmail: "resident3@example.com",
      userName: "Jennifer Smith",
      department: "Building Inspector",
      status: "in_progress" as const,
    },
  ];

  for (const ticket of sampleTickets) {
    await storage.createTicket(ticket);
  }

  console.log(`[DEMO SEED] Seeded ${sampleTickets.length} sample tickets.`);
  console.log("[DEMO SEED] Demo data seeding complete!");
}

export async function resetDemoData() {
  console.log("[DEMO RESET] Resetting demo data...");

  // Clear conversations, messages, tickets, analytics
  // Note: This is a simplified reset - in production you'd be more selective
  await storage.clearDemoData();

  // Re-seed structured knowledge
  const existingKnowledge = await storage.getAllStructuredKnowledge();
  if (existingKnowledge.length === 0) {
    for (const knowledge of westNewburyKnowledge) {
      await storage.createStructuredKnowledge(knowledge);
    }
    console.log(`[DEMO RESET] Re-seeded ${westNewburyKnowledge.length} structured knowledge entries.`);
  }

  console.log("[DEMO RESET] Demo reset complete!");
}
