# CivicMind - AI for Every Municipality

## Overview

CivicMind is a turnkey AI platform and managed service for small to mid-sized US municipalities. It enables towns to deploy compliant AI assistants for citizens to get instant answers about municipal services 24/7. The platform prioritizes transparency, accessibility, and trust through citations, policy guardrails, and public analytics. Its core purpose is to provide a trusted public-sector AI layer, allowing municipalities to safely adopt AI without requiring in-house expertise, addressing the lack of secure and affordable AI paths for smaller US towns. The project targets New England and Mid-Atlantic municipalities, aiming for a significant share of the annual TAM.

## West Newbury Demo Branch (November 2025)

**Current Branch:** demo/test - West Newbury, MA demonstration

This branch contains a complete rebrand of the CivicMind platform for the Town of West Newbury, Massachusetts, featuring:

- **Visual Rebrand:** Deep forest green color scheme (#004422 primary, #E6F0E9 light green background, #D4AF37 muted gold accent)
- **Branding:** All "CivicMind" references replaced with "West Newbury Assistant" throughout the application
- **Custom Content:** 12 West Newbury-specific structured knowledge entries seeded (2025 holiday trash schedule, property tax procedures, boat/motor vehicle excise tax, water utility billing, town hall hours/contact, department information)
- **Meeting Integration:** 6 upcoming Select Board and Planning Board meetings seeded with realistic dates, locations, and agendas (Nov-Dec 2025)
- **Service Request Routing:** Keyword-based detection routes citizen complaints/issues to 7 West Newbury departments with automatic ticket creation
- **Dual-Persona Demo Experience (COMPLETED - Nov 2025):**
  - **Landing Page:** Two-panel role selector (Resident vs Staff) with four CivicMind pillars value proposition
  - **Resident Portal:** Chat interface with 5 sample questions, accurate West Newbury answers from structured knowledge, contact information
  - **Staff Portal:** Ticket queue with 3 seeded sample tickets, overview statistics, demo reset functionality, role switcher
  - **Demo Infrastructure:** DemoContext for role state, DEMO_MODE flag (defaults to true in dev), auto-seeding with idempotent checks
  - **E2E Validation:** Comprehensive tests verify resident chat, staff dashboard, role switching, and demo reset
- **Demo Flows:** Complete citizen engagement flow (landing page → resident chat → meeting queries → service requests) and employee admin portal (staff dashboard → ticket management → role switching)

This demo showcases the platform's white-label capabilities, municipal-specific customization, intelligent request routing, and dual-persona user experience ready for Select Board presentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18+ and TypeScript using Vite. It utilizes `shadcn/ui` components based on Radix UI, adhering to Material Design principles and WCAG 2.1 AA accessibility standards for government use. Styling is managed with Tailwind CSS and custom design tokens. State management uses TanStack Query for server state and React hooks for client-side state. Wouter handles client-side routing, including protected admin routes. Key pages include a public landing page, a transparency dashboard, and a protected admin portal.

### Backend Architecture

The backend runs on Node.js with Express.js, using ESM modules. It provides RESTful API endpoints for various features, returning JSON and standard HTTP status codes. Session management is handled by Express sessions stored in PostgreSQL. File uploads are processed by Multer, supporting PDFs and text files up to 50MB. AI integration leverages Replit's AI Integrations service (OpenAI-compatible API) for chat responses, content moderation, and semantic understanding. A policy guardrails engine incorporates PII detection, OpenAI moderation API, in-memory rate limiting, and role-based access control (admin vs. super_admin).

### Data Storage Solutions

The primary database is PostgreSQL, accessed via Neon serverless driver. Drizzle ORM provides type-safe database operations and migration management. The schema includes tables for users, sessions, documents (with categories, content, embeddings, version control, OCR metadata), FAQs, conversations, messages (with sentiment tracking), tickets, analytics events, and department routing. PostgreSQL ensures ACID compliance for data integrity, and Drizzle ORM offers flexibility with type safety.

### Authentication and Authorization

The platform uses Replit's OpenID Connect (OIDC) authentication integration with `openid-client` and Passport.js. Users log in via Replit OIDC, and their information is stored in the database. Sessions are established with a 7-day cookie lifetime and HTTP-only secure cookies, stored in PostgreSQL. User roles include `admin` (municipal staff) and `super_admin` (platform administrators). This leverages Replit's security while providing role-based access control.

### UI/UX Decisions

The design system emphasizes trust, professional restraint, and responsive efficiency. Typography uses the Roboto font family. Layouts include a 12-column grid for admin dashboards and single-column max-width for public pages.

### Feature Specifications

**Phase 2 - Completed (November 2025)**

1. **Document Summarization:** AI-generated summaries and key insights for uploaded documents using GPT-4o.
2. **Version Control:** Document versioning system with expiration date management for policies and regulations.
3. **Multi-Language Support:** English and Spanish localization with context-based language switching.
4. **Sentiment Analysis:** Automatic sentiment detection on citizen feedback using GPT-4o, storing sentiment type (positive/neutral/negative) and numerical scores (-100 to +100). Analytics dashboard displays sentiment distribution pie chart and average sentiment score. Enhanced with comprehensive logging for processing times and error tracking.
5. **OCR Processing:** Image document support (JPG, PNG, GIF, BMP, TIFF, WEBP) with automatic text extraction using Tesseract.js and Sharp for preprocessing. Confidence scores tracked and displayed in document management UI. Production optimizations include Tesseract worker pooling (2 reusable workers), rate limiting (10 uploads per 5 minutes), and monitoring endpoint for system health.
6. **Enhanced Guardrails & Bias Detection (Completed - November 2025):**
   - **Bias Detection Service:** GPT-4o powered analysis detecting 6 types of bias (demographic, socioeconomic, political, geographic, language, accessibility) with severity levels (low/medium/high) and confidence scores.
   - **Policy Guardrails:** Configurable topic boundaries with allowed/blocked topic lists, severity thresholds for block/rewrite/allow decisions, and ordered severity ranking (low < medium < high).
   - **Audit Logging:** Comprehensive event tracking for all guardrail decisions with PII redaction, reviewer workflow, and exportable audit trails.
   - **Flagged Response Management:** Automatic flagging of biased content with severity classification, suggested rewrites, and review status tracking.
   - **Auto-Rewrite System:** Medium-severity bias triggers automatic rewrite with secondary validation before delivery.
   - **Integration:** Synchronous guardrails checks in chat flow with graceful keyword-based fallback when OpenAI unavailable.
   - **Caching:** Policy config caching (5-min TTL) with manual invalidation for performance optimization.
   - **FERPA Compliance:** PII redaction using existing pii-detector utility before persistence in all audit logs and flagged responses.
   - **Admin Dashboard:** Complete administrative interface with four pages:
     * **Guardrails Overview:** Real-time statistics, severity distribution charts, bias type breakdown, and recent events timeline
     * **Flagged Responses:** Review interface with status filters, detailed view dialog, approve/reject workflow with notes
     * **Audit Logs:** Comprehensive event viewer with severity and event type filtering, review status tracking
     * **Policy Configuration:** Super_admin-only editor for bias thresholds (block/rewrite/allow levels), blocked topics management, and allowed topics management
   - **Authorization:** Role-based access control with OIDC role claim mapping; admin users can view all pages, super_admin users can modify policy configurations; role stored in both database and session for efficient authorization checks.

7. **Service Request Routing (Completed - November 2025):**
   - **Intent Detection:** Keyword-based detection of service requests (complaints, issues, problems, broken items, help requests) in chat messages
   - **Department Routing:** Automatic routing to 7 West Newbury departments (Town Clerk, DPW, Building Inspector, Board of Health, Assessor, Finance, General Inquiry) based on category detection
   - **Ticket Creation:** Automatic ticket creation with conversation context, user details, and department assignment for staff follow-up
   - **User Notification:** AI response includes ticket ID, routed department, and expected response time (1-2 business days)
   - **Analytics Tracking:** Service request events logged for transparency dashboard with ticket metadata

8. **Meeting/Calendar Integration (Completed - November 2025):**
   - **Meetings Schema:** Database table for town meetings with composite index on (boardName, meetingDate) for optimized queries
   - **Storage Methods:** Seven storage operations (create, read, update, delete, list, upcoming, next-by-board) with filtering by board name and public visibility
   - **API Endpoints:** RESTful routes for upcoming meetings and next meeting by board with query parameter validation (limit clamped 1-50)
   - **Intent Detection:** Pre-AI keyword detection for meeting queries ("next meeting", "Select Board", "Planning Board", "schedule", "agenda") to provide instant database responses
   - **Formatted Responses:** Human-readable responses with date/time formatting (using date-fns), location details, and agenda summaries with source citations
   - **Seeded Data:** 6 upcoming Select Board and Planning Board meetings (Nov-Dec 2025) with realistic West Newbury dates, Town Hall location (381 Main Street), and detailed agendas
   - **Performance:** Meeting queries bypass AI generation entirely, reducing token usage and response latency while ensuring accurate scheduling information

**Planned Features**

SMS/text message channel integration (Twilio), municipal ticketing system integration (Tyler Technologies, CivicPlus).

## External Dependencies

**AI Services:**
- **Replit AI Integrations (OpenAI-compatible API):** For LLM-based chat responses, content moderation, and semantic understanding.

**Database:**
- **Neon Serverless PostgreSQL:** Primary data persistence.

**CDN/Assets:**
- **Google Fonts CDN:** For Roboto font family.

**Key Libraries:**
- **UI Components:** Radix UI primitives.
- **Data Visualization:** Recharts.
- **Form Validation:** React Hook Form with Zod resolvers.
- **OCR Processing:** Tesseract.js for text extraction, Sharp for image preprocessing.
- **Utilities:** date-fns, nanoid, clsx/tailwind-merge.

**Environment Variables:**
- `DATABASE_URL`
- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `SESSION_SECRET`
- `ISSUER_URL`
- `REPL_ID`