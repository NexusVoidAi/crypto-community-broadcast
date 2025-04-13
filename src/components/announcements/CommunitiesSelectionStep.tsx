
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import SuggestionsList from './SuggestionsList';

interface Community {
  id: string;
  name: string;
  platform: string;
  platform_id: string;
  reach: number;
  price_per_announcement: number;
}

interface CommunitiesSelectionStepProps {
  communities: Community[];
  selectedCommunities: string[];
  toggleCommunitySelection: (communityId: string) => void;
  calculateTotalPrice: () => number;
  onBack: () => void;
  onContinue: () => void;
  validationResults: any | null;
  isValidating: boolean;
  aiSuggestions: string[];
  applySuggestion: (suggestion: string) => Promise<void>;
  aiSuggestionsLoading: boolean;
  errorMessage: string | null;
}

const CommunitiesSelectionStep: React.FC<CommunitiesSelectionStepProps> = ({
  communities,
  selectedCommunities,
  toggleCommunitySelection,
  calculateTotalPrice,
  onBack,
  onContinue,
  validationResults,
  isValidating,
  aiSuggestions,
  applySuggestion,
  aiSuggestionsLoading,
  errorMessage,
}) => {
  return (
    <Card className="border border-border/50 bg-crypto-darkgray/50">
      <CardHeader>
        <CardTitle>Select Communities</CardTitle>
        <CardDescription>
          Choose which communities you want to publish this announcement to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display validation results if available */}
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
        
        {/* Display AI suggestions */}
        {aiSuggestions.length > 0 && (
          <SuggestionsList 
            suggestions={aiSuggestions} 
            onApply={applySuggestion}
            isLoading={aiSuggestionsLoading}
            onEdit={onBack}
            isValid={validationResults?.passed !== false}
          />
        )}

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
            <TabsTrigger value="discord">Discord</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>
          
          {['all', 'telegram', 'discord', 'whatsapp'].map(platform => (
            <TabsContent key={platform} value={platform} className="pt-4">
              {communities.length > 0 ? (
                <div className="space-y-4">
                  {communities
                    .filter(community => 
                      platform === 'all' || 
                      community.platform.toLowerCase() === platform.toLowerCase()
                    )
                    .map(community => (
                      <div 
                        key={community.id} 
                        className={`p-4 border rounded-md flex justify-between items-center cursor-pointer transition-colors ${
                          selectedCommunities.includes(community.id) 
                            ? 'border-crypto-blue/80 bg-crypto-blue/10' 
                            : 'border-border/50 bg-crypto-dark/40 hover:bg-crypto-dark/60'
                        }`}
                        onClick={() => toggleCommunitySelection(community.id)}
                      >
                        <div>
                          <h3 className="font-medium">{community.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <span className="mr-4">{community.platform}</span>
                            <span>{community.reach.toLocaleString()} members</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 text-right">
                            <span className="block text-crypto-green font-medium">
                              ${community.price_per_announcement}
                            </span>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                            selectedCommunities.includes(community.id) 
                              ? 'bg-crypto-blue border-crypto-blue' 
                              : 'border-muted-foreground'
                          }`}>
                            {selectedCommunities.includes(community.id) && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No communities available.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        
        {selectedCommunities.length > 0 && (
          <div className="bg-crypto-darkgray p-4 rounded-md border border-border/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Selected:</p>
                <p className="font-medium">{selectedCommunities.length} communities</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Price:</p>
                <p className="text-crypto-green font-medium">
                  ${calculateTotalPrice().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
          >
            Back
          </Button>
          <Button 
            className="bg-crypto-blue hover:bg-crypto-blue/90"
            disabled={selectedCommunities.length === 0 || isValidating || (validationResults && !validationResults.passed)}
            onClick={onContinue}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Continue to Review'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunitiesSelectionStep;
