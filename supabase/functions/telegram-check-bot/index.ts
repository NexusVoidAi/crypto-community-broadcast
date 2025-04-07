
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    
    // Create Supabase client with proper SDK
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get platform settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .maybeSingle();
      
    if (settingsError) {
      console.error("Error fetching platform settings:", settingsError);
      throw new Error('Failed to fetch platform settings');
    }
    
    console.log("Retrieved platform settings:", settingsData ? "Found settings" : "No settings found");
    
    if (!settingsData) {
      throw new Error('Platform settings not found');
    }
    
    const botToken = settingsData.telegram_bot_token;
    
    if (!botToken) {
      throw new Error('Telegram bot token not configured');
    }
    
    // Get community data
    const { data: communityData, error: communityError } = await supabaseAdmin
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .maybeSingle();
      
    if (communityError) {
      console.error("Error fetching community:", communityError);
      throw new Error(`Failed to fetch community: ${communityError.message}`);
    }
    
    if (!communityData) {
      throw new Error(`Community with ID ${communityId} not found`);
    }
    
    if (communityData.platform !== 'TELEGRAM' || !communityData.platform_id) {
      throw new Error('Not a valid Telegram community or missing platform ID');
    }
    
    console.log(`Checking bot for Telegram chat: ${communityData.platform_id}`);
    
    // Ensure we're using a valid chat ID format
    let chatId = communityData.platform_id;
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
      } else {
        // Try to extract chat ID from URL using the utility function
        const extractedId = extractChatIdFromUrl(chatId);
        if (extractedId) {
          chatId = extractedId;
        }
      }
    }
    
    // Get bot info first
    try {
      const botInfoResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const botInfoResult = await botInfoResponse.json();
      console.log("Bot info:", JSON.stringify(botInfoResult));
      
      if (!botInfoResult.ok) {
        return new Response(JSON.stringify({ 
          botAdded: false,
          error: "Failed to get bot information: " + botInfoResult.description 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const botId = botInfoResult.result.id;
      
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
            user_id: botId,
          }),
        }
      );
      
      const telegramResult = await telegramResponse.json();
      console.log("Telegram API response:", JSON.stringify(telegramResult));
      
      if (!telegramResult.ok) {
        return new Response(JSON.stringify({ 
          botAdded: false,
          error: telegramResult.description,
          inviteLink: await generateBotInviteLink(botInfoResult.result.username)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Check if bot has admin rights
      const isAdmin = ['administrator', 'creator'].includes(telegramResult.result.status);
      
      // If bot is member but not admin, try to get chat info and member count
      let memberCount = null;
      let chatInfo = null;
      
      if (telegramResult.ok) {
        try {
          // Get member count
          const memberCountResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getChatMemberCount`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId }),
            }
          );
          
          if (memberCountResponse.ok) {
            const memberCountResult = await memberCountResponse.json();
            if (memberCountResult.ok) {
              memberCount = memberCountResult.result;
              
              // Update community record with member count
              await supabaseAdmin
                .from('communities')
                .update({ reach: memberCount })
                .eq('id', communityId);
            }
          }
          
          // Get chat info
          const chatInfoResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getChat`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId }),
            }
          );
          
          if (chatInfoResponse.ok) {
            const chatInfoResult = await chatInfoResponse.json();
            if (chatInfoResult.ok) {
              chatInfo = chatInfoResult.result;
            }
          }
        } catch (error) {
          console.error("Error fetching additional chat info:", error);
        }
      }
      
      return new Response(JSON.stringify({ 
        botAdded: true,
        isAdmin,
        status: telegramResult.result.status,
        botInfo: botInfoResult.result,
        memberCount,
        chatInfo,
        inviteLink: isAdmin ? null : await generateBotInviteLink(botInfoResult.result.username)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error checking bot status:', error);
      return new Response(JSON.stringify({ 
        botAdded: false, 
        error: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error checking Telegram bot status:', error);
    return new Response(JSON.stringify({ botAdded: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Generate a link for users to add the bot to their group
async function generateBotInviteLink(botUsername: string): Promise<string> {
  if (!botUsername) {
    return "";
  }
  return `https://t.me/${botUsername}?startgroup=true`;
}

// Utility function to extract chat ID from Telegram URL
function extractChatIdFromUrl(url: string): string | null {
  let chatId: string | null = null;

  try {
    // Check if it's a private group or channel link (with "joinchat/")
    if (url.includes("joinchat/")) {
      // Telegram doesn't expose chat_id directly for private invite links
      chatId = url.split("joinchat/")[1];
      console.log(`Private chat invite hash extracted: ${chatId}`);
    }
    // Check if it's a public group or channel link
    else if (url.includes("t.me/")) {
      let path = url.split("t.me/")[1];

      // Check if it contains a subpath like "/c/"
      if (path.startsWith("c/")) {
        // For "/c/" channels, there is a numeric ID followed by "/<message_id>"
        chatId = "-" + path.split("/")[1]; // Prefix it with "-"
      } else {
        // For public channels or groups, we use the group name or channel name directly
        chatId = path.split("/")[0]; // First part before any slash
        console.log(`Public group or channel ID extracted: ${chatId}`);
      }
    } else {
      console.log("Not a recognized Telegram URL format:", url);
      return null;
    }
  } catch (error) {
    console.error(`Failed to extract chat ID: ${error.message}`);
    return null;
  }

  return chatId;
}
