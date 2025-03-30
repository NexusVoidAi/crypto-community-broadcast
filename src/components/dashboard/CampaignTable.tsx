
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Campaign } from './types';
import { ChevronRight, Eye, MousePointerClick, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CampaignTableProps {
  campaigns: Campaign[];
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string, text: string } } = {
      'DRAFT': { color: 'bg-gray-500/20 text-gray-500', text: 'Draft' },
      'PENDING_VALIDATION': { color: 'bg-yellow-500/20 text-yellow-500', text: 'Pending Validation' },
      'VALIDATION_FAILED': { color: 'bg-red-500/20 text-red-500', text: 'Validation Failed' },
      'PUBLISHED': { color: 'bg-green-500/20 text-green-500', text: 'Published' }
    };

    const style = statusMap[status] || { color: 'bg-gray-500/20 text-gray-500', text: status };
    
    return (
      <Badge className={`${style.color} border border-current/20`}>
        {style.text}
      </Badge>
    );
  };

  return (
    <div className="rounded-lg border border-border/40 bg-crypto-darkgray/20 backdrop-blur-lg glassmorphism">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Reach</span>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>Views</span>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                <MousePointerClick className="h-4 w-4" />
                <span>Clicks</span>
              </div>
            </TableHead>
            <TableHead>Conv. Rate</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                No campaigns found. Create your first announcement!
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.title}</TableCell>
                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                <TableCell>{campaign.reach.toLocaleString()}</TableCell>
                <TableCell>{campaign.views?.toLocaleString() || 0}</TableCell>
                <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                <TableCell>{campaign.conversionRate}%</TableCell>
                <TableCell>${campaign.budget}</TableCell>
                <TableCell>
                  <Button
                    size="sm" 
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => navigate(`/announcements/preview?id=${campaign.id}`)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CampaignTable;
