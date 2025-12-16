# Announcements Module Implementation Guide

A comprehensive guide for implementing the announcements module in a new project. This module provides school-wide announcements with rich text content, attachments, priority levels, scheduling, and automatic expiration.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Dependencies](#dependencies)
3. [File Structure](#file-structure)
4. [Core Components](#core-components)
5. [Hooks](#hooks)
6. [Utilities](#utilities)
7. [Edge Functions & CRON Jobs](#edge-functions--cron-jobs)
8. [Implementation Steps](#implementation-steps)
9. [Key Features](#key-features)

---

## Database Schema

### announcements table

```sql
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id),
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  publish_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expire_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your permission system)
CREATE POLICY "announcements: read access" ON public.announcements
  FOR SELECT USING (is_user_in_school(school_id));

CREATE POLICY "announcements: create" ON public.announcements
  FOR INSERT WITH CHECK (is_user_in_school(school_id));

CREATE POLICY "announcements: update" ON public.announcements
  FOR UPDATE USING (is_user_in_school(school_id));

CREATE POLICY "announcements: delete" ON public.announcements
  FOR DELETE USING (is_user_in_school(school_id));

-- Updated at trigger
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### attachments table (shared with other modules)

```sql
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_type TEXT NOT NULL, -- 'task', 'subtask', 'incident', 'announcement', etc.
  record_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments from their school" ON public.attachments
  FOR SELECT USING (is_user_in_school(school_id) OR uploaded_by = auth.uid());

CREATE POLICY "attachments: create" ON public.attachments
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own attachments" ON public.attachments
  FOR DELETE USING (is_user_in_school(school_id) AND uploaded_by = auth.uid());
```

### schools table (timezone field)

Ensure your `schools` table has a `timezone` column:

```sql
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
```

### Database Function for Auto-Deactivation

```sql
CREATE OR REPLACE FUNCTION public.deactivate_expired_announcements()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER := 0;
  announcement_record RECORD;
BEGIN
  FOR announcement_record IN
    SELECT id, title, expire_date
    FROM public.announcements
    WHERE is_active = true
      AND expire_date IS NOT NULL
      AND expire_date < NOW()
  LOOP
    UPDATE public.announcements
    SET is_active = false, updated_at = NOW()
    WHERE id = announcement_record.id;
    
    updated_count := updated_count + 1;
    
    RAISE LOG 'Deactivated announcement: id=%, title=%, expire_date=%', 
      announcement_record.id, announcement_record.title, announcement_record.expire_date;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'executed_at', NOW()
  );
END;
$function$;
```

### Storage Bucket

Create a storage bucket for attachments:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-incident-attachments', 'task-incident-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-incident-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-incident-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-incident-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Dependencies

### Required npm packages

```bash
npm install react-quill dompurify @types/dompurify date-fns date-fns-tz @tanstack/react-query embla-carousel-react
```

### shadcn/ui components needed

- Card, CardContent, CardHeader, CardTitle
- Button
- Input
- Label
- Switch
- Slider
- Badge
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Tabs, TabsContent, TabsList, TabsTrigger
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
- AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
- Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext

---

## File Structure

```
src/
├── components/
│   ├── announcements/
│   │   ├── components/
│   │   │   ├── AnnouncementRichTextEditor.tsx  # Quill editor wrapper
│   │   │   └── AnnouncementViewer.tsx          # Sanitized HTML viewer
│   │   ├── AnnouncementDialog.tsx              # Create/Edit modal
│   │   ├── AnnouncementManagementPage.tsx      # List page with tabs
│   │   └── AnnouncementRecordPage.tsx          # Full page create/edit/view
│   ├── attachments/
│   │   ├── AttachmentSection.tsx               # Reusable attachment UI
│   │   ├── AttachmentList.tsx                  # List of attachments
│   │   └── FileAttachmentUpload.tsx            # Drag-drop upload
│   └── dashboard/
│       └── widgets/
│           ├── AnnouncementsWidget.tsx         # Dashboard carousel widget
│           └── AnnouncementAttachments.tsx     # Attachment display for widget
├── hooks/
│   ├── useAnnouncements.ts                     # CRUD operations
│   ├── useSchoolTimezone.ts                    # Timezone fetching
│   └── attachments/
│       ├── useAttachments.ts                   # Attachment CRUD
│       └── types.ts                            # Attachment types
└── utils/
    └── timezoneUtils.ts                        # UTC conversion utilities

supabase/
└── functions/
    └── deactivate-expired-announcements/
        └── index.ts                            # Auto-deactivation edge function
```

---

## Core Components

### 1. AnnouncementRichTextEditor.tsx

Rich text editor using ReactQuill:

```typescript
import React from 'react';
import ReactQuill from 'react-quill';
import { Label } from '@/components/ui/label';
import 'react-quill/dist/quill.snow.css';

interface AnnouncementRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['clean']
  ],
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent', 'link', 'color', 'background', 'align'
];

export const AnnouncementRichTextEditor: React.FC<AnnouncementRichTextEditorProps> = ({
  value,
  onChange,
  label = "Content",
  placeholder = "Write your announcement content here..."
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-md">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ minHeight: '200px' }}
        />
      </div>
    </div>
  );
};
```

### 2. AnnouncementViewer.tsx

Sanitized HTML viewer for displaying rich content:

```typescript
import React from 'react';
import DOMPurify from 'dompurify';

interface AnnouncementViewerProps {
  content: string;
  className?: string;
}

export const AnnouncementViewer: React.FC<AnnouncementViewerProps> = ({
  content,
  className = ""
}) => {
  const sanitizedContent = DOMPurify.sanitize(content);
  
  return (
    <div 
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
```

### 3. Priority System

The module uses a 3-tier priority system mapped to numeric values:

| Display | Slider Value | Stored Value |
|---------|--------------|--------------|
| Low     | 0            | 2            |
| Medium  | 1            | 5            |
| High    | 2            | 8            |

```typescript
// Convert slider value to stored priority
const getPriorityForStorage = (sliderValue: number) => {
  return sliderValue === 2 ? 8 : sliderValue === 1 ? 5 : 2;
};

// Convert stored priority to slider value
const getPriorityValue = (storedPriority: number) => {
  if (storedPriority >= 7) return 2; // High
  if (storedPriority >= 4) return 1; // Medium
  return 0; // Low
};

// Get display label
const getPriorityLabel = (storedPriority: number) => {
  if (storedPriority >= 8) return 'High';
  if (storedPriority >= 5) return 'Medium';
  return 'Low';
};

// Get badge color
const getPriorityColor = (priority: number) => {
  if (priority >= 8) return 'bg-red-100 text-red-800';
  if (priority >= 5) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};
```

---

## Hooks

### useAnnouncements.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Announcement {
  id: string;
  school_id: string;
  title: string;
  content: string;
  author_id: string;
  priority: number;
  is_active: boolean;
  publish_date: string;
  expire_date?: string;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  priority: number;
  is_active: boolean;
  publish_date: string;
  expire_date?: string;
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {
  id: string;
}

// Fetch all announcements for the school
export const useAnnouncements = () => {
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['announcements', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('school_id', userProfile.school_id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!userProfile?.school_id,
  });
};

// Fetch only active announcements (for dashboard widget)
export const useActiveAnnouncements = () => {
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['active-announcements', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('school_id', userProfile.school_id)
        .eq('is_active', true)
        .lte('publish_date', now)
        .or(`expire_date.is.null,expire_date.gte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!userProfile?.school_id,
  });
};

// Create announcement
export const useCreateAnnouncement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      if (!userProfile?.school_id) throw new Error('School ID not found');
      
      const { data: announcement, error } = await supabase
        .from('announcements')
        .insert({
          ...data,
          school_id: userProfile.school_id,
          author_id: userProfile.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
      console.error('Create announcement error:', error);
    },
  });
};

// Update announcement
export const useUpdateAnnouncement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateAnnouncementData) => {
      const { id, ...updateData } = data;
      const { data: announcement, error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
      console.error('Update announcement error:', error);
    },
  });
};

