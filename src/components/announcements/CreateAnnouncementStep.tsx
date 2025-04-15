import React, { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle } from 'lucide-react';
import FileUpload from './FileUpload';
import SuggestionsList from './SuggestionsList';

export const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  content: z.string().min(15, {
    message: "Content must be at least 15 characters.",
  }),
  cta_text: z.string().optional(),
  cta_url: z.string().url().optional().or(z.literal('')),
  campaign_id: z.string().optional(),
  target_nation: z.string().min(1, { message: "Please select a target nation" }),
  target_category: z.string().min(1, { message: "Please select a target category" }),
});

export type AnnouncementFormValues = z.infer<typeof formSchema>;

interface CreateAnnouncementStepProps {
  form: UseFormReturn<AnnouncementFormValues>;
  onSubmit: (values: AnnouncementFormValues) => Promise<void>;
  campaignId: string | null;
  isSaving: boolean;
  isValidating: boolean;
  validationResults: any | null;
  aiSuggestions: string[];
  applySuggestion: (suggestion: string) => Promise<void>;
  aiSuggestionsLoading: boolean;
  onFileChange: (file: File | null) => void;
  onFileUrlChange: (url: string | null) => void;
}

const CreateAnnouncementStep: React.FC<CreateAnnouncementStepProps> = ({
  form,
  onSubmit,
  campaignId,
  isSaving,
  isValidating,
  validationResults,
  aiSuggestions,
  applySuggestion,
  aiSuggestionsLoading,
  onFileChange,
  onFileUrlChange,
}) => {
  const nations = [
    "Global",
    "United States",
    "United Kingdom",
    "European Union",
    "Asia Pacific",
    "Latin America",
    "Africa",
    "Middle East",
  ];

  const categories = [
    "Crypto Enthusiasts",
    "Traders",
    "DeFi Users",
    "NFT Collectors",
    "Web3 Developers",
    "Blockchain Investors",
    "GameFi Players",
    "DAO Participants",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-border/50 bg-crypto-darkgray/50">
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
            <CardDescription>
              Fill out the form below to create your announcement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationResults && !validationResults.passed && (
              <>
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Validation Issues</AlertTitle>
                  <AlertDescription>
                    Please review and address the validation issues.
                  </AlertDescription>
                </Alert>
                
                {/* Display AI suggestions */}
                {aiSuggestions.length > 0 && (
                  <SuggestionsList 
                    suggestions={aiSuggestions} 
                    onApply={applySuggestion}
                    isLoading={aiSuggestionsLoading}
                    isValid={false}
                  />
                )}
              </>
            )}
          
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a compelling title" 
                      {...field} 
                      className="bg-crypto-dark border-border/50"
                    />
                  </FormControl>
                  <FormDescription>
                    Title should be clear and attention-grabbing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your announcement content" 
                      {...field} 
                      className="min-h-[150px] bg-crypto-dark border-border/50"
                    />
                  </FormControl>
                  <FormDescription>
                    Be concise but informative. Remember to include all important details.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-sm font-medium mb-2">Targeting Options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="target_nation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Nation/Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-crypto-dark border-border/50">
                            <SelectValue placeholder="Select target region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nations.map((nation) => (
                            <SelectItem key={nation} value={nation}>
                              {nation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the primary region for your announcement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-crypto-dark border-border/50">
                            <SelectValue placeholder="Select target audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select your primary target audience
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <FormLabel htmlFor="media">Media (Optional)</FormLabel>
                <FileUpload onFileChange={onFileChange} onFileUrlChange={onFileUrlChange} />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Call to Action (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cta_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Learn More" 
                            {...field} 
                            className="bg-crypto-dark border-border/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cta_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com" 
                            {...field} 
                            className="bg-crypto-dark border-border/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {campaignId && (
                <FormField
                  control={form.control}
                  name="campaign_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign ID</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          readOnly 
                          className="bg-crypto-dark border-border/50"
                        />
                      </FormControl>
                      <FormDescription>
                        This announcement is linked to a campaign.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="bg-crypto-blue hover:bg-crypto-blue/90"
              disabled={isSaving || isValidating}
            >
              {isSaving || isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isValidating ? 'Validating...' : 'Saving...'}
                </>
              ) : (
                'Continue to Community Selection'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default CreateAnnouncementStep;
