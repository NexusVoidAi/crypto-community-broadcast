
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    platformFee: 1,
    telegramBotToken: '',
    telegramBotUsername: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings({
          platformFee: data.platform_fee || 1,
          telegramBotToken: data.telegram_bot_token || '',
          telegramBotUsername: data.telegram_bot_username || ''
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load platform settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 1, // Single row for all settings
          platform_fee: settings.platformFee,
          telegram_bot_token: settings.telegramBotToken,
          telegram_bot_username: settings.telegramBotUsername,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      // Call the configure bot function to update the webhook
      if (settings.telegramBotToken && settings.telegramBotUsername) {
        await supabase.functions.invoke("telegram-configure-bot", {
          body: { 
            token: settings.telegramBotToken,
            username: settings.telegramBotUsername
          }
        });
      }
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
      <CardHeader>
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>Configure platform-wide settings</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platformFee">Platform Fee (USDT)</Label>
              <Input
                id="platformFee"
                type="number"
                min="0"
                step="0.01"
                value={settings.platformFee}
                onChange={(e) => setSettings(prev => ({ ...prev, platformFee: parseFloat(e.target.value) }))}
                className="bg-crypto-dark border-border"
              />
              <p className="text-xs text-muted-foreground">Additional fee added to each announcement</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Telegram Bot Configuration</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="telegramBotToken">Bot Token</Label>
                  <Input
                    id="telegramBotToken"
                    type="password"
                    value={settings.telegramBotToken}
                    onChange={(e) => setSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                    className="bg-crypto-dark border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telegramBotUsername">Bot Username</Label>
                  <Input
                    id="telegramBotUsername"
                    placeholder="e.g., my_crypto_bot"
                    value={settings.telegramBotUsername}
                    onChange={(e) => setSettings(prev => ({ ...prev, telegramBotUsername: e.target.value }))}
                    className="bg-crypto-dark border-border"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-crypto-blue hover:bg-crypto-blue/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformSettings;
