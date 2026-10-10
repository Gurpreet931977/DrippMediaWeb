# DRIPP MEDIA — COMPLETE SYSTEM ARCHITECTURE & FEATURE MASTER GUIDE

> **Executive Purpose:**  
> This document is the single source of truth for the entire **Dripp Media** web platform (`DrippMediaWeb`). It contains a comprehensive, technical, and operational blueprint designed for:
> 1. **Autonomous AI Agents** without live internet or browser access to understand every system, route, data schema, component, and interaction.
> 2. **Founder & Leadership Reference** to recall every feature, engineering decision, and workflow built.
> 3. **Client, Investor & Partner Demonstrations** to showcase the full depth of engineering, design systems, and product thinking powering the agency.

---

## 1. BRAND IDENTITY & CORE ARCHITECTURAL CONSTRAINTS

### 1.1 What is Dripp Media?
**Dripp Media** is an elite digital creative agency specializing in high-converting video production (short-form reels & long-form YouTube), high-fidelity 3D motion design, graphic identity, web applications, and digital business systems. It was founded by **Gurpreet Singh**.

### 1.2 Strict Brand Design Rules
All interfaces, tools, public pages, client documents, and exports MUST strictly adhere to the following visual tokens:
- **Primary Luxury Palette:**
  - Background Base: `#050505` (Deep Obsidian Black)
  - Card & Surface Glass: `rgba(255, 255, 255, 0.025)` with `1px solid rgba(255, 255, 255, 0.08)` borders and `backdrop-filter: blur(16px)`
  - Accent / Primary Gold: `#ebd73f` (Electric Dripp Gold)
  - Secondary Text / Subtitles: `#a1a1aa` and `#71717a`
  - Subtle Gold Glow: `rgba(235, 215, 63, 0.15)` to `rgba(235, 215, 63, 0.35)`
- **Mandatory Brand Typography Rule:**
  - **Hero & Display Headlines:** `'Panchang', sans-serif` (Heavy, Geometric, Luxury Extended)
  - **Body Text, Controls, Labels, Inputs & Data:** `'Clash Display', sans-serif` (Modern Grotesque, Crisp Editorial)
  - *No system fonts (Arial, Inter, Roboto), monospace, or unapproved sans-serif fonts are permitted anywhere.*

---

## 2. TECHNOLOGY STACK & CORE DEPENDENCIES

| Layer | Technologies & Libraries | Purpose |
| :--- | :--- | :--- |
| **Framework & Runtime** | Next.js 16.2.9 (Turbopack, App Router), React 19.2.7, Node.js | Modern server & client components, streaming routes, zero-lag compilation |
| **Animation & Motion** | GSAP 3.15.0, `@gsap/react`, ScrollTrigger, Lenis 1.3.23, Lottie-React 2.4.1 | Fluid 120fps physics, custom cursors, scroll animations, micro-interactions |
| **3D & Canvas** | Three.js 0.184.0, `@react-three/fiber`, `@react-three/drei` | WebGL 3D scenes, retro arcade environments, particle physics |
| **Document Generation** | jsPDF 4.2.1, jspdf-autotable 5.0.8, html2canvas 1.4.1, QRCode 1.5.4 | Client invoice & quote PDF vector rendering, 2x PNG rendering, UPI QR codes |
| **AI & NLP Engine** | Google Gemini API (Dynamic discovery & multi-model fallback), Compromise 14.15.1 (NLP extraction) | Orlo AI Copilot, natural language invoice parser, email writer, case study generator |
| **Storage & Database** | Supabase PostgreSQL (`@supabase/supabase-js`), AWS S3 (`@aws-sdk/client-s3`), Local JSON Dual-Store | Quotes, campaigns, leaderboards, media uploads, pre-signed video ingestion |
| **Media Processing** | FFmpeg WASM (`@ffmpeg/ffmpeg`, `@ffmpeg/core`), ffmpeg-static, ffprobe-static, react-easy-crop | Video metadata analysis, thumbnail extraction, aspect ratio cropping |
| **Productivity Sync** | Notion API (`@notionhq/client`), Google Sheets API | Live two-way Notion to-do & note sync, Google Sheets invoice bookkeeping |
| **Communications** | Resend API (`resend` 6.17.2), WhatsApp Deep Links (`wa.me`) | Automated email campaigns, 1-click WhatsApp client invoice sharing |
| **Security & Auth** | Node.js `crypto` (HMAC-SHA256), `bcryptjs`, Rate Limiters, Timing-Safe Equality | Session security, passwordless PIN gates, anti-cheat gaming score protection |

