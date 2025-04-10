
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get platform settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('platform_settings')
      .select('telegram_bot_token')
      .maybeSingle();
      
    if (settingsError) {
      console.error("Error fetching platform settings:", settingsError);
      throw new Error('Failed to fetch platform settings');
    }
    
    if (!settingsData || !settingsData.telegram_bot_token) {
      throw new Error('Failed to fetch platform settings or missing bot token');
    }
    
    const botToken = settingsData.telegram_bot_token;
    console.log("Got bot token, registering commands");
    
    // Define new commands to register
    const commands = [
      {
        command: '/my_communities',
        description: 'List all communities where the bot is added',
        response_template: '📊 Checking communities where I am present...',
        is_admin_only: true
      },
      {
        command: '/generate_invite',
        description: 'Generate a link to add the bot to a group',
        response_template: 'Generating invite link...',
        is_admin_only: false
      },
      {
        command: '/community_stats',
        description: 'Get statistics about this community',
        response_template: 'Analyzing community statistics...',
        is_admin_only: false
      },
      {
        command: '/member_count',
        description: 'Get the number of members in this community',
        response_template: 'Counting members...',
        is_admin_only: false
      },
      // Add a test command to check if bot is working
      {
        command: '/hello',
        description: 'Check if the bot is responding',
        response_template: 'Hello! I am up and running. 👋',
        is_admin_only: false
      },
      {
        command: '/check_admin_status',
        description: 'Check if the bot is an admin in this group',
        response_template: 'Checking admin status...',
        is_admin_only: false
      }
    ];
    
    // Insert commands to database
    for (const cmd of commands) {
      console.log(`Processing command: ${cmd.command}`);
      // Check if command already exists
      const { data: existingCommands } = await supabaseAdmin
        .from('bot_commands')
        .select('*')
        .eq('command', cmd.command);
      
      if (!existingCommands || existingCommands.length === 0) {
        console.log(`Command ${cmd.command} does not exist, creating...`);
        const { error: insertError } = await supabaseAdmin
          .from('bot_commands')
          .insert([cmd]);
          
        if (insertError) {
          console.error(`Error inserting command ${cmd.command}:`, insertError);
        } else {
          console.log(`Command ${cmd.command} inserted successfully`);
        }
      } else {
        console.log(`Command ${cmd.command} already exists, updating...`);
        // Update existing command
        const { error: updateError } = await supabaseAdmin
          .from('bot_commands')
          .update(cmd)
          .eq('command', cmd.command);
          
        if (updateError) {
          console.error(`Error updating command ${cmd.command}:`, updateError);
        } else {
          console.log(`Command ${cmd.command} updated successfully`);
        }
      }
    }
    
    // Register commands with Telegram
    const telegramCommands = commands.map(cmd => ({
      command: cmd.command.substring(1), // Remove the "/" prefix
      description: cmd.description
    }));
    
    console.log("Sending commands to Telegram API:", JSON.stringify(telegramCommands));
    
    try {
      // First, register global commands (available in private chats)
      const globalResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/setMyCommands`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commands: telegramCommands.filter(cmd => 
              !cmd.command.includes('community_stats') && 
              !cmd.command.includes('member_count') &&
              !cmd.command.includes('check_admin_status')
            )
          }),
        }
      );
      
      if (!globalResponse.ok) {
        const errorText = await globalResponse.text();
        console.error("Error response from Telegram API (global commands):", errorText);
        throw new Error(`Telegram API responded with status ${globalResponse.status}: ${errorText}`);
      }
      
      const globalResult = await globalResponse.json();
      console.log("Telegram API response (global commands):", JSON.stringify(globalResult));
      
      // Now register group-specific commands
      const groupResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/setMyCommands`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commands: telegramCommands.filter(cmd => 
              !cmd.command.includes('my_communities') && 
              !cmd.command.includes('generate_invite')
            ),
            scope: {
              type: 'all_group_chats'
            }
          }),
        }
      );
      
      if (!groupResponse.ok) {
        const errorText = await groupResponse.text();
        console.error("Error response from Telegram API (group commands):", errorText);
      } else {
        const groupResult = await groupResponse.json();
        console.log("Telegram API response (group commands):", JSON.stringify(groupResult));
      }
      
      // Additionally, let's update our bot's description and about info
      const aboutText = "I help manage ACHO AI communities and distribute announcements. Add me to your group to connect with the ACHO platform!";
      
      try {
        const aboutResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/setMyDescription`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              description: aboutText
            }),
          }
        );
        
        if (!aboutResponse.ok) {
          console.error("Error setting bot description:", await aboutResponse.text());
        } else {
          console.log("Bot description updated successfully");
        }
      } catch (error) {
        console.error("Error updating bot description:", error);
      }
      
      // Also get and store the bot's username
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
        
        if (botInfoResponse.ok) {
          const botInfo = await botInfoResponse.json();
          if (botInfo.ok && botInfo.result.username) {
            // Store the bot username in platform_settings
            await supabaseAdmin
              .from('platform_settings')
              .update({
                telegram_bot_username: botInfo.result.username
              })
              .eq('id', settingsData.id || 1);
              
            console.log(`Updated bot username in platform settings: ${botInfo.result.username}`);
          }
        }
      } catch (error) {
        console.error("Error getting bot info:", error);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Bot commands registered successfully',
          registeredCommands: commands.length
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error registering commands with Telegram:", error);
      throw error;
    }
  } catch (error) {
    console.error('Error registering bot commands:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
