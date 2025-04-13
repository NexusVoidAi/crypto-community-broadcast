
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, CreditCard, Bell, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { ActivityItem } from './types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, className }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    if (['ACTIVE', 'PUBLISHED', 'PAID'].includes(status)) {
      return <CheckCircle2 className="h-4 w-4 text-crypto-green" />;
    } else if (['REJECTED', 'VALIDATION_FAILED', 'FAILED'].includes(status)) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (['ACTIVE', 'PUBLISHED', 'PAID'].includes(status)) {
      return 'bg-crypto-green/10 text-crypto-green border-crypto-green/20';
    } else if (['REJECTED', 'VALIDATION_FAILED', 'FAILED'].includes(status)) {
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    } else {
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Recently';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <Card className={cn("border border-border/50 glassmorphism bg-crypto-darkgray/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        <CardDescription>Your latest updates and actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-0 pb-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-crypto-dark/20 transition-colors"
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                activity.type === 'announcement' ? 'bg-blue-500/20 text-blue-500' :
                activity.type === 'payment' ? 'bg-crypto-green/20 text-crypto-green' :
                'bg-purple-500/20 text-purple-500'
              )}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                  <Badge variant="outline" className={cn("text-xs px-1.5 py-0 h-5", getStatusColor(activity.status))}>
                    <span className="flex items-center">
                      {getStatusIcon(activity.status)}
                      <span className="ml-1">{activity.status}</span>
                    </span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(activity.timestamp || '')}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
