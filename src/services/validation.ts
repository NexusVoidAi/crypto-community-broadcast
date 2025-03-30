
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  feedback?: string;
}

export const validateAnnouncementWithAI = async (
  title: string,
  content: string
): Promise<ValidationResult> => {
  try {
    // Call Gemini validation edge function
    const { data, error } = await supabase.functions.invoke("validate-announcement", {
      body: { title, content },
    });

    if (error) throw error;
    
    return data as ValidationResult;
  } catch (error) {
    console.error("Error validating announcement:", error);
    // Return a default validation result in case of error
    return {
      isValid: false,
      score: 0,
      issues: ["Failed to validate the announcement. Please try again later."],
      feedback: "An error occurred during validation. Please try again."
    };
  }
}

export const enhanceAnnouncementWithAI = async (
  title?: string,
  content?: string
): Promise<{ improved_title?: string, improved_content?: string, error?: string }> => {
  try {
    // Call Gemini enhancement edge function
    const { data, error } = await supabase.functions.invoke("enhance-announcement", {
      body: { title, content },
    });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error enhancing announcement:", error);
    return {
      improved_title: title,
      improved_content: content,
      error: "Failed to enhance the announcement. Please try again later."
    };
  }
}

// This function ensures the validation result is compatible with Json type
export const serializeValidationResult = (result: ValidationResult): Json => {
  // Convert the ValidationResult object to a plain object that's compatible with Json
  return {
    isValid: result.isValid,
    score: result.score,
    issues: result.issues,
    feedback: result.feedback
  } as unknown as Json;
}

export const getSuggestions = (validationResult: ValidationResult): string[] => {
  const suggestions: string[] = [];
  
  // Extract suggestions from the feedback
  if (validationResult.feedback) {
    // Split feedback by sentences and filter for actionable suggestions
    const sentences = validationResult.feedback.split('.');
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (
        trimmed.includes('suggest') || 
        trimmed.includes('consider') || 
        trimmed.includes('try') ||
        trimmed.includes('add') ||
        trimmed.includes('improve')
      ) {
        suggestions.push(trimmed);
      }
    });
  }
  
  // Add general suggestions based on score
  if (validationResult.score < 0.7 && validationResult.issues.length > 0) {
    suggestions.push("Address the issues mentioned above to improve your announcement");
  }
  
  // If no specific suggestions were found, add generic ones
  if (suggestions.length === 0) {
    if (validationResult.isValid) {
      suggestions.push("Your announcement is good to go, but you can always refine the messaging");
      suggestions.push("Consider adding more specific details about benefits or features");
      suggestions.push("Make sure your call-to-action is clear and compelling");
    } else {
      validationResult.issues.forEach(issue => {
        suggestions.push(`Fix issue: ${issue}`);
      });
    }
  }
  
  return suggestions;
}
