
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertCircle, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  X, 
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SuggestionsList from './SuggestionsList';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateAnnouncement, enhanceAnnouncementWithAI, getSuggestions } from '@/services/validation';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  content: z.string().min(15, {
    message: "Content must be at least 15 characters.",
  }),
  cta_text: z.string().optional(),
  cta_url: z.string().url().optional().or(z.literal('')),
  campaign_id: z.string().optional(),
});

interface Community {
  id: string;
  name: string;
  platform: string;
  platform_id: string;
  reach: number;
  price_per_announcement: number;
}

const AnnouncementForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaign');
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [step, setStep] = useState('create'); // create, communities, review
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      cta_text: "",
      cta_url: "",
      campaign_id: campaignId || "",
    },
  });
  
  // Fetch communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .eq('approval_status', 'APPROVED')
          .order('name', { ascending: true });
          
        if (error) throw error;
        setCommunities(data || []);
      } catch (error: any) {
        console.error('Error fetching communities:', error.message);
        toast.error('Failed to load communities');
      }
    };
    
    fetchCommunities();
  }, []);
  
  // Calculate total price based on selected communities
  const calculateTotalPrice = (): number => {
    return communities
      .filter(community => selectedCommunities.includes(community.id))
      .reduce((total, community) => total + community.price_per_announcement, 0);
  };
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Unsupported file type. Please upload an image, video, or PDF.');
      return;
    }
    
    setUploadedFile(file);
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string || null);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-images, just show the file name
      setFilePreview(null);
    }
  };
  
  // Upload file to Supabase Storage
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    setIsUploading(true);
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('announcements')
        .upload(filePath, file);
        
      if (error) throw error;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error.message);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setUploadedFileUrl(null);
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('You must be logged in to create an announcement');
      return;
    }
    
    setIsSaving(true);
    try {
      let mediaUrl = uploadedFileUrl;
      
      // Upload file if there's one and it hasn't been uploaded yet
      if (uploadedFile && !uploadedFileUrl) {
        mediaUrl = await uploadFileToStorage(uploadedFile);
      }
      
      // Save announcement
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: values.title,
          content: values.content,
          cta_text: values.cta_text || null,
          cta_url: values.cta_url || null,
          media_url: mediaUrl,
          user_id: user.id,
          status: 'DRAFT'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setAnnouncement(data);
      
      // Validate the announcement immediately before moving to communities step
      setIsValidating(true);
      const validationResult = await validateAnnouncement(values.title, values.content);
      setIsValidating(false);
      
      // Set validation results to display to user
      setValidationResults({
        passed: validationResult.isValid,
        message: validationResult.feedback,
        suggestions: validationResult.suggestions
      });
      
      // Set suggestions even if validation fails
      setAiSuggestions(validationResult.suggestions);
      
      // Move to communities selection after showing validation
      setStep('communities');
      toast.success('Announcement draft saved!');
    } catch (error: any) {
      console.error('Error creating announcement:', error.message);
      toast.error('Failed to create announcement');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Toggle community selection
  const toggleCommunitySelection = (communityId: string) => {
    setSelectedCommunities(prev => 
      prev.includes(communityId)
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    );
  };
  
  // Handle validation request
  const handleValidate = async () => {
    if (!announcement) return;
    
    setIsValidating(true);
    try {
      // Use the validation service directly
      const validationResult = await validateAnnouncement(announcement.title, announcement.content);
      
      setValidationResults({
        passed: validationResult.isValid,
        message: validationResult.feedback,
        suggestions: validationResult.suggestions
      });
      
      // If validation passed, move to review step
      if (validationResult.isValid) {
        setStep('review');
      } else {
        toast.error('Announcement validation failed. Please review the issues.');
      }
    } catch (error: any) {
      console.error('Error validating announcement:', error.message);
      toast.error('Failed to validate announcement');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Handle AI enhancement
  const handleEnhance = async () => {
    if (!announcement) return;
    
    setIsEnhancing(true);
    try {
      // Use the AI enhancement service directly
      const enhancement = await enhanceAnnouncementWithAI(announcement.title, announcement.content);
      
      if (enhancement?.improvements) {
        setAiSuggestions(enhancement.improvements);
      }
    } catch (error: any) {
      console.error('Error enhancing announcement:', error.message);
      toast.error('Failed to enhance announcement');
    } finally {
      setIsEnhancing(false);
    }
  };
  
  // Apply AI suggestion
  const applySuggestion = async (suggestion: string) => {
    if (!announcement) return;
    
    setAiSuggestionsLoading(true);
    try {
      // Update the content in the form
      form.setValue('content', suggestion);
      
      // Also update in the database
      const { error } = await supabase
        .from('announcements')
        .update({ content: suggestion })
        .eq('id', announcement.id);
        
      if (error) throw error;
      
      // Update local state
      setAnnouncement({ ...announcement, content: suggestion });
      
      toast.success('Applied AI suggestion!');
    } catch (error: any) {
      console.error('Error applying suggestion:', error.message);
      toast.error('Failed to apply suggestion');
    } finally {
      setAiSuggestionsLoading(false);
    }
  };
  
  // Submit final announcement
  const handleSubmitAnnouncement = async () => {
    if (!announcement || selectedCommunities.length === 0) return;
    
    setIsLoading(true);
    try {
      // Update announcement status - using 'PENDING_VALIDATION' instead of 'PENDING_APPROVAL'
      const { error } = await supabase
        .from('announcements')
        .update({ status: 'PENDING_VALIDATION' })
        .eq('id', announcement.id);
        
      if (error) throw error;
      
      // Create announcement-community relations
      const communityRelations = selectedCommunities.map(communityId => ({
        announcement_id: announcement.id,
        community_id: communityId
      }));
      
      const { error: relationsError } = await supabase
        .from('announcement_communities')
        .insert(communityRelations);
        
      if (relationsError) throw relationsError;
      
      // Navigate to preview page
      navigate(`/announcements/preview?id=${announcement.id}`);
      toast.success('Announcement submitted!');
    } catch (error: any) {
      console.error('Error submitting announcement:', error.message);
      toast.error('Failed to submit announcement');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render form based on current step
  const renderStepContent = () => {
    switch (step) {
      case 'create':
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
                    <div>
                      <FormLabel htmlFor="media">Media (Optional)</FormLabel>
                      <div className="mt-2">
                        {!uploadedFile ? (
                          <div className="border border-dashed border-border/70 rounded-md p-6 text-center bg-crypto-dark/50">
                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-4">Upload an image, video, or document</p>
                            <label className="relative cursor-pointer">
                              <Button variant="secondary" type="button" className="relative z-10">
                                <Upload className="mr-2 h-4 w-4" />
                                Select File
                              </Button>
                              <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                onChange={handleFileUpload}
                                accept="image/*,video/*,application/pdf"
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="border border-border/70 rounded-md p-4 bg-crypto-dark/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground mr-2" />
                                <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                type="button"
                                onClick={handleRemoveFile}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                            
                            {filePreview && (
                              <div className="mt-2">
                                <img 
                                  src={filePreview} 
                                  alt="Preview" 
                                  className="rounded-md max-h-40 mx-auto"
                                />
                              </div>
                            )}
                            
                            {isUploading && (
                              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                <Loader2 className="animate-spin h-3 w-3 mr-1" />
                                Uploading...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported formats: JPEG, PNG, GIF, MP4, PDF. Maximum size: 10MB.
                      </p>
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
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
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
        
      case 'communities':
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
                  onEdit={() => setStep('create')}
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
                  onClick={() => setStep('create')}
                >
                  Back
                </Button>
                <Button 
                  className="bg-crypto-blue hover:bg-crypto-blue/90"
                  disabled={selectedCommunities.length === 0 || isValidating || (validationResults && !validationResults.passed)}
                  onClick={handleValidate}
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
        
      case 'review':
        return (
          <Card className="border border-border/50 bg-crypto-darkgray/50">
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Review your announcement before submitting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {announcement && (
                <>
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
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                onClick={() => setStep('communities')}
                className="sm:w-1/2 w-full"
              >
                Back
              </Button>
              <Button 
                className="bg-crypto-blue hover:bg-crypto-blue/90 sm:w-1/2 w-full"
                onClick={handleSubmitAnnouncement}
                disabled={isLoading || !announcement || selectedCommunities.length === 0}
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
        
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      {renderStepContent()}
    </div>
  );
};

export default AnnouncementForm;
