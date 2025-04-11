
// src/components/dashboard/types.ts
// This file contains types used across dashboard components

export interface TrendProps {
  value: string;
  positive: boolean;
}

export interface ActivityItem {
  id?: string;
  timestamp?: string;
  title: string;
  description: string;
  type: string;
  status: string;
}

export interface Campaign {
  id: string;
  name: string;
  title: string;
  status: string;
  reach: number;
  clicks: number;
  views?: number; 
  conversionRate: number;
  budget: number;
  spent: number;
  communities?: any[];
  impressions?: number;
}

export interface DashboardNavItem {
  name: string;
  id: string;
  icon: React.ReactNode;
}
