
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
    
    // Create Supabase client with more comprehensive methods
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get platform settings
    const { data: settings } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .limit(1);
      
    console.log("Retrieved platform settings:", settings ? "Found settings" : "No settings found");
    
    if (!settings || settings.length === 0) {
      throw new Error('Platform settings not found');
    }
    
    const botToken = settings[0]?.telegram_bot_token;
    
    if (!botToken) {
      throw new Error('Telegram bot token not configured in platform settings');
    }
    
    // Get community data
    const { data: communities } = await supabaseAdmin
      .from('communities')
      .select('*');
      
    if (!communities || communities.length === 0) {
      throw new Error('No communities found');
    }
    
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      throw new Error(`Community with ID ${communityId} not found`);
    }
    
    if (community.platform !== 'TELEGRAM' || !community.platform_id) {
      throw new Error('Not a valid Telegram community or missing platform ID');
    }
    
    console.log(`Checking bot for Telegram chat: ${community.platform_id}`);
    
    // Ensure we're using a valid chat ID format
    let chatId = community.platform_id;
    if (chatId.startsWith('@')) {
      // It's a username, we can use it directly
    } else if (!isNaN(Number(chatId))) {
      // It's numeric, ensure it's treated as a string
      chatId = chatId.toString();
    } else {
      // Try to extract numeric ID if it's a URL or something else
      const numericMatch = chatId.match(/-\d+/);
      if (numericMatch) {
        chatId = numericMatch[0];
      }
    }
    
    // Check if bot is a member of the chat
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: 'me', // Special value to get bot's own info
        }),
      }
    );
    
    const telegramResult = await telegramResponse.json();
    console.log("Telegram API response:", JSON.stringify(telegramResult));
    
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

// More comprehensive helper to create Supabase client in Deno
const createClient = (url: string, key: string) => {
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        limit: (n: number) => fetch(`${url}/rest/v1/${table}?select=${columns}&limit=${n}`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json()),
        eq: (column: string, value: any) => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
        }).then(res => res.json()),
      })
    }),
  };
};
