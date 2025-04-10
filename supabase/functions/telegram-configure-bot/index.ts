
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
    const body = await req.json();
    const token = body.token;
    
    if (!token) {
      throw new Error('Missing bot token');
    }
    
    // Get bot username directly from Telegram
    let username;
    try {
      const getMeResponse = await fetch(
        `https://api.telegram.org/bot${token}/getMe`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const getMeResult = await getMeResponse.json();
      if (getMeResult.ok) {
        username = getMeResult.result.username;
        console.log(`Retrieved bot username: ${username}`);
      } else {
        throw new Error(`Failed to get bot info: ${getMeResult.description}`);
      }
    } catch (error) {
      console.error("Error getting bot info:", error);
      throw new Error(`Could not get bot info: ${error.message}`);
    }
    
    // Set up webhook to receive updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const projectName = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    
    if (!projectName) {
      throw new Error('Failed to determine Supabase project name');
    }
    
    const webhookUrl = `https://${projectName}.functions.supabase.co/telegram-webhook`;
    
    // Set webhook
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
        }),
      }
    );
    
    const telegramResult = await telegramResponse.json();
    
    if (!telegramResult.ok) {
      throw new Error(`Failed to set webhook: ${telegramResult.description}`);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      webhook: webhookUrl,
      result: telegramResult,
      username: username
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error configuring Telegram bot:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
