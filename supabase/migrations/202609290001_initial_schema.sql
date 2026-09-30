create extension if not exists pgcrypto with schema extensions;

create type public.subject_code as enum ('L21', 'L23');
create type public.question_origin as enum ('official', 'exam_style', 'guide_research');
create type public.attempt_kind as enum ('mock', 'practice');
create type public.attempt_state as enum ('in_progress', 'submitted');

create table public.topics (
  id text primary key,
  subject public.subject_code not null,
  parent_id text references public.topics(id) on delete cascade,
  title text not null,
  guide_section text,
  guide_page text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.question_groups (
  id text primary key,
  shared_stem text not null,
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.questions (
  id text primary key,
  subject public.subject_code not null,
  origin public.question_origin not null,
  stem text not null,
  options jsonb not null,
  correct_option text not null,
  explanation text not null,
  option_explanations jsonb not null default '{}'::jsonb,
  topic_ids text[] not null default '{}',
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  tags text[] not null default '{}',
  group_id text references public.question_groups(id) on delete set null,
  display_order integer not null default 0,
  source_label text not null,
  source_url text,
  exam_year integer,
  exam_session text,
  source_question_number integer,
  source_pdf_page smallint,
  style_reference text,
  theory_sources jsonb not null default '[]'::jsonb,
  verified_at date,
  needs_manual_media_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint options_have_four_choices check (jsonb_typeof(options) = 'object' and options ? 'A' and options ? 'B' and options ? 'C' and options ? 'D'),
  constraint correct_option_is_valid check (correct_option in ('A', 'B', 'C', 'D')),
  constraint source_fields_valid check (
    (origin = 'official' and exam_year is not null and exam_session is not null and source_question_number is not null and source_url is not null)
    or (origin = 'exam_style' and style_reference is not null)
    or (origin = 'guide_research' and cardinality(topic_ids) > 0 and jsonb_array_length(theory_sources) > 0 and verified_at is not null)
  )
);

create index questions_subject_origin_idx on public.questions(subject, origin);
create index questions_topic_ids_idx on public.questions using gin(topic_ids);
create index questions_tags_idx on public.questions using gin(tags);
create index questions_group_idx on public.questions(group_id) where group_id is not null;

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject public.subject_code not null,
  kind public.attempt_kind not null,
  state public.attempt_state not null default 'in_progress',
  title text not null,
  question_ids text[] not null,
  answers jsonb not null default '{}'::jsonb,
  flagged_question_ids text[] not null default '{}',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  submitted_at timestamptz,
  score smallint,
  correct_count smallint,
  wrong_count smallint,
  unanswered_count smallint,
  passed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attempt_score_range check (score is null or score between 0 and 100),
  constraint mock_duration_present check (kind <> 'mock' or expires_at is not null)
);

create index exam_attempts_user_recent_idx on public.exam_attempts(user_id, created_at desc);
create index exam_attempts_in_progress_idx on public.exam_attempts(user_id, state) where state = 'in_progress';

create table public.saved_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.saved_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

alter table public.topics enable row level security;
alter table public.question_groups enable row level security;
alter table public.questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.saved_questions enable row level security;
alter table public.saved_concepts enable row level security;

create policy "Authenticated users can read topics" on public.topics
  for select to authenticated using (true);
create policy "Authenticated users can read question groups" on public.question_groups
  for select to authenticated using (true);
create policy "Authenticated users can read questions" on public.questions
  for select to authenticated using (true);

create policy "Users can read their own attempts" on public.exam_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own attempts" on public.exam_attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own attempts" on public.exam_attempts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own attempts" on public.exam_attempts
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their saved questions" on public.saved_questions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can save their own questions" on public.saved_questions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can edit their saved questions" on public.saved_questions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can remove their saved questions" on public.saved_questions
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their saved concepts" on public.saved_concepts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can save their own concepts" on public.saved_concepts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can edit their saved concepts" on public.saved_concepts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can remove their saved concepts" on public.saved_concepts
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select on public.topics, public.question_groups, public.questions to authenticated;
grant select, insert, update, delete on public.exam_attempts, public.saved_questions, public.saved_concepts to authenticated;

comment on table public.questions is 'Versioned public prompts, choices, and source metadata for official and authored questions. Answer keys and explanations are stored separately.';
comment on table public.exam_attempts is 'Private per-user attempt and answer snapshots; row access is restricted by RLS.';
