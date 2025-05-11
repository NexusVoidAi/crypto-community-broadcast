
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
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'PENDING':
    case 'PENDING_VALIDATION':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'REJECTED':
    case 'VALIDATION_FAILED':
    case 'FAILED':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'DRAFT':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

// Get platform-specific colors
export const getPlatformColorClass = (platform: string): string => {
  switch (platform.toUpperCase()) {
    case 'TELEGRAM':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'DISCORD':
      return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    case 'WHATSAPP':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export default {
  theme,
  getStatusColorClass,
  getStatusBadgeClass,
  getPlatformColorClass
};
