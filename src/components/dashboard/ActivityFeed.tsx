
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, MessageSquare, Zap, Bell, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityItem = {
  id: string;
  type: 'announcement' | 'payment' | 'validation' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
};

type ActivityFeedProps = {
  activities: ActivityItem[];
  className?: string;
};

const getIcon = (type: ActivityItem['type'], status?: ActivityItem['status']) => {
  switch (type) {
    case 'announcement':
      return <MessageSquare className="h-4 w-4" />;
    case 'payment':
      return <Zap className="h-4 w-4" />;
    case 'validation':
      return <Check className="h-4 w-4" />;
    case 'notification':
      return <Bell className="h-4 w-4" />;
    default:
      return null;
  }
};

const getStatusClass = (status?: ActivityItem['status']) => {
  switch (status) {
    case 'success':
      return 'bg-crypto-green/20 text-crypto-green';
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'error':
      return 'bg-red-500/20 text-red-500';
    case 'info':
      return 'bg-crypto-blue/20 text-crypto-blue';
    default:
      return 'bg-muted/50 text-muted-foreground';
  }
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, className }) => {
  return (
    <Card className={cn("border border-border/50 glassmorphism bg-crypto-darkgray/50", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-space">Recent Activity</CardTitle>
        <Button variant="ghost" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start p-4",
                index !== activities.length - 1 && "border-b border-border"
              )}
            >
              <div className={cn("mr-4 flex h-8 w-8 items-center justify-center rounded-full", getStatusClass(activity.status))}>
                {activity.icon || getIcon(activity.type, activity.status)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
              </div>
              <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
