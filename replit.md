# CivicMind - AI for Every Municipality

## Overview

CivicMind is a turnkey AI platform and managed service for small to mid-sized US municipalities. It enables towns to deploy compliant AI assistants for citizens to get instant answers about municipal services 24/7. The platform prioritizes transparency, accessibility, and trust through citations, policy guardrails, and public analytics. Its core purpose is to provide a trusted public-sector AI layer, allowing municipalities to safely adopt AI without requiring in-house expertise, addressing the lack of secure and affordable AI paths for smaller US towns. The project targets New England and Mid-Atlantic municipalities, aiming for a significant share of the annual TAM.

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
4. **Sentiment Analysis:** Automatic sentiment detection on citizen feedback using GPT-4o, storing sentiment type (positive/neutral/negative) and numerical scores (-100 to +100). Analytics dashboard displays sentiment distribution pie chart and average sentiment score.
5. **OCR Processing:** Image document support (JPG, PNG, GIF, BMP, TIFF, WEBP) with automatic text extraction using Tesseract.js and Sharp for preprocessing. Confidence scores tracked and displayed in document management UI.

**Planned Features**

Advanced bias detection and audit logging, SMS/text message channel integration (Twilio), and municipal ticketing system integration (Tyler Technologies, CivicPlus).

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