
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
    // Parse the request body
    const update = await req.json();
    console.log("Received update:", JSON.stringify(update));

    // Extract environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Create a simple Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Process message or callback query
    if (update.message) {
      // Get platform settings to retrieve bot token
      const { data: settings } = await supabaseAdmin
        .from('platform_settings')
        .select('telegram_bot_token, telegram_bot_username')
        .single();
        
      const botToken = settings?.telegram_bot_token;
      if (!botToken) {
        console.error("Bot token not found in platform settings");
        return new Response(JSON.stringify({ success: false, error: "Bot token not configured" }), 
          { status: 200, headers: corsHeaders });
      }
      
      // Handle commands
      if (update.message.entities && update.message.entities.some(e => e.type === 'bot_command')) {
        console.log("Processing command message");
        
        const commandEntity = update.message.entities.find(e => e.type === 'bot_command');
        const messageText = update.message.text;
        const command = messageText.substring(commandEntity.offset, commandEntity.offset + commandEntity.length);
        const params = messageText.substring(commandEntity.offset + commandEntity.length).trim();
        
        console.log(`Command detected: ${command}, Parameters: ${params}`);
        
        // Get the command from the database
        const { data: commandData } = await supabaseAdmin
          .from('bot_commands')
          .select('*')
          .eq('command', command)
          .maybeSingle();
          
        if (!commandData) {
          console.log(`Command ${command} not found in database`);
          
          // Check if it's a standard hello command
          if (command === '/hello' || command === '/start') {
            await sendTelegramMessage(
              botToken,
              update.message.chat.id, 
              "👋 Hello! I am the ACHO AI bot. I help manage communities and distribute announcements."
            );
          }
          
          return new Response(JSON.stringify({ success: true }), 
            { status: 200, headers: corsHeaders });
        }
        
        console.log(`Found command in database: ${commandData.command}`);
        
        // Check if command is admin-only and validate sender is admin
        if (commandData.is_admin_only) {
          const isAdmin = await isChatAdmin(botToken, update.message.chat.id, update.message.from.id);
          if (!isAdmin) {
            await sendTelegramMessage(
              botToken,
              update.message.chat.id,
              "⛔ This command can only be used by group administrators."
            );
            return new Response(JSON.stringify({ success: true }), 
              { status: 200, headers: corsHeaders });
          }
        }
        
        // Send initial response from template
        if (commandData.response_template) {
          await sendTelegramMessage(
            botToken,
            update.message.chat.id,
            commandData.response_template
          );
        }
        
        // Process specific commands
        switch (command) {
          case '/hello':
            await sendTelegramMessage(
              botToken,
              update.message.chat.id,
              "👋 Hello! I am the ACHO AI bot. I help manage communities and distribute announcements."
            );
            break;
            
          case '/check_admin_status':
            const botInfo = await getBotInfo(botToken);
            if (botInfo) {
              const isAdmin = await isBotAdminInGroup(update.message.chat.id, botToken, botInfo.id);
              await sendTelegramMessage(
                botToken,
                update.message.chat.id,
                isAdmin 
                  ? "✅ I am an admin in this group and can post announcements."
                  : "⚠️ I am NOT an admin in this group. Please make me an admin so I can post announcements properly."
              );
            } else {
              await sendTelegramMessage(
                botToken,
                update.message.chat.id,
                "❌ Could not check my admin status due to an error."
              );
            }
            break;
            
          case '/my_communities':
            // This command shows communities the bot is in
            const chatInfo = await getChatInfo(botToken, update.message.chat.id);
            if (chatInfo && chatInfo.ok) {
              // Check if this community is already registered
              const { data: existingCommunity } = await supabaseAdmin
                .from('communities')
                .select('id, name')
                .eq('platform_id', update.message.chat.id.toString())
                .eq('platform', 'TELEGRAM')
                .maybeSingle();
                
              if (existingCommunity) {
                await sendTelegramMessage(
                  botToken,
                  update.message.chat.id,
                  `✅ This community is registered in the ACHO platform as: *${existingCommunity.name}*`
                );
              } else {
                await sendTelegramMessage(
                  botToken,
                  update.message.chat.id,
                  "⚠️ This community is not yet registered in the ACHO platform. Contact an administrator to add it."
                );
              }
            }
            break;
            
          case '/member_count':
            const chatMemberCount = await getChatMemberCount(botToken, update.message.chat.id);
            if (chatMemberCount && chatMemberCount.ok) {
              await sendTelegramMessage(
                botToken,
                update.message.chat.id,
                `👥 This community has *${chatMemberCount.result}* members.`
              );
              
              // Update the reach in the database if this community exists
              const { data: communityToUpdate } = await supabaseAdmin
                .from('communities')
                .select('id')
                .eq('platform_id', update.message.chat.id.toString())
                .eq('platform', 'TELEGRAM')
                .maybeSingle();
                
              if (communityToUpdate) {
                await supabaseAdmin
                  .from('communities')
                  .update({ reach: chatMemberCount.result })
                  .eq('id', communityToUpdate.id);
              }
            } else {
              await sendTelegramMessage(
                botToken,
                update.message.chat.id,
                "❌ Could not get member count. Make sure I have the right permissions."
              );
            }
            break;
            
          case '/community_stats':
            const stats = await getChatInfo(botToken, update.message.chat.id);
            if (stats && stats.ok) {
              const memberCount = await getChatMemberCount(botToken, update.message.chat.id);
              let statsMessage = `📊 *COMMUNITY STATISTICS*\n\n`;
              statsMessage += `*Name:* ${stats.result.title || stats.result.username || 'Unknown'}\n`;
              statsMessage += `*Type:* ${stats.result.type || 'Unknown'}\n`;
              statsMessage += `*Members:* ${memberCount && memberCount.ok ? memberCount.result : 'Unknown'}\n`;
              
              if (stats.result.username) {
                statsMessage += `*Username:* @${stats.result.username}\n`;
              }
              
              // Check ACHO registration status
              const { data: registeredCommunity } = await supabaseAdmin
                .from('communities')
                .select('id, name, price_per_announcement, approval_status')
                .eq('platform_id', update.message.chat.id.toString())
                .eq('platform', 'TELEGRAM')
                .maybeSingle();
              
              if (registeredCommunity) {
                statsMessage += `\n✅ *Registered in ACHO AI*\n`;
                statsMessage += `*ACHO Name:* ${registeredCommunity.name}\n`;
                statsMessage += `*Status:* ${registeredCommunity.approval_status}\n`;
                if (registeredCommunity.price_per_announcement) {
                  statsMessage += `*Price:* $${registeredCommunity.price_per_announcement}\n`;
                }
              } else {
                statsMessage += `\n⚠️ *Not registered in ACHO AI*\n`;
                statsMessage += `Contact an administrator to register this community.`;
              }
              
              await sendTelegramMessage(botToken, update.message.chat.id, statsMessage);
            } else {
              await sendTelegramMessage(
                botToken,
                update.message.chat.id,
                "❌ Could not retrieve community statistics."
              );
            }
            break;
        }
      } 
      // Handle new chat member (bot added to group)
      else if (update.message.new_chat_member && 
               update.message.new_chat_member.is_bot && 
               update.message.new_chat_member.username === settings?.telegram_bot_username) {
        console.log("Bot was added to a new group!");
        
        // Get chat info
        const chatInfo = await getChatInfo(botToken, update.message.chat.id);
        if (chatInfo && chatInfo.ok) {
          // Send welcome message
          await sendTelegramMessage(
            botToken,
            update.message.chat.id,
            `👋 Hello! I am the ACHO AI bot. I have been added to this group and will help distribute announcements.\n\nFor this community to receive announcements, it needs to be registered in the ACHO platform.\n\nPlease ask the community administrator to make me an *admin* so I can post announcements properly.`
          );
        }
      }
    } 
    
    // Return a 200 OK response to acknowledge receipt
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Helper function to send telegram messages
async function sendTelegramMessage(botToken: string, chatId: number | string, text: string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      }
    );
    
    const result = await response.json();
    if (!result.ok) {
      console.error("Error sending telegram message:", result.description);
    }
    return result;
  } catch (error) {
    console.error("Error sending telegram message:", error);
    return null;
  }
}

