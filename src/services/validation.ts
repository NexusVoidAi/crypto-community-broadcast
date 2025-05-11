import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  suggestions: string[];
  score: number;
  issues: string[];
  feedback?: string;
  factors?: {
    length: { weight: number, score: number },
    clarity: { weight: number, score: number },
    relevance: { weight: number, score: number },
    engagement: { weight: number, score: number },
    compliance: { weight: number, score: number }
  };
}

const bannedKeywords = [
  'airdrop', 'pump', '100x', 'moon', 'shitcoin', 'scam', 'vulgar',
  'porn', 'nude', 'hate', 'nazi', 'kill', 'rape', 'rekt',
  'buy now', 'limited supply', 'guaranteed returns', 'whitelist', 'presale', 'pump', 'rug pull', 'scam', 'airdrops', 'shitcoin', 'moonshot',
  'nsfw', 'xxx', 'porn', 'vulgar', 'nazi', 'kill', 'hate', 'slur',
  'offensive', 'token giveaway', 'free crypto', 'buy now', 'whale',
  'rekt', 'ape in', 'degenerate'
];

const hasBannedKeywords = (text: string): boolean => {
  const lcText = text.toLowerCase();
  return bannedKeywords.some(keyword => lcText.includes(keyword));
};

const basicValidationCheck = (title: string, content: string): ValidationResult => {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (title.trim().length < 10) {
    issues.push('Title is too short or vague');
    suggestions.push('Make your title more descriptive and specific.');
  }

  if (content.trim().length < 50) {
    issues.push('Content is too short');
    suggestions.push('Provide more context and useful details in your announcement.');
  }

  if (hasBannedKeywords(title) || hasBannedKeywords(content)) {
    issues.push('Contains inappropriate or banned promotional content');
    suggestions.push('Remove misleading, vulgar, or inappropriate language.');
  }

  return {
    isValid: issues.length === 0,
    suggestions,
    issues,
    score: issues.length === 0 ? 0.8 : 0.4,
    feedback: issues.length > 0 ? 'Your announcement needs revision based on content policy.' : 'Looks good!',
    factors: {
      length: { weight: 0.2, score: content.length > 100 ? 1 : 0.5 },
      clarity: { weight: 0.2, score: title.length > 15 ? 1 : 0.6 },
      relevance: { weight: 0.2, score: hasBannedKeywords(content) ? 0.3 : 0.9 },
      engagement: { weight: 0.2, score: content.includes('join') ? 1 : 0.5 },
      compliance: { weight: 0.2, score: hasBannedKeywords(content) ? 0.1 : 1 },
    }
  };
};

export const validateAnnouncement = async (title: string, content: string): Promise<ValidationResult> => {
  try {
    // First perform local basic validation to catch obvious issues
    const basicResults = basicValidationCheck(title, content);
    
    // If basic validation fails, return those results immediately without calling the serverless function
    if (!basicResults.isValid) {
      return basicResults;
    }
    
    // If basic validation passes, proceed with more advanced validation through Supabase function
    const { data, error } = await supabase.functions.invoke('validate-announcement', {
      body: { title, content },
    });

    if (error) {
      console.error('Validation function error:', error);
      throw error;
    }

    return {
      isValid: data.isValid,
      suggestions: data.suggestions || [],
      score: data.score || 0.6,
      issues: data.issues || [],
      feedback: data.feedback,
      factors: data.factors
    };
  } catch (error) {
    console.error('Error validating announcement:', error);
    
    // Fallback to basic validation
    return basicValidationCheck(title, content);
  }
};

export const validateAnnouncementWithAI = async (title: string, content: string): Promise<ValidationResult> => {
  try {
    // First check with basic validation
    const basicResults = basicValidationCheck(title, content);
    
    // If basic validation fails, return those results immediately
    if (!basicResults.isValid) {
      return basicResults;
    }
    
    // Otherwise proceed with AI validation
    const { data, error } = await supabase.functions.invoke('validate-announcement', {
      body: { title, content },
    });

    if (error) {
      console.error('AI Validation function error:', error);
      throw error;
    }

    // Return the data with default values for missing properties
    return {
      isValid: data.isValid,
      suggestions: data.suggestions || [],
      score: data.score || 0.7,
      issues: data.issues || [],
      feedback: data.feedback || '',
      factors: data.factors
    };
  } catch (error) {
    console.error('Error validating announcement with AI:', error);
    
    // Fallback to basic validation
    return basicValidationCheck(title, content);
  }
};

export const serializeValidationResult = (result: ValidationResult): any => {
  // Ensure the validation result is serializable for storing in Supabase
  return {
    isValid: result.isValid,
    suggestions: result.suggestions || [],
    score: result.score || 0,
    issues: result.issues || [],
    feedback: result.feedback || '',
    factors: result.factors || null,
  };
};

export const getSuggestions = (validationResult: ValidationResult): string[] => {
  if (validationResult.suggestions && validationResult.suggestions.length > 0) {
    return validationResult.suggestions;
  }
  
  if (validationResult.issues && validationResult.issues.length > 0) {
    return validationResult.issues.map(issue => `Fix issue: ${issue}`);
  }
  
  // Generate suggestions based on factors if available
  if (validationResult.factors) {
    const factorSuggestions = [];
    const { length, clarity, relevance, engagement, compliance } = validationResult.factors;
    
    if (length.score < 0.7) {
      factorSuggestions.push('Add more detail to your announcement to make it more informative.');
    }
    
    if (clarity.score < 0.7) {
      factorSuggestions.push('Improve readability by using clearer sentence structures.');
    }
    
    if (relevance.score < 0.6) {
      factorSuggestions.push('Include more crypto-specific terminology to increase relevance.');
    }
    
    if (engagement.score < 0.6) {
      factorSuggestions.push('Add engaging elements like questions, calls-to-action, or links.');
    }
    
    if (compliance.score < 1) {
      factorSuggestions.push('Review your content for potentially problematic language.');
    }
    
    if (factorSuggestions.length > 0) {
      return factorSuggestions;
    }
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
      console.error('AI Enhancement function error:', error);
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
