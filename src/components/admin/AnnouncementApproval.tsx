
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Loader2, MessageSquare, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AnnouncementApproval = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingAnnouncements();
  }, []);

  const fetchPendingAnnouncements = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles:user_id(name),
          announcement_communities:announcement_communities(
            community:communities(name, platform)
          )
        `)
        .in('status', ['PENDING_VALIDATION'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setAnnouncements(data || []);
    } catch (error: any) {
      toast.error(`Error loading announcements: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (announcementId: string, approved: boolean) => {
    setIsProcessing(announcementId);
    
    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          status: approved ? 'PUBLISHED' : 'VALIDATION_FAILED'
        })
        .eq('id', announcementId);
        
      if (error) throw error;
      
      toast.success(`Announcement ${approved ? 'approved' : 'rejected'} successfully`);
      
      // Remove the processed announcement from the list
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.filter(a => a.id !== announcementId)
      );
    } catch (error: any) {
      toast.error(`Error processing announcement: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const getValidationScoreBadge = (score: number) => {
    if (score > 0.8) return <Badge className="bg-green-500">High</Badge>;
    if (score > 0.5) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-red-500">Low</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/50 bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle className="text-xl">Pending Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending announcements to review</p>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="border border-border rounded-md p-4 bg-crypto-dark/50"
                >
                  <div className="flex flex-col md:flex-row justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-medium">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted by {announcement.profiles?.name || 'Unknown'} on {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center">
                      <span className="text-sm mr-2">AI Score:</span>
                      {getValidationScoreBadge(announcement.validation_result?.score || 0)}
                    </div>
                  </div>
                  
                  <div className="my-4 p-3 bg-crypto-darkgray/50 rounded-md">
                    <p className="text-sm">{announcement.content}</p>
                  </div>
                  
                  {announcement.announcement_communities?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Target Communities:</p>
                      <div className="flex flex-wrap gap-2">
                        {announcement.announcement_communities.map((item: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-crypto-darkgray/50">
                            {item.community?.name} ({item.community?.platform})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {announcement.validation_result?.issues?.length > 0 && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-400">AI flagged issues:</p>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {announcement.validation_result.issues.map((issue: string, idx: number) => (
                              <li key={idx} className="text-xs text-red-400">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {announcement.validation_result?.feedback && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <p className="text-sm font-medium text-blue-400 mb-1">AI Feedback:</p>
                      <p className="text-xs">{announcement.validation_result.feedback}</p>
                    </div>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="destructive"
                      onClick={() => handleApproval(announcement.id, false)}
                      disabled={isProcessing === announcement.id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isProcessing === announcement.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproval(announcement.id, true)}
                      disabled={isProcessing === announcement.id}
                      className="bg-crypto-green hover:bg-crypto-green/90"
                    >
                      {isProcessing === announcement.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementApproval;
