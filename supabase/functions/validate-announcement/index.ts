
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Enhanced validation algorithm
const analyzeAnnouncementScore = (title: string, content: string, geminiResult: any): any => {
  try {
    // Extract gemini result if available
    const baseResult = geminiResult || {
      isValid: false,
      score: 0.5,
      issues: [],
      feedback: ""
    };
    
    // Define scoring factors
    const factors = {
      length: { weight: 0.15, score: 0 },
      clarity: { weight: 0.25, score: 0 },
      relevance: { weight: 0.20, score: 0 },
      engagement: { weight: 0.25, score: 0 },
      compliance: { weight: 0.15, score: 0 }
    };

    // Length factor - longer content tends to be more informative
    const titleWordCount = title.trim().split(/\s+/).length;
    const contentWordCount = content.trim().split(/\s+/).length;
    factors.length.score = Math.min(1, 
      ((titleWordCount >= 5 ? 1 : titleWordCount / 5) * 0.3) + 
      ((contentWordCount >= 50 ? 1 : contentWordCount / 50) * 0.7)
    );

    // Clarity factor - based on sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => 
      sum + s.trim().split(/\s+/).length, 0) / Math.max(1, sentences.length);
    
    // Optimal sentence length between 10-20 words
    factors.clarity.score = avgSentenceLength > 5 && avgSentenceLength < 25 ? 
      1 - Math.abs(15 - avgSentenceLength) / 15 : 0.5;

    // Relevance factor - presence of crypto-related terms
    const cryptoTerms = [
      "blockchain", "crypto", "token", "coin", "wallet", "defi", "nft", 
      "smart contract", "web3", "decentralized", "mining", "staking", "dao", 
      "exchange", "cryptocurrency", "bitcoin", "ethereum", "protocol", "chain"
    ];
    
    const contentLower = content.toLowerCase();
    const relevanceScore = cryptoTerms.reduce((score, term) => 
      contentLower.includes(term) ? score + 0.1 : score, 0);
    factors.relevance.score = Math.min(1, relevanceScore);

    // Engagement factor - presence of engaging elements
    const engagementPatterns = [
      {pattern: /\?/g, weight: 0.05}, // Questions 
      {pattern: /!/g, weight: 0.05},  // Exclamations
      {pattern: /join|participate|get|earn|learn|discover|explore|start|build/gi, weight: 0.1}, // Call-to-actions
      {pattern: /limited|exclusive|new|first|early|special|bonus|free|reward/gi, weight: 0.1}, // Incentives
      {pattern: /https?:\/\/[^\s]+/g, weight: 0.2}, // URLs
      {pattern: /@\w+/g, weight: 0.1}, // Mentions
      {pattern: /#\w+/g, weight: 0.1}, // Hashtags
    ];
    
    const engagementScore = engagementPatterns.reduce((score, pattern) => {
      const matches = (content.match(pattern.pattern) || []).length;
      return score + (Math.min(matches, 3) * pattern.weight);
    }, 0);
    factors.engagement.score = Math.min(1, engagementScore);

    // Compliance factor - absence of prohibited content
    const prohibitedPatterns = [
      {pattern: /scam|hack|steal|exploit|fake|fraudulent|illegal/gi, weight: -0.2},
      {pattern: /guaranteed profit|100% return|get rich quick|double your money/gi, weight: -0.3},
      {pattern: /password|seed phrase|private key|sensitive data/gi, weight: -0.3},
      {pattern: /porn|sex|explicit|nude|xxx/gi, weight: -0.5},
      {pattern: /hate|racist|nazi|terrorist|discrimination/gi, weight: -0.5},
    ];
    
    const complianceIssues = prohibitedPatterns.flatMap(pattern => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        factors.compliance.score += pattern.weight;
        return [`Contains prohibited term: "${matches[0]}"`];
      }
      return [];
    });
    
    // Start with perfect compliance and reduce if issues found
    factors.compliance.score = Math.max(0, 1 + factors.compliance.score);

    // Calculate weighted score
    const calculatedScore = Object.values(factors).reduce((total, factor) => 
      total + (factor.score * factor.weight), 0);
    
    // Generate descriptive feedback based on the scores
    let descriptiveFeedback = "";
    const scoreDescriptions = {
      excellent: "Your announcement is excellent! It's well-structured, engaging, and complies with all guidelines.",
      verygood: "Your announcement is very good. It effectively communicates your message while maintaining engagement.",
      good: "Your announcement is good. With a few improvements, it could be even more effective.",
      average: "Your announcement is acceptable but could benefit from some improvements.",
      belowaverage: "Your announcement needs improvement in several areas to be more effective.",
      poor: "Your announcement requires significant improvements to meet community standards."
    };
    
    // Determine feedback tier
    let feedbackTier;
    if (calculatedScore >= 0.9) feedbackTier = "excellent";
    else if (calculatedScore >= 0.8) feedbackTier = "verygood";
    else if (calculatedScore >= 0.7) feedbackTier = "good";
    else if (calculatedScore >= 0.6) feedbackTier = "average";
    else if (calculatedScore >= 0.5) feedbackTier = "belowaverage";
    else feedbackTier = "poor";
    
    descriptiveFeedback = scoreDescriptions[feedbackTier] + "\n\n";
    
    // Add specific feedback for each factor
    if (factors.length.score < 0.7) 
      descriptiveFeedback += "- Consider adding more detail to make your announcement more informative.\n";
    if (factors.clarity.score < 0.7)
      descriptiveFeedback += "- Try to use clearer sentence structures for better readability.\n";
    if (factors.relevance.score < 0.6)
      descriptiveFeedback += "- Include more crypto-specific terminology to increase relevance.\n";
    if (factors.engagement.score < 0.6)
      descriptiveFeedback += "- Add more engaging elements like questions, calls-to-action, or links.\n";
    if (factors.compliance.score < 1)
      descriptiveFeedback += "- Review and remove potentially problematic language flagged in the issues section.\n";
    
    // Combine calculated score with AI score and issues
    const finalScore = baseResult.score ? (baseResult.score * 0.7 + calculatedScore * 0.3) : calculatedScore;
    const allIssues = [...(baseResult.issues || []), ...complianceIssues];
    
    // Final feedback combines AI feedback with calculated feedback
    const finalFeedback = baseResult.feedback ? 
      `${baseResult.feedback}\n\n${descriptiveFeedback}` : 
      descriptiveFeedback;
    
    return {
      ...baseResult,
      score: finalScore,
      issues: allIssues,
      feedback: finalFeedback,
      factors: factors, // Include detailed scoring factors for transparency
    };
  } catch (error) {
    console.error("Error in analyzeAnnouncementScore:", error);
    return geminiResult || {
      isValid: title.length >= 10 && content.length >= 50,
      score: 0.6,
      issues: ["Could not perform complete score analysis"],
      feedback: "Score analysis encountered technical issues. Basic validation performed instead."
    };
  }
};

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
                  4. "feedback": detailed constructive feedback explaining your evaluation, including both strengths and areas for improvement`
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
      let parsedResult;
      try {
        // Try to extract JSON from the text (in case it's wrapped in markdown code blocks)
        const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                          textResponse.match(/```\n([\s\S]*?)\n```/) ||
                          textResponse.match(/{[\s\S]*?}/);
                          
        const jsonText = jsonMatch ? jsonMatch[0].replace(/```json\n|```\n|```/g, '') : textResponse;
        parsedResult = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        console.log("Raw content:", textResponse);
        
        // Provide a fallback response if parsing fails
        parsedResult = {
          isValid: title.trim().split(/\s+/).length >= 5 && content.trim().split(/\s+/).length >= 15,
          score: 0.7,
          issues: [],
          feedback: "Content appears valid based on basic checks. Advanced validation unavailable."
        };
      }
      
      // Apply enhanced scoring algorithm
      const enhancedResult = analyzeAnnouncementScore(title, content, parsedResult);
      
      return new Response(JSON.stringify(enhancedResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (geminiError) {
      console.error("Error calling Gemini API:", geminiError);
      
      // Fallback to algorithmic validation if Gemini call fails
      const algorithmicValidation = analyzeAnnouncementScore(title, content, null);
      
      return new Response(JSON.stringify(algorithmicValidation), {
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
