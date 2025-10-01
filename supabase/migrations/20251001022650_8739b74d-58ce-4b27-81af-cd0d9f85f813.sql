-- Ensure the storage bucket exists (private)
insert into storage.buckets (id, name, public)
values ('task-incident-attachments', 'task-incident-attachments', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder within the bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to their own folder'
  ) THEN
    CREATE POLICY "Users can upload to their own folder"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'task-incident-attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow authenticated users to generate signed URLs (select) for objects if:
-- 1) it's their own folder, OR
-- 2) there exists an attachments row pointing to that file and the user shares the same school_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read attachments in their school'
  ) THEN
    CREATE POLICY "Users can read attachments in their school"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'task-incident-attachments'
      AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR EXISTS (
          SELECT 1
          FROM public.attachments a
          JOIN public.profiles p ON p.id = auth.uid()
          WHERE a.file_path = storage.objects.name
            AND a.school_id = p.school_id
        )
      )
    );
  END IF;
END $$;

-- Allow users to delete their own uploads (keeps removal scoped)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own uploads'
  ) THEN
    CREATE POLICY "Users can delete their own uploads"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'task-incident-attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;