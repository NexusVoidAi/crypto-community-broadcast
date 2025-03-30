
export interface ActivityItem {
  id: string;
  type: "announcement" | "payment" | "validation" | "notification" | "community";
  title: string;
  time: string;
  status: string;
  description: string;
  timestamp?: string;
  icon?: React.ReactNode; // Add optional icon property
}
