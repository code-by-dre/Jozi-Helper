# JoziHelper

**JoziHelper** is a practical, live-grounded community assistant web application for Johannesburg residents covering local municipal utilities, public clinics and Home Affairs, public transportation, and household budgeting.

---

## Features

- **Clarify-First Community Assistant**: Asks 1–2 brief clarifying questions when your general Johannesburg suburb/area or goal/budget is needed before giving specific advice.
- **Smart Live Search Grounding (`Auto | Always | Off`)**:
  - Automatically attaches Google Search grounding via the Gemini API for factual hours, schedules, prices, and local service queries, while skipping search on missing-suburb clarification turns.
  - Displays structured responses (`summary`, step-by-step `action_steps`, `confidence_level` (`HIGH` / `MEDIUM` / `LOW`), and clickable `verified_sources`).
  - Automatically falls back to general step-by-step guidance (`confidence_level: "LOW"`, `verified_sources: []`) if live search hits a `429` quota/rate limit, and falls back to a backup model on transient `503` availability spikes.
- **Johannesburg Public Transit Guide**: Reference guide covering Rea Vaya, Metrobus, Putco, Gautrain, and Metrorail Gauteng, with guidance on checking official schedules/fares and triggering live verification queries.
- **Essential Local Services Directory**: Filterable directory for Johannesburg service categories (Plumbing, Electrical, Handyman, Gas & Appliance, Municipal & Civic) with verification tips and POPIA-safe session review notes.
- **POPIA Privacy & Guardrails**: Automatically detects and redacts personally identifiable information (South African ID numbers, phone numbers, email addresses, street addresses, and banking/card numbers) both before sending and on the server, never asks for or stores PII, and restricts scope to Johannesburg community logistics.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, `lucide-react`
- **Backend**: Express (`server.ts`) running Vite middlewares in development and serving static `dist/` assets in production
- **AI SDK**: `@google/genai` (server-side only via `POST /api/chat`)

---

## Project Structure

```text
.
├── server.ts                  # Express server, /api/chat & /api/health routes, Vite/static serving
├── index.html                 # App entry HTML & metadata
├── metadata.json              # App metadata and capabilities
├── package.json               # Scripts and dependencies
├── vite.config.ts             # Vite & Tailwind v4 configuration
├── .env.example               # Environment variable template
└── src/
    ├── App.tsx                # Top-level view state and conversation flow
    ├── main.tsx               # React root mount
    ├── index.css              # Tailwind CSS v4 imports and theme tokens
    ├── components/
    │   ├── TopBar.tsx         # Navigation header and New Chat control
    │   ├── ContextSidebar.tsx # Suburb, topic, budget note, and Live Search mode controls
    │   ├── ChatWorkspace.tsx  # Starter prompts, structured message cards, POPIA warning & composer
    │   ├── FormattedMessage.tsx # Safe markdown renderer
    │   ├── TransitGuideView.tsx # Johannesburg public transport guide
    │   ├── LocalServicesView.tsx# Essential services directory & session review notes
    │   └── PopiaNoticeView.tsx  # POPIA privacy notice view
    ├── data/
    │   ├── joziTopics.ts      # Johannesburg suburbs, starter prompts, and service categories
    │   └── joziTransit.ts     # Public transport operator summaries and verification steps
    ├── services/
    │   └── geminiService.ts   # Frontend client calling POST /api/chat
    └── utils/
        ├── assistantPrompt.ts # Conversation validation, PII scrubbing, and system instructions
        ├── directory.ts       # Directory filtering and POPIA-safe review notes
        ├── grounding.ts       # Grounding chunk extraction and safe URL validation
        ├── groundingPolicy.ts # Auto-search heuristics, fence stripping, and response parsing
        ├── markdown.ts        # Pure markdown-to-AST parser blocking unsafe links
        ├── popia.ts           # SA ID, phone, email, address, and bank PII detector/redactor
        └── *.test.ts          # Node unit test suites
```

---

## Environment Variables

Configure secrets in `.env` locally or via **Settings > Secrets** in Google AI Studio:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Yes | Server-side Gemini API key used exclusively by `server.ts` |
| `PORT` | No | Server port (defaults to `3000`) |
| `APP_URL` | No | Hosted application URL |

> `GEMINI_API_KEY` is read only on the server (`server.ts`) and is never bundled into browser code.

---

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server** (Express + Vite middleware on port `3000`)

   ```bash
   npm run dev
   ```

3. **Run unit tests**

   ```bash
   npx tsx --test src/utils/*.test.ts
   ```

4. **Type-check and build for production**

   ```bash
   npm run lint
   npm run build
   ```

5. **Run the production server**

   ```bash
   NODE_ENV=production npm start
   ```

---

## Server API

### `GET /api/health`
Returns `{ "ok": true }` when the Express server is running.

### `POST /api/chat`
Accepts up to `64kb` JSON with conversation history and context:

```json
{
  "messages": [{ "role": "user", "text": "What are Rea Vaya T1 hours?" }],
  "context": {
    "suburb": "Soweto",
    "category": "transit",
    "budgetFocus": "",
    "liveSearchMode": "auto"
  }
}
```

Returns a structured JSON payload:

```json
{
  "summary": "...",
  "action_steps": ["..."],
  "confidence_level": "HIGH",
  "verified_sources": [{ "title": "...", "uri": "https://..." }],
  "searchModeUsed": "grounded",
  "piiRedacted": false,
  "piiTypes": []
}
```
