
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

interface CampaignTableProps {
  campaigns: Campaign[];
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'PUBLISHED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
      case 'PENDING_VALIDATION':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'REJECTED':
      case 'VALIDATION_FAILED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'DRAFT':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

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
      <TableCaption>A list of your recent campaigns</TableCaption>
      <TableHeader>
        <TableRow className="border-border/50 hover:bg-crypto-darkgray/30">
          <TableHead className="w-[300px]">Campaign</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Communities</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Clicks</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.id} className="border-border/50 hover:bg-crypto-darkgray/30">
            <TableCell className="font-medium">{campaign.title || campaign.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className={getStatusColor(campaign.status)}>
                {campaign.status}
              </Badge>
            </TableCell>
            <TableCell>{campaign.communities?.length || 0}</TableCell>
            <TableCell>{campaign.views?.toLocaleString() || 0}</TableCell>
            <TableCell>{campaign.clicks?.toLocaleString() || 0}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="View"
                  onClick={() => handleViewCampaign(campaign.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Edit"
                  onClick={() => handleEditCampaign(campaign.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Analytics"
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
