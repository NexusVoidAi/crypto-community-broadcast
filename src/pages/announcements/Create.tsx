
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';

const CreateAnnouncement: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Create Announcement</h1>
        <AnnouncementForm />
      </div>
    </AppLayout>
  );
};

export default CreateAnnouncement;
