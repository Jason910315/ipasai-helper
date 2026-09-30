# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

An individual preparing for the iPAS AI Planner intermediate certification. Each person clones or downloads the project and uses a separate Supabase deployment and account so their attempts, saved questions, and study progress remain private to them.

## Product Purpose

Help the user prepare for the intermediate exams in L21, 人工智慧技術應用與規劃, and L23, 機器學習技術與應用, with timed full-length mock exams, topic practice, explanations, review, and a personal wrong-question collection.

## Operating Context

The user studies across devices and wants progress synchronized through Supabase. Mock exams should follow the official duration, question count, and question type. Users can practice either past papers or a randomized pool, review results and explanations, and choose whether to save a missed question or concept.

## Capabilities and Constraints

- Focus only on L21 and L23 intermediate exam subjects.
- Use official historical questions and pre-authored questions; never generate questions by calling an AI service at runtime.
- Each question must show its origin. Self-authored questions include 50 exam-style questions and 50 questions grounded in study-guide concepts and verified technical sources per subject.
- Prepare explanations before questions are imported.
- Use Supabase Auth and Postgres for accounts and synchronized personal study data.
- A downloaded project is configured with its own Supabase URL and publishable key in a gitignored local environment file. Never expose a service-role or secret key in the browser.
- Prefer the Supabase Free plan while usage remains within its quotas.
- The interface should avoid a generic AI-generated visual style while keeping exam content and actions clear.

## Evidence on Hand

- Official study guides and exam-scope reference PDFs are in the project root.
- Official 114 and 115 exam PDFs for L21 and L23 are in the project root.
- The local Supabase project is configured through the ignored `.env.local`; credentials are not committed.
- The current production build was scanned for the local Supabase secret value: it was absent from both generated assets. `.env.local` is ignored by Git, and auth email callbacks use the current site origin; a public deployment still needs its URL in Supabase Auth's redirect allowlist.
- The local question source files contain 400 items across both subjects (200 each). A read-only Supabase query confirmed 28 topics, 400 questions, and 400 answer records, matching the local subject and origin counts. All 100 L21 official answer keys match the 114 and 115 official PDFs. Text extraction directly matched 93 question stems; the seven layout-related exceptions and five option-text exceptions were checked against their source pages. No obvious PDF text contamination was found.
- All 100 L21 official questions have explanations and four option explanations. A semantic review of the 300 incorrect-option explanations found no other clear contradictions with their question stems; this was not an external fact check of every claim. Review found that official question 115-46's answer C preserves data locality but does not meet the stem's public-cloud GPU training condition; the local explanation identifies that ambiguity while preserving the official stem and answer key. With user authorization, the main and C-option explanations for question 115-46 and the D-option explanation for question 115-23 now match in Supabase; read-back confirmed the other answer fields were unchanged. See [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md#題庫來源複核與待釐清) for the evidence and limits.
- The local browser flow has been exercised for authentication, a timed 50-question mock, submission, results, history, topic practice, and the personal wrong-question collection. The account-data clear flow was also verified with a one-time account: the UI reported 4 attempts, 0 saved questions, and 0 saved concepts deleted; read-back confirmed all three personal-data tables were empty while the Auth account and question bank remained.
- The GitHub repository has a `main` branch tracked by the local checkout. The user selected Cloudflare Pages with a `pages.dev` URL and asked to commit and push the current work before following deployment steps. The Pages project name and public URL are not set, and no deployment has started; cross-computer browser access remains unverified.

## Product Principles

- Make exam practice credible through official timing, question counts, sources, and server-trusted scoring.
- Make every answer useful for learning through a prepared explanation and clear source attribution.
- Keep each user's records private and synchronized across their own devices.
- Keep the experience focused on the two selected subjects.
