
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Parse request body from Telegram
    const update = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));

    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get bot token from settings for later use
    const { data: settings } = await supabaseAdmin
      .from('platform_settings')
      .select('telegram_bot_token')
      .limit(1);
      
    if (!settings || settings.length === 0 || !settings[0].telegram_bot_token) {
      throw new Error('Bot token not configured');
    }
    
    const botToken = settings[0].telegram_bot_token;
    
    // Store bot information
    let botInfo;
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const result = await response.json();
      if (result.ok) {
        botInfo = result.result;
        console.log(`Bot Username: ${botInfo.username}, Bot ID: ${botInfo.id}`);
      } else {
        console.error(`Error getting bot info: ${result.description}`);
      }
    } catch (error) {
      console.error(`Error getting bot info: ${error.message}`);
    }
    
    // Handle different types of updates
    if (update.message) {
      const { message } = update;
      const chatId = message.chat.id;
      const text = message.text || '';
      
      // Handle commands
      if (text.startsWith('/')) {
        const command = text.split(' ')[0]; // Extract command part
        
        // Fetch command from database
        const { data: commandData, error: commandError } = await supabaseAdmin
          .from('bot_commands')
          .select('*')
          .eq('command', command)
          .maybeSingle();
          
        if (commandError) {
          console.error('Error fetching command:', commandError);
        } else if (commandData) {
          // Handle admin-only commands
          if (commandData.is_admin_only) {
            // Check if user is an admin by fetching platform_settings editor rights
            // For now, we'll just log and proceed
            console.log(`Admin command '${command}' received`);
          }
          
          // Special command handlers
          if (command === '/list_communities') {
            // Handle list_communities command
            const { data: communities } = await supabaseAdmin
              .from('communities')
              .select('*')
              .eq('platform', 'TELEGRAM');
              
            let response = commandData.response_template + '\n\n';
            
            if (communities && communities.length > 0) {
              communities.forEach((community, index) => {
                response += `${index + 1}. ${community.name}\n`;
                response += `  Members: ${community.reach || 'N/A'}\n`;
                response += `  Price: $${community.price_per_announcement} USDT\n`;
                if (community.description) {
                  response += `  Description: ${community.description.substring(0, 50)}...\n`;
                }
                response += '\n';
              });
            } else {
              response += 'No communities available.';
            }
            
            // Send response back to Telegram
            await sendTelegramMessage(chatId, response, botToken);
          } else if (command === '/check_admin_status') {
            // New command to check if bot is admin in the current group
            if (message.chat.type === 'group' || message.chat.type === 'supergroup') {
              const isAdmin = await isBotAdminInGroup(chatId, botToken, botInfo?.id);
              
              if (isAdmin) {
                await sendTelegramMessage(chatId, "✅ I have administrator rights in this group.", botToken);
              } else {
                await sendTelegramMessage(chatId, "⚠️ I don't have administrator rights in this group. Please make me an administrator to use all features.", botToken);
              }
            } else {
              await sendTelegramMessage(chatId, "This command can only be used in groups.", botToken);
            }
          } else if (command === '/my_communities') {
            // NEW COMMAND: List communities where the bot is present
            await listBotCommunities(chatId, botToken);
          } else if (command === '/generate_invite') {
            // NEW COMMAND: Generate invite link to add bot to groups
            const botUsername = botInfo?.username;
            if (botUsername) {
              const inviteUrl = `https://t.me/${botUsername}?startgroup=true`;
              await sendTelegramMessage(
                chatId, 
                `Use this link to add me to your group:\n\n${inviteUrl}\n\nAfter adding me, please make me an administrator to enable all features.`, 
                botToken
              );
            } else {
              await sendTelegramMessage(chatId, "Couldn't generate invite link. Please try again later.", botToken);
            }
          } else if (command === '/community_stats') {
            // NEW COMMAND: Get community statistics
            if (message.chat.type === 'group' || message.chat.type === 'supergroup') {
              await getCommunityStats(chatId, botToken);
            } else {
              await sendTelegramMessage(chatId, "This command can only be used in groups.", botToken);
            }
          } else if (command === '/member_count') {
            // NEW COMMAND: Get number of members in the community
            if (message.chat.type === 'group' || message.chat.type === 'supergroup') {
              await getMemberCount(chatId, botToken);
            } else {
              await sendTelegramMessage(chatId, "This command can only be used in groups.", botToken);
            }
          } else {
            // Standard command response
            await sendTelegramMessage(chatId, commandData.response_template, botToken);
          }
        } else {
          console.log(`Unknown command received: ${command}`);
          await sendTelegramMessage(chatId, "Sorry, I don't understand that command.", botToken);
        }
      }
    }

    // Always respond with status 200 to Telegram
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to check if bot is admin in group
async function isBotAdminInGroup(chatId: string | number, botToken: string, botId?: number) {
  try {
    if (!botId) {
      // Get bot info if not provided
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
        { method: 'GET' }
      );
      
      const result = await response.json();
      if (!result.ok) return false;
      
      botId = result.result.id;
    }
    
    const chatMemberResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          user_id: botId 
        }),
      }
    );
    
    const chatMember = await chatMemberResponse.json();
    
    if (!chatMember.ok) return false;
    
    return (
      chatMember.result.status === "administrator" || 
      chatMember.result.status === "creator"
    );
  } catch (error) {
    console.error("Error checking bot admin status:", error);
    return false;
  }
}

