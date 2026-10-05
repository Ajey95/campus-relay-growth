# Campus Relay

An independent, AI-assisted assessment simulation for a proposed free online workshop, **“Build Your First AI Project in 60 Minutes.”** It demonstrates how a seven-day campaign might pursue 500 unique final-year engineering registrations with a ₹2,000 ceiling. No campaign was run and no real workshop registration is created.

**Public demo:** https://campus-relay-growth.vercel.app

**Public source:** https://github.com/Ajey95/campus-relay-growth

**Growth plan:** https://campus-relay-growth.vercel.app/assets/Campus_Relay_Growth_Plan.pdf

**AI worklog:** https://campus-relay-growth.vercel.app/assets/AI_Worklog.md

## Ninety-second walkthrough

1. Open the public link signed out and create an **empty workspace**. This creates a seven-day isolated database scope and saves a separate operator link in the current browser.
2. In the chat, choose CSE, then use **Browse curated examples**. View the **Campus FAQ finder** project and download its ZIP; the archive includes a README, sample FAQ and test questions.
3. Continue to fictional registration using `student-a@example.com` and graduation year 2027. No message is sent. Copy the friend invite link.
4. Open that invite in a second browser profile. Choose ECE in the chat, browse curated examples and see the shared **Sensor anomaly explorer** with separate CSE/ECE roles. Register `student-b@example.com`.
5. Return to the first browser's **Growth desk**. It should show two unique eligible demo registrations and one valid referral. Generate a club or academic tagged link, edit the draft partner copy, inspect forecast and test denominators, and export an anonymised CSV. Reset to empty or reseed synthetic examples as needed.

To try live AI suggestions, answer the five chat prompts. Choose a branch-specific challenge or type your own project idea. The server generates three project concepts from the replies, each with a reason it fits and a concrete first-hour demonstration. These are proposals, and their ZIPs contain a generated outline rather than a supplied data bundle.

The operator token is in the Growth desk URL fragment and browser local storage. It is not included in student or friend URLs. Treat it as a private demo capability link.

## Implemented

- Responsive conversational Matchmaker with branch-specific challenge replies, a free-text idea option, preferred build style, experience level and desired payoff. The OpenAI Responses API returns three proposals with personal fit, a first-hour demonstration and a realistic scope. Eight version-controlled curated examples are available through a separate chat action. Curated cards have sample starter ZIPs; generated cards have a README outline.
- The OpenAI key is server-side only, configured as a sensitive production environment variable. AI calls require a chosen challenge or typed idea and have daily visitor, workspace and IP limits. Only the idea and nonidentifying Matchmaker choices are sent to the API; the app does not store the raw idea.
- Persistent Neon Postgres through Vercel. Workspace isolation, expiry, seed mode, reset, record caps, basic workspace-creation throttling, foreign keys, indexes and unique registration constraint.
- Fictional `@example.com` registration only; server-side HMAC digest replaces raw address after request processing. Declared 2027 engineering records count as eligible. Duplicate and self-referral attempts do not add records or referral credit.
- Opaque campaign and invite links, first-touch primary attribution, last touch and referral assist, a separate operator-scoped Growth desk and CSV export with formula-safe escaping.
- Editable hypothetical forecast and budget, three proposed tests with stable illustrative assignment records and exposure denominators, editable partner drafts. The app sends no messages.
- Automated integration/browser checks in two isolated Chrome contexts; see `tests/e2e.spec.ts`.

## Proposed or unverified

- The 500 target, 610 gross forecast, 18% reduction, channel yields and ₹2,000 spend are planning assumptions. Live demo counts are fictional, and seed rows are marked synthetic.
- The official workshop date, instructor, exact curriculum, certificate or other benefit is unknown. Project cards are possible starters, not an approved NxtWave syllabus.
- No real partner agreed, no student outreach or campaign occurred, and no A/B winner or significance claim can be drawn from demo data.
- Fictional email uniqueness is not human verification. Production anti-fraud, deliverability, consent, attendance and long-term retention need organiser approval and a separate production system.
- The candidate must review the AI worklog and campaign copy, enter their own identity details, and record their own three-minute video before submitting the assessment form.

## Local development

Requires Node.js 22 or newer and a Postgres database. The deployed project uses a free Neon resource connected to Vercel. Set `DATABASE_URL`, a unique `EMAIL_HASH_SECRET`, and `OPENAI_API_KEY` in a local `.env.local`; never commit their values. Without the OpenAI key, the curated Matchmaker still works. Then:

```bash
npm ci
npm run dev
```

The API creates its demo schema on first use. Run checks with:

```bash
npm run build
npx playwright test
```

`playwright.config.ts` uses installed Chrome and starts a local server if needed. Set `TEST_BASE_URL=https://campus-relay-growth.vercel.app` to run against production; tests create isolated fictional workspaces.

## API outline

`POST /api/demo-workspaces`, `GET /api/projects`, `POST /api/recommendations`, `POST /api/visits`, `POST /api/registrations`, `POST /api/invites`, `POST /api/invites/{token}/accept`, `POST /api/links`, `GET /api/dashboard`, `GET /api/export.csv`, and `POST /api/demo-workspaces/{id}/reset`. Dashboard, CSV, links and reset require `x-operator-token`.

## Implementation notes

Next.js 16 App Router and TypeScript on Vercel; Neon Postgres via the serverless driver. The application stores no raw email, contacts no students and uses only synthetic or evaluator-entered fictional demo data. `src/lib/catalog.ts` is the project catalogue and matching logic; `src/lib/starters.ts` contains the downloadable sample data. `src/app/api/[...path]/route.ts` implements validation, persistence and metrics. The project was created with AI assistance, documented in the worklog.
