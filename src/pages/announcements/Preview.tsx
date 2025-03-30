import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Preview = () => {
  const [searchParams] = useSearchParams();
  const announcementId = searchParams.get('id');
  const [announcement, setAnnouncement] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!announcementId) {
        toast.error('Announcement ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        const { data: announcementData, error: announcementError } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', announcementId)
          .single();

        if (announcementError) throw announcementError;

        setAnnouncement(announcementData);

        const { data: communityData, error: communityError } = await supabase
          .from('announcement_communities')
          .select('community_id')
          .eq('announcement_id', announcementId);

        if (communityError) throw communityError;

        // Fetch community details based on community_id
        const communityIds = communityData.map((item: any) => item.community_id);
        if (communityIds.length > 0) {
          const { data: communitiesData, error: communitiesError } = await supabase
            .from('communities')
            .select('*')
            .in('id', communityIds);

          if (communitiesError) throw communitiesError;
          setCommunities(communitiesData);
        }
      } catch (error: any) {
        toast.error(`Error fetching announcement: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, [announcementId]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading preview...</div>;
  }

  if (!announcement) {
    return <div className="flex h-screen items-center justify-center">Announcement not found.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50 max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Announcement Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{announcement.title}</h2>
            <p className="text-muted-foreground">{announcement.content}</p>
            {announcement.cta_text && announcement.cta_url && (
              <Button asChild>
                <a href={announcement.cta_url} target="_blank" rel="noopener noreferrer">
                  {announcement.cta_text}
                </a>
              </Button>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Selected Communities:</h3>
            {communities.length > 0 ? (
              <ul className="list-disc pl-5">
                {communities.map((community) => (
                  <li key={community.id} className="text-muted-foreground">
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-crypto-green" />
                      {community.name} ({community.platform})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No communities selected.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Preview;
