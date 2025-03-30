
export interface Campaign {
  id: string;
  name: string;
  title: string;
  status: string;
  reach: number;
  clicks: number;
  views: number; // Changed from impressions to views
  conversionRate: number;
  budget: number;
  spent: number;
  communities: any[];
}

export interface StatCardData {
  title: string;
  value: string | number;
  change?: string | number;
  icon: React.ComponentType;
  iconColor?: string;
  changeIsPositive?: boolean;
}

export interface TrendProps {
  value: string | number;
  positive: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'announcement' | 'payment' | 'community';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}
