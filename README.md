# EVENTFORGE — Local-First GenAI Event Architect

EVENTFORGE is a tactile, high-performance neo-brutalist event planning command center engineered for organizing weddings, milestone birthdays, and community festivals. Built on a local-first philosophy, EVENTFORGE bypasses third-party hosted cloud databases entirely, storing every byte of event data, budget ledger, vendor contract detail, and configuration directly inside your personal computer's local disk storage. Powered by Gemini 3.5 Flash, it transforms high-level event concepts into complete, actionable operational blueprints—encompassing balanced multi-category budgets, minute-by-minute timeline runs of show, vendor vetting checklists, and bespoke creative concepts—while guaranteeing absolute data sovereignty and lightning-fast tactile responsiveness.

---

## The Problem

Planning a major event—whether an intimate wedding, a large 50th birthday gala, or a multi-day neighborhood festival—is fundamentally an exercise in multi-variable logistics under strict financial constraints. Yet, event organizers and individuals are consistently trapped between two flawed extremes: fragile, disconnected spreadsheets or bloated cloud SaaS platforms.

Cloud-based event management tools invariably introduce invasive data collection, recurring subscription fees, and severe privacy risks. Sensitive personal information—including private guest lists, home addresses, phone numbers, and detailed financial budgets—is uploaded to multi-tenant remote databases vulnerable to breaches, unexpected downtime, and vendor lock-in. Furthermore, these platforms suffer from sluggish interfaces weighed down by unnecessary animations, rigid currency assumptions that fail international planners, and generic templates that require hours of tedious manual adjustment.

On the other hand, traditional spreadsheets offer privacy and flexibility but lack operational intelligence. A spreadsheet cannot evaluate whether your catering quote is reasonable for eighty guests, cannot automatically calculate buffer times for wedding photography transitions, and cannot proactively suggest creative entertainment concepts tailored to a specific theme. When budgets fluctuate or vendors change, manual recalculations across multiple sheets inevitably introduce human errors, missed deadlines, and uncoordinated schedules.

---

## The Solution

EVENTFORGE solves this dilemma by uniting local computer hardware persistence with state-of-the-art generative intelligence and an ultra-tactile neo-brutalist interface. Instead of relying on a distant cloud server, EVENTFORGE treats your local computer's disk as the authoritative system of record. Every interaction—from adjusting a budget item's actual cost to checking off a timeline milestone—is instantly serialized and persisted directly to your local file system, ensuring zero latency, zero telemetry leakage, and complete offline availability.

Complementing this local foundation is a deeply integrated AI orchestration layer powered by Gemini 3.5 Flash. Rather than offering a detached chatbot, EVENTFORGE embeds generative intelligence directly into every operational workflow. With a single click, the auto-planner parses an event's theme, date, headcount, and budget to generate a mathematically balanced budget distribution, chronological timeline checkpoints, essential vendor categories with vetting questions, and curated guest experience ideas. Organizers gain the speed and foresight of an experienced event coordinator while retaining total executive control over their data and decisions.

---

## Why Us

EVENTFORGE was created from the conviction that modern software should feel solid, dependable, and respectful of the user's autonomy. Several core pillars set EVENTFORGE apart from any conventional planning tool:

### 1. Absolute Local-First Data Sovereignty
Your data never leaves your computer unless you explicitly communicate with the Gemini API to run an AI workflow. All event files, timelines, vendor directories, and configuration settings reside in a human-readable JSON database stored directly on your computer's disk. You can back it up, copy it across drives, open the raw folder in your OS file explorer, or archive it with zero external dependencies.

### 2. Radical Neo-Brutalist Tactile Experience
EVENTFORGE rejects the sterile, homogenized corporate design language of typical web applications in favor of high-contrast neo-brutalism. Featuring thick solid borders, high-impact functional color-coding, crisp typography, and an interactive Web Audio synthesizer that delivers crisp haptic audio feedback upon clicks, saves, and deletions, every component feels responsive, alive, and physically grounded.

### 3. Dynamic Multi-Currency Freedom
Unlike platforms that hardcode monetary symbols or force USD defaults, EVENTFORGE provides full dynamic currency selection. Users can select from 30+ global currencies—including USD, EUR, GBP, JPY, CAD, AUD, INR, CHF, BRL, and SGD—with zero hardcoding and zero fallback placeholders. Currency choices are persisted directly in the local configuration and reactively format every calculation across the entire application in real time.

### 4. Zero Placeholders and Operational Rigor
There are no placeholder text elements, no mock emojis, and no decorative fluff. Every icon is an industrial, precision-crafted vector glyph from the Lucide icon family. Every budget calculation accounts for allocated funds, actual spend, variance, and safety contingencies. Every timeline task includes urgency indicators, countdown timers, and phase categorization.

---

## If Not Us, Then What?

To understand the necessity of EVENTFORGE, consider the alternatives currently available:

