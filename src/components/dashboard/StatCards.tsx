
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
}

interface StatCardsProps {
  cards: StatCardProps[];
  isLoading: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({ cards, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <div className={card.iconColor}>
                  <IconComponent size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatCards;
