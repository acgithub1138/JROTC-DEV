
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EmailPreviewData {
  subject: string;
  body: string;
  processedSubject: string;
  processedBody: string;
}

export const useEmailPreview = (subject: string, body: string, recordData: any) => {
  return useQuery({
    queryKey: ['email-preview', subject, body, recordData],
    queryFn: async (): Promise<EmailPreviewData> => {
      if (!recordData || (!subject && !body)) {
        return {
          subject,
          body,
          processedSubject: subject,
          processedBody: body,
        };
      }

      // Process subject
      const { data: processedSubject, error: subjectError } = await supabase
        .rpc('process_email_template', {
          template_content: subject,
          record_data: recordData,
        });

      if (subjectError) throw subjectError;

      // Process body
      const { data: processedBody, error: bodyError } = await supabase
        .rpc('process_email_template', {
          template_content: body,
          record_data: recordData,
        });

      if (bodyError) throw bodyError;

      return {
        subject,
        body,
        processedSubject: processedSubject || subject,
        processedBody: processedBody || body,
      };
    },
    enabled: !!recordData && (!!subject || !!body),
  });
};
