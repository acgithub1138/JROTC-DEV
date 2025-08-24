-- Create storage bucket for task and incident attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-incident-attachments', 'task-incident-attachments', false);

-- Create attachments table
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_type TEXT NOT NULL CHECK (record_type IN ('task', 'subtask', 'incident')),
  record_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  school_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attachments
CREATE POLICY "Users can view attachments from their school" 
ON public.attachments 
FOR SELECT 
USING (is_user_in_school(school_id));

CREATE POLICY "Users can create attachments in their school" 
ON public.attachments 
FOR INSERT 
WITH CHECK (is_user_in_school(school_id) AND uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own attachments" 
ON public.attachments 
FOR DELETE 
USING (is_user_in_school(school_id) AND uploaded_by = auth.uid());

-- Create storage policies for attachments bucket
CREATE POLICY "Users can view attachments from their school" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'task-incident-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload attachments to their folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'task-incident-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'task-incident-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for updated_at
CREATE TRIGGER update_attachments_updated_at
BEFORE UPDATE ON public.attachments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_attachments_record ON public.attachments(record_type, record_id);
CREATE INDEX idx_attachments_school ON public.attachments(school_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);