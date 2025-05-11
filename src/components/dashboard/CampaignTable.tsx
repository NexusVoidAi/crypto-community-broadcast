
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { Campaign } from './types';
import { getStatusBadgeClass } from '@/utils/theme-utils';

interface CampaignTableProps {
  campaigns: Campaign[];
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns }) => {
  const navigate = useNavigate();

  const handleViewCampaign = (id: string) => {
    navigate(`/announcements/preview?id=${id}`);
  };

  const handleEditCampaign = (id: string) => {
    navigate(`/announcements/create?edit=${id}`);
  };

  const handleViewAnalytics = (id: string) => {
    toast.info(`Viewing analytics for campaign ID: ${id}`);
    // This would navigate to an analytics page in the future
  };

  return (
    <Table>
      <TableCaption className="text-white/70">A list of your recent campaigns</TableCaption>
      <TableHeader>
        <TableRow className="border-border/50 hover:bg-crypto-darkgray/30">
          <TableHead className="w-[300px] text-white">Campaign</TableHead>
          <TableHead className="text-white">Status</TableHead>
          <TableHead className="text-white">Communities</TableHead>
          <TableHead className="text-white">Views</TableHead>
          <TableHead className="text-white">Clicks</TableHead>
          <TableHead className="text-right text-white">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.id} className="border-border/50 hover:bg-crypto-darkgray/30">
            <TableCell className="font-medium text-white">{campaign.title || campaign.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className={getStatusBadgeClass(campaign.status)}>
                {campaign.status}
              </Badge>
            </TableCell>
            <TableCell className="text-white">{campaign.communities?.length || 0}</TableCell>
            <TableCell className="text-white">{campaign.views?.toLocaleString() || 0}</TableCell>
            <TableCell className="text-white">{campaign.clicks?.toLocaleString() || 0}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="View"
                  className="text-white hover:bg-white/10"
                  onClick={() => handleViewCampaign(campaign.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Edit"
                  className="text-white hover:bg-white/10"
                  onClick={() => handleEditCampaign(campaign.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Analytics"
                  className="text-white hover:bg-white/10"
                  onClick={() => handleViewAnalytics(campaign.id)}
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CampaignTable;
