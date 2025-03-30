
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content } = await req.json();
    
    if (!title || !content) {
      throw new Error("Missing required parameters: title and content");
    }

    // OpenAI validation
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI validator for crypto announcements. Evaluate if the announcement follows community guidelines:
            1. No hate speech, discrimination, or offensive content
            2. No misleading claims or scams
            3. No explicit content
            4. No personal information
            5. Relevant to crypto/blockchain topics
            
            Respond with a JSON object containing:
            1. "isValid": boolean (true if passes all guidelines)
            2. "score": number between 0 and 1 indicating confidence
            3. "issues": array of strings with specific issues found (empty if none)
            4. "feedback": constructive feedback if issues found`
          },
          {
            role: "user",
            content: `Announcement Title: ${title}\n\nAnnouncement Content: ${content}`
          }
        ]
      })
    });

    const result = await response.json();
    
    // Check if we have a valid response with choices
    if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error("Invalid response from OpenAI:", result);
      throw new Error("Invalid response from OpenAI API");
    }
    
    let validationResult;
    try {
      validationResult = JSON.parse(result.choices[0].message.content);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw content:", result.choices[0].message.content);
      
      // Provide a fallback response if parsing fails
      validationResult = {
        isValid: title.length > 3 && content.length > 10, // Basic validation
        score: 0.7,
        issues: parseError.message ? [parseError.message] : [],
        feedback: "Content appears valid based on basic checks, but detailed validation failed."
      };
    }
    
    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in validate-announcement function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      isValid: false,
      score: 0,
      issues: ["Server error during validation"],
      feedback: "An error occurred during validation. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
