-- Allow judges (or any authenticated user) to upload attachments for competition events
-- even if they are not in the same school, as long as the attachment is linked
-- to an existing competition_event row with a matching school_id.

-- Create an additional INSERT policy specifically for competition_event attachments
create policy "Users can create competition_event attachments via event linkage"
on public.attachments
for insert
to authenticated
with check (
  record_type = 'competition_event'
  and uploaded_by = auth.uid()
  and exists (
    select 1 from public.competition_events ce
    where ce.id = record_id
      and ce.school_id = attachments.school_id
  )
);
