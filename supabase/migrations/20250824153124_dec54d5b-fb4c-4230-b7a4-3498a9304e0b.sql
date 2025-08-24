-- Update attachments table to support announcements
ALTER TYPE public.attachment_record_type ADD VALUE IF NOT EXISTS 'announcement';

-- Add announcement attachments support by updating the record_type constraint if it exists
-- (This will allow 'announcement' as a valid record type)