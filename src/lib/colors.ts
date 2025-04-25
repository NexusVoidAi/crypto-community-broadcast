
// Central color management for the entire application

// Base colors
export const colors = {
  // Background and surfaces
  background: '#FFFFFF',
  
  // Text colors
  text: {
    primary: '#222222',
    secondary: '#403E43',
    muted: '#9F9EA1',
  },
  
  // Neon accent colors
  neon: {
    blue: '#00FFFF',
    purple: '#BD00FF',
    pink: '#FF00FF',
    green: '#39FF14',
  },
  
  // UI element colors
  border: '#E9E9EC',
  card: {
    background: 'rgba(255, 255, 255, 0.75)',
  },
  
  // Status colors
  status: {
    success: '#00C853',
    warning: '#FFA000',
    error: '#FF3D00',
    info: '#0091EA',
  },
};

// Helper function to create a neon gradient
export const createNeonGradient = (
  direction: 'to-r' | 'to-br' | 'to-b' | 'radial' = 'to-r'
) => {
  if (direction === 'radial') {
    return `bg-gradient-radial from-${colors.neon.blue} via-${colors.neon.purple} to-${colors.neon.pink}`;
  }
  return `bg-gradient-${direction} from-${colors.neon.blue} via-${colors.neon.purple} to-${colors.neon.pink}`;
};

// Helper for creating glassmorphism effect
export const glassmorphism = {
  light: 'bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg',
  medium: 'bg-white/75 backdrop-blur-xl border border-white/30 shadow-lg',
  strong: 'bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl',
};

// The unified theme object that can be used across the application
export const theme = {
  colors,
  glassmorphism,
};

export default theme;
