
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityItem } from './types';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, AlertTriangle, Info, Ban, ArrowRight } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <Ban className="h-4 w-4 text-red-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'announcement':
      return <Bell className="h-4 w-4 text-purple-500" />;
    case 'payment':
      return <Bell className="h-4 w-4 text-green-500" />;
    case 'validation':
      return <Check className="h-4 w-4 text-blue-500" />;
    case 'community':
      return <Bell className="h-4 w-4 text-orange-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'warning':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'error':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'info':
    default:
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  }
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 last:pb-0 border-b border-border/30 last:border-0">
                <div className="p-2 rounded-full bg-crypto-dark/60">
                  {getTypeIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{activity.title}</p>
                    <Badge variant="outline" className={`${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                    <button className="text-xs text-crypto-blue hover:underline flex items-center">
                      View Details <ArrowRight className="ml-1 h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
