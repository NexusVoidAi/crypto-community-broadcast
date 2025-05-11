
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    <div className="overflow-hidden rounded-lg border border-nexus-border-subtle bg-nexus-background-card/70 backdrop-blur-md">
      <Table>
        <TableCaption className="text-nexus-text-muted font-medium pb-4">
          A list of your recent campaigns
        </TableCaption>
        <TableHeader>
          <TableRow className="border-nexus-border-subtle hover:bg-nexus-background-secondary/30">
            <TableHead className="w-[300px] text-nexus-text-secondary font-semibold">Campaign</TableHead>
            <TableHead className="text-nexus-text-secondary font-semibold">Status</TableHead>
            <TableHead className="text-nexus-text-secondary font-semibold">Communities</TableHead>
            <TableHead className="text-nexus-text-secondary font-semibold">Views</TableHead>
            <TableHead className="text-nexus-text-secondary font-semibold">Clicks</TableHead>
            <TableHead className="text-right text-nexus-text-secondary font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="border-nexus-border-subtle hover:bg-nexus-background-secondary/30">
              <TableCell className="font-medium text-nexus-text">{campaign.title || campaign.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusBadgeClass(campaign.status)}>
                  {campaign.status}
                </Badge>
              </TableCell>
              <TableCell className="text-nexus-text">
                {campaign.communities?.length 
                  ? <span className="font-semibold">{campaign.communities.length}</span>
                  : <span className="text-nexus-text-muted">0</span>
                }
              </TableCell>
              <TableCell className="text-nexus-text">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-semibold">{campaign.views?.toLocaleString() || 0}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total campaign views</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-nexus-text">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-semibold">{campaign.clicks?.toLocaleString() || 0}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total campaign clicks</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-nexus-text hover:bg-nexus-background-secondary"
                          onClick={() => handleViewCampaign(campaign.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View campaign</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-nexus-text hover:bg-nexus-background-secondary"
                          onClick={() => handleEditCampaign(campaign.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit campaign</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-nexus-text hover:bg-nexus-background-secondary"
                          onClick={() => handleViewAnalytics(campaign.id)}
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View analytics</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {campaigns.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <p className="text-nexus-text-muted">No campaigns found</p>
                <Button 
                  variant="outline" 
                  className="mt-2" 
                  onClick={() => navigate('/announcements/create')}
                >
                  Create your first campaign
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CampaignTable;