---

## 3. PUBLIC WEBSITE ARCHITECTURE & USER EXPERIENCES

### 3.1 Public Home / Interactive Coming Soon (`/`)
- **Interactive Arcade Canvas:** An interactive physics-based arcade game embedded right inside the hero viewport.
  - Custom fluid cursor with GSAP physics.
  - Monitored by the `scoreGuard` anti-cheat system.
  - Multi-tier trial gate: allows guests to play, then transitions into an authentication prompt (`AuthModal`) for leaderboard recording.
- **GenZ Mode Toggle (`GenzContext`):**
  - Switches brand voice dynamically between formal agency copy and high-energy GenZ agency slang (e.g., "DRIPP MEDIA" $\rightarrow$ "dripp media", "CEO OF CONTENT", "Coming Soon" $\rightarrow$ "cooking soon").
- **Contact & Social Gateways:** Direct external integrations to Instagram, WhatsApp (`+91 73005 95147`), and phone (`+91 78189 95147`).

### 3.2 Arcade Gaming Universe (`/arcade`)
- **Route:** `app/arcade/page.jsx`
- **Protection:** Requires authentication via `dripp_auth_token` and `dripp_user`. Unauthenticated visitors are redirected to `/?login=true`.
- **Game Engine Ecosystem:**
  1. **3D Arcade Menu (`ArcadeMenu.jsx`):** Interactive retro-futuristic arcade game selector.
  2. **2D Retro Arcade Engine (`ArcadeEngine.jsx`):**
     - *BeatMaker:* Interactive music sequencer and rhythm maker.
     - *BomberCrazy:* Action arcade bomb evasion.
     - *BulletHell:* Particle bullet dodging survival game.
     - *GravityFlip:* Precision platformer with gravity inversion mechanics.
     - *HarmonicLooper:* Audio synthesis harmonic visualizer.
     - *LiquidSandbox:* Interactive fluid physics simulation.
     - *MandalaMaker:* Generative art and sacred geometry canvas.
     - *NeonDevil & NeonPac:* Cyberpunk arcade chase games.
     - *NodeWeaver:* Graph network puzzle game.
     - *PocketTanks:* Trajectory calculation artillery duel.
     - *SlingshotNinja:* Physics-based projectile game.
  3. **Multiplayer Engine (`MultiplayerEngine.jsx`):**
     - *BrokenBrief, WordDrop, UndercoverSpy, DumbDoodles, PriceIsWhat, CoopEscape, NeonBusiness.*
     - Features custom avatar creation (`CustomAvatar.jsx`) and party gameplay.
  4. **Global Leaderboard & Anti-Cheat (`/api/arcade/highscore`, `/api/arcade/leaderboard`):**
     - Scores verified through server-side HMAC session tokens (`/api/session-token`, `/api/submit-score`).

### 3.3 Video Portfolio (`/video-portfolio`)
- **Hub (`/video-portfolio`):** 3D perspective cards with dynamic mouse spotlights, custom cursor triggers, and category navigation.
- **Short-Form Reels (`/video-portfolio/short-form`):**
  - High-performance vertical video showcase designed for 9:16 content (Instagram Reels, TikTok, YouTube Shorts).
  - Category filters: Podcasts, SaaS, Talking Heads, Real Estate, E-Commerce, Creator Brands.
  - Custom video player with hover previews, auto-mute controls, timeline scrubbing, retention & view count analytics.
- **Long-Form Media (`/video-portfolio/long-form`):**
  - 16:9 cinematic YouTube video player with case studies, embedded analytics, and client testimonial highlights.

