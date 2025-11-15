import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert at analyzing PDF score sheets and converting them to structured JSON templates for competition scoring systems.

FIELD TYPES YOU CAN USE:
1. section_header - Bold headers that divide the form into sections
2. number - Numeric input fields with maxValue (for scoring criteria)
3. text - Text input (use textType: 'short' or 'notes')
4. dropdown - Selection from predefined values
5. penalty - Penalty fields with specific penalty types
6. scoring_scale - Fields with poor/average/exceptional ranges
7. label - Informational text only
8. bold_gray - Bold label with gray background
9. calculated - Auto-calculated fields (sum or subtotal)
10. pause - Pause field for spacing

FIELD STRUCTURE:
{
  "id": "unique_snake_case_id",
  "name": "Field Display Name",
  "type": "field_type",
  "fieldInfo": "Optional description from PDF",
  "pauseField": false,
  "penalty": false, // true only for penalty type fields
  "maxValue": 100, // for number fields
  "penaltyType": "points" | "minor_major" | "split", // for penalty fields
  "pointValue": -10, // penalty amount for points type
  "splitFirstValue": -5, // for split penalty first occurrence
  "splitSubsequentValue": -25, // for split penalty 2+ occurrences
  "scaleRanges": { // for scoring_scale type
    "poor": { "min": 1, "max": 3 },
    "average": { "min": 4, "max": 12 },
    "exceptional": { "min": 13, "max": 15 }
  }
}

EXAMPLE TEMPLATE (Air Force - Armed Exhibition):
{
  "criteria": [
    {
      "name": "Performance Overview",
      "type": "section_header",
      "pauseField": false,
      "penalty": false
    },
    {
      "name": "1. REPORT IN & REPORT OUT",
      "type": "number",
      "maxValue": 15,
      "fieldInfo": "Verbal report in/out; all movements to enter/exit floor",
      "pauseField": false,
      "penalty": false
    },
    {
      "name": "2. Team/Cadet APPEARANCE",
      "type": "number",
      "maxValue": 15,
      "fieldInfo": "Uniform / overall preparation & presentation",
      "pauseField": false,
      "penalty": false
    },
    {
      "name": "Penalties",
      "type": "section_header",
      "pauseField": false,
      "penalty": false
    },
    {
      "name": "Boundary Violations",
      "type": "penalty",
      "penaltyType": "points",
      "pointValue": -10,
      "fieldInfo": "",
      "pauseField": false,
      "penalty": true
    },
    {
      "name": "Dropped weapons",
      "type": "penalty",
      "penaltyType": "split",
      "pointValue": -25,
      "fieldInfo": "",
      "pauseField": false,
      "penalty": true
    },
    {
      "name": "Seconds over/under time",
      "type": "penalty",
      "penaltyType": "points",
      "pointValue": -1,
      "fieldInfo": "(Min: 6 minutes - Max: 9 Minutes)",
      "pauseField": false,
      "penalty": true
    }
  ]
}

MAPPING RULES:
1. Table headers or section titles → section_header type
2. Scoring criteria with max points → number type with maxValue
3. Look for Poor/Average/Exceptional ranges → use scoring_scale type with scaleRanges
4. Penalty sections:
   - "@ X points each" or "X points per" → penaltyType: "points", pointValue: -X
   - "1 Drop at 5Pts. / 2+ Drops 25 pts" or similar → penaltyType: "split", splitFirstValue: -5, splitSubsequentValue: -25
   - "Minor/Major" penalties → penaltyType: "minor_major"
5. Notes/descriptions column → add to fieldInfo
6. Generate unique IDs using snake_case from the field name
7. Maintain the order from the PDF
8. Set penalty: true ONLY for penalty type fields
9. Set pauseField: false for all fields (legacy compatibility)

CRITICAL:
- ALL fields must have pauseField: false
- ALL fields must have penalty: false EXCEPT penalty type fields which must have penalty: true
- For number fields with Poor/Average/Exceptional ranges, use scoring_scale type instead
- Penalty amounts must be negative numbers
- Return ONLY valid JSON, no markdown or explanations`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText } = await req.json();

    if (!pdfText || pdfText.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PDF text is empty or could not be extracted' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'AI service not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Truncate to 500k characters as requested
    const truncatedText = pdfText.slice(0, 500000);

    console.log('Calling Lovable AI with text length:', truncatedText.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this score sheet and generate a template:\n\n${truncatedText}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_template',
            description: 'Generate score sheet template from PDF',
            parameters: {
              type: 'object',
              properties: {
                criteria: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      fieldInfo: { type: 'string' },
                      pauseField: { type: 'boolean' },
                      penalty: { type: 'boolean' },
                      maxValue: { type: 'number' },
                      penaltyType: { type: 'string' },
                      pointValue: { type: 'number' },
                      splitFirstValue: { type: 'number' },
                      splitSubsequentValue: { type: 'number' },
                      scaleRanges: {
                        type: 'object',
                        properties: {
                          poor: {
                            type: 'object',
                            properties: {
                              min: { type: 'number' },
                              max: { type: 'number' }
                            }
                          },
                          average: {
                            type: 'object',
                            properties: {
                              min: { type: 'number' },
                              max: { type: 'number' }
                            }
                          },
                          exceptional: {
                            type: 'object',
                            properties: {
                              min: { type: 'number' },
                              max: { type: 'number' }
                            }
                          }
                        }
                      }
                    },
                    required: ['name', 'type', 'pauseField', 'penalty']
                  }
                }
              },
              required: ['criteria']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_template' } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'AI service is busy. Please try again in a moment.' 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'AI credits depleted. Please add credits to your workspace.' 
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'AI service error. Please try again.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate template. Please try again.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const template = JSON.parse(toolCall.function.arguments);
    
    console.log('Generated template with', template.criteria?.length || 0, 'fields');

    return new Response(
      JSON.stringify({ 
        success: true, 
        template 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-template-from-pdf:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
