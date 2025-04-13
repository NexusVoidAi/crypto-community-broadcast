
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Campaigns = () => {
  const campaigns = [
    {
      id: 1,
      title: "Spring Token Launch",
      description: "Announcement campaign for the new SPR token launch",
      status: "active",
      progress: 68,
      communities: 12,
      budget: "$5,000",
      endDate: "2025-05-15"
    },
    {
      id: 2,
      title: "NFT Collection Drop",
      description: "Promotional campaign for the exclusive NFT collection",
      status: "scheduled",
      progress: 0,
      communities: 8,
      budget: "$3,500",
      endDate: "2025-05-20"
    },
    {
      id: 3,
      title: "DeFi Protocol Update",
      description: "Announcements for major protocol upgrade",
      status: "completed",
      progress: 100,
      communities: 24,
      budget: "$7,200",
      endDate: "2025-04-05"
    },
    {
      id: 4,
      title: "Community AMA Series",
      description: "Weekly AMA series with project founders",
      status: "active",
      progress: 45,
      communities: 16,
      budget: "$2,800",
      endDate: "2025-06-10"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaign Management</h1>
        <Button>Create New Campaign</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{campaign.title}</CardTitle>
                  <CardDescription>{campaign.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{campaign.progress}%</span>
                  </div>
                  <Progress value={campaign.progress} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Communities</p>
                    <p className="font-medium">{campaign.communities}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-medium">{campaign.budget}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">{campaign.endDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" size="sm" className="w-full">Manage Campaign</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Campaigns;
