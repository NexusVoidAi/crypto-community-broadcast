
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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
    const { title, content } = await req.json();
    
    if (!title && !content) {
      throw new Error('Title or content is required');
    }

    console.log('Enhancing announcement with Gemini:', { title, content });

    const prompt = `You are an expert copywriter specializing in crypto and blockchain announcements.
    
    ${title ? `Here is a title that needs improvement: "${title}"` : ''}
    ${content ? `Here is content that needs improvement: "${content}"` : ''}
    
    Please enhance the ${title && content ? 'title and content' : title ? 'title' : 'content'} to make it more engaging, professional, and impactful for a crypto audience. 
    
    Maintain the same general meaning and key information, but improve the writing quality, clarity, and persuasiveness.
    
    Respond in the following JSON format ONLY:
    {
      ${title ? '"improved_title": "The improved title",' : ''}
      ${content ? '"improved_content": "The improved content"' : ''}
    }`;

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error('No valid response from Gemini API');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    console.log('Raw Gemini response:', textResponse);
    
    // Extract JSON from the response
    let jsonMatch;
    try {
      // First try to parse the whole response as JSON
      const enhancedContent = JSON.parse(textResponse);
      return new Response(JSON.stringify(enhancedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      // If that fails, try to extract JSON from the text
      jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[0];
          const enhancedContent = JSON.parse(jsonStr);
          return new Response(JSON.stringify(enhancedContent), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
        }
      }
    }

    // If all parsing failed, return a fallback response
    const fallbackResponse = {
      improved_title: title || undefined,
      improved_content: content || undefined,
      error: "Could not properly extract enhanced content"
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhance-announcement function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
