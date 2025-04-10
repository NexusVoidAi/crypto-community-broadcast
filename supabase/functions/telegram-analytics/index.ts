
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatStats {
  chat_id: string;
  total_messages: number;
  active_users: number;
  avg_messages_per_day: number;
  last_activity_date: string;
  top_active_users: string[];
  peak_hours: number[];
  engagement_rate: number;
  member_count: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  try {
    const { communityId } = await req.json();
    
    if (!communityId) {
      throw new Error('Missing community ID');
    }
    
    console.log(`Generating analytics for community ID: ${communityId}`);
    
    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get platform settings for bot token
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('platform_settings')
      .select('telegram_bot_token')
      .maybeSingle();
      
    if (settingsError || !settingsData) {
      throw new Error('Failed to fetch platform settings');
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
      
    if (communityError || !communityData) {
      throw new Error('Failed to fetch community data');
    }
    
    // Ensure it's a Telegram community
    if (communityData.platform !== 'TELEGRAM' || !communityData.platform_id) {
      throw new Error('Not a valid Telegram community');
    }
    
    // Normalize and process the chat ID
    const chatId = normalizeTelegramChatId(communityData.platform_id);
    console.log(`Using normalized chat ID for analytics: ${chatId}`);
    
    // Get chat information first to verify the chat exists
    const chatInfoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );
    
    if (!chatInfoResponse.ok) {
      const errorInfo = await chatInfoResponse.text();
      console.error(`Failed to get chat info: ${errorInfo}`);
      throw new Error(`Chat not found or bot doesn't have access: ${errorInfo}`);
    }
    
    const chatInfoResult = await chatInfoResponse.json();
    if (!chatInfoResult.ok) {
      throw new Error(`Failed to get chat info: ${chatInfoResult.description}`);
    }
    
    let chatInfo = chatInfoResult.result;
    
    // Get member count
    let memberCount = 0;
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
            platform_id: chatInfo.id.toString()
          })
          .eq('id', communityId);
      } else {
        console.error(`Failed to get member count: ${memberCountResult.description}`);
      }
    } else {
      console.error(`Failed to get member count: ${await memberCountResponse.text()}`);
    }
    
    // For now, generate placeholder statistics
    // In a real implementation, we would analyze stored message data
    const stats: ChatStats = {
      chat_id: chatId,
      total_messages: Math.floor(Math.random() * 1000) + 100, // Placeholder
      active_users: Math.floor(Math.random() * 100) + 10, // Placeholder
      avg_messages_per_day: Math.floor(Math.random() * 50) + 5, // Placeholder
      last_activity_date: new Date().toISOString(),
      top_active_users: ['user1', 'user2', 'user3'], // Placeholder
      peak_hours: [9, 12, 18, 20], // Placeholder
      engagement_rate: Math.random() * 0.5 + 0.1, // Placeholder (10-60%)
      member_count: memberCount
    };
    
    // Return community analytics
    return new Response(
      JSON.stringify({
        success: true,
        stats,
        chatInfo
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error generating community analytics:', error);
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
