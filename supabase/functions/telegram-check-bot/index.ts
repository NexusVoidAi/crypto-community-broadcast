
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
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      throw new Error('Invalid request body format');
    }
    
    const { communityId } = body;
    
    if (!communityId) {
      throw new Error('Missing community ID');
    }
    
    console.log(`Checking Telegram bot for community ID: ${communityId}`);
    
    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get platform settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('platform_settings')
      .select('telegram_bot_token, telegram_bot_username');
      
    if (settingsError) throw settingsError;
    
    // Settings might return an array with one object, handle both cases
    const settings = Array.isArray(settingsData) ? settingsData[0] : settingsData;
    
    if (!settings?.telegram_bot_token) {
      throw new Error('Telegram bot token not configured');
    }
    
    const botToken = settings.telegram_bot_token;
    
    // Get community data
    const { data: communityData, error: communityError } = await supabaseAdmin
      .from('communities')
      .select('platform, platform_id');
    
    if (communityError) throw communityError;
    
    // Find the community in the array of communities
    const community = Array.isArray(communityData) 
      ? communityData.find((c) => c.id === communityId) 
      : (communityData?.id === communityId ? communityData : null);
      
    if (!community) {
      throw new Error(`Community with ID ${communityId} not found`);
    }
    
    if (community.platform !== 'TELEGRAM' || !community.platform_id) {
      throw new Error('Not a valid Telegram community or missing platform ID');
    }
    
    console.log(`Checking bot for Telegram chat: ${community.platform_id}`);
    
    // Check if bot is a member of the chat
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: community.platform_id,
          user_id: 'me', // Special value to get bot's own info
        }),
      }
    );
    
    const telegramResult = await telegramResponse.json();
    
    if (!telegramResult.ok) {
      return new Response(JSON.stringify({ 
        botAdded: false,
        error: telegramResult.description 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check if bot has admin rights
    const isAdmin = ['administrator', 'creator'].includes(telegramResult.result.status);
    
    return new Response(JSON.stringify({ 
      botAdded: true,
      isAdmin,
      status: telegramResult.result.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error checking Telegram bot status:', error);
    return new Response(JSON.stringify({ botAdded: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper to create Supabase client in Deno
const createClient = (url: string, key: string) => {
  return {
    from: (table: string) => ({
      select: (columns: string) => {
        return {
          eq: (column: string, value: any) => {
            return fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`, {
              headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
              },
            }).then(res => res.json());
          }
        };
      }
    }),
  };
};
