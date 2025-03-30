import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Loader2, 
  Check, 
  X, 
  Upload, 
  MessageSquare, 
  AlertTriangle,
  Wand2
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  validateAnnouncementWithAI, 
  serializeValidationResult,
  getSuggestions,
  enhanceAnnouncementWithAI
} from '@/services/validation';
import SuggestionsList from './SuggestionsList';
import CopperXPayment from '../payments/CopperXPayment';

type ValidationResult = {
  isValid: boolean;
  score: number;
  issues: string[];
  feedback?: string;
};

type Community = {
  id: string;
  name: string;
  platform: 'TELEGRAM' | 'DISCORD' | 'WHATSAPP';
  price_per_announcement: number;
  reach: number;
  selected?: boolean;
};

type AnnouncementFormProps = {
  className?: string;
};

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [platformFee, setPlatformFee] = useState<number>(1);
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);

  // Add new state for handling AI enhancement
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    // Fetch platform fee
    const fetchPlatformFee = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('platform_fee')
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setPlatformFee(data.platform_fee);
        }
      } catch (error: any) {
        console.error("Error fetching platform fee:", error);
        // Use default fee if there's an error
      }
    };
    
    fetchPlatformFee();
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      if (step !== 2) return;
      
      setLoadingCommunities(true);
      
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        setCommunities(data || []);
      } catch (error: any) {
        toast.error(`Error loading communities: ${error.message}`);
      } finally {
        setLoadingCommunities(false);
      }
    };
    
    fetchCommunities();
  }, [step]);

  const handleValidate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // First, save the announcement as draft
      let announcement;
      
      if (!announcementId) {
        // Create new announcement
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            title,
            content,
            cta_text: ctaText,
            cta_url: ctaUrl,
            status: 'DRAFT',
            user_id: user?.id
          })
          .select()
          .single();
          
        if (error) throw error;
        announcement = data;
        setAnnouncementId(data.id);
      } else {
        // Update existing announcement
        const { data, error } = await supabase
          .from('announcements')
          .update({
            title,
            content,
            cta_text: ctaText,
            cta_url: ctaUrl
          })
          .eq('id', announcementId)
          .select()
          .single();
          
        if (error) throw error;
        announcement = data;
      }
      
      // Call Gemini validation service
      const validationResult = await validateAnnouncementWithAI(title, content);
      
      // Update announcement with validation result - serialize to ensure it's JSON compatible
      const { error: updateError } = await supabase
        .from('announcements')
        .update({
          validation_result: serializeValidationResult(validationResult),
          status: validationResult.isValid ? 'PENDING_VALIDATION' : 'VALIDATION_FAILED'
        })
        .eq('id', announcement.id);
        
      if (updateError) throw updateError;
      
      setValidationResult(validationResult);
      
      // Generate suggestions from validation result
      const suggestionList = getSuggestions(validationResult);
      setSuggestions(suggestionList);
      setShowSuggestions(true);
      
      if (validationResult.isValid) {
        toast.success('Announcement validated successfully!');
      } else {
        toast.error('Announcement failed validation checks');
      }
    } catch (error: any) {
      toast.error(`Error validating announcement: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCommunitySelection = (communityId: string) => {
    setSelectedCommunities(prev => {
      if (prev.includes(communityId)) {
        return prev.filter(id => id !== communityId);
      } else {
        return [...prev, communityId];
      }
    });
  };

  const calculateTotalCost = () => {
    return communities
      .filter(community => selectedCommunities.includes(community.id))
      .reduce((sum, community) => sum + Number(community.price_per_announcement), 0);
  };

  const handlePreviewAndPay = async () => {
    if (selectedCommunities.length === 0) {
      toast.error('Please select at least one community');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, update the announcement status
      const { error: updateError } = await supabase
        .from('announcements')
        .update({
          status: 'PENDING_VALIDATION'
        })
        .eq('id', announcementId);
        
      if (updateError) throw updateError;
      
      // Create announcement-community links
      const communityLinks = selectedCommunities.map(communityId => ({
        announcement_id: announcementId,
        community_id: communityId
      }));
      
      const { error: linkError } = await supabase
        .from('announcement_communities')
        .insert(communityLinks);
        
      if (linkError) throw linkError;
      
      // Calculate total with platform fee
      const communityTotal = calculateTotalCost();
      const totalWithFee = communityTotal + platformFee;
      
      // Create a payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          amount: totalWithFee,
          currency: 'USDT',
          user_id: user?.id,
          announcement_id: announcementId,
          status: 'PENDING'
        })
        .select()
        .single();
        
      if (paymentError) throw paymentError;
      
      toast.success('Announcement prepared for preview');
      
      // Navigate to preview page with the announcement ID
      navigate(`/announcements/preview?id=${announcementId}`);
    } catch (error: any) {
      toast.error(`Error preparing preview: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCryptoPayment = () => {
    setShowCryptoPayment(true);
  };

  const handlePaymentSuccess = async (txHash: string) => {
    try {
      // Update the payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'PAID',
          transaction_hash: txHash
        })
        .eq('announcement_id', announcementId);
        
      if (paymentError) throw paymentError;
      
      // Update the announcement status
      const { error: announcementError } = await supabase
        .from('announcements')
        .update({
          status: 'PUBLISHED',
          payment_status: 'PAID'
        })
        .eq('id', announcementId);
        
      if (announcementError) throw announcementError;
      
      toast.success('Payment successful! Your announcement is published.');
      navigate('/');
    } catch (error: any) {
      toast.error(`Error updating payment status: ${error.message}`);
    }
  };
  
  // Update the handleEnhanceWithAI function to use the correct property names
  const handleEnhanceWithAI = async () => {
    if (!title.trim() && !content.trim()) {
      toast.error('Please provide some text to enhance');
      return;
    }

    setIsEnhancing(true);

    try {
      const enhanced = await enhanceAnnouncementWithAI(title, content);
      
      // Update to use correct property names
      setTitle(enhanced.enhancedTitle);
      setContent(enhanced.enhancedContent);
      
      toast.success('Announcement enhanced successfully!');
      setShowSuggestions(false);
    } catch (error: any) {
      toast.error(`Error enhancing announcement: ${error.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Announcement Title</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-crypto-blue hover:text-crypto-blue/80"
                          onClick={() => handleEnhanceWithAI()}
                          disabled={isEnhancing || !title.trim()}
                        >
                          {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enhance with AI</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="title"
                  placeholder="Enter a clear, attention-grabbing title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Announcement Content</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-crypto-blue hover:text-crypto-blue/80"
                          onClick={() => handleEnhanceWithAI()}
                          disabled={isEnhancing || !content.trim()}
                        >
                          {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enhance with AI</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="content"
                  placeholder="Share your announcement message. Keep it clear and concise."
                  className="min-h-[150px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="media" className="flex items-center">
                  Media (Optional)
                </Label>
                <div className="border border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center text-muted-foreground">
                  <Upload className="h-8 w-8 mb-2" />
                  <p className="text-sm mb-1">Drag & drop or click to upload</p>
                  <p className="text-xs">JPG, PNG, GIF or MP4 (max 10MB)</p>
                  <Button variant="ghost" size="sm" className="mt-2">
                    Upload File
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">CTA Button Text (Optional)</Label>
                  <Input
                    id="ctaText"
                    placeholder="e.g., Learn More"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">CTA URL (Optional)</Label>
                  <Input
                    id="ctaUrl"
                    placeholder="https://example.com"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {validationResult && !showSuggestions && (
              <div className={cn(
                "mt-6 p-4 rounded-md",
                validationResult.isValid 
                  ? "bg-crypto-green/10 border border-crypto-green/30" 
                  : "bg-red-500/10 border border-red-500/30"
              )}>
                <div className="flex items-center mb-2">
                  {validationResult.isValid ? (
                    <Check className="h-5 w-5 text-crypto-green mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <h3 className="font-medium">
                    {validationResult.isValid ? "Validation passed" : "Validation failed"}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">AI confidence score:</span>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full", 
                          validationResult.isValid ? "bg-crypto-green" : "bg-red-500"
                        )}
                        style={{ width: `${validationResult.score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm ml-2">{Math.round(validationResult.score * 100)}%</span>
                  </div>
                  
                  {validationResult.issues.length > 0 && (
                    <div className="text-sm">
                      <p>Issues found:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {validationResult.issues.map((issue, i) => (
                          <li key={i} className="text-red-400">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {showSuggestions && validationResult && (
              <SuggestionsList 
                suggestions={suggestions}
                isValid={validationResult.isValid}
                onEdit={() => setShowSuggestions(false)}
                onEditWithAI={handleEnhanceWithAI}
                onContinue={() => {
                  setShowSuggestions(false);
                  setStep(2);
                }}
              />
            )}
            
            {!showSuggestions && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleValidate}
                  disabled={isLoading || !title.trim() || !content.trim()}
                  className="bg-crypto-blue hover:bg-crypto-blue/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating
                    </>
                  ) : (
                    <>
                      Validate & Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        );
      case 2:
        return (
          <div className="space-y-6">
            {showCryptoPayment ? (
              <CopperXPayment
                amount={calculateTotalCost() + platformFee}
                currency="USDT"
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowCryptoPayment(false)}
              />
            ) : (
              <>
                <div className="rounded-md border border-border p-4 bg-crypto-darkgray">
                  <h3 className="text-lg font-medium mb-2">Your Announcement</h3>
                  <div className="space-y-2">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{content}</p>
                    {(ctaText && ctaUrl) && (
                      <Button variant="outline" size="sm" className="mt-2">
                        {ctaText}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Select Communities</h3>
                  
                  {loadingCommunities ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : communities.length > 0 ? (
                    <>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {communities.map((community) => (
                          <Card 
                            key={community.id} 
                            className={cn(
                              "border cursor-pointer transition-colors",
                              selectedCommunities.includes(community.id)
                                ? "border-crypto-green/70 bg-crypto-green/5"
                                : "border-border/50 bg-crypto-darkgray/50"
                            )}
                            onClick={() => toggleCommunitySelection(community.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium flex items-center">
                                    {selectedCommunities.includes(community.id) && (
                                      <Check className="h-4 w-4 text-crypto-green mr-2" />
                                    )}
                                    {community.name}
                                  </h4>
                                  <div className="flex items-center mt-1">
                                    <Badge variant="outline" className="mr-2">
                                      {community.platform}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {community.reach?.toLocaleString() || 0} members
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-crypto-green">${community.price_per_announcement}</p>
                                  <button className="text-xs text-crypto-blue hover:underline mt-1">
                                    {selectedCommunities.includes(community.id) ? 'Deselect' : 'Select'}
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {selectedCommunities.length > 0 && (
                        <div className="mt-6 p-4 border border-border rounded-md bg-crypto-darkgray/70">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Selected Communities:</span>
                              <span>{selectedCommunities.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Communities Cost:</span>
                              <span>${calculateTotalCost().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Platform Fee:</span>
                              <span>${platformFee.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center font-bold">
                              <span>Total:</span>
                              <span className="text-crypto-green">${(calculateTotalCost() + platformFee).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No communities available</p>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep(1)}
                    >
                      Back to Edit
                    </Button>
                    
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCryptoPayment}
                        disabled={selectedCommunities.length === 0 || isLoading}
                        className="border-crypto-green/50 text-crypto-green"
                      >
                        Pay with CopperX
                      </Button>
                      
                      <Button 
                        onClick={handlePreviewAndPay}
                        className="bg-crypto-blue hover:bg-crypto-blue/90"
                        disabled={selectedCommunities.length === 0 || isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                          </>
                        ) : (
                          <>
                            Preview & Pay
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={cn("border border-border/50 glassmorphism bg-crypto-darkgray/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>{step === 1 ? 'Create Announcement' : 'Select Communities'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2",
              step >= 1 ? "border-crypto-blue bg-crypto-blue text-white" : "border-border text-muted-foreground"
            )}>
              1
            </div>
            <div className={cn(
              "flex-1 h-1 mx-2",
              step >= 2 ? "bg-crypto-blue" : "bg-border"
            )}></div>
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2",
              step >= 2 ? "border-crypto-blue bg-crypto-blue text-white" : "border-border text-muted-foreground"
            )}>
              2
            </div>
            <div className={cn(
              "flex-1 h-1 mx-2",
              step >= 3 ? "bg-crypto-blue" : "bg-border"
            )}></div>
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2",
              step >= 3 ? "border-crypto-blue bg-crypto-blue text-white" : "border-border text-muted-foreground"
            )}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Compose</span>
            <span>Select Communities</span>
            <span>Preview & Pay</span>
          </div>
        </div>
        <Separator className="mb-6" />
        {renderStep()}
      </CardContent>
    </Card>
  );
};

export default AnnouncementForm;
