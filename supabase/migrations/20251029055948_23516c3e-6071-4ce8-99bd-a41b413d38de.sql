-- Create a SECURITY DEFINER helper to bypass RLS on competition_events when validating linkage
create or replace function public.can_link_attachment_to_competition_event(
  _record_id uuid,
  _school_id uuid
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.competition_events ce
    where ce.id = _record_id
      and ce.school_id = _school_id
  );
$$;

-- Replace the earlier permissive INSERT policy to use the helper function
drop policy if exists "Users can create competition_event attachments via event linkage" on public.attachments;

create policy "Users can create competition_event attachments via event linkage"
on public.attachments
for insert
to authenticated
with check (
  record_type = 'competition_event'
  and uploaded_by = auth.uid()
  and public.can_link_attachment_to_competition_event(record_id, school_id)
);
