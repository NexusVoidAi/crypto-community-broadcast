
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon, className }) => {
  return (
    <Card className={cn(
      "border border-border/50 bg-crypto-darkgray/50 backdrop-blur-md p-6 hover:bg-crypto-darkgray/70 transition-colors", 
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.positive ? (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-crypto-green mr-1.5" />
                  <span className="text-xs font-medium text-crypto-green">{trend.value}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                  <span className="text-xs font-medium text-red-500">{trend.value}</span>
                </>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-crypto-blue/20 text-crypto-blue">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
