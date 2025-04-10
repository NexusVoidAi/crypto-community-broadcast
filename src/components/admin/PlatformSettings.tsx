import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Settings, Send, Bot, MessageSquare } from 'lucide-react';
import BotCommandsManagement from './BotCommandsManagement';
import TelegramMessenger from './TelegramMessenger';

const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    id: 0,
    platform_fee: 1.0,
    telegram_bot_token: '',
    telegram_bot_username: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [botConfigured, setBotConfigured] = useState(false);
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings(data);
        setBotConfigured(!!data.telegram_bot_token);
      }
    } catch (error: any) {
      console.error('Error fetching platform settings:', error);
      toast.error(`Failed to load settings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
const handleSave = async () => {
  setIsSaving(true);
  try {
    // Check if settings exist
    const { data: existingData, error: existingError } = await supabase
      .from('platform_settings')
      .select('id')
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }
    
    // Configure bot webhook after getting token
    let botUsername = settings.telegram_bot_username;
    if (settings.telegram_bot_token) {
      try {
        const response = await supabase.functions.invoke('telegram-configure-bot', {
          body: { token: settings.telegram_bot_token },
        });
        
        if (response.error) {
          throw new Error(response.error.message || 'Failed to configure bot webhook');
        }
        
        // Get the username from the response
        if (response.data && response.data.username) {
          botUsername = response.data.username;
        }
        
        setBotConfigured(true);
        toast.success('Bot webhook configured successfully!');
      } catch (webhookError: any) {
        console.error('Failed to configure bot webhook:', webhookError);
        toast.error(`Bot webhook configuration failed: ${webhookError.message}`);
      }
    }
    
    let result;
    
    if (existingData) {
      // Update existing settings
      result = await supabase
        .from('platform_settings')
        .update({
          platform_fee: settings.platform_fee,
          telegram_bot_token: settings.telegram_bot_token,
          telegram_bot_username: botUsername || settings.telegram_bot_username,
        })
        .eq('id', existingData.id);
    } else {
      // Insert new settings
      result = await supabase
        .from('platform_settings')
        .insert({
          platform_fee: settings.platform_fee,
          telegram_bot_token: settings.telegram_bot_token,
          telegram_bot_username: botUsername || settings.telegram_bot_username,
        });
    }
    
    if (result.error) {
      throw result.error;
    }
    
    // Update local state with the potentially new username
    if (botUsername !== settings.telegram_bot_username) {
      setSettings(prev => ({
        ...prev,
        telegram_bot_username: botUsername
      }));
    }
    
    toast.success('Platform settings saved successfully');
  } catch (error: any) {
    console.error('Error saving platform settings:', error);
    toast.error(`Failed to save settings: ${error.message}`);
  } finally {
    setIsSaving(false);
  }
};
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'platform_fee' ? parseFloat(value) : value,
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-crypto-darkgray/80">
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="telegram-bot" className="flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            Telegram Bot
          </TabsTrigger>
          <TabsTrigger 
            value="bot-commands" 
            className="flex items-center"
            disabled={!botConfigured}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Bot Commands
          </TabsTrigger>
          <TabsTrigger 
            value="messenger" 
            className="flex items-center"
            disabled={!botConfigured}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Messages
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="border border-border/50 bg-crypto-darkgray/50">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure platform-wide settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform_fee">Platform Fee (USD)</Label>
                <Input
                  id="platform_fee"
                  name="platform_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.platform_fee}
                  onChange={handleChange}
                  className="max-w-xs bg-crypto-dark"
                />
                <p className="text-sm text-muted-foreground">
                  Fee charged on each announcement in addition to community price
                </p>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-crypto-blue hover:bg-crypto-blue/90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="telegram-bot">
          <Card className="border border-border/50 bg-crypto-darkgray/50">
            <CardHeader>
              <CardTitle>Telegram Bot Configuration</CardTitle>
              <CardDescription>
                Configure your Telegram bot for community management and announcements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram_bot_token">Bot Token</Label>
                <Input
                  id="telegram_bot_token"
                  name="telegram_bot_token"
                  type="password"
                  value={settings.telegram_bot_token}
                  onChange={handleChange}
                  className="bg-crypto-dark"
                  placeholder="Enter your Telegram bot token from BotFather"
                />
                <p className="text-sm text-muted-foreground">
                  Get a token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-crypto-blue hover:underline">@BotFather</a> on Telegram
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegram_bot_username">Bot Username</Label>
                <Input
                  id="telegram_bot_username"
                  name="telegram_bot_username"
                  value={settings.telegram_bot_username}
                  onChange={handleChange}
                  className="bg-crypto-dark"
                  placeholder="@YourBotUsername"
                />
                <p className="text-sm text-muted-foreground">
                  The username of your Telegram bot (e.g. @AchoAIBot)
                </p>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-crypto-blue hover:bg-crypto-blue/90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving & Configuring...
                    </>
                  ) : 'Save Bot Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bot-commands">
          <BotCommandsManagement />
        </TabsContent>
        
        <TabsContent value="messenger">
          <TelegramMessenger />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformSettings;
