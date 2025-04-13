
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Edit, Eye, Trash2, Plus } from "lucide-react";

const MyAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnnouncements();
  }, [user]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'PENDING_VALIDATION': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'VALIDATION_FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'PUBLISHED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleEdit = (id) => {
    navigate('/announcements/create', { state: { announcementId: id } });
  };
  
  const handlePreview = (id) => {
    navigate('/announcements/preview', { state: { announcementId: id } });
  };
  
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remove from local state
      setAnnouncements(announcements.filter(ann => ann.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Announcements</h1>
        <Button onClick={() => navigate('/announcements/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="text-center py-10">Loading announcements...</div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <Badge className={getStatusBadgeClass(announcement.status)}>
                        {announcement.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(announcement.created_at).toLocaleDateString()}
                      </div>
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePreview(announcement.id)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(announcement.id)}
                          disabled={announcement.status === 'PUBLISHED'}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDelete(announcement.id)}
                          disabled={announcement.status === 'PUBLISHED'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p>You haven't created any announcements yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/announcements/create')}
              >
                Create your first announcement
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="draft">
          {/* Similar to "all" but filtered for drafts */}
        </TabsContent>
        
        <TabsContent value="pending">
          {/* Similar to "all" but filtered for pending */}
        </TabsContent>
        
        <TabsContent value="published">
          {/* Similar to "all" but filtered for published */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyAnnouncements;
