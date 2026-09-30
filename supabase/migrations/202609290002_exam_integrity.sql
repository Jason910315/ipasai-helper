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
