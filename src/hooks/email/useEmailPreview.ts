
import { useQuery } from '@tanstack/react-query';
import { processTemplate } from '@/utils/templateProcessor';

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

      // Process templates using client-side processing
      const processedSubject = processTemplate(subject, recordData);
      const processedBody = processTemplate(body, recordData);

      return {
        subject,
        body,
        processedSubject,
        processedBody,
      };
    },
    enabled: !!recordData && (!!subject || !!body),
  });
};