// Delete announcement (with attachments cleanup)
export const useDeleteAnnouncement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First, get all attachments for this announcement
      const { data: attachments, error: attachmentsFetchError } = await supabase
        .from('attachments')
        .select('id, file_path')
        .eq('record_type', 'announcement')
        .eq('record_id', id);

      if (attachmentsFetchError) throw attachmentsFetchError;

      // Delete attachments if they exist
      if (attachments && attachments.length > 0) {
        // Delete files from storage
        const filePaths = attachments.map(att => att.file_path);
        const { error: storageError } = await supabase.storage
          .from('task-incident-attachments')
          .remove(filePaths);

        if (storageError) throw storageError;

        // Delete attachment records from database
        const { error: attachmentDeleteError } = await supabase
          .from('attachments')
          .delete()
          .eq('record_type', 'announcement')
          .eq('record_id', id);

        if (attachmentDeleteError) throw attachmentDeleteError;
      }

      // Finally, delete the announcement
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
      console.error('Delete announcement error:', error);
    },
  });
};
```

### useSchoolTimezone.ts

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSchoolTimezone = () => {
  const [timezone, setTimezone] = useState<string>('America/New_York'); // Default fallback
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchSchoolTimezone = async () => {
      if (!userProfile?.school_id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('schools')
          .select('timezone')
          .eq('id', userProfile.school_id)
          .single();

        if (!error && data?.timezone) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        console.error('Error fetching school timezone:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolTimezone();
  }, [userProfile?.school_id]);

  return { timezone, isLoading };
};
```

