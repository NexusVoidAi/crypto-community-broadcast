
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateAnnouncement, enhanceAnnouncementWithAI, getSuggestions } from '@/services/validation';
import { formSchema, AnnouncementFormValues } from './CreateAnnouncementStep';
import CreateAnnouncementStep from './CreateAnnouncementStep';
import CommunitiesSelectionStep from './CommunitiesSelectionStep';
import ReviewAnnouncementStep from './ReviewAnnouncementStep';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  
  const form = useForm<AnnouncementFormValues>({
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
  
  // Handle form submission
  const onSubmit = async (values: AnnouncementFormValues) => {
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
        suggestions: getSuggestions(validationResult)
      });
      
      // Set suggestions from validation result
      setAiSuggestions(getSuggestions(validationResult));
      
      // Only move to communities selection if validation passed
      if (validationResult.isValid) {
        setStep('communities');
        toast.success('Announcement draft saved!');
      } else {
        toast.error('Announcement validation failed. Please review the issues and improve your content.');
        // Stay on create step but show the validation results
        setStep('create');
      }
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
          <CreateAnnouncementStep
            form={form}
            onSubmit={onSubmit}
            campaignId={campaignId}
            isSaving={isSaving}
            isValidating={isValidating}
            validationResults={validationResults}
            aiSuggestions={aiSuggestions}
            applySuggestion={applySuggestion}
            aiSuggestionsLoading={aiSuggestionsLoading}
            onFileChange={setUploadedFile}
            onFileUrlChange={setUploadedFileUrl}
          />
        );
        
      case 'communities':
        return (
          <CommunitiesSelectionStep
            communities={communities}
            selectedCommunities={selectedCommunities}
            toggleCommunitySelection={toggleCommunitySelection}
            calculateTotalPrice={calculateTotalPrice}
            onBack={() => setStep('create')}
            onContinue={handleValidate}
            validationResults={validationResults}
            isValidating={isValidating}
            aiSuggestions={aiSuggestions}
            applySuggestion={applySuggestion}
            aiSuggestionsLoading={aiSuggestionsLoading}
            errorMessage={errorMessage}
          />
        );
        
      case 'review':
        return (
          <ReviewAnnouncementStep
            announcement={announcement}
            validationResults={validationResults}
            communities={communities}
            selectedCommunities={selectedCommunities}
            calculateTotalPrice={calculateTotalPrice}
            onBack={() => setStep('communities')}
            onSubmit={handleSubmitAnnouncement}
            isLoading={isLoading}
            isEnhancing={isEnhancing}
            handleEnhance={handleEnhance}
            aiSuggestions={aiSuggestions}
            applySuggestion={applySuggestion}
            aiSuggestionsLoading={aiSuggestionsLoading}
          />
        );
        
      default:
        return null;
    }
  };

  return renderStepContent();
};

export default AnnouncementForm;
