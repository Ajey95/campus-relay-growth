# Campus Relay AI Worklog

**Three genuine build interactions · 5 October 2026**
This log describes work done by the Codex coding agent under the candidate's instruction to build the project. It does not claim the candidate personally wrote the prompts, edited these outputs or approved the campaign copy. Candidate review remains required before submission or real use.

## 1. Partner message drafts

**Prompt/context:** The attached PRD asked the coding agent to create a human-editable 40–70-word group post, 120–180-word academic email and 20-second creator script from confirmed workshop facts. The challenge confirms the proposed title, free, online and 60 minutes; the date, instructor and syllabus are unconfirmed.

**AI output:** The agent produced three differentiated editable drafts in the Growth desk's link generator, with a tagged URL inserted after a link is issued. The email addresses an academic reviewer, the group post speaks to engineering members, and the script describes a short screen recording.

**Change/rejection:** The agent kept unconfirmed logistics explicit and excluded certificates, job outcomes, urgency and official endorsement. The drafts are never sent by the app. Their actual wording still needs candidate and organiser approval before any campaign.

**Shipped result:** [Growth desk partner pack](https://campus-relay-growth.vercel.app) after creating a workspace and opening its private desk link; source in `src/app/desk/[id]/page.tsx`.

## 2. Curated project matching

**Prompt/context:** The PRD asked for eight branch-aware project previews with realistic one-hour inputs, outputs and cautions, including CSE/IT text, sensor data, maintenance notes and cross-branch pairings.

**AI output:** The agent built eight curated templates and a deterministic ranker. During the first real browser check, CSE + beginner + text returned the broad “Community feedback themes” project rather than the more relevant “Campus FAQ finder.”

**Change/rejection:** The agent rejected that first ranking, added branch specificity and skill-level fit to the score, and reran the browser test. CSE + beginner + text now returns “Campus FAQ finder”; Mechanical + beginner + data returns “Maintenance note explorer.” The downloadable starters contain actual small sample files. Project claims remain examples until a workshop organiser confirms the syllabus.

**Shipped result:** `src/lib/catalog.ts`, `src/lib/starters.ts`, and the student Matchmaker. After the candidate asked for students to type their own ideas and then for a conversational flow, the agent built a five-question chat with branch-specific choices and a free-text route. A server-side OpenAI path in `src/lib/ai-ideas.ts` turns the replies into three labelled proposals with a personal-fit explanation and first-hour demonstration. The fictional receipt step also became a three-question chat. A separate action uses the corrected curated ranker. Local browser checks covered the adaptive prompts and receipt flow, and a production browser check confirmed the live AI reveal. The generated starter is an outline; curated starters retain sample files.

## 3. Dashboard and experiment judgement

**Actual visual-concept prompt:** “High fidelity desktop UI concept screenshot ... for the Growth desk of Campus Relay ... three proposed experiment rows with arm A/B exposures and rates, no significance claims ... no invented claims.”

**AI output:** The generated concept nevertheless showed unrelated tests and a “₹50 reward” referral incentive, alongside raw A/B registration totals. That conflicted with the PRD's exact three tests and the ₹2,000 fixed-cost plan.

**Change/rejection:** The agent rejected the invented incentive and experiment names. The implemented desk uses the PRD's exact tests: personalised preview, concrete take-home value and cross-department friend invitation. It shows explicit exposure denominators, validates that registrations cannot exceed exposure, and labels demo assignments as illustrative rather than evidence of uplift.

**Shipped result:** `src/app/desk/[id]/page.tsx` and `src/app/api/[...path]/route.ts`. The rejected visual concept remains an internal design study and is not presented as a campaign result.

**Candidate review checklist:** Confirm the claims, edit copy into your own voice, decide whether you agree with these rejections, then record your own three-minute explanation. Do not describe these agent actions as personal work you performed.