### 3.4 Graphic Portfolio (`/graphic-portfolio`)
- **Features:** Over 4,000 lines of custom presentation engineering.
- **Synthesized Audio Interaction:** Web Audio API (`AudioContext`) initializes on mount for zero-latency tactile audio clicks on UI interactions.
- **Views:** Instant toggle between Grid View and List View.
- **Interactive Lightbox:** Fullscreen zoom, pan, high-res asset rendering, color palette breakdown, and project deliverables overview.
- **Taxonomy:** 20+ categories including Branding & Identity, 3D Rendering, Pitch Decks, Typography, and Merch.

### 3.5 Web Portfolio (`/web-portfolio`)
- **Features:** Showcase of client web apps engineered by Dripp Media.
- **Live Interactive Previews:** Embeds real interactive viewport frames (Desktop, Tablet, Mobile responsive modes).
- **Embedded Case Studies:**
  - *BharatUp:* Enterprise Digital Platform (0.40s load, 100% SEO, +280% conversion).
  - *Pinaka Care Clinic:* Healthcare & Clinical Web (0.28s load, 100% SEO, +340% conversion).
  - *Goat Society:* Luxury E-Commerce & Decanted Fragrances (0.35s load, mobile checkout).
- **CMS Powered:** Pulls real-time project updates from the database via `/api/web`.

### 3.6 Public Orlo AI Knowledge Hub (`/orloai` & `/orlo-export`)
- Dedicated documentation, internal agent wiki, and public AI capability overview detailing the Orlo ecosystem.

### 3.7 Secret Developer Dashboard (`/developermodeon`)
- Diagnostics and development utility portal for testing models, cookies, and local database stores.

---

## 4. SECURE CLIENT PORTAL SYSTEM (INVOICES & QUOTES)

The client portal allows clients to access their proposals and invoices via secure, expiring, PIN-protected links without needing an account.

### 4.1 Architecture & Flow
```
[Admin Generates Invoice in Studio]
               │
               ▼
   [POST /api/quote Payload]
               │
      ┌────────┴────────┐
      ▼                 ▼
[Local Disk Cache]   [Supabase Cloud DB]
(data/shared_quotes.json)
               │
               ▼
[Cryptographic 4-Digit PIN Generated: e.g. "4921"]
               │
               ▼
[Client Receives Link: /invoice/[id] or /quote/[id]]
               │
       [PIN Verification Gate]
               │
    ┌──────────┴──────────┐
    ▼                     ▼
[Unlocked View]    [Action Bar: Download PDF / Image]
```

### 4.2 Security & Encryption Details
- **Unique URL Identifier:** Cryptographically random 6-byte base64url string (`randomBytes(6).toString('base64url')`), completely unguessable.
- **Authentication Gate:** 4-digit numeric PIN with dedicated single-box auto-advancing PIN inputs, paste support, and backspace auto-reversion.
- **Auto-Fill PIN Parameter:** Allows authorized links with `?pwd=XXXX` or `?pin=XXXX` to decrypt automatically for immediate client viewing.
- **Dual-Layer Persistence:** Every record is saved simultaneously to local disk (`data/shared_quotes.json`) and synced to Supabase. If one fails, the other serves the document seamlessly.

### 4.3 Modern & Minimal Client Experience (`/invoice/[id]` & `/quote/[id]`)
- **Branded Layout:** Obsidian `#050505` luxury layout, Panchang typography for client brand names and invoice totals, Clash Display for item descriptions and dates.
- **Payment & Bank Module:**
  - Displays Bank Name, Beneficiary Account Name, Account Number, IFSC/Routing, SWIFT Code, and UPI ID.
  - Renders a live **Scan-to-Pay UPI QR Code** generated using `qrcode`.
- **Modern Minimal Action Bar (`no-print`):**
  - Gold document badge with invoice number (`#INV-001`).
  - **Download PDF Button:**
    - Uses `html2canvas` and `jsPDF`.
    - Awaits `document.fonts.ready` before rasterization to eliminate font flickering.
    - Uses `onclone` to enforce full 1200px desktop dimensions and generous 36px padding even when clicked from a narrow smartphone screen.
    - Saves crisp, vector-scaled PDF document named `Dripp_Media_Invoice_[Brand]_[Number].pdf`.
  - **Download Image Button:**
    - Generates a lossless 2x scale PNG with obsidian background and gold typography.
  - **Print Button:**
    - Triggers native `window.print()` with `@media print` styling that hides action bars and formats clean white/black printouts for physical records.

---

