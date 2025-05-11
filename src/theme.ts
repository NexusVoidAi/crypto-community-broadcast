
/**
 * NexusVoid Theme System
 * 
 * This file centralizes design tokens used across the application.
 * Import from this file rather than hardcoding values.
 */

export const theme = {
  colors: {
    // Background colors
    background: {
      primary: '#01000E',
      secondary: '#1A1F2C',
      tertiary: '#2A2A3F',
      card: 'rgba(26, 31, 44, 0.5)',
    },
    
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: '#F6F6F7', // Soft off-white
      muted: 'rgba(255, 255, 255, 0.7)',
      subtle: 'rgba(255, 255, 255, 0.5)',
    },
    
    // Brand colors
    brand: {
      teal: '#008B8B',     // crypto-teal
      green: '#14F195',    // crypto-green
      blue: '#3671E9',     // crypto-blue
      violet: '#9945FF',   // crypto-violet
    },
    
    // Border colors
    border: {
      primary: '#312442',
      subtle: 'rgba(255, 255, 255, 0.1)',
      accent: '#5F299B',
    },
    
    // Status colors
    status: {
      success: '#14F195',
      warning: '#FFB800',
      error: '#FF5252',
      info: '#3671E9',
    },
    
    // Tag/Badge colors
    tags: {
      blue: { bg: 'rgba(54, 113, 233, 0.15)', text: '#3671E9', border: 'rgba(54, 113, 233, 0.25)' },
      green: { bg: 'rgba(0, 139, 139, 0.15)', text: '#00B8B8', border: 'rgba(0, 139, 139, 0.25)' },
      purple: { bg: 'rgba(153, 69, 255, 0.15)', text: '#A455FF', border: 'rgba(153, 69, 255, 0.25)' },
      yellow: { bg: 'rgba(255, 184, 0, 0.15)', text: '#FFB800', border: 'rgba(255, 184, 0, 0.25)' },
      red: { bg: 'rgba(255, 82, 82, 0.15)', text: '#FF5252', border: 'rgba(255, 82, 82, 0.25)' },
    }
  },
  
  // Gradient definitions
  gradients: {
    mainBackground: 'linear-gradient(to bottom, #350081, #01000E)',
    gradient1: 'linear-gradient(90deg, #FABE5C, #C97B75, #892BE1)',
    gradient2: 'linear-gradient(90deg, #341D63, #5F299B, #892BE1)',
    gradient3: 'linear-gradient(90deg, #010002, #1A113E, #4C1C6A)',
    cardGradient: 'linear-gradient(180deg, rgba(26, 31, 44, 0.6), rgba(12, 15, 25, 0.8))',
    buttonGradient: 'linear-gradient(90deg, #9945FF, #14F195)',
    accentGradient: 'linear-gradient(90deg, #14F195, #3671E9)',
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: 'Space Grotesk, sans-serif',
      secondary: 'Inter, sans-serif',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Spacing system
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
  },
  
  // Border radius
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
    glow: '0 0 15px rgba(20, 241, 149, 0.5), 0 0 30px rgba(20, 241, 149, 0.2)',
    blueGlow: '0 0 15px rgba(54, 113, 233, 0.5), 0 0 30px rgba(54, 113, 233, 0.2)',
    purpleGlow: '0 0 15px rgba(153, 69, 255, 0.5), 0 0 30px rgba(153, 69, 255, 0.2)',
  },
};

// Include console logs for debugging theme application
if (process.env.NODE_ENV === 'development') {
  console.log('NexusVoid Theme loaded:', theme);
}

// Helper functions for working with the theme
export const getTagColor = (type: keyof typeof theme.colors.tags) => {
  return theme.colors.tags[type] || theme.colors.tags.blue;
};

export const getStatusColor = (status: string) => {
  const statusMap: Record<string, keyof typeof theme.colors.tags> = {
    'ACTIVE': 'green',
    'PUBLISHED': 'green',
    'PENDING': 'yellow',
    'PENDING_VALIDATION': 'yellow',
    'REJECTED': 'red',
    'VALIDATION_FAILED': 'red',
    'DRAFT': 'blue',
    'PAID': 'green',
    'FAILED': 'red',
  };
  
  const colorKey = statusMap[status] || 'blue';
  return theme.colors.tags[colorKey];
};

export default theme;
