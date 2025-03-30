
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AnnouncementApproval = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const fetchPendingAnnouncements = async () => {
    try {
      setIsLoading(true);
      
      // Fetch announcements that passed AI validation and are waiting for admin approval
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          user:profiles(name),
          communities:announcement_communities(
            community:communities(id, name, platform)
          )
        `)
        .eq('status', 'PENDING_VALIDATION')
        .eq('payment_status', 'PAID')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAnnouncements();
  }, []);

  const handleApproveAnnouncement = async (announcementId: string) => {
    setProcessingIds(prev => [...prev, announcementId]);
    
    try {
      // Update announcement status to PUBLISHED
      const { error } = await supabase
        .from('announcements')
        .update({ status: 'PUBLISHED' })
        .eq('id', announcementId);
        
      if (error) throw error;
      
      // Refresh the list
      fetchPendingAnnouncements();
      toast.success("Announcement approved successfully");
      
      // Call Telegram posting function
      await supabase.functions.invoke("telegram-post-announcement", {
        body: { announcementId }
      });
    } catch (error) {
      console.error("Error approving announcement:", error);
      toast.error("Failed to approve announcement");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== announcementId));
    }
  };

  const handleRejectAnnouncement = async (announcementId: string) => {
    setProcessingIds(prev => [...prev, announcementId]);
    
    try {
      // Update announcement status to REJECTED
      const { error } = await supabase
        .from('announcements')
        .update({ status: 'VALIDATION_FAILED' })
        .eq('id', announcementId);
        
      if (error) throw error;
      
      // Refresh the list
      fetchPendingAnnouncements();
      toast.success("Announcement rejected");
    } catch (error) {
      console.error("Error rejecting announcement:", error);
      toast.error("Failed to reject announcement");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== announcementId));
    }
  };

  return (
    <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
      <CardHeader>
        <CardTitle>Pending Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="border border-border/50 bg-crypto-dark/70">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{announcement.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          By {announcement.user?.name || 'Unknown user'} • 
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        Pending Approval
                      </Badge>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                      <p>{announcement.content}</p>
                    </div>
                    
                    {announcement.media_url && (
                      <div className="rounded-md overflow-hidden">
                        <img src={announcement.media_url} alt="Announcement media" className="w-full h-auto" />
                      </div>
                    )}
                    
                    {announcement.cta_text && announcement.cta_url && (
                      <div>
                        <Button variant="outline" size="sm" className="flex items-center" asChild>
                          <a href={announcement.cta_url} target="_blank" rel="noreferrer">
                            {announcement.cta_text}
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium mb-2">Selected Communities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {announcement.communities.map((item: any) => (
                          <Badge key={item.community.id} variant="outline">
                            {item.community.name} ({item.community.platform})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={() => handleApproveAnnouncement(announcement.id)}
                        disabled={processingIds.includes(announcement.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        {processingIds.includes(announcement.id) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectAnnouncement(announcement.id)}
                        disabled={processingIds.includes(announcement.id)}
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                      >
                        {processingIds.includes(announcement.id) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pending announcements to review</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementApproval;