// Check if a user is admin in a chat
async function isChatAdmin(botToken: string, chatId: number | string, userId: number) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId
        })
      }
    );
    
    const result = await response.json();
    if (!result.ok) {
      return false;
    }
    
    return ['administrator', 'creator'].includes(result.result.status);
  } catch (error) {
    console.error("Error checking if user is admin:", error);
    return false;
  }
}

// Helper to check if bot is admin in group
async function isBotAdminInGroup(chatId: string | number, botToken: string, botId: number) {
  try {
    const response = await fetch(
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
    
    const result = await response.json();
    if (!result.ok) return false;
    
    return ['administrator', 'creator'].includes(result.result.status);
  } catch (error) {
    console.error("Error checking bot admin status:", error);
    return false;
  }
}

// Get bot information
async function getBotInfo(botToken: string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const result = await response.json();
    return result.ok ? result.result : null;
  } catch (error) {
    console.error("Error getting bot info:", error);
    return null;
  }
}

// Get chat information
async function getChatInfo(botToken: string, chatId: number | string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId })
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error getting chat info:", error);
    return null;
  }
}

// Get chat member count
async function getChatMemberCount(botToken: string, chatId: number | string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMemberCount`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId })
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error getting chat member count:", error);
    return null;
  }
}

// Helper to create Supabase client in Deno
const createClient = (url: string, key: string) => {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: () => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            },
          }).then(res => res.json().then(data => ({ data: data?.[0] || null, error: null }))),
          limit: (limit: number) => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=${limit}`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            },
          }).then(res => res.json().then(data => ({ data, error: null }))),
          maybeSingle: () => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            },
          }).then(res => res.json().then(data => ({ 
            data: data && data.length > 0 ? data[0] : null, 
            error: null 
          }))),
        }),
        in: (column: string, values: any[]) => ({
          eq: (column2: string, value: any) => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=in.(${values.join(',')})&${column2}=eq.${value}`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            },
          }).then(res => res.json().then(data => ({ data, error: null }))),
          maybeSingle: () => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=in.(${values.join(',')})&limit=1`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            }, 
          }).then(res => res.json().then(data => ({ 
            data: data && data.length > 0 ? data[0] : null, 
            error: null 
          }))),
        }),
        maybeSingle: () => fetch(`${url}/rest/v1/${table}?select=${columns}&limit=1`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
          },
        }).then(res => res.json().then(data => ({ 
          data: data && data.length > 0 ? data[0] : null, 
          error: null 
        }))),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => fetch(`${url}/rest/v1/${table}?${column}=eq.${value}`, {
          method: 'PATCH',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(data),
        }).then(res => ({ data: null, error: null })),
      }),
    }),
  };
};