| Feature / Criterion | Traditional Spreadsheets (Excel / Sheets) | Generic Event SaaS Platforms | Standard Chatbots (ChatGPT / Claude) | EVENTFORGE |
| :--- | :--- | :--- | :--- | :--- |
| **Data Storage Location** | Local drive or Cloud Drive | Multi-tenant proprietary cloud database | Remote chat logs on AI vendor servers | **User's own computer disk (Local ROM database)** |
| **Data Privacy & Leakage** | Medium (if stored locally) | High risk (stored on third-party servers) | High risk (conversations logged & trained) | **100% Private; local storage only** |
| **Event Intelligence** | None (manual formulas only) | Minimal / Rigid static rule engines | High, but disconnected from any data model | **Deeply integrated Gemini 3.5 Flash event engine** |
| **Actionable Structure** | Unstructured rows and cells | Rigid forms with paywalled upgrades | Unstructured raw markdown paragraphs | **Structured Budgets, Timelines, Vendors & Ideas** |
| **International Currency** | Manual formatting per column | Often limited or locked to USD | No automated aggregate calculations | **Global dynamic currency system saved to disk** |
| **Tactile UX & Latency** | Bland, slow on large datasets | Sluggish SaaS dashboards with loaders | Ephemeral text stream without tactile state | **Instant zero-latency neo-brutalist interaction** |
| **Offline Reliability** | Yes (local desktop apps) | Fails without active internet | Fails without active internet | **Full local disk operation & offline viewing** |

If not EVENTFORGE, event planners are left juggling fragile spreadsheet templates that break under complex calculations, paying recurring SaaS subscriptions for bloated software that hoards their personal data, or manually copying and pasting prompt outputs from generic chat interfaces into disconnected note apps. EVENTFORGE bridges these disjointed workflows into a unified, privacy-first command center.

---

## Full Application Architecture

EVENTFORGE is architected around a reactive, unidirectional data flow that bridges modern browser capabilities with local disk input/output and external generative intelligence.

```
+-----------------------------------------------------------------------------------+
|                                CLIENT APPLICATION                                 |
|                                                                                   |
|   +-----------------------+     +--------------------+     +------------------+   |
|   |   Svelte 5 Reactive   | <-> | Tactile Audio Web  | <-> | Dynamic Currency |   |
|   |      UI Engine        |     |  Synthesizer API   |     | Formatter Engine |   |
|   +-----------------------+     +--------------------+     +------------------+   |
|               |                                                      |            |
|               v                                                      |            |
|   +------------------------------------------------------------+     |            |
|   |                   Centralized State Stores                 | <---+            |
|   |         ($events, $vaultConfig, $isSaving, $lastSavedAt)   |                  |
|   +------------------------------------------------------------+                  |
|               |                                      |                            |
+---------------|--------------------------------------|----------------------------+
                |                                      |                             
                v                                      v                             
+------------------------------------+   +------------------------------------------+
|    STORAGE PERSISTENCE PIPELINE    |   |         GENAI INTELLIGENCE ENGINE        |
|                                    |   |                                          |
|  +------------------------------+  |   |  +------------------------------------+  |
|  | Local ROM Disk Bridge        |  |   |  | Google GenAI SDK (gemini-3.5-flash)|  |
|  | - Directory Picker API       |  |   |  +------------------------------------+  |
|  | - IndexedDB File Handles     |  |   |                   |                      |
|  | - LocalStorage Fallback      |  |   |                   v                      |
|  +------------------------------+  |   |  +------------------------------------+  |
|               |                    |   |  | Structured JSON Schema Parser      |  |
|               v                    |   |  | - Blueprint Generator              |  |
|  +------------------------------+  |   |  | - Budget Optimization Models       |  |
|  | JSON Vault File on Disk      |  |   |  | - Timeline Run-of-Show Engine      |  |
|  | (eventforge_vault.json)      |  |   |  | - Vendor Guidance & Scoring        |  |
|  +------------------------------+  |   |  | - Event Copilot Concierge          |  |
|                                    |   |  +------------------------------------+  |
+------------------------------------+   +------------------------------------------+
```

### 1. Presentation & Interaction Layer
The user interface is constructed using Svelte 5 and TypeScript, compiled via Vite for instantaneous hot-module replacement and ultra-lean production bundles. State changes propagate reactively through Svelte stores, guaranteeing that edits to a budget item or timeline event instantly update aggregate dashboards, progress bars, countdown badges, and status pills across the application without manual re-renders.

### 2. Audio Synthesis Subsystem
To reinforce tactile neo-brutalist feedback, EVENTFORGE features a custom Web Audio API synthesizer. Operating entirely in code without heavy external MP3 assets, the synthesizer produces programmatic square, triangle, and sine waveforms shaped by custom exponential gain envelopes. Distinct acoustic frequencies provide immediate auditory feedback for affirmative clicks (600Hz), successful file saves (523Hz-659Hz-784Hz arpeggios), item deletions (300Hz-180Hz downward pitch drops), and modal popups.

### 3. Storage & Local Computer ROM Persistence Pipeline
Data storage is engineered around absolute user sovereignty. The pipeline utilizes the modern browser File System Access API (`showDirectoryPicker`) to grant EVENTFORGE persistent read and write access to a user-designated directory on their physical computer drive.

