-- iPAS AI Planner: Supabase initial schema
-- For a fresh project only. Run this complete file once in Supabase SQL Editor.
-- It mirrors the four versioned migrations in order. Do not run both this file and the migration files.


-- ===== supabase/migrations/202609290001_initial_schema.sql =====

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


-- ===== supabase/migrations/202609290002_exam_integrity.sql =====

-- Keep answer keys and explanations out of the table that the browser can read.
-- These functions are the only client-facing path to scoring and answer review.

create table public.question_answers (
  question_id text primary key references public.questions(id) on delete cascade,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  explanation text not null,
  option_explanations jsonb not null default '{}'::jsonb
);

insert into public.question_answers (question_id, correct_option, explanation, option_explanations)
select id, correct_option, explanation, option_explanations
from public.questions;

alter table public.question_answers enable row level security;
revoke all on public.question_answers from anon, authenticated;
revoke all on public.question_answers from public;

alter table public.questions drop column correct_option;
alter table public.questions drop column explanation;
alter table public.questions drop column option_explanations;

drop policy if exists "Users can create their own attempts" on public.exam_attempts;
drop policy if exists "Users can update their own attempts" on public.exam_attempts;
drop policy if exists "Users can delete their own attempts" on public.exam_attempts;
revoke insert, update, delete on public.exam_attempts from anon, authenticated;
grant select on public.exam_attempts to authenticated;

create or replace function public.create_attempt(
  p_subject public.subject_code,
  p_kind public.attempt_kind,
  p_title text,
  p_question_ids text[]
) returns public.exam_attempts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.exam_attempts;
  v_question_count integer;
  v_duration timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_title is null or length(trim(p_title)) = 0 then
    raise exception 'Attempt title is required';
  end if;
  if p_question_ids is null or cardinality(p_question_ids) = 0
     or cardinality(p_question_ids) > 50
     or cardinality(p_question_ids) <> (select count(distinct qid) from unnest(p_question_ids) as qid) then
    raise exception 'Question list is empty, too large, or contains duplicates';
  end if;
  if (p_kind = 'mock' and cardinality(p_question_ids) <> 50)
     or (p_kind = 'practice' and cardinality(p_question_ids) > 10) then
    raise exception 'Question count does not match attempt kind';
  end if;

  select count(*) into v_question_count
  from public.questions q
  where q.id = any(p_question_ids) and q.subject = p_subject;
  if v_question_count <> cardinality(p_question_ids) then
    raise exception 'Question set is invalid for this subject';
  end if;

  v_duration := case when p_kind = 'mock' then now() + interval '90 minutes' else null end;
  insert into public.exam_attempts (
    user_id, subject, kind, state, title, question_ids, expires_at
  ) values (
    auth.uid(), p_subject, p_kind, 'in_progress', trim(p_title), p_question_ids, v_duration
  ) returning * into v_attempt;
  return v_attempt;
end;
$$;

