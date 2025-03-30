
import React from 'react';
import { StatCardData } from './types';
import StatCard from './StatCard';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardsProps {
  cards: StatCardData[];
  isLoading: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({ cards, isLoading }) => {
  // Default trend data
  const defaultTrend = {
    value: '0%',
    positive: true
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card, index) => {
        // Create the icon element with the appropriate color class
        const IconComponent = card.icon;
        // Wrap the icon in a div so we don't directly pass className to the icon component
        const iconElement = <div><IconComponent className={`h-5 w-5 ${card.iconColor || 'text-white'}`} /></div>;

        return (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={iconElement}
            trend={{
              value: card.change || defaultTrend.value,
              positive: card.changeIsPositive !== undefined ? card.changeIsPositive : defaultTrend.positive
            }}
          />
        );
      })}
    </div>
  );
};

export default StatCards;
