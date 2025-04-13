
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, Loader2, ImageIcon, Sparkles } from 'lucide-react';
import SuggestionsList from './SuggestionsList';

interface Community {
  id: string;
  name: string;
  platform: string;
  platform_id: string;
  reach: number;
  price_per_announcement: number;
}

interface ReviewAnnouncementStepProps {
  announcement: any;
  validationResults: any | null;
  communities: Community[];
  selectedCommunities: string[];
  calculateTotalPrice: () => number;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  isEnhancing: boolean;
  handleEnhance: () => void;
  aiSuggestions: string[];
  applySuggestion: (suggestion: string) => Promise<void>;
  aiSuggestionsLoading: boolean;
}

const ReviewAnnouncementStep: React.FC<ReviewAnnouncementStepProps> = ({
  announcement,
  validationResults,
  communities,
  selectedCommunities,
  calculateTotalPrice,
  onBack,
  onSubmit,
  isLoading,
  isEnhancing,
  handleEnhance,
  aiSuggestions,
  applySuggestion,
  aiSuggestionsLoading,
}) => {
  if (!announcement) return null;
  
  return (
    <Card className="border border-border/50 bg-crypto-darkgray/50">
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>
          Review your announcement before submitting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationResults && (
          <Alert variant={validationResults.passed ? "default" : "destructive"} className="mb-4">
            {validationResults.passed ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {validationResults.passed ? 'Validation Passed' : 'Validation Issues'}
            </AlertTitle>
            <AlertDescription>
              {validationResults.passed 
                ? 'Your announcement has passed our validation checks.' 
                : validationResults.message || 'Please review and address the validation issues.'}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Title</h3>
            <p className="font-medium">{announcement.title}</p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-medium text-muted-foreground">Content</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleEnhance}
                disabled={isEnhancing}
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    Enhance with AI
                  </>
                )}
              </Button>
            </div>
            <div className="p-4 rounded-md border border-border/50 bg-crypto-dark/30">
              <p className="whitespace-pre-wrap">{announcement.content}</p>
            </div>
          </div>
          
          {announcement.media_url && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Media</h3>
              {announcement.media_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img 
                  src={announcement.media_url} 
                  alt="Media" 
                  className="rounded-md max-h-60 mx-auto"
                />
              ) : (
                <div className="p-3 rounded-md border border-border/50 bg-crypto-dark/30 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  <a 
                    href={announcement.media_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-400 hover:underline truncate"
                  >
                    View attached media
                  </a>
                </div>
              )}
            </div>
          )}
          
          {(announcement.cta_text || announcement.cta_url) && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Call to Action</h3>
              <div className="flex space-x-2 items-center">
                {announcement.cta_text && (
                  <Button variant="secondary" size="sm" disabled>
                    {announcement.cta_text}
                  </Button>
                )}
                {announcement.cta_url && (
                  <span className="text-xs text-muted-foreground truncate">
                    {announcement.cta_url}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Selected Communities</h3>
            <div className="space-y-2">
              {communities
                .filter(community => selectedCommunities.includes(community.id))
                .map(community => (
                  <div 
                    key={community.id} 
                    className="p-3 rounded-md border border-border/50 bg-crypto-dark/30 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <span className="font-medium">{community.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({community.reach.toLocaleString()} members)
                      </span>
                    </div>
                    <span className="text-crypto-green font-medium">
                      ${community.price_per_announcement}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="bg-crypto-dark/30 p-4 rounded-md border border-border/50">
            <div className="flex justify-between items-center">
              <p className="font-medium">Total Price:</p>
              <p className="text-crypto-green font-bold text-lg">
                ${calculateTotalPrice().toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        {aiSuggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-3">AI Content Suggestions</h3>
            <SuggestionsList 
              suggestions={aiSuggestions} 
              onApply={applySuggestion}
              isLoading={aiSuggestionsLoading}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="sm:w-1/2 w-full"
        >
          Back
        </Button>
        <Button 
          className="bg-crypto-blue hover:bg-crypto-blue/90 sm:w-1/2 w-full"
          onClick={onSubmit}
          disabled={isLoading || selectedCommunities.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit & Continue to Payment'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReviewAnnouncementStep;
