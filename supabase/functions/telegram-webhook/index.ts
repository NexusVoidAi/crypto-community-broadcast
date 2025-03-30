
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  try {
    const update = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));
    
    // Create a Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get platform settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('platform_settings')
      .select('telegram_bot_token')
      .single();
      
    if (settingsError) throw settingsError;
    
    const botToken = settings?.telegram_bot_token;
    
    if (!botToken) {
      throw new Error('Telegram bot token not configured');
    }
    
    // Handle message updates
    if (update.message) {
      const { message } = update;
      
      // Log chat info for potential new communities
      if (message.chat.type === 'group' || message.chat.type === 'supergroup') {
        console.log(`Bot added to chat: ${message.chat.title} (ID: ${message.chat.id})`);
        
        // Check if this is a new community that needs to be registered
        const chatId = String(message.chat.id);
        
        const { data: communities } = await supabaseAdmin
          .from('communities')
          .select('id, platform_id')
          .eq('platform', 'TELEGRAM')
          .eq('platform_id', chatId);
          
        if (communities && communities.length > 0) {
          console.log(`Found ${communities.length} communities matching chat ID ${chatId}`);
          
          // Send a welcome message
          await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: chatId,
                text: "✅ Bot successfully connected to this community! Now you can receive approved announcements.",
                parse_mode: 'Markdown'
              }),
            }
          );
        }
      }
    }
    
    // Handle callback queries (button clicks)
    if (update.callback_query) {
      // Implementation for handling button clicks if needed
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper to create Supabase client in Deno
const createClient = (url: string, key: string) => {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
          },
        }).then(res => res.json().then(data => ({ data, error: null }))),
      }),
    }),
  };
};
