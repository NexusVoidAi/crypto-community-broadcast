
import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  suggestions: string[];
  score: number; // Changed from optional to required
  issues: string[]; // Changed from optional to required
  feedback?: string;
}

export const validateAnnouncement = async (title: string, content: string): Promise<ValidationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-announcement', {
      body: { title, content },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error validating announcement:', error);
    
    // Fallback to basic validation
    return {
      isValid: title.length >= 5 && content.length >= 20,
      suggestions: [
        'Make sure your title is clear and concise.',
        'Provide specific details in your content.',
        'Avoid excessive use of promotional language.',
        'Check for spelling and grammar errors.'
      ],
      score: 0.6, // Added default score
      issues: [] // Added default empty issues array
    };
  }
};

export const validateAnnouncementWithAI = async (title: string, content: string): Promise<ValidationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-announcement', {
      body: { title, content },
    });

    if (error) {
      throw error;
    }

    // Return the data with default values for missing properties
    return {
      isValid: data.isValid,
      suggestions: data.suggestions || [],
      score: data.score || 0.7,
      issues: data.issues || [],
      feedback: data.feedback || ''
    };
  } catch (error) {
    console.error('Error validating announcement with AI:', error);
    
    // Fallback to basic validation
    return {
      isValid: title.length >= 5 && content.length >= 20,
      score: 0.6,
      issues: ['Could not perform complete AI validation'],
      suggestions: [
        'Make sure your title is clear and concise.',
        'Provide specific details in your content.',
        'Avoid excessive use of promotional language.',
        'Check for spelling and grammar errors.'
      ]
    };
  }
};

export const serializeValidationResult = (result: ValidationResult): any => {
  // Convert any non-serializable data to a serializable format if needed
  return {
    ...result,
    // Add any conversions if necessary
  };
};

export const getSuggestions = (validationResult: ValidationResult): string[] => {
  if (validationResult.suggestions && validationResult.suggestions.length > 0) {
    return validationResult.suggestions;
  }
  
  if (validationResult.issues && validationResult.issues.length > 0) {
    return validationResult.issues.map(issue => `Fix issue: ${issue}`);
  }
  
  // Default suggestions if none are provided
  return [
    'Consider making your title more specific and targeted.',
    'Add more details to your content to engage your audience.',
    'Include a clear call to action in your announcement.',
    'Make sure your tone is appropriate for your target community.'
  ];
};

export const enhanceAnnouncementWithAI = async (title: string, content: string): Promise<{
  enhancedTitle: string;
  enhancedContent: string;
  improvements: string[];
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('enhance-announcement', {
      body: { title, content },
    });

    if (error) {
      throw error;
    }

    return {
      enhancedTitle: data.enhancedTitle || title,
      enhancedContent: data.enhancedContent || content,
      improvements: data.improvements || ['Content enhanced successfully']
    };
  } catch (error) {
    console.error('Error enhancing announcement with AI:', error);
    throw new Error('Failed to enhance announcement with AI. Please try again later.');
  }
};
