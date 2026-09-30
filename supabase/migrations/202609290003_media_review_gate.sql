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
