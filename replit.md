# CivicMind - AI for Every Municipality

## Overview

CivicMind is a turnkey AI platform and managed service designed for small to mid-sized US municipalities (under 150K population). The platform enables towns to deploy vetted, compliant AI assistants that help citizens get instant answers about municipal services 24/7. The system emphasizes transparency, accessibility, and trust through clear citations, policy guardrails, and public-facing analytics dashboards.

**Core Value Proposition:** Become the trusted public-sector AI layer that allows municipalities to safely deploy intelligent assistants without requiring in-house AI expertise, addressing the critical gap where 95% of smaller US towns lack secure, affordable paths to AI adoption.

**Target Market:** New England and Mid-Atlantic municipalities representing ~$200M annual TAM at $1-3K/month pricing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18+ with TypeScript running on Vite for fast development and optimized production builds.

**UI Component System:** shadcn/ui components built on Radix UI primitives, implementing Material Design principles adapted for government accessibility standards (WCAG 2.1 AA compliant). The design system emphasizes trust, professional restraint, and responsive efficiency across mobile and desktop devices.

**Styling:** Tailwind CSS with custom design tokens defined in CSS variables for theming. Typography uses Roboto font family (via Google Fonts CDN) for its government-appropriate aesthetic and accessibility. Layout follows a 12-column grid for admin dashboards and single-column max-width layouts for public pages.

**State Management:** TanStack Query (React Query) for server state management with custom query functions that handle authentication and error states. Client-side state is managed through React hooks.

**Routing:** Wouter for lightweight client-side routing with protected admin routes that require authentication.

**Key Pages:**
- **Public Landing Page:** Showcases platform features with call-to-action for demo and transparency report
- **Transparency Dashboard:** Public-facing analytics showing AI usage metrics, satisfaction rates, and top topics
- **Admin Portal:** Protected area for municipal staff to manage knowledge base, FAQs, tickets, and view detailed analytics

### Backend Architecture

**Runtime:** Node.js with Express.js server, built using ESM modules for modern JavaScript patterns.

**API Design:** RESTful API endpoints organized by feature area (auth, chat, documents, FAQs, tickets, analytics, transparency). All endpoints return JSON and use standard HTTP status codes.

**Session Management:** Express sessions stored in PostgreSQL using connect-pg-simple, with 7-day cookie lifetime and HTTP-only secure cookies.

**File Upload Handling:** Multer middleware for processing document uploads (PDFs, text files) with 50MB file size limit. PDF parsing handled by pdf-parse CommonJS module.

**AI Integration:** OpenAI-compatible API access through Replit's AI Integrations service, eliminating need for direct OpenAI API keys. The chat system builds context from documents and conversation history to generate responses with citations.

**Policy Guardrails Engine:**
- **PII Detection:** Custom regex-based detector for SSN, credit cards, phone numbers, emails, addresses
- **Content Moderation:** OpenAI moderation API integration to filter inappropriate content
- **Rate Limiting:** In-memory rate limiter (30 requests/minute default, configurable per endpoint)
- **Role-Based Access Control:** Admin vs super_admin roles with protected routes

**Rationale:** This architecture separates concerns between public citizen-facing features and authenticated admin functionality, ensuring scalability while maintaining security. The policy guardrails provide the "must-have" safety nets for government AI deployment without flashy complexity.

### Data Storage Solutions

**Primary Database:** PostgreSQL accessed via Neon serverless driver with WebSocket support for connection pooling.

**ORM:** Drizzle ORM for type-safe database operations with schema defined in TypeScript. Migration management through drizzle-kit.

**Schema Design:**
- **users:** Stores admin user profiles with Replit Auth integration (id, email, name, role, municipality)
- **sessions:** Express session storage for authentication state
- **documents:** Knowledge base documents with categories, content, embeddings for semantic search
- **faqs:** Pre-defined question-answer pairs for common inquiries
- **conversations:** Chat session tracking with unique session IDs
- **messages:** Individual chat messages with role (user/assistant/system), content, citations, feedback
- **tickets:** Support tickets created when AI cannot answer queries, with department routing
- **analyticsEvents:** Granular event tracking for queries, answers, escalations, feedback
- **departmentRouting:** Configuration for routing tickets to appropriate municipal departments

**Relationships:** Users own documents, FAQs, and tickets. Conversations contain many messages. Department routing links tickets to municipal departments.

**Rationale:** PostgreSQL provides ACID compliance critical for government data integrity. Drizzle ORM enables type-safe queries while maintaining flexibility. The schema supports both real-time chat interactions and comprehensive analytics for transparency reporting.

### Authentication and Authorization

**Strategy:** Replit's OpenID Connect (OIDC) authentication integration using the openid-client library with Passport.js strategy.

**Flow:**
1. User clicks "Admin Login" → redirects to Replit OIDC provider
2. After authentication, callback creates/updates user record in database
3. Session established with user claims stored in PostgreSQL
4. Protected routes verify session using `isAuthenticated` middleware

**User Roles:**
- **admin:** Municipal staff with access to knowledge base, FAQs, tickets, analytics
- **super_admin:** Platform administrators with elevated privileges (future extensibility)

**Session Security:** HTTP-only cookies, secure flag in production, 7-day expiry with automatic renewal. Sessions tied to PostgreSQL for horizontal scalability.

**Rationale:** Leveraging Replit's OIDC eliminates need to manage authentication infrastructure while providing enterprise-grade security suitable for government systems. Role-based access allows municipalities to control internal permissions.

### External Dependencies

**AI Services:**
- **Replit AI Integrations (OpenAI-compatible API):** Primary LLM for chat responses, content moderation, and semantic understanding. Base URL and API key provided via environment variables.
- **Purpose:** Generate contextual responses from knowledge base, detect inappropriate content, future semantic search capabilities.

**Database:**
- **Neon Serverless PostgreSQL:** Hosted PostgreSQL with WebSocket connections for serverless environments.
- **Purpose:** Primary data persistence for users, documents, conversations, analytics.

**CDN/Assets:**
- **Google Fonts CDN:** Roboto and Roboto Mono font families for government-appropriate typography.
- **Purpose:** Consistent, accessible typography without bundling fonts.

**Development Tools:**
- **Replit-specific Plugins:** Vite plugins for runtime error modal, cartographer (code navigation), and dev banner in development mode.
- **Purpose:** Enhanced development experience within Replit environment.

**Key Libraries:**
- **UI Components:** Radix UI primitives (@radix-ui/*) for accessible, headless components
- **Data Visualization:** Recharts for transparency dashboard charts
- **Form Validation:** React Hook Form with Zod resolvers for type-safe form handling
- **Utilities:** date-fns (date formatting), nanoid (unique ID generation), clsx/tailwind-merge (className utilities)

**Environment Variables Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: AI service endpoint
- `AI_INTEGRATIONS_OPENAI_API_KEY`: AI service authentication
- `SESSION_SECRET`: Session encryption key
- `ISSUER_URL`: OIDC provider URL (defaults to Replit)
- `REPL_ID`: Replit environment identifier

**Rationale:** Dependencies are carefully chosen to minimize vendor lock-in while leveraging Replit's managed services for AI and database. Open-source libraries (Radix UI, Drizzle, Express) ensure transparency and community support critical for government software procurement.