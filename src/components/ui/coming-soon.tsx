
import React from 'react';
import { SparklesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComingSoonProps {
  className?: string;
  message?: string;
  showIcon?: boolean;
}

const ComingSoon = ({
  className,
  message = "Coming Soon",
  showIcon = true
}: ComingSoonProps) => {
  return (
    <div className={cn(
      "coming-soon-overlay",
      className
    )}>
      {showIcon && <SparklesIcon className="h-8 w-8 mb-2 text-neon-purple" />}
      <p className="coming-soon-text">{message}</p>
      <p className="text-sm text-muted-foreground mt-2">
        We're working on bringing this feature to you soon!
      </p>
    </div>
  );
};

export default ComingSoon;
