
import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendProps } from './types';

interface StatCardProps {
  title: string;
  value: string | number;
  trend: TrendProps;
  icon: ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  trend,
  icon,
  className
}) => {
  return (
    <Card className={cn("border border-border/50 glassmorphism bg-crypto-darkgray/50", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              <div className={`flex items-center text-xs font-medium ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trend.value}
              </div>
            </div>
          </div>
          <div className="p-2 rounded-full bg-crypto-dark/60">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