## 5. DRIPP STUDIO — THE ADMIN SYSTEM (`/dripp-studio`)

Dripp Studio is the private operational OS of the agency. It is protected by cookie-based HMAC session verification (`verifyCookie`).

### 5.1 Studio Hub & Dashboard (`/dripp-studio`)
- **Live Notion Task Synchronization:** Automatically fetches active to-dos from linked Notion workspaces, allowing 1-click completion directly from the dashboard with optimistic local UI updates and remote sync (`/api/admin/notion/update`).
- **Creative Spark Generator (`CreativeSpark.jsx`):** Instant creative ideation generator for viral video concepts, hooks, and strategy angles.
- **Operational Status:** Displays live date, system status, pending tasks counter, and quick navigation cards.

### 5.2 Invoice Maker (`/dripp-studio/invoice`)
- **AI Natural Language Generation:** Integrated directly with Orlo AI. Enter natural prompts like:
  > *"Create an invoice for Apex Brands, client Rohan Mehta, +91 98765 43210 for 3D Product Animation at 65000 and Creative Direction at 25000 with HDFC bank"*
  and Orlo instantly parses the client name, phone, address, items, quantities, rates, and bank details.
- **Manual Precision Controls:** Add, remove, and reorder line items, adjust quantities, toggle currencies (₹ INR, $ USD, € EUR, £ GBP, etc.), calculate GST percentages, and select bank accounts with instant QR code generation.
- **Service-Aware Copy Message (Zero Prices):**
  - **Single Service:**
    ```text
    Hey {ClientName}!

    Here is your secure invoice from Dripp Media for {Service}.

    🔗 Link: {link}
    🔑 PIN: {pin}

    Let me know if you have any questions!
    ```
  - **Multiple Services (Bulleted List):**
    ```text
    Hey {ClientName}!

    Here is your secure invoice from Dripp Media.

    📋 Services Included:
    • 3D Product Animation & Motion Design
    • Creative Direction & Sound Design

    🔗 Link: {link}
    🔑 PIN: {pin}

    Let me know if you have any questions!
    ```
- **1-Click WhatsApp Direct Share:** Encodes the service-aware message and opens WhatsApp Web / App directly to the client's phone number.
- **Automated Google Sheets Bookkeeping:** Automatically syncs generated invoices to Google Sheets (`/api/invoice/log`) for real-time revenue tracking.

### 5.3 Package Maker (`/dripp-studio/package`)
- **Package Modality:** Choose between Monthly Retainers or One-Off Projects.
- **PMP (Production Master Plan):** Comprehensive strategy document builder detailing Campaign Overview, Target Demographics, and Multi-Phase Roadmaps (Phase 1: Pre-Production & Scripting, Phase 2: Production & 3D Assets, Phase 3: Post-Production & Distribution).
- **Natural Language Currency Parsing:** Parses shorthand terms like `24k`, `1.5L`, `2 Lakhs`, `10M`, and automatically converts them to clean numbers.
- **Secure Link & PDF Export:** Generates secure links and branded PDFs.

### 5.4 Quote Maker (`/dripp-studio/quote`)
- Over 2,300 lines of quote compilation logic.
- Built-in live **Currency Converter** (`CurrencyConverter.jsx`) across all global currencies (`currencies.js`).
- Dynamic item management, custom alerts (`customAlert.js`), and instant client portal link creation (`/quote/[id]`).

### 5.5 Services Directory Manager (`/dripp-studio/services`)
- Centralized database for all services offered by Dripp Media (Video Editing, 3D Motion, Brand Strategy, Graphic Design, Web Development).
- Add, edit, reorder, categorize, and archive services with instant local caching and remote DB persistence.

### 5.6 Portfolio Manager (`/dripp-studio/portfolio`)
- **4-in-1 Media CMS:** Manages Reels, Long-Form Videos, Graphics, and Web Portfolios in one unified dashboard.
- **Direct S3 Pre-Signed Uploads:** Uploads gigabyte-scale videos and high-res assets directly to AWS S3 (`/api/admin/portfolio/upload-url`) with real-time percentage progress bars.
- **Built-in Image Cropper & Editor (`ImageEditorModal.jsx`):** Crop, rotate, and aspect-ratio lock images before publishing.
- **YouTube Metadata Auto-Fetcher (`/api/admin/portfolio/youtube-info`):** Paste any YouTube URL to instantly fetch video title, description, duration, and maxres thumbnail.
- **Automated Broken Link Health Scanner (`/api/admin/portfolio/health-check`):** Scans all portfolio media URLs, tests response headers, and alerts admins to dead links or CDN issues.
- **AI Case Study Generator (`/api/admin/portfolio/generate-case-study`):** Auto-writes deep client case studies from basic project summaries using Gemini.

