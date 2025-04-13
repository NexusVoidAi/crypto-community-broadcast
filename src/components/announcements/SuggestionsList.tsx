
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

export interface SuggestionsListProps {
  suggestions: string[];
  onApply: (suggestion: string) => Promise<void>;
  isLoading: boolean;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({ suggestions, onApply, isLoading }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion, index) => (
        <Card key={index} className="p-4 border border-border/50 bg-crypto-dark/30">
          <div className="space-y-2">
            <p className="whitespace-pre-wrap text-sm">{suggestion}</p>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onApply(suggestion)}
                disabled={isLoading}
                className="text-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" /> Apply
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SuggestionsList;