// NEW FUNCTION: List all communities where the bot is a member
async function listBotCommunities(chatId: string | number, botToken: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get all communities from the database
    const { data: communities, error } = await supabaseAdmin
      .from('communities')
      .select('*')
      .eq('platform', 'TELEGRAM');

    if (error) {
      console.error("Error fetching communities:", error);
      await sendTelegramMessage(chatId, "Failed to fetch communities. Please try again later.", botToken);
      return;
    }

    if (!communities || communities.length === 0) {
      await sendTelegramMessage(chatId, "No Telegram communities found in the database.", botToken);
      return;
    }

    // Check bot status in each community and build the response
    let response = "📊 *BOT COMMUNITIES STATUS*\n\n";
    
    for (const community of communities) {
      try {
        // Skip if no platform_id is available
        if (!community.platform_id) continue;
        
        // Check if bot is a member and admin in this community
        const isAdmin = await isBotAdminInGroup(community.platform_id, botToken);
        const statusEmoji = isAdmin ? "✅" : "⚠️";
        
        response += `${statusEmoji} *${community.name}*\n`;
        response += `   ID: ${community.platform_id}\n`;
        response += `   Status: ${isAdmin ? "Admin" : "Not Admin"}\n\n`;
      } catch (error) {
        console.error(`Error checking status for community ${community.id}:`, error);
        response += `❌ *${community.name}*: Error checking status\n\n`;
      }
    }

    await sendTelegramMessage(chatId, response, botToken, "Markdown");
  } catch (error) {
    console.error("Error listing bot communities:", error);
    await sendTelegramMessage(chatId, "An error occurred while processing your request.", botToken);
  }
}

// NEW FUNCTION: Get community statistics
async function getCommunityStats(chatId: string | number, botToken: string) {
  try {
    // Get chat info
    const chatInfoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    if (!chatInfoResponse.ok) {
      await sendTelegramMessage(chatId, "Failed to fetch group information.", botToken);
      return;
    }

    const chatInfo = await chatInfoResponse.json();
    
    // Get member count
    const memberCountResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMemberCount`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    if (!memberCountResponse.ok) {
      await sendTelegramMessage(chatId, "Failed to fetch member count.", botToken);
      return;
    }

    const memberCount = await memberCountResponse.json();

    // Calculate engagement based on message history (pseudocode)
    let messageCount = 0;
    let activeUsers = 0;
    
    // This would need actual data from the chat history
    // In a real implementation, we would store and analyze message events
    
    // For now, we'll provide a placeholder response
    const response = `
📊 *Community Statistics*

*Group Name:* ${chatInfo.result.title}
*Type:* ${chatInfo.result.type}
*Total Members:* ${memberCount.result}
${chatInfo.result.description ? `*Description:* ${chatInfo.result.description}\n` : ''}

*Engagement Metrics*
This is a placeholder for engagement metrics. To implement actual metrics, we need to:
1. Store message history in a database
2. Analyze frequency and types of interactions
3. Identify most active users and peak activity times
    `;

    await sendTelegramMessage(chatId, response, botToken, "Markdown");
  } catch (error) {
    console.error("Error fetching community stats:", error);
    await sendTelegramMessage(chatId, "An error occurred while fetching community statistics.", botToken);
  }
}

// NEW FUNCTION: Get number of members in the community
async function getMemberCount(chatId: string | number, botToken: string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMemberCount`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    if (data.ok) {
      await sendTelegramMessage(
        chatId, 
        `This group has *${data.result}* members.`,
        botToken,
        "Markdown"
      );
    } else {
      throw new Error(`Telegram API returned error: ${data.description}`);
    }
  } catch (error) {
    console.error("Error getting member count:", error);
    await sendTelegramMessage(
      chatId, 
      "Failed to get member count. Make sure I am an administrator in this group.",
      botToken
    );
  }
}

// Helper function to send Telegram messages
async function sendTelegramMessage(chatId: string | number, text: string, botToken?: string, parseMode: string = 'HTML') {
  try {
    if (!botToken) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      // Create Supabase client
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      
      // Get bot token from settings
      const { data: settings } = await supabaseAdmin
        .from('platform_settings')
        .select('telegram_bot_token')
        .limit(1);
        
      if (!settings || settings.length === 0 || !settings[0].telegram_bot_token) {
        throw new Error('Bot token not configured');
      }
      
      botToken = settings[0].telegram_bot_token;
    }
    
    // Send message via Telegram API
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: parseMode,
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

// Helper function to extract chat ID from Telegram URL
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
        in: (column: string, values: any[]) => {
          const valuesStr = values.join(',');
          return fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=in.(${valuesStr})`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
          }).then(res => res.json());
        },
        maybeSingle: () => fetch(`${url}/rest/v1/${table}?select=${columns}&limit=1`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        }).then(async res => {
          const data = await res.json();
          return { data: data.length > 0 ? data[0] : null, error: null };
        }).catch(error => ({ data: null, error }))
      }),
      insert: (data: any) => fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      }).then(async res => {
        if (!res.ok) {
          const error = await res.json();
          return { data: null, error };
        }
        const responseData = await res.json();
        return { data: responseData, error: null };
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => fetch(`${url}/rest/v1/${table}?${column}=eq.${value}`, {
          method: 'PATCH',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(data)
        }).then(async res => {
          if (!res.ok) {
            const error = await res.json();
            return { data: null, error };
          }
          const responseData = await res.json();
          return { data: responseData, error: null };
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => fetch(`${url}/rest/v1/${table}?${column}=eq.${value}`, {
          method: 'DELETE',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.ok ? { error: null } : res.json().then(error => ({ error })))
      })
    }),
  };
};