### 5.7 Email Campaign Studio (`/dripp-studio/email`)
- **Broadcast & Targeted Sends:** Send to the full community subscriber base or specific VIP client emails.
- **AI Magic Newsletter Writer (`/api/admin/email/magic-generate`):** Automatically crafts high-converting newsletter and campaign copy.
- **Scheduled & Recurring Campaigns:** Configure one-time future sends or recurring intervals (e.g., every 7 days) with optional expiry dates, triggered automatically via the cron endpoint (`/api/cron/campaigns`).
- **Resend Integration:** Delivers transactional and broadcast emails via Resend API.

### 5.8 Standard Operating Procedures (SOP) & Revision Rules (`/dripp-studio/sop`)
- **Agency Operating Procedures (`/dripp-studio/sop`):** Documented protocols for Client Onboarding, Creative & Motion Standards, QA Review, Final Handover, and Rush Orders. Features interactive checklists for team members.
- **Client Revision Rules (`/dripp-studio/sop/revision-rules`):** Clear agency policies detailing revision caps (e.g. 2 rounds included), turnaround windows, scope creep boundaries, source file delivery terms, and emergency rush surcharges.

### 5.9 System Workspace (`/dripp-studio/system`)
- **Operational Document Generators:**
  1. *Onboarding Doc Maker:* Generates tailored client onboarding guidelines and asset requirements.
  2. *Feedback Form Maker:* Creates structured feedback questionnaires for client milestones.
  3. *Delivery Doc Maker:* Compiles final deliverable packages, asset handoffs, and credential documentation.
  4. *Agreement Maker:* Crafts binding client-agency contracts and work agreements.
- **Bi-Directional Orlo Sync (`useOrloCopilot`):** Orlo AI listens to the active system tab and can rewrite or complete legal and operational documents in real time.

### 5.10 Notes & Roadmaps (`/dripp-studio/notes-and-planning`)
- **Notion Two-Way Sync:** Complete block editor supporting H1, H2, H3, bulleted lists, numbered lists, to-do checkboxes, blockquotes, code blocks, and toggle callouts.
- **Lottie Micro-Animations:** Enhanced tactile visual feedback using Lottie animations.
- **Undo/Redo History & Offline Resilience:** Full state preservation ensuring zero loss of draft notes.

### 5.11 Daily Tips CMS (`/dripp-studio/daily-tips`)
- Internal wisdom repository containing daily aphorisms and lessons across 14 categories (Sales & Psychology, Pricing, Content & Attention, Creative Craft, Clear Thinking).
- Powers the public learning ticker and internal agency onboarding.

### 5.12 Error Logs & Diagnostics (`/dripp-studio/errors`)
- Real-time client and server error interceptor (`ErrorLogContext.jsx`).
- Auto-refreshes every 8 seconds, streaming unhandled exceptions, network failures, and diagnostic logs with stack traces, timestamps, and origin paths.
- Features a **Manual Test Error** trigger to verify end-to-end monitoring health.

---

## 6. ORLO AI COPILOT ENGINE

Orlo is Dripp Media's custom intelligent assistant, deeply wired into the admin panel and public experience.

