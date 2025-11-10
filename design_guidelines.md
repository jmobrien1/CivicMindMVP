# CivicMind Design Guidelines

## Design Approach

**Selected Framework:** Material Design System adapted for civic trust and government accessibility standards

**Rationale:** CivicMind is a utility-focused government platform where trust, accessibility, and efficiency are paramount. Material Design provides:
- WCAG 2.1 AA compliant components out-of-box
- Established interaction patterns citizens recognize
- Clear information hierarchy for data-dense admin interfaces
- Robust documentation for consistent implementation

**Key Design Principles:**
1. **Trust Through Transparency:** All AI responses show clear citations and sources
2. **Accessibility First:** Government services must be usable by all citizens
3. **Professional Restraint:** Avoid flashy animations; prioritize clarity and stability
4. **Responsive Efficiency:** Works seamlessly on mobile devices for citizens and desktop for staff

---

## Typography

**Font Stack:** Roboto (via Google Fonts CDN) - clean, accessible, government-appropriate
- **Display/Headers:** Roboto Medium (500 weight)
  - H1: text-4xl (36px) - Page titles
  - H2: text-3xl (30px) - Section headers
  - H3: text-2xl (24px) - Card titles, subsections
- **Body Text:** Roboto Regular (400 weight)
  - Large: text-lg (18px) - Primary content, chat messages
  - Base: text-base (16px) - Standard UI text
  - Small: text-sm (14px) - Metadata, timestamps, captions
- **Interactive Elements:** Roboto Medium (500 weight) for buttons and links
- **Data/Code:** Roboto Mono for citations, document references

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: mb-8, mt-12
- Card gaps: gap-6, gap-8
- Dense layouts (tables): p-2, gap-4

**Grid Structure:**
- **Admin Portal:** 12-column grid for dashboards and data tables
- **Public Pages:** Single-column max-w-4xl for content, max-w-6xl for full layouts
- **Chat Widget:** Fixed width 400px desktop, full-width mobile

---

## Component Library

### Core UI Elements

**Cards:** Elevated surfaces with subtle shadows
- Base: rounded-lg border border-gray-200 shadow-sm p-6
- Hover state: shadow-md transition (minimal animation)
- Used for: FAQ items, document previews, analytics widgets

**Buttons:**
- Primary: Filled, medium emphasis for main actions (submit query, save changes)
- Secondary: Outlined for alternative actions (cancel, view details)  
- Text: Minimal for tertiary actions (dismiss, learn more)
- Sizes: h-10 (standard), h-12 (prominent CTAs)

**Input Fields:**
- Consistent height: h-12
- Clear labels above inputs
- Helper text below in text-sm
- Error states with red borders and descriptive messages
- Focus states: ring-2 for keyboard navigation

### Navigation

**Public Website:**
- Top navigation bar: h-16, sticky positioning
- Logo left, primary links center, "Ask CivicMind" CTA button right
- Mobile: Hamburger menu, drawer navigation

**Admin Portal:**
- Left sidebar navigation: w-64 fixed
- Top bar: breadcrumbs, user profile, notifications
- Content area: pl-64 on desktop

### Chat Widget

**Citizen Interface:**
- Fixed position bottom-right: bottom-6 right-6
- Collapsed state: Floating action button (FAB) 56px diameter with chat icon
- Expanded: 400px × 600px card with rounded-xl shadow-2xl
- Header: Town name, CivicMind branding, minimize/close
- Message area: Scrollable, alternating citizen (right-aligned) and AI (left-aligned) bubbles
- Input: Fixed at bottom with send button
- Citation links: Underlined, opens in new tab

**Message Bubbles:**
- AI responses: bg-gray-100, rounded-2xl rounded-tl-sm (speech bubble effect), p-4
- User queries: bg-blue-600 text-white, rounded-2xl rounded-tr-sm, p-4
- Timestamps: text-xs text-gray-500, mt-1
- Source citations: Inline links in text-sm with document icon

### Data Displays

**Analytics Dashboard (Staff):**
- Metric cards in grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Each card: Large number (text-3xl font-bold), label below, optional trend indicator
- Charts: Use Chart.js or similar library (bar, line, pie)
- Tables: Striped rows, sticky headers, sortable columns

**Transparency Page (Public):**
- Hero stats: Large numbers in grid-cols-3 layout
- Topic breakdown: Horizontal bar chart showing top query categories
- Update timestamp: Clearly displayed "Last updated: [date/time]"

### Forms

**Admin Portal Forms:**
- Clear field groupings with mb-6 spacing
- Required field indicators (asterisk)
- Inline validation on blur
- Success/error messages in alert components
- Multi-step forms: Progress indicator at top

**Document Upload:**
- Drag-and-drop zone: Dashed border, p-12, centered icon and instructions
- File list: Shows name, size, upload progress, remove option
- Batch upload: Multiple files displayed as chips

---

## Accessibility Implementation

- All interactive elements: Minimum 44×44px touch target
- Keyboard navigation: Visible focus rings (ring-2 ring-blue-500)
- Screen readers: Proper ARIA labels on all custom components
- Form validation: Error messages announced to screen readers
- Skip links: "Skip to main content" for keyboard users
- Chat widget: Can be operated entirely via keyboard (Tab, Enter, Esc)

---

## Images

**Public Transparency Page:**
- Hero image: Full-width banner showing civic engagement (town hall, community meeting, or abstract civic imagery), h-64, object-cover
- Overlay: Dark gradient for text readability if text overlays image

**Admin Portal:**
- No decorative images - focus on data and functionality
- Icons only: Use Material Icons via CDN for consistent icon set

**Chat Widget:**
- Avatar icons: Small circular avatars (8×8) for AI assistant and user
- Document preview thumbnails: If showing search results, 80×80 thumbnails with document type icon overlay

---

## Trust & Transparency Elements

**Citation Display:**
- Every AI response includes "Source: [Document Name]" link at bottom
- Clicking opens document in new tab/modal
- Format: Subtle bg-blue-50 rounded px-2 py-1 text-sm

**Confidence Indicators:**
- When AI is uncertain: "I'm not completely sure, but based on [source]..."
- Escalation prompt: "Would you like to speak with a staff member?"

**Public Dashboard Badge:**
- Prominent "View AI Transparency Report" link in footer
- Dashboard shows real usage data, not marketing claims
- Updated daily with timestamp