
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from './StatCard';
import { StatCardData } from './types';

interface StatCardsProps {
  cards: StatCardData[];
  isLoading: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({ cards, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          trend={{
            value: card.change || '0%',
            positive: card.changeIsPositive ?? true
          }}
          icon={<card.icon className={`h-5 w-5 ${card.iconColor || 'text-primary'}`} />}
        />
      ))}
    </div>
  );
};

export default StatCards;
