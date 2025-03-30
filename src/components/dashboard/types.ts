
export interface ActivityItem {
  id: string;
  timestamp: Date | string;
  title: string;
  description: string;
  icon?: string;
  variant?: string;
  type?: "announcement" | "payment" | "validation" | "notification" | "community";
  time?: string;
  status?: string;
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
  title?: string;
  communities?: any[];
  impressions?: number;
}

export interface TrendProps {
  value: string | number;
  positive?: boolean;
}
