# Campus Relay AI Worklog

**Three build decisions from the assessment simulation | 5 October 2026**

Campus Relay was built with Codex. These examples describe what the AI produced and how the product was corrected; they do not claim that an actual campaign ran.

## 1. From guided prompts to a responsive interview

**Prompt:** Ask students personal questions, then recommend projects from their replies in a conversational flow.

**AI output:** The first Matchmaker used branch-aware but predetermined follow-up questions. AI generated the three project ideas only at the end.

**Changed or rejected:** That did not respond closely enough to a student's own idea. The user asked for a real conversation within a bounded discovery flow. The build was changed to generate two short follow-up questions from the challenge and prior reply. It still limits the interview to seven steps, and labels a guided fallback if live AI fails.

**Final output:** A working chat that uses both free-text replies to generate three scoped project recommendations. Selecting one shows a sample flow, hypothetical usage and a cited comparable real-world workflow.

## 2. Correcting an unhelpful project match

**Prompt:** Match a beginner CSE student interested in text to a realistic first-hour project.

**AI output:** The initial curated scoring surfaced “Community feedback themes” ahead of the more specific “Campus FAQ finder.”

**Changed or rejected:** The broad result was less relevant to the branch and starter skill level. The matching score gained explicit branch specificity and level fit, then was checked again in the browser.

**Final output:** CSE plus beginner now opens the FAQ finder first; Mechanical plus beginner and data opens the maintenance note explorer. The curated starters include actual small sample files.

## 3. Rejecting an invented referral incentive

**Prompt:** Design a Growth desk with three proposed A/B tests, exposure and conversion denominators, and no invented performance claims.

**AI output:** A generated visual concept added unrelated tests and a ₹50 referral reward.

**Changed or rejected:** A per-sign-up reward was absent from the challenge plan, would consume the ₹2,000 ceiling unpredictably, and could favor volume over eligible registrations. The unrelated tests were removed.

**Final output:** The desk shows the three planned tests—personalised preview, concrete take-home value and cross-branch friend invite—with explicit denominators. All displayed seed records and experiment figures are labelled simulated.
