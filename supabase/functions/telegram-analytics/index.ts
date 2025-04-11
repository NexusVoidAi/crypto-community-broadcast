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
    const { communityId, announcementId, action } = await req.json();
    
    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // If this is a tracking request for views or clicks
    if (announcementId && action) {
      console.log(`Tracking ${action} for announcement ${announcementId} in community ${communityId}`);
      
      // Find the announcement_community record
      const { data: acData, error: acError } = await supabaseAdmin
        .from('announcement_communities')
        .select('id, views, clicks')
        .eq('announcement_id', announcementId)
        .eq('community_id', communityId)
        .single();
        
      if (acError || !acData) {
        console.error("Error finding announcement_community:", acError);
        return new Response(
          JSON.stringify({ success: false, error: "Announcement-community relation not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Update the views or clicks count
      const updateData = action === 'view' 
        ? { views: (acData.views || 0) + 1 }
        : { clicks: (acData.clicks || 0) + 1 };
        
      const { error: updateError } = await supabaseAdmin
        .from('announcement_communities')
        .update(updateData)
        .eq('id', acData.id);
        
      if (updateError) {
        console.error("Error updating metrics:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update metrics" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Also update the announcement table to track overall metrics
      if (action === 'view' || action === 'click') {
        const metricsField = action === 'view' ? 'impressions' : 'clicks';
        
        // Get current announcement data
        const { data: announcementData, error: announcementError } = await supabaseAdmin
          .from('announcements')
          .select(`id, ${metricsField}`)
          .eq('id', announcementId)
          .single();
          
        if (!announcementError && announcementData) {
          const currentValue = announcementData[metricsField] || 0;
          
          // Update the announcement metrics
          await supabaseAdmin
            .from('announcements')
            .update({ [metricsField]: currentValue + 1 })
            .eq('id', announcementId);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${action} tracked successfully`,
          data: {
            ...acData,
            ...updateData
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If this is a general analytics request
    if (!communityId) {
      throw new Error('Missing community ID');
    }
    
    console.log(`Generating analytics for community ID: ${communityId}`);
    
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
      
      // Try alternative formats if the first attempt failed
      const alternativeFormats = generateAlternativeChatIdFormats(communityData.platform_id);
      let chatInfoResult = null;
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
        throw new Error(`Chat not found or bot doesn't have access: ${errorInfo}`);
      }
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
    
    // Get announcement metrics for this community
    const { data: announcementData, error: announcementError } = await supabaseAdmin
      .from('announcement_communities')
      .select(`
        id,
        announcement_id,
        views,
        clicks,
        created_at,
        announcement:announcements (
          title,
          content,
          status,
          created_at
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });
      
    if (announcementError) {
      console.error("Error fetching announcement metrics:", announcementError);
    }
    
    // For now, generate placeholder statistics
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
        chatInfo,
        announcements: announcementData || []
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
