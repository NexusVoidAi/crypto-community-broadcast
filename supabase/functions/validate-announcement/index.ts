
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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

    try {
      // Gemini validation
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an AI validator for crypto announcements. Evaluate if the following announcement follows community guidelines:
                  1. No hate speech, discrimination, or offensive content
                  2. No misleading claims or scams
                  3. No explicit content
                  4. No personal information
                  5. Relevant to crypto/blockchain topics
                  
                  Announcement Title: ${title}
                  Announcement Content: ${content}
                  
                  Respond with a JSON object containing:
                  1. "isValid": boolean (true if passes all guidelines)
                  2. "score": number between 0 and 1 indicating confidence
                  3. "issues": array of strings with specific issues found (empty if none)
                  4. "feedback": constructive feedback if issues found`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          }
        })
      });

      const geminiResult = await response.json();
      console.log("Gemini API response:", JSON.stringify(geminiResult, null, 2));
      
      // Check for API errors
      if (geminiResult.error) {
        console.error("Gemini API error:", geminiResult.error);
        throw new Error("Gemini API error: " + geminiResult.error.message);
      }
      
      // Extract the text content from the Gemini response
      if (!geminiResult.candidates || geminiResult.candidates.length === 0 || !geminiResult.candidates[0].content) {
        throw new Error("Invalid response format from Gemini API");
      }
      
      const textResponse = geminiResult.candidates[0].content.parts[0].text;
      
      // Parse the JSON response from the text
      let validationResult;
      try {
        // Try to extract JSON from the text (in case it's wrapped in markdown code blocks)
        const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                          textResponse.match(/```\n([\s\S]*?)\n```/) ||
                          textResponse.match(/{[\s\S]*?}/);
                          
        const jsonText = jsonMatch ? jsonMatch[0].replace(/```json\n|```\n|```/g, '') : textResponse;
        validationResult = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        console.log("Raw content:", textResponse);
        
        // Provide a fallback response if parsing fails
        validationResult = {
          isValid: title.length > 3 && content.length > 10, // Basic validation
          score: 0.7,
          issues: [],
          feedback: "Content appears valid based on basic checks. Advanced validation unavailable."
        };
      }
      
      return new Response(JSON.stringify(validationResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (geminiError) {
      console.error("Error calling Gemini API:", geminiError);
      
      // Fallback to basic validation if Gemini call fails
      const basicValidation = {
        isValid: true,  // Allow the content to pass in fallback mode
        score: 0.75,
        issues: [],
        feedback: "Basic validation passed. Advanced validation service currently unavailable."
      };
      
      return new Response(JSON.stringify(basicValidation), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
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