---

## Utilities

### timezoneUtils.ts

```typescript
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Converts school-local date/time to UTC ISO string for database storage
 */
export const convertToUTC = (
  dateKey: string,
  timeHHmm: string,
  timezone: string,
  options?: { isAllDay?: boolean }
): string => {
  // For all-day events, use noon to avoid DST edge cases
  const time = options?.isAllDay ? '12:00' : timeHHmm;
  
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  const schoolDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const utcDate = fromZonedTime(schoolDate, timezone);
  
  return utcDate.toISOString();
};

/**
 * Converts UTC timestamp to school timezone for UI display
 */
export const convertToUI = (
  utc: string | Date | null,
  timezone: string,
  mode: 'time' | 'date' | 'datetime' | 'dateKey' = 'datetime'
): string => {
  if (!utc) return '-';
  
  const utcDate = typeof utc === 'string' ? new Date(utc) : utc;
  
  switch (mode) {
    case 'time':
      return formatInTimeZone(utcDate, timezone, 'HH:mm');
    case 'date':
      return formatInTimeZone(utcDate, timezone, 'MM/dd/yyyy');
    case 'dateKey':
      return formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd');
    case 'datetime':
      return formatInTimeZone(utcDate, timezone, 'MM/dd/yyyy HH:mm');
    default:
      return formatInTimeZone(utcDate, timezone, 'MM/dd/yyyy HH:mm');
  }
};

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];
```

---

## Edge Functions & CRON Jobs

