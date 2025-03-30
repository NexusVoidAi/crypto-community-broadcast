
export interface ActivityItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'announcement' | 'payment' | 'validation' | 'community' | string;
  status: 'success' | 'warning' | 'error' | 'info' | string;
}

export interface TrendProps {
  value: string;
  positive: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  reach: number;
  clicks: number;
  conversionRate: number;
  budget: number;
  spent: number;
  title: string;
  communities: any[];
  views: number; // Changed from impressions to views
}