### 6.1 Multi-Model Resilience & Auto-Discovery
- **Endpoint:** `/api/admin/copilot/route.js`
- **Dynamic Model Enumeration (`getAvailableGeminiModels`):** Queries Google's Generative Language API on a 10-minute cache to discover all active Gemini models under the current API key, automatically ignoring deprecated models.
- **Intelligent Cascade Fallback:** Priority cascade through `gemini-3.8-flash`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-3.6-flash`, `gemini-3.7-flash`, and `gemini-flash-latest`.
- **Zero-Downtime Offline NLP Heuristics (`generateResilientNLPResponse`):** If API keys expire, models hit rate limits, or networks disconnect, Orlo seamlessly shifts into local NLP pattern extraction (using regular expressions and Compromise). Invoices, packages, and quotes are STILL generated accurately with 100% uptime!

### 6.2 Multi-Modal Copilot Endpoints
- **Copilot Health Check (`/api/admin/copilot/health`):** Real-time latency ping that drives the live status orb in the UI (green for active, amber for fallback, red for offline).
- **Model Diagnostics (`/api/admin/copilot/test-models`):** Tests every model in the catalog to report exact response times and token throughput.
- **Text-to-Speech Engine (`/api/admin/copilot/tts`):** Generates voice responses for audio interactions.
- **Video Analysis Engine (`/api/admin/copilot/video-analyze`):** Analyzes video frames and provides pacing, grading, and motion feedback.

---

## 7. COMPLETE API ROUTE CATALOG

| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/quote` | `POST` | Public (Rate-limited) | Creates a secure quote or invoice with password encryption. Dual-writes to disk and Supabase. |
| `/api/quote/[id]` | `POST` | Public (Rate-limited) | Decrypts and returns quote/invoice data when provided the correct 4-digit PIN. |
| `/api/quote/send-pdf` | `POST` | Admin | Generates and sends a proposal PDF via email. |
| `/api/invoice/log` | `POST` | Admin | Logs generated invoice details into Google Sheets. |
| `/api/admin/verify` | `POST` | Public | Validates admin access password and sets signed HMAC session cookie. |
| `/api/admin/settings` | `GET`, `POST` | Admin | Reads and updates agency settings and environment configs. |
| `/api/admin/bank` | `GET`, `POST` | Admin | Manages agency bank account profiles and UPI IDs. |
| `/api/admin/copilot` | `POST` | Admin | Primary Orlo AI conversational and document generation endpoint. |
| `/api/admin/copilot/health` | `GET` | Admin | Real-time health and latency diagnostic for Orlo AI. |
| `/api/admin/copilot/test-models`| `GET` | Admin | Tests connectivity across all available Gemini models. |
| `/api/admin/copilot/tts` | `POST` | Admin | Converts text into audio speech. |
| `/api/admin/copilot/video-analyze` | `POST` | Admin | Ingests video frames and outputs creative critique. |
| `/api/admin/portfolio/manage/[type]` | `GET`, `POST`, `DELETE` | Admin | Manages items for Reels, Long-form, Graphics, or Web portfolios. |
| `/api/admin/portfolio/upload-url` | `POST` | Admin | Generates AWS S3 pre-signed upload URLs for direct client uploads. |
| `/api/admin/portfolio/youtube-info` | `POST` | Admin | Scrapes YouTube video metadata, title, and max-res thumbnails. |
| `/api/admin/portfolio/health-check` | `GET` | Admin | Scans all portfolio URLs to detect broken links or CDN errors. |
| `/api/admin/portfolio/report-broken`| `POST` | Admin | Flags a media item as broken and notifies the review ledger. |
| `/api/admin/portfolio/generate-case-study` | `POST` | Admin | Generates client case studies from project metadata. |
| `/api/admin/portfolio/capture-screenshot` | `POST` | Admin | Captures automated browser screenshots of client websites. |
| `/api/admin/portfolio/fix-cors` | `POST` | Admin | Proxy utility to resolve cross-origin asset issues. |
| `/api/admin/email/campaigns` | `GET`, `POST` | Admin | Fetches and schedules email marketing campaigns. |
| `/api/admin/email/magic-generate` | `POST` | Admin | AI newsletter generator for email campaigns. |
| `/api/admin/email/send` | `POST` | Admin | Triggers email dispatch via Resend API. |
| `/api/admin/notion` | `GET` | Admin | Fetches Notion workspace pages and block hierarchy. |
| `/api/admin/notion/create` | `POST` | Admin | Creates a new page or block in Notion. |
| `/api/admin/notion/update` | `PATCH`| Admin | Toggles to-do checkboxes or updates Notion text blocks. |
| `/api/admin/notion/append` | `POST` | Admin | Appends new blocks to existing Notion documents. |
| `/api/admin/errors` | `GET`, `DELETE`| Admin | Retrieves or flushes the server-side error log collection. |
| `/api/cron/campaigns` | `GET`, `POST` | System/Cron | Cron webhook that executes scheduled and recurring emails. |
| `/api/arcade/highscore` | `GET` | Authenticated | Fetches user personal highscore from Supabase. |
| `/api/arcade/leaderboard` | `GET` | Public | Returns global leaderboard top scores. |
| `/api/submit-score` | `POST` | Authenticated | Validates session token and anti-cheat checksum before committing score. |
| `/api/session-token` | `POST` | Authenticated | Issues an HMAC-signed gaming session token. |
| `/api/auth/signup` | `POST` | Public | Registers a new arcade / community account. |
| `/api/auth/login` | `POST` | Public | Authenticates user and issues identity JWT/token. |
| `/api/auth/reset` | `POST` | Public | Password reset workflow. |
| `/api/book-call` | `POST` | Public | Client call booking intake and calendar integration. |
| `/api/community` | `POST` | Public | Newsletter and community subscriber ingestion. |
| `/api/daily-tips` | `GET`, `POST` | Public/Admin | Returns or updates daily agency wisdom tips. |
| `/api/reels` | `GET` | Public | Returns published short-form video portfolio items. |
| `/api/long-form` | `GET` | Public | Returns published long-form video portfolio items. |
| `/api/graphics` | `GET` | Public | Returns published graphic design portfolio items. |
| `/api/web` | `GET`, `POST` | Public/Admin | Returns or updates web application portfolio items. |
| `/api/services` | `GET`, `POST` | Public/Admin | Fetches or updates active agency services catalog. |

