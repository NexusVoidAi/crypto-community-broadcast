
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, Edit, Wand2, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SuggestionsListProps {
  suggestions: string[];
  onEdit?: () => void;
  onContinue?: () => void;
  onEditWithAI?: () => void;
  onApply?: (suggestion: string) => Promise<void> | void;
  isValid?: boolean;
  isLoading?: boolean;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  onEdit,
  onContinue,
  onEditWithAI,
  onApply,
  isValid = true,
  isLoading = false
}) => {
  const isMobile = useIsMobile();
  
  // Ensure we always have at least one suggestion to display
  const displaySuggestions = suggestions.length > 0 
    ? suggestions 
    : ['Consider making your announcement more specific and targeted.'];

  return (
    <Card className="border border-border/50 bg-crypto-darkgray/50 mt-6 rounded-xl glassmorphism">
      <CardContent className="pt-6">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 h-8 w-8 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-medium text-base mb-1">AI Suggestions</h3>
            <p className="text-sm text-muted-foreground">
              {isValid 
                ? "Your announcement passes our guidelines. Here are some suggestions to make it even better:" 
                : "Please review these suggestions to improve your announcement:"}
            </p>
          </div>
        </div>
        
        <ul className="space-y-3 mb-6 pl-2 md:pl-11">
          {displaySuggestions.map((suggestion, index) => (
            <li key={index} className="text-sm flex items-start gap-2">
              <span className="inline-block h-5 w-5 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-medium mt-0.5">
                {index + 1}
              </span>
              {onApply ? (
                <div className="flex justify-between items-start flex-1">
                  <span className="text-muted-foreground flex-1">{suggestion}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6 ml-2 text-crypto-blue flex-shrink-0" 
                    onClick={() => onApply(suggestion)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : 'Apply'}
                  </Button>
                </div>
              ) : (
                <span className="text-muted-foreground">{suggestion}</span>
              )}
            </li>
          ))}
        </ul>
        
        {(onEdit || onContinue || onEditWithAI) && (
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between'}`}>
            <div className={`flex ${isMobile ? 'w-full' : ''} gap-2 ${isMobile ? 'flex-col' : ''}`}>
              {onEdit && (
                <Button 
                  variant="outline"
                  className={isMobile ? "w-full" : ""}
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Manually
                </Button>
              )}
              
              {onEditWithAI && (
                <Button 
                  variant="outline"
                  className={`border-crypto-blue/50 text-crypto-blue ${isMobile ? "w-full" : ""}`}
                  onClick={onEditWithAI}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Enhance with AI
                </Button>
              )}
            </div>
            
            {onContinue && (
              <Button 
                className={`bg-crypto-blue hover:bg-crypto-blue/90 ${isMobile ? "w-full" : ""}`}
                onClick={onContinue}
                disabled={!isValid}
              >
                {isValid ? (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : "Fix Issues to Continue"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestionsList;