- **System of Record:** All events, budgets, vendors, timelines, ideas, and vault configurations are serialized into a master JSON database file (`eventforge_vault.json`) written directly to the chosen disk directory.
- **Session Durability:** The native directory handle is stored inside IndexedDB (`idb-keyval`), allowing the application to re-acquire disk access upon browser refreshes and system reboots.
- **Zero Data Loss Guarantee:** As a robust secondary tier, all mutations are mirror-cached into browser `localStorage`, ensuring data remains completely accessible and recoverable even if the directory permission is temporarily ungranted.
- **Portability:** Organizers can export full JSON backups at any moment or open their underlying storage directory directly in Windows Explorer or macOS Finder.

### 4. GenAI Intelligence & Prompt Engineering Engine
The AI tier interfaces directly with the official `@google/genai` client library, utilizing `gemini-3.5-flash` for high-throughput, low-latency reasoning. Prompt pipelines are strictly engineered with domain-specific knowledge representations:

- **JSON Enforcement:** All generative requests enforce strict schema adherence, instructing the model to return sanitized JSON objects with explicit data types, eliminating parsing failures.
- **Contextual Anchoring:** When executing targeted actions (such as optimizing an existing budget or generating a vendor negotiation checklist), the system injects the event's current financial balance, guest count, location, and theme as ground truth, preventing generic or hallucinatory recommendations.
- **Configurable Models & Keys:** Users manage their own Gemini API credentials locally on their computer disk. No API keys are ever routed through or stored on external proxy servers.

---

## Core Operational Modules

EVENTFORGE organizes event planning into five specialized, interconnected operational modules:

### 1. Unified Event Dashboard & Metric Hub
The central command hub displays real-time metrics across all active celebrations. High-level metric cards calculate total allocated budget, aggregate actual expenditure, percentage of budget utilized, and active vendor pipeline progress across weddings, birthdays, and community gatherings. Organizers can filter by event archetype, search by keyword or vibe, and inspect urgency indicators that dynamically flag upcoming deadlines.

### 2. Real-Time Budget Allocator & Expense Tracker
The financial ledger enables granular tracking of projected and actual expenditures across six standard categories: Venue, Catering, Entertainment, Decor, Logistics, and Miscellaneous. Each item records vendor associations, invoice notes, and payment statuses (Paid, Pending, or Overdue). A visual progress meter compares total budget against actual costs, dynamically displaying warning badges if expenditures exceed planned caps. Organizers can trigger the **Optimize Budget AI** function to audit allocations, identify overspending risks, and rebalance funds based on real-world market norms.

### 3. Chronological Timeline & Run-of-Show Engine
The timeline module organizes complex schedules across four distinct logistical phases: Planning & Sourcing, Booking & Confirmation, Week-of Crunch, and Event Day Run-of-Show. Each milestone features priority tagging (Low, Medium, High, Critical), target dates, time stamps, and completion toggles. The **Generate Run-of-Show AI** utility automatically constructs a minute-by-minute execution schedule tailored to the specific event archetype, ensuring smooth transitions and adequate buffer times.

### 4. Vendor Management & Contract Checklist
The vendor studio manages the external supply chain for your event. Organizers can track vendor company names, primary contact persons, phone numbers, email addresses, quoted prices, and contract milestones (Inquiry, Quote Received, Contract Signed, Deposit Paid, or Fully Settled). With the **Vendor Guide AI** tool, organizers can instantly generate tailored vetting questions, red-flag warnings, and negotiation pointers specific to each vendor category.

### 5. Creative Idea Lab & Bespoke Guest Experience Studio
The Idea Lab captures and organizes personalized creative concepts across Decor & Visuals, Food & Beverage, Interactive Guest Activities, and Ambient Music & Sound. Each card records implementation effort ratings (Easy, Moderate, Ambitious) and estimated costs. Organizers can activate the **Brainstorm Ideas AI** engine to produce high-impact, non-cliché experiential concepts mapped specifically to the event's designated theme and vibe.

### 6. Interactive Event Copilot & Contextual Concierge
Built directly into the event detail screen, the AI Copilot serves as an on-demand event coordinator. Unlike standard chat interfaces, the Copilot has full real-time visibility into the currently viewed event—including remaining budget, pending tasks, confirmed vendors, and guest numbers. Planners can ask complex logistical questions, request contingency plans for inclement weather, or draft formal vendor outreach emails with complete contextual relevance.

---

## Technical Specifications

- **Frontend Core:** Svelte 5 (TypeScript)
- **Bundler & Build Tool:** Vite
- **Styling Architecture:** Custom Neo-Brutalist Design System with Vanilla CSS Variables
- **Vector Iconography:** Lucide Icons (`@lucide/svelte`)
- **Audio Architecture:** Native Browser Web Audio API Synthesizer
- **AI Intelligence:** Google Gemini API (`@google/genai`, running `gemini-3.5-flash`)
- **Persistence Tier:** File System Access API, IndexedDB File Handle Storage, and LocalStorage Mirror
- **Data Exchange Format:** Human-readable JSON (`eventforge_vault.json`)
- **Typography:** JetBrains Mono (data & metrics), Space Grotesk (body & controls), Syne (headings & titles)
