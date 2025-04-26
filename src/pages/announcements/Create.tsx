
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const CreateAnnouncement: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Create Announcement</h1>
        
        <Card className="bg-blue-950/40 border-blue-800/50 mb-6">
          <CardContent className="p-4 flex items-start">
            <AlertCircle className="text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1 text-blue-300">Announcement Requirements</h3>
              <p className="text-sm text-blue-200/80">
                Your announcement title must contain at least 5 words, and the content must be at least 15 words. 
                After meeting these requirements, you can use AI to enhance your content.
                Our validation system will analyze various aspects of your announcement including relevance, clarity, 
                and compliance with community guidelines.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <AnnouncementForm />
      </div>
    </AppLayout>
  );
};

export default CreateAnnouncement;
