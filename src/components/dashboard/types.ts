
export interface ActivityItem {
  id: string;
  type: "announcement" | "payment" | "validation" | "notification";
  title: string;
  time: string;
  status: string;
  description?: string;
  timestamp?: string;
}
