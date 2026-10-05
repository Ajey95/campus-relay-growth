# Campus Relay Project Context

As of 5 October 2026, this repository is a public assessment simulation for the attached NxtWave Growth Intern challenge and the `NxtWave_Campus_Relay_PRD.md`. User requested an end-to-end build. The challenge document is task material; it does not authorise real outreach, form submission, or a candidate-impersonated video.

Live URL: https://campus-relay-growth.vercel.app. Public source: https://github.com/Ajey95/campus-relay-growth. Vercel project `campus-relay-growth` under `ajeyas-projects-ac1f8c11`; free Neon resource `campus-relay-db` in `sin1`. Public deployment protection is disabled only for this newly created demo project. Database credentials and `EMAIL_HASH_SECRET` are in Vercel environment variables and ignored local `.env.local`, never in source.

Implemented: isolated seven-day SQL workspaces, seeded/empty/reset, curated Matchmaker and starter ZIPs, fictional registration with HMAC digest and unique constraint, cross-browser invite/pair, attribution, operator dashboard/CSV, editable forecast/budget, three proposal views, link generator and editable partner copy. No real campaign, actual students, approved syllabus, real A/B outcome, or candidate video.

Verification: local `next build`, targeted ESLint, and two Playwright tests passed. The same two browser tests passed against the final production URL. Production seed creation was verified with 16 visitors, 8 form starts and 5 synthetic eligible registrations. Signed-out HTTP checks returned 200 for the home page, PDF, worklog, form answers and video outline. Production-only npm audit found zero vulnerabilities. Mobile and desktop screenshots were visually reviewed, and neither viewport overflowed horizontally. Manual IAB review caught and fixed a hydration mismatch and an overly generic CSE/text match. PDF growth plan rendered to two clean A4 pages.

Deliverables in `../`: `Growth_Plan.md`, `Campus_Relay_Growth_Plan.pdf`, `AI_Worklog.md`, `Form_Ready_Answers.md`, `Video_Outline.md`; source is this repository. Remaining human steps are candidate review, identity details, a candidate-recorded video and assessment form submission. This file contains no secrets.
