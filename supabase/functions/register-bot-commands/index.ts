
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
      
    if (settingsError || !settingsData || !settingsData.telegram_bot_token) {
      throw new Error('Failed to fetch platform settings or missing bot token');
    }
    
    const botToken = settingsData.telegram_bot_token;
    
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
      }
    ];
    
    // Insert commands to database
    for (const cmd of commands) {
      // Check if command already exists
      const { data: existingCommand } = await supabaseAdmin
        .from('bot_commands')
        .select('*')
        .eq('command', cmd.command)
        .maybeSingle();
      
      if (!existingCommand) {
        await supabaseAdmin
          .from('bot_commands')
          .insert([cmd]);
      } else {
        // Update existing command
        await supabaseAdmin
          .from('bot_commands')
          .update(cmd)
          .eq('command', cmd.command);
      }
    }
    
    // Register commands with Telegram
    const telegramCommands = commands.map(cmd => ({
      command: cmd.command.substring(1), // Remove the "/" prefix
      description: cmd.description
    }));
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setMyCommands`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands: telegramCommands
        }),
      }
    );
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Failed to register commands with Telegram: ${result.description}`);
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

// Helper function to create Supabase client in Deno
const createClient = (url: string, key: string) => {
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
        }).then(res => res.json()),
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
      })
    })
  };
};
