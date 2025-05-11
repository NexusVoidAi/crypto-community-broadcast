
import { theme, getStatusColor, getTagColor } from '../theme';
import { cn } from '@/lib/utils';

/**
 * Utility functions to work with the NexusVoid theme system
 */

// Helper to get status color classes for components like badges
export const getStatusColorClass = (status: string): string => {
  const colorSet = getStatusColor(status.toUpperCase());
  return cn(
    `bg-${colorSet.bg} text-${colorSet.text} border-${colorSet.border}`
  );
};

// Generate classes for status badges with Tailwind
export const getStatusBadgeClass = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'PUBLISHED':
    case 'PAID':
      return 'bg-green-500/15 text-green-400 border border-green-500/25 font-semibold';
    case 'PENDING':
    case 'PENDING_VALIDATION':
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 font-semibold';
    case 'REJECTED':
    case 'VALIDATION_FAILED':
    case 'FAILED':
      return 'bg-red-500/15 text-red-400 border border-red-500/25 font-semibold';
    case 'DRAFT':
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/25 font-semibold';
    default:
      return 'bg-gray-500/15 text-gray-400 border border-gray-500/25 font-semibold';
  }
};

// Get platform-specific colors
export const getPlatformColorClass = (platform: string): string => {
  switch (platform.toUpperCase()) {
    case 'TELEGRAM':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/25 font-medium';
    case 'DISCORD':
      return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25 font-medium';
    case 'WHATSAPP':
      return 'bg-green-500/15 text-green-400 border-green-500/25 font-medium';
    default:
      return 'bg-gray-500/15 text-gray-300 border-gray-500/25 font-medium';
  }
};

// Get CSS gradient string from theme
export const getGradient = (gradientName: keyof typeof theme.gradients): string => {
  return theme.gradients[gradientName] || theme.gradients.mainBackground;
};

// Generate card style with gradient background
export const getCardStyle = (variant: 'default' | 'accent' | 'elevated' = 'default'): string => {
  switch (variant) {
    case 'accent':
      return 'bg-gradient-to-br from-nexus-background-secondary/70 to-nexus-background-tertiary/80 backdrop-blur-md border border-nexus-border-accent/20 shadow-lg';
    case 'elevated':
      return 'bg-gradient-to-br from-nexus-background-secondary/60 to-nexus-background-tertiary/70 backdrop-blur-md border border-nexus-border-primary/20 shadow-xl';
    default:
      return 'bg-gradient-to-br from-nexus-background-card to-nexus-background-secondary/60 backdrop-blur-md border border-nexus-border-subtle shadow-md';
  }
};

export default {
  theme,
  getStatusColorClass,
  getStatusBadgeClass,
  getPlatformColorClass,
  getGradient,
  getCardStyle
};