### deactivate-expired-announcements/index.ts

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting expired announcements deactivation process...');

    const { data, error } = await supabase.rpc('deactivate_expired_announcements');

    if (error) {
      console.error('Error deactivating expired announcements:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Expired announcements deactivation completed:', data);

    return new Response(
      JSON.stringify({ success: true, ...data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### CRON Job Setup

Schedule the edge function to run daily at 8 AM:

```sql
SELECT cron.schedule(
  'deactivate-expired-announcements-8am',
  '0 8 * * *', -- At 8:00 AM every day
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/deactivate-expired-announcements',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  )$$
);
```

---

## Implementation Steps

### Step 1: Database Setup

1. Run the SQL migrations to create the `announcements` table and RLS policies
2. Create the `attachments` table if not already present
3. Add the `timezone` column to your `schools` table
4. Create the `deactivate_expired_announcements` database function
5. Set up the storage bucket for attachments

### Step 2: Install Dependencies

```bash
npm install react-quill dompurify @types/dompurify date-fns date-fns-tz embla-carousel-react
```

### Step 3: Create Utilities

1. Create `src/utils/timezoneUtils.ts`
2. Create `src/hooks/useSchoolTimezone.ts`

### Step 4: Create Hooks

1. Create `src/hooks/useAnnouncements.ts`
2. Create `src/hooks/attachments/types.ts`
3. Create `src/hooks/attachments/useAttachments.ts`

### Step 5: Create Components

1. Create `src/components/announcements/components/AnnouncementRichTextEditor.tsx`
2. Create `src/components/announcements/components/AnnouncementViewer.tsx`
3. Create `src/components/attachments/AttachmentSection.tsx`
4. Create `src/components/announcements/AnnouncementManagementPage.tsx`
5. Create `src/components/announcements/AnnouncementRecordPage.tsx`
6. Create `src/components/dashboard/widgets/AnnouncementsWidget.tsx`
7. Create `src/components/dashboard/widgets/AnnouncementAttachments.tsx`

### Step 6: Deploy Edge Function

```bash
supabase functions deploy deactivate-expired-announcements
```

### Step 7: Set Up CRON Job

Run the SQL to schedule the CRON job for automatic deactivation.

### Step 8: Configure Routes

Add routes in your router configuration:

```typescript
{ path: '/app/announcements', element: <AnnouncementManagementPage /> }
{ path: '/app/announcements/announcements_record', element: <AnnouncementRecordPage /> }
```

---

## Key Features

### 1. Rich Text Content
- Full WYSIWYG editor with formatting options
- HTML sanitization with DOMPurify for security
- Support for headers, lists, links, colors, and alignment

### 2. Priority System
- Three-tier priority (Low, Medium, High)
- Visual indicators with color-coded badges
- Sorted by priority in list views

### 3. Scheduling
- Publish date for delayed publishing
- Optional expiration date
- Automatic deactivation via CRON job

### 4. Attachments
- File upload with drag-and-drop support
- Multiple file support
- Automatic cleanup on announcement deletion

### 5. Dashboard Widget
- Auto-rotating carousel for multiple announcements
- Expandable content preview
- Quick view modal for full content

### 6. Mobile Responsive
- Card layout for mobile devices
- Table layout for desktop
- Responsive form layouts

### 7. Permission-Based Access
- Integrates with your permission system
- Separate permissions for create, edit, delete, view

### 8. Timezone Support
- All dates stored in UTC
- Displayed in school's local timezone
- Proper handling of DST edge cases

---

## CSS Additions

Add these styles for the rich text content display:

```css
/* Rich text content styling */
.rich-text-content h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
.rich-text-content h2 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; }
.rich-text-content h3 { font-size: 1.125rem; font-weight: bold; margin-bottom: 0.5rem; }
.rich-text-content ul { list-style-type: disc; padding-left: 1.5rem; }
.rich-text-content ol { list-style-type: decimal; padding-left: 1.5rem; }
.rich-text-content a { color: hsl(var(--primary)); text-decoration: underline; }
.rich-text-content p { margin-bottom: 0.5rem; }

/* Quill editor overrides */
.ql-container { min-height: 200px; }
.ql-editor { min-height: 200px; }
```

---

## Testing Checklist

- [ ] Create announcement with all fields
- [ ] Edit existing announcement
- [ ] Delete announcement (verify attachments are cleaned up)
- [ ] Verify priority sorting
- [ ] Test publish date scheduling
- [ ] Test expiration date auto-deactivation
- [ ] Upload and download attachments
- [ ] Verify dashboard widget displays correctly
- [ ] Test carousel functionality with multiple announcements
- [ ] Verify mobile responsiveness
- [ ] Test permission restrictions
- [ ] Verify timezone conversion accuracy
