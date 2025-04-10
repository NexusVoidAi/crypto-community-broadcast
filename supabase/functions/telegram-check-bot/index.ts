
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
    
    // Normalize and process the chat ID
    let chatId = normalizeTelegramChatId(communityData.platform_id);
    console.log(`Normalized chat ID: ${chatId}`);
    
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
      
      // Try to get chat info first to see if this is a valid chat
      console.log(`Attempting to get chat info for: ${chatId}`);
      const chatInfoResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getChat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
          }),
        }
      );
      
      const chatInfoResult = await chatInfoResponse.json();
      console.log("Chat info response:", JSON.stringify(chatInfoResult));
      
      if (!chatInfoResult.ok) {
        // If chat not found and it looks like a username, try to update database with the correct ID
        if (chatId.startsWith('@') && chatInfoResult.description?.includes("chat not found")) {
          console.log(`Chat not found with username ${chatId}, trying to resolve username...`);
          // We might need to store this information for later or suggest updating the community record
        }
        
        return new Response(JSON.stringify({ 
          botAdded: false,
          error: chatInfoResult.description || "Failed to get chat information",
          inviteLink: await generateBotInviteLink(botInfoResult.result.username, chatId),
          suggestedFormat: getSuggestedChatIdFormat(chatId)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // If we got chat info successfully, get bot's membership status
      console.log("Chat found, checking bot membership status");
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
          inviteLink: await generateBotInviteLink(botInfoResult.result.username, chatId),
          chatInfo: chatInfoResult.result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Check if bot has admin rights
      const isAdmin = ['administrator', 'creator'].includes(telegramResult.result.status);
      
      // If bot is member but not admin, try to get chat info and member count
      let memberCount = null;
      let chatInfo = chatInfoResult.result;
      
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
                .update({ 
                  reach: memberCount,
                  // If the platform_id was in a different format than what worked, update it
                  platform_id: chatInfoResult.result.id.toString()
                })
                .eq('id', communityId);
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
        inviteLink: isAdmin ? null : await generateBotInviteLink(botInfoResult.result.username, chatId)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error('Error checking bot status:', error);
      return new Response(JSON.stringify({ 
        botAdded: false, 
        error: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Error checking Telegram bot status:', error);
    return new Response(JSON.stringify({ botAdded: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Generate a link for users to add the bot to their group
async function generateBotInviteLink(botUsername: string, chatId?: string): Promise<string> {
  if (!botUsername) {
    return "";
  }
  
  // If we have a valid chat ID that's not a username, we can't generate a direct invite
  // so we'll just return the general bot invite link
  return `https://t.me/${botUsername}?startgroup=true`;
}

// Normalize and process chat ID to work with Telegram API
function normalizeTelegramChatId(chatId: string): string {
  if (!chatId) return '';
  
  // Clean up the input
  chatId = chatId.trim();
  
  // Handle group username (should start with @)
  if (!chatId.startsWith('@') && !chatId.startsWith('-') && !chatId.startsWith('http') && isNaN(Number(chatId))) {
    console.log(`Adding @ prefix to ${chatId}`);
    chatId = '@' + chatId;
  }
  
  // Handle URLs
  if (chatId.includes('t.me/') || chatId.includes('telegram.me/')) {
    const parts = chatId.split('/');
    const username = parts[parts.length - 1].split('?')[0]; // Remove query parameters if any
    
    console.log(`Extracted username ${username} from URL ${chatId}`);
    
    // If username is numeric, it's likely a direct chat ID
    if (!isNaN(Number(username))) {
      return username;
    }
    
    return '@' + username;
  }
  
  return chatId;
}

// Get suggestion for correcting chat ID format
function getSuggestedChatIdFormat(chatId: string): string {
  if (!chatId) return '';
  
  // If doesn't start with @ and doesn't seem to be a numeric ID
  if (!chatId.startsWith('@') && !chatId.startsWith('-') && isNaN(Number(chatId))) {
    return `Try using "@${chatId}" for public groups or channels`;
  }
  
  // If it's already a username format
  if (chatId.startsWith('@')) {
    return `The format looks correct. Make sure the group or channel exists and is public.`;
  }
  
  // If it's a numeric ID
  if (!isNaN(Number(chatId))) {
    return `The format looks correct for a private chat ID. Make sure the bot has been added to this chat.`;
  }
  
  return '';
}
