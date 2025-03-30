
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
    // Call OpenAI validation edge function
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
