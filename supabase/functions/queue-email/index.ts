import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueEmailRequest {
  templateId: string;
  recipientEmail: string;
  sourceTable: string;
  recordId: string;
  schoolId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing email queue request...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { templateId, recipientEmail, sourceTable, recordId, schoolId }: QueueEmailRequest = await req.json();

    console.log('Queue email request:', { templateId, recipientEmail, sourceTable, recordId, schoolId });

    // Call the queue_email database function
    const { data, error } = await supabase.rpc('queue_email', {
      template_id_param: templateId,
      recipient_email_param: recipientEmail,
      source_table_param: sourceTable,
      record_id_param: recordId,
      school_id_param: schoolId
    });

    if (error) {
      console.error('Error queuing email:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Email queued successfully with ID:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        queueId: data,
        message: 'Email queued successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in queue-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);