
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const requestData = await req.json();
    const { title, content } = requestData;

    if (!title || !content) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: title and content are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Enhancing announcement with AI:", { title, content });

    const prompt = `
    You are an expert marketing specialist who helps improve crypto announcements.
    Please enhance the following announcement to make it more engaging, professional, and effective.
    Focus on improving clarity, adding relevant details, and making it more compelling.
    
    Original Title: ${title}
    Original Content: ${content}
    
    Return your response in JSON format with the following structure:
    {
      "enhancedTitle": "improved title here",
      "enhancedContent": "improved content here",
      "improvements": ["list of specific improvements made"]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Generated response:", text);

    // Extract JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const jsonResponse = JSON.parse(jsonMatch[0]);
    
    return new Response(JSON.stringify({
      enhancedTitle: jsonResponse.enhancedTitle,
      enhancedContent: jsonResponse.enhancedContent,
      improvements: jsonResponse.improvements
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error enhancing announcement:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to enhance announcement",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
