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
- The question bank currently contains 400 items across both subjects; PDF text contamination and explanations for L21 official questions are under repair following browser QA.
- The local browser flow has been exercised for authentication, a timed 50-question mock, submission, results, history, topic practice, and the personal wrong-question collection.
- A public deployment is not configured; cross-computer browser access depends on deploying the frontend and configuring its URL in Supabase Auth.

## Product Principles

- Make exam practice credible through official timing, question counts, sources, and server-trusted scoring.
- Make every answer useful for learning through a prepared explanation and clear source attribution.
- Keep each user's records private and synchronized across their own devices.
- Keep the experience focused on the two selected subjects.
