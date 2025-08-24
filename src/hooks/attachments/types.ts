export interface Attachment {
  id: string;
  record_type: 'task' | 'subtask' | 'incident' | 'announcement';
  record_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAttachmentData {
  record_type: 'task' | 'subtask' | 'incident' | 'announcement';
  record_id: string;
  file: File;
}

export interface AttachmentListProps {
  recordType: 'task' | 'subtask' | 'incident' | 'announcement';
  recordId: string;
  canEdit?: boolean;
}