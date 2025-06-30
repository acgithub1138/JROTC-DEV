
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { QueueProcessor } from './queue-processor.ts';
import { ProcessingResult } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const processor = new QueueProcessor();

    // Get pending emails from queue
    const queueItems = await processor.getQueueItems();
    console.log(`Processing ${queueItems.length} emails from queue`);

    // Get global SMTP settings
    const globalSmtpSettings = await processor.getGlobalSmtpSettings();

    if (!globalSmtpSettings) {
      console.log('No active global SMTP settings found, cannot process emails');
      
      if (queueItems.length > 0) {
        await processor.handleNoSmtpSettings(queueItems);
      }

      const result: ProcessingResult = {
        success: false,
        error: 'No active global SMTP settings configured',
        processed: 0,
        failed: queueItems.length,
        total: queueItems.length
      };

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Process emails using global SMTP settings
    const { processed, failed } = await processor.processEmails(queueItems, globalSmtpSettings);

    const result: ProcessingResult = {
      success: true,
      processed,
      failed,
      total: queueItems.length
    };

    console.log('Email processing completed:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in process-email-queue function:', error);
    
    const result: ProcessingResult = {
      success: false,
      error: error.message || 'Unknown error occurred',
      processed: 0,
      failed: 0,
      total: 0
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});
