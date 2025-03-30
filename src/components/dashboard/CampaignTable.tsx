
import React from 'react';
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

interface Campaign {
  id: number;
  title: string;
  status: string;
  communities: number;
  impressions: number;
  spent: number;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Table>
      <TableCaption>A list of your recent campaigns</TableCaption>
      <TableHeader>
        <TableRow className="border-border/50 hover:bg-crypto-darkgray/30">
          <TableHead className="w-[300px]">Campaign</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Communities</TableHead>
          <TableHead>Impressions</TableHead>
          <TableHead className="text-right">Spent</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.id} className="border-border/50 hover:bg-crypto-darkgray/30">
            <TableCell className="font-medium">{campaign.title}</TableCell>
            <TableCell>
              <Badge variant="outline" className={getStatusColor(campaign.status)}>
                {campaign.status}
              </Badge>
            </TableCell>
            <TableCell>{campaign.communities}</TableCell>
            <TableCell>{campaign.impressions.toLocaleString()}</TableCell>
            <TableCell className="text-right">${campaign.spent.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-1">
                <Button variant="ghost" size="icon" title="View">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Analytics">
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
