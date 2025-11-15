import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText } = await req.json();
    
    if (!pdfText) {
      return new Response(
        JSON.stringify({ error: 'PDF text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Generating fields from PDF text...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing score sheet forms and converting them into structured JSON field definitions. 
            
Your task is to analyze the provided PDF text from a score sheet form and generate a JSON structure that defines the fields.

Each field should have:
- "name": The field label or question text
- "type": One of "number", "text", "dropdown", "section_header", "label", "penalty"
- "id": A unique identifier (use snake_case based on the name)

For number fields, include:
- "maxPoints": The maximum points possible (if specified)

For text fields, include:
- "maxLength": 500 for long text areas, 100 for short text inputs

For dropdown fields, include:
- "options": Array of dropdown options

For penalty fields, include:
- "penaltyType": "points", "minor_major", or "custom"
- "pointValue": The penalty point value (if applicable)

For section headers:
- Use these to organize sections of the form

Return ONLY a valid JSON object with a "criteria" array containing the field definitions. Do not include any explanatory text before or after the JSON.`
          },
          {
            role: "user",
            content: `Please analyze this score sheet form text and generate the field definitions:\n\n${pdfText}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    console.log('Generated content:', generatedContent);

    // Parse the JSON from the AI response
    let fieldsJson;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      fieldsJson = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI response was:', generatedContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI-generated fields. The AI response was not valid JSON.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated fields:', fieldsJson);

    return new Response(
      JSON.stringify({ fields: fieldsJson }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-fields-from-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});