---

## 8. SECURITY, RATE LIMITING & ANTI-CHEAT ARCHITECTURE

1. **Admin Session Guard (`app/lib/adminAuth.js`):**
   - Cookies signed with HMAC-SHA256 (`ADMIN_SESSION_SECRET`).
   - Constant-time string comparison (`crypto.timingSafeEqual`) prevents timing attack vulnerabilities.
   - Strict whitelist against `ADMIN_EMAILS`.
2. **Arcade Anti-Cheat System (`app/lib/scoreGuard.js`):**
   - In-memory shadow checksum obfuscated with `0x44727070` XOR salt.
   - 50ms rate gate (rejects impossible human catch frequencies >20/sec).
   - Delta validation (only accepted increment steps: 1, 5, 69).
   - Server-side HMAC token verification (`/api/session-token`).
3. **API Rate Limiting (`app/lib/rateLimit.js`):**
   - Enforces sliding-window request caps per client IP (e.g., max 10 quote generations/min) to prevent brute-force or denial of service attacks.
4. **CORS & Payload Guards (`app/lib/cors.js`):**
   - Strict origin headers on API requests.
   - 500 KB payload ceiling on quotes to prevent buffer memory exhaustion.

---

## 9. HOW TO PRESENT THIS WORK TO CLIENTS & STAKEHOLDERS

When showcasing Dripp Media to potential clients, partners, or investors:
1. **Show the Public Experience First:** Open the homepage (`/`), demonstrate the 120fps physics cursor, and trigger the interactive arcade canvas. Emphasize that **Dripp Media doesn't build passive websites; we build dynamic digital experiences.**
2. **Walk Through the Portfolios:**
   - Open `/video-portfolio/short-form` to display vertical video playback with retention metrics.
   - Open `/graphic-portfolio` to showcase zero-latency audio tactile clicks and instant list/grid toggling.
   - Open `/web-portfolio` to show responsive live website frames operating inside the viewport.
3. **Demonstrate the Secure Client Portal:**
   - Create an invoice in `/dripp-studio/invoice` using natural language Orlo AI copilot.
   - Show how the generated link (`/invoice/[id]`) is PIN-encrypted, features a UPI QR code, and lets clients download a branded **PDF** or **High-Res Image** with one click.
4. **Highlight the Internal Operational Power:**
   - Show `/dripp-studio` with live Notion task synchronization, SOP interactive checklists, automated health scanners for broken links, and scheduled email campaigns.

---

*Document compiled and verified for Dripp Media Web Platform.*  
*Maintained under version control at repository root.*
