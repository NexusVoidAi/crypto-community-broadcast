
import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  suggestions: string[];
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
      ]
    };
  }
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

    return data;
  } catch (error) {
    console.error('Error enhancing announcement with AI:', error);
    throw new Error('Failed to enhance announcement with AI. Please try again later.');
  }
};
