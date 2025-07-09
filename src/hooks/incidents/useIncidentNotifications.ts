import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useIncidentNotifications = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const sendNotification = useMutation({
    mutationFn: async ({ 
      incidentId, 
      templateId, 
      recipientEmail,
      incidentData 
    }: { 
      incidentId: string; 
      templateId: string; 
      recipientEmail: string;
      incidentData: any;
    }) => {
      // First get the template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('subject, body, name')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Process template variables by replacing placeholders with incident data
      const processTemplate = (text: string) => {
        let processed = text;
        
        // Replace incident variables
        if (incidentData.title) processed = processed.replace(/\{\{title\}\}/g, incidentData.title);
        if (incidentData.description) processed = processed.replace(/\{\{description\}\}/g, incidentData.description);
        if (incidentData.status) processed = processed.replace(/\{\{status\}\}/g, incidentData.status);
        if (incidentData.priority) processed = processed.replace(/\{\{priority\}\}/g, incidentData.priority);
        if (incidentData.category) processed = processed.replace(/\{\{category\}\}/g, incidentData.category);
        if (incidentData.incident_number) processed = processed.replace(/\{\{incident_number\}\}/g, incidentData.incident_number);
        
        // Replace submitted_by profile variables
        if (incidentData.submitted_by_profile) {
          const profile = incidentData.submitted_by_profile;
          processed = processed.replace(/\{\{submitted_by\.first_name\}\}/g, profile.first_name || '');
          processed = processed.replace(/\{\{submitted_by\.last_name\}\}/g, profile.last_name || '');
          processed = processed.replace(/\{\{submitted_by\.full_name\}\}/g, `${profile.first_name || ''} ${profile.last_name || ''}`.trim());
          processed = processed.replace(/\{\{submitted_by\.email\}\}/g, profile.email || '');
        }
        
        // Replace assigned_to profile variables
        if (incidentData.assigned_to_profile) {
          const profile = incidentData.assigned_to_profile;
          processed = processed.replace(/\{\{assigned_to\.first_name\}\}/g, profile.first_name || '');
          processed = processed.replace(/\{\{assigned_to\.last_name\}\}/g, profile.last_name || '');
          processed = processed.replace(/\{\{assigned_to\.full_name\}\}/g, `${profile.first_name || ''} ${profile.last_name || ''}`.trim());
          processed = processed.replace(/\{\{assigned_to\.email\}\}/g, profile.email || '');
        }
        
        // Replace dates
        if (incidentData.created_at) {
          const date = new Date(incidentData.created_at);
          processed = processed.replace(/\{\{created_at\}\}/g, date.toLocaleDateString());
        }
        if (incidentData.updated_at) {
          const date = new Date(incidentData.updated_at);
          processed = processed.replace(/\{\{updated_at\}\}/g, date.toLocaleDateString());
        }
        
        return processed;
      };

      const processedSubject = processTemplate(template.subject);
      const processedBody = processTemplate(template.body);

      // Queue the email
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          template_id: templateId,
          recipient_email: recipientEmail,
          subject: processedSubject,
          body: processedBody,
          record_id: incidentId,
          source_table: 'incidents',
          school_id: userProfile?.school_id,
          scheduled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Notification sent",
        description: "The notification email has been queued for delivery.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification.",
        variant: "destructive",
      });
    },
  });

  return {
    sendNotification: sendNotification.mutate,
    isSending: sendNotification.isPending,
  };
};