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
