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

// Helper function to send Telegram messages
async function sendTelegramMessage(chatId: string | number, text: string, botToken?: string) {
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
          parse_mode: 'HTML',
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