create or replace function public.save_attempt(
  p_attempt_id uuid,
  p_answers jsonb,
  p_flagged_question_ids text[] default '{}'
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.exam_attempts;
begin
  select * into v_attempt from public.exam_attempts
  where id = p_attempt_id and user_id = auth.uid() for update;
  if not found or v_attempt.state <> 'in_progress' then
    raise exception 'Attempt is unavailable';
  end if;
  if v_attempt.expires_at is not null and v_attempt.expires_at <= now() then
    raise exception 'Attempt time has expired';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object'
     or exists (
       select 1 from jsonb_each_text(p_answers) answer
       where not (answer.key = any(v_attempt.question_ids))
          or answer.value not in ('A', 'B', 'C', 'D')
     ) then
    raise exception 'Answers contain an invalid question or choice';
  end if;
  if p_flagged_question_ids is null or exists (
       select 1 from unnest(p_flagged_question_ids) flagged_id
       where not (flagged_id = any(v_attempt.question_ids))
     ) then
    raise exception 'Flag list contains an invalid question';
  end if;

  update public.exam_attempts
  set answers = p_answers,
      flagged_question_ids = p_flagged_question_ids,
      updated_at = now()
  where id = p_attempt_id;
end;
$$;

create or replace function public.submit_attempt(
  p_attempt_id uuid,
  p_answers jsonb
) returns public.exam_attempts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.exam_attempts;
  v_answers jsonb;
  v_total integer;
  v_correct integer;
  v_answered integer;
begin
  select * into v_attempt from public.exam_attempts
  where id = p_attempt_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Attempt is unavailable';
  end if;
  if v_attempt.state = 'submitted' then
    return v_attempt;
  end if;

  if p_answers is not null and jsonb_typeof(p_answers) = 'object'
     and (v_attempt.expires_at is null or v_attempt.expires_at > now())
     and not exists (
       select 1 from jsonb_each_text(p_answers) answer
       where not (answer.key = any(v_attempt.question_ids))
          or answer.value not in ('A', 'B', 'C', 'D')
     ) then
    v_answers := p_answers;
  else
    v_answers := v_attempt.answers;
  end if;

  select count(*),
         count(*) filter (where a.correct_option = v_answers ->> q.id),
         count(*) filter (where v_answers ? q.id)
  into v_total, v_correct, v_answered
  from unnest(v_attempt.question_ids) as q(id)
  join public.question_answers a on a.question_id = q.id;

  if v_total <> cardinality(v_attempt.question_ids) then
    raise exception 'One or more question keys are missing';
  end if;

  update public.exam_attempts
  set state = 'submitted',
      answers = v_answers,
      submitted_at = now(),
      updated_at = now(),
      correct_count = v_correct,
      wrong_count = v_answered - v_correct,
      unanswered_count = v_total - v_answered,
      score = round(v_correct * 100.0 / v_total)::smallint,
      passed = case when kind = 'mock' then round(v_correct * 100.0 / v_total) >= 70 else null end
  where id = p_attempt_id
  returning * into v_attempt;
  return v_attempt;
end;
$$;

create or replace function public.check_practice_answer(
  p_attempt_id uuid,
  p_question_id text,
  p_choice text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.exam_attempts;
  v_key public.question_answers;
begin
  select * into v_attempt from public.exam_attempts
  where id = p_attempt_id and user_id = auth.uid() for update;
  if not found or v_attempt.kind <> 'practice' or v_attempt.state <> 'in_progress'
     or not (p_question_id = any(v_attempt.question_ids)) then
    raise exception 'Practice question is unavailable';
  end if;
  if p_choice is null or p_choice not in ('A', 'B', 'C', 'D') then
    raise exception 'Choice is invalid';
  end if;

  select * into v_key from public.question_answers where question_id = p_question_id;
  if not found then raise exception 'Question key is missing'; end if;

  update public.exam_attempts
  set answers = coalesce(answers, '{}'::jsonb) || jsonb_build_object(p_question_id, p_choice),
      updated_at = now()
  where id = p_attempt_id;

  return jsonb_build_object(
    'correct_option', v_key.correct_option,
    'explanation', v_key.explanation,
    'option_explanations', v_key.option_explanations,
    'is_correct', p_choice = v_key.correct_option
  );
end;
$$;

create or replace function public.get_attempt_review(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.exam_attempts;
  v_questions jsonb;
begin
  select * into v_attempt from public.exam_attempts
  where id = p_attempt_id and user_id = auth.uid();
  if not found or v_attempt.state <> 'submitted' then
    raise exception 'Submitted attempt review is unavailable';
  end if;

  select coalesce(jsonb_agg(
    to_jsonb(q) || jsonb_build_object(
      'correct_option', a.correct_option,
      'explanation', a.explanation,
      'option_explanations', a.option_explanations,
      'shared_stem', g.shared_stem,
      'media', coalesce(g.media, '[]'::jsonb)
    ) order by array_position(v_attempt.question_ids, q.id)
  ), '[]'::jsonb)
  into v_questions
  from public.questions q
  join public.question_answers a on a.question_id = q.id
  left join public.question_groups g on g.id = q.group_id
  where q.id = any(v_attempt.question_ids);
  return v_questions;
end;
$$;

create or replace function public.get_saved_question_reviews(p_question_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_questions jsonb;
  v_saved_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_question_ids is null or cardinality(p_question_ids) > 100 then
    raise exception 'Question list is invalid';
  end if;
  if cardinality(p_question_ids) = 0 then
    return '[]'::jsonb;
  end if;

  select count(*) into v_saved_count
  from public.saved_questions s
  where s.user_id = auth.uid() and s.question_id = any(p_question_ids);
  if v_saved_count <> cardinality(p_question_ids) then
    raise exception 'One or more questions are not saved by this user';
  end if;

  select coalesce(jsonb_agg(
    to_jsonb(q) || jsonb_build_object(
      'correct_option', a.correct_option,
      'explanation', a.explanation,
      'option_explanations', a.option_explanations,
      'shared_stem', g.shared_stem,
      'media', coalesce(g.media, '[]'::jsonb)
    ) order by array_position(p_question_ids, q.id)
  ), '[]'::jsonb)
  into v_questions
  from public.questions q
  join public.question_answers a on a.question_id = q.id
  left join public.question_groups g on g.id = q.group_id
  where q.id = any(p_question_ids);
  return v_questions;
end;
$$;

revoke all on function public.create_attempt(public.subject_code, public.attempt_kind, text, text[]) from public, anon;
revoke all on function public.save_attempt(uuid, jsonb, text[]) from public, anon;
revoke all on function public.submit_attempt(uuid, jsonb) from public, anon;
revoke all on function public.check_practice_answer(uuid, text, text) from public, anon;
revoke all on function public.get_attempt_review(uuid) from public, anon;
revoke all on function public.get_saved_question_reviews(text[]) from public, anon;
grant execute on function public.create_attempt(public.subject_code, public.attempt_kind, text, text[]) to authenticated;
grant execute on function public.save_attempt(uuid, jsonb, text[]) to authenticated;
grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;
grant execute on function public.check_practice_answer(uuid, text, text) to authenticated;
grant execute on function public.get_attempt_review(uuid) to authenticated;
grant execute on function public.get_saved_question_reviews(text[]) to authenticated;

comment on table public.question_answers is 'Private answer keys and explanations. Browser roles have no direct table access; controlled RPCs reveal answers only in practice or after submission.';
comment on table public.questions is 'Versioned public prompts, choices, and source metadata for official and authored questions. Answer keys and explanations are stored separately.';


-- ===== supabase/migrations/202609290003_media_review_gate.sql =====

alter table public.questions
  add column if not exists needs_manual_media_review boolean not null default false;
alter table public.questions
  add column if not exists source_pdf_page smallint;

create index if not exists questions_ready_for_practice_idx
  on public.questions(subject, origin)
  where needs_manual_media_review = false;

create or replace function public.create_attempt(
  p_subject public.subject_code,
  p_kind public.attempt_kind,
  p_title text,
  p_question_ids text[]
) returns public.exam_attempts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.exam_attempts;
  v_question_count integer;
  v_answer_count integer;
  v_duration timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_title is null or length(trim(p_title)) = 0 then
    raise exception 'Attempt title is required';
  end if;
  if p_question_ids is null or cardinality(p_question_ids) = 0
     or cardinality(p_question_ids) > 50
     or cardinality(p_question_ids) <> (select count(distinct qid) from unnest(p_question_ids) as qid) then
    raise exception 'Question list is empty, too large, or contains duplicates';
  end if;
  if (p_kind = 'mock' and cardinality(p_question_ids) <> 50)
     or (p_kind = 'practice' and cardinality(p_question_ids) > 10) then
    raise exception 'Question count does not match attempt kind';
  end if;

  select count(*) into v_question_count
  from public.questions q
  where q.id = any(p_question_ids)
    and q.subject = p_subject
    and not q.needs_manual_media_review;
  if v_question_count <> cardinality(p_question_ids) then
    raise exception 'Question set is invalid, incomplete, or needs media review';
  end if;
  select count(*) into v_answer_count
  from public.question_answers a
  where a.question_id = any(p_question_ids);
  if v_answer_count <> cardinality(p_question_ids) then
    raise exception 'Question set is missing answer explanations';
  end if;

  v_duration := case when p_kind = 'mock' then now() + interval '90 minutes' else null end;
  insert into public.exam_attempts (
    user_id, subject, kind, state, title, question_ids, expires_at
  ) values (
    auth.uid(), p_subject, p_kind, 'in_progress', trim(p_title), p_question_ids, v_duration
  ) returning * into v_attempt;
  return v_attempt;
end;
$$;

comment on column public.questions.needs_manual_media_review is 'True when a question depends on an image/code block that has not yet been transcribed and verified; excluded from practice and mock attempts.';

-- ===== supabase/migrations/202609300004_account_data_management.sql =====

create or replace function public.delete_my_study_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempts integer;
  v_saved_questions integer;
  v_saved_concepts integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.exam_attempts where user_id = v_user_id;
  get diagnostics v_attempts = row_count;
  delete from public.saved_questions where user_id = v_user_id;
  get diagnostics v_saved_questions = row_count;
  delete from public.saved_concepts where user_id = v_user_id;
  get diagnostics v_saved_concepts = row_count;

  return jsonb_build_object(
    'attempts', v_attempts,
    'saved_questions', v_saved_questions,
    'saved_concepts', v_saved_concepts
  );
end;
$$;

revoke all on function public.delete_my_study_data() from public, anon;
grant execute on function public.delete_my_study_data() to authenticated;
