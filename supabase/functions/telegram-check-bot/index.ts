
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
      console.error("Missing communityId in request:", body);
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
          success: false,
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
      
      let chatInfoResult;

      // If the first attempt fails, try alternative formats
      if (!chatInfoResponse.ok) {
        const errorInfo = await chatInfoResponse.text();
        console.log(`Initial chat info failed: ${errorInfo}. Trying alternative formats.`);

        // Try alternative formats
        const alternativeFormats = generateAlternativeChatIdFormats(communityData.platform_id);
        let successfulChatId = null;
        
        for (const altFormat of alternativeFormats) {
          console.log(`Trying alternative chat ID format: ${altFormat}`);
          
          const altResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getChat`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: altFormat }),
            }
          );
          
          if (altResponse.ok) {
            const result = await altResponse.json();
            if (result.ok) {
              chatInfoResult = result;
              successfulChatId = altFormat;
              chatId = altFormat; // Update chatId to the working format
              
              // Update the community record with the working format
              await supabaseAdmin
                .from('communities')
                .update({ platform_id: successfulChatId })
                .eq('id', communityId);
                
              console.log(`Updated community with working chat ID format: ${successfulChatId}`);
              break;
            }
          }
        }
        
        if (!chatInfoResult) {
          return new Response(JSON.stringify({ 
            success: false,
            error: "Chat not found. Please check the group ID or make sure the bot has been added to the group.",
            inviteLink: await generateBotInviteLink(botInfoResult.result.username, communityData.platform_id),
            suggestedFormat: getSuggestedChatIdFormat(communityData.platform_id)
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        chatInfoResult = await chatInfoResponse.json();
        if (!chatInfoResult.ok) {
          return new Response(JSON.stringify({ 
            success: false,
            error: chatInfoResult.description || "Failed to get chat information", 
            inviteLink: await generateBotInviteLink(botInfoResult.result.username, chatId),
            suggestedFormat: getSuggestedChatIdFormat(chatId)
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      console.log("Chat info:", JSON.stringify(chatInfoResult));
      
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
          success: false,
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
              
              // Update community record with member count and verified platform_id
              await supabaseAdmin
                .from('communities')
                .update({ 
                  reach: memberCount,
                  platform_id: chatId  // Use the verified working chat ID
                })
                .eq('id', communityId);
              
              console.log(`Updated community with member count ${memberCount} and platform_id ${chatId}`);
            }
          }
        } catch (error) {
          console.error("Error fetching additional chat info:", error);
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true,
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
        success: false, 
        error: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Error checking Telegram bot status:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
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

// Generate alternative formats to try for a chat ID
function generateAlternativeChatIdFormats(chatId: string): string[] {
  if (!chatId) return [];
  
  const formats = [];
  chatId = chatId.trim();
  
  // Remove @ if it exists
  if (chatId.startsWith('@')) {
    formats.push(chatId.substring(1));
  } else {
    // Add @ if it doesn't exist and looks like a username
    if (!chatId.startsWith('-') && isNaN(Number(chatId))) {
      formats.push('@' + chatId);
    }
  }
  
  // Extract from URL
  if (chatId.includes('t.me/') || chatId.includes('telegram.me/')) {
    const parts = chatId.split('/');
    const username = parts[parts.length - 1].split('?')[0];
    formats.push(username);
    formats.push('@' + username);
  }
  
  // Try variations with and without hyphens for group ids
  if (chatId.startsWith('-')) {
    // Without the hyphen
    formats.push(chatId.substring(1));
  } else if (!isNaN(Number(chatId))) {
    // With a hyphen, if it's a number
    formats.push('-' + chatId);
  }
  
  // Remove duplicates and the original format
  return [...new Set(formats)].filter(format => format !== chatId);
}

// Normalize and process chat ID to work with Telegram API
function normalizeTelegramChatId(chatId: string): string {
  if (!chatId) return '';
  
  // Clean up the input
  chatId = chatId.trim();
  
  // Handle URLs - extract username or ID
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
  
  // Handle group username (should start with @)
  if (!chatId.startsWith('@') && !chatId.startsWith('-') && !chatId.startsWith('http') && isNaN(Number(chatId))) {
    console.log(`Adding @ prefix to ${chatId}`);
    chatId = '@' + chatId;
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
