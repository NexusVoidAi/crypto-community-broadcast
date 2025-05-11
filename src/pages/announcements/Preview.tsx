import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, ArrowLeft, CreditCard, Image, Link, BarChart2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import CopperXPayment from '@/components/payments/CopperXPayment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
const Preview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const announcementId = searchParams.get('id');
  const tabParam = searchParams.get('tab') || 'preview';
  const [announcement, setAnnouncement] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(1);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!announcementId) {
        toast.error('Announcement ID is missing');
        setIsLoading(false);
        return;
      }
      try {
        // Fetch the announcement
        const {
          data: announcementData,
          error: announcementError
        } = await supabase.from('announcements').select('*').eq('id', announcementId).single();
        if (announcementError) throw announcementError;
        setAnnouncement(announcementData);
        console.log("Loaded announcement:", announcementData);

        // Fetch communities linked to this announcement
        const {
          data: communityData,
          error: communityError
        } = await supabase.from('announcement_communities').select('community_id, views, clicks').eq('announcement_id', announcementId);
        if (communityError) throw communityError;

        // Generate analytics data from community data
        if (communityData && communityData.length > 0) {
          // Create basic analytics data
          const lastWeek = [];
          const today = new Date();
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            lastWeek.push({
              date: date.toLocaleDateString(),
              views: Math.floor(Math.random() * 100),
              // Placeholder - replace with real data
              clicks: Math.floor(Math.random() * 30) // Placeholder - replace with real data
            });
          }
          setAnalyticsData(lastWeek);
        }

        // Fetch community details
        const communityIds = communityData.map((item: any) => item.community_id);
        if (communityIds.length > 0) {
          const {
            data: communitiesData,
            error: communitiesError
          } = await supabase.from('communities').select('*').in('id', communityIds);
          if (communitiesError) throw communitiesError;

          // Merge community data with views/clicks
          const enhancedCommunities = communitiesData.map((community: any) => {
            const communityStats = communityData.find((c: any) => c.community_id === community.id);
            return {
              ...community,
              views: communityStats?.views || 0,
              clicks: communityStats?.clicks || 0
            };
          });
          setCommunities(enhancedCommunities);

          // Calculate total cost from communities
          const communityCost = enhancedCommunities.reduce((sum: number, community: any) => sum + Number(community.price_per_announcement), 0);

          // Fetch platform fee
          const {
            data: platformSettings
          } = await supabase.from('platform_settings').select('platform_fee').maybeSingle();
          const fee = platformSettings?.platform_fee || 1;
          setPlatformFee(fee);
          setTotalCost(communityCost + fee);
        }
      } catch (error: any) {
        toast.error(`Error fetching announcement: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncement();
  }, [announcementId]);
  const handlePaymentSuccess = async (txHash: string) => {
    try {
      // Update payment status
      const {
        data: paymentData,
        error: paymentError
      } = await supabase.from('payments').update({
        status: 'PAID',
        transaction_hash: txHash
      }).eq('announcement_id', announcementId).select().single();
      if (paymentError) throw paymentError;

      // Update announcement status
      const {
        error: announcementError
      } = await supabase.from('announcements').update({
        status: 'PUBLISHED',
        payment_status: 'PAID'
      }).eq('id', announcementId);
      if (announcementError) throw announcementError;

      // Create community earnings records
      if (communities.length > 0) {
        const communityFee = totalCost - platformFee;
        const amountPerCommunity = communityFee / communities.length;

        // Create earnings records for each community
        for (const community of communities) {
          await supabase.from('community_earnings').insert({
            community_id: community.id,
            amount: amountPerCommunity,
            payment_id: paymentData.id,
            currency: 'USDT'
          });
        }
      }
      toast.success('Payment successful! Your announcement will be published soon.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(`Error processing payment: ${error.message}`);
    }
  };
  const renderPreviewTab = () => <Card className="border border-nexus-border-subtle bg-nexus-background-card/70 backdrop-blur-md">
      <CardHeader>
        <CardTitle>Announcement Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">{announcement.title}</h2>
          
          {announcement.media_url && <div className="relative rounded-md overflow-hidden border border-nexus-border-subtle">
              <div className="bg-crypto-dark/50 py-1 px-2 absolute top-2 right-2 rounded text-xs flex items-center">
                <Image className="h-3 w-3 mr-1" />
                Media included
              </div>
              <img src={announcement.media_url} alt="Announcement media" className="w-full max-h-[300px] object-contain bg-crypto-dark/50" />
            </div>}
          
          <p className="text-nexus-text-muted">{announcement.content}</p>
          
          {announcement.cta_text && announcement.cta_url && <div className="mt-4">
              <div className="text-xs text-nexus-text-muted mb-2 flex items-center">
                <Link className="h-3 w-3 mr-1" /> Call-to-Action Button:
              </div>
              <Button asChild>
                <a href={announcement.cta_url} target="_blank" rel="noopener noreferrer">
                  {announcement.cta_text}
                </a>
              </Button>
            </div>}
        </div>

        <div className="mt-4 pt-4 border-t border-nexus-border-subtle">
          <h3 className="text-lg font-medium text-white mb-2">Selected Communities:</h3>
          {communities.length > 0 ? <ul className="list-disc pl-5">
              {communities.map(community => <li key={community.id} className="text-nexus-text-muted">
                  <span className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-crypto-green" />
                    {community.name} ({community.platform}) - ${community.price_per_announcement}
                  </span>
                </li>)}
            </ul> : <p className="text-nexus-text-muted">No communities selected.</p>}
        </div>
        
        <div className="pt-4 border-t border-nexus-border-subtle">
          <div className="flex justify-between mb-1">
            <span className="text-nexus-text-muted">Communities Cost:</span>
            <span className="text-white">${(totalCost - platformFee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-nexus-text-muted">Platform Fee:</span>
            <span className="text-white">${platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-white">Total:</span>
            <span className="text-crypto-green">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/announcements/create')} className="text-white bg-crypto-violet">
          <ArrowLeft className="mr-2 h-4 w-4" /> Edit Announcement
        </Button>
        {announcement.status !== 'PUBLISHED' && announcement.status !== 'ACTIVE' && <Button className="bg-crypto-green hover:bg-crypto-green/90" onClick={() => setShowPayment(true)}>
            <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
          </Button>}
      </CardFooter>
    </Card>;
  const renderAnalyticsTab = () => <Card className="border border-nexus-border-subtle bg-nexus-background-card/70 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white">Campaign Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border border-nexus-border-subtle rounded-md bg-crypto-dark/80">
            <h3 className="font-medium text-center mb-3 text-white">Total Views</h3>
            <div className="text-center text-2xl md:text-3xl font-bold text-crypto-green">
              {communities.reduce((sum, community) => sum + (community.views || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 border border-nexus-border-subtle rounded-md bg-crypto-dark/80">
            <h3 className="font-medium text-center mb-3 text-white">Total Clicks</h3>
            <div className="text-center text-2xl md:text-3xl font-bold text-crypto-blue">
              {communities.reduce((sum, community) => sum + (community.clicks || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 border border-nexus-border-subtle rounded-md bg-crypto-dark/80">
            <h3 className="font-medium text-center mb-3 text-white">Click Rate</h3>
            <div className="text-center text-2xl md:text-3xl font-bold text-yellow-500">
              {(() => {
              const totalViews = communities.reduce((sum, community) => sum + (community.views || 0), 0);
              const totalClicks = communities.reduce((sum, community) => sum + (community.clicks || 0), 0);
              const rate = totalViews ? (totalClicks / totalViews * 100).toFixed(2) : '0.00';
              return `${rate}%`;
            })()}
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Performance Over Time</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData} margin={{
            top: 5,
            right: 20,
            left: 10,
            bottom: 5
          }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <RechartsTooltip contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              color: '#fff'
            }} />
              <Line type="monotone" dataKey="views" name="Views" stroke="#8884d8" activeDot={{
              r: 8
            }} />
              <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#82ca9d" activeDot={{
              r: 8
            }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-white mb-4">Community Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-nexus-border-subtle">
                  <th className="text-left py-2 px-4">Community</th>
                  <th className="text-center py-2 px-4">Platform</th>
                  <th className="text-center py-2 px-4">Views</th>
                  <th className="text-center py-2 px-4">Clicks</th>
                  <th className="text-center py-2 px-4">CTR</th>
                </tr>
              </thead>
              <tbody>
                {communities.map(community => <tr key={community.id} className="border-b border-nexus-border-subtle">
                    <td className="py-2 px-4">{community.name}</td>
                    <td className="py-2 px-4 text-center">{community.platform}</td>
                    <td className="py-2 px-4 text-center">{community.views}</td>
                    <td className="py-2 px-4 text-center">{community.clicks}</td>
                    <td className="py-2 px-4 text-center">
                      {community.views ? (community.clicks / community.views * 100).toFixed(2) : '0.00'}%
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="text-white bg-crypto-violet">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </CardFooter>
    </Card>;
  if (isLoading) {
    return <AppLayout>
        <div className="flex h-screen items-center justify-center text-white">Loading preview...</div>
      </AppLayout>;
  }
  if (!announcement) {
    return <AppLayout>
        <div className="flex h-screen items-center justify-center text-white">Announcement not found.</div>
      </AppLayout>;
  }
  return <AppLayout>
      <div className="container mx-auto py-10">
        {showPayment ? <div className="max-w-md mx-auto">
            <Button variant="outline" className="mb-4 text-white" onClick={() => setShowPayment(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Preview
            </Button>
            
            <CopperXPayment amount={totalCost} currency="USDT" onSuccess={handlePaymentSuccess} onCancel={() => setShowPayment(false)} announcementId={announcementId} />
          </div> : <Tabs defaultValue={tabParam} className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-2 mb-6">
              <TabsTrigger value="preview" onClick={() => navigate(`/announcements/preview?id=${announcementId}&tab=preview`)}>
                Preview
              </TabsTrigger>
              <TabsTrigger value="analytics" onClick={() => navigate(`/announcements/preview?id=${announcementId}&tab=analytics`)}>
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview">
              {renderPreviewTab()}
            </TabsContent>
            
            <TabsContent value="analytics">
              {renderAnalyticsTab()}
            </TabsContent>
          </Tabs>}
      </div>
    </AppLayout>;
};
export default Preview;