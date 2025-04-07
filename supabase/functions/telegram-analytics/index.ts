
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
    
    const chatId = communityData.platform_id;
    
    // Get member count
    const memberCountResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMemberCount`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );
    
    let memberCount = 0;
    if (memberCountResponse.ok) {
      const memberCountResult = await memberCountResponse.json();
      if (memberCountResult.ok) {
        memberCount = memberCountResult.result;
      }
    }
    
    // Get chat information
    const chatInfoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );
    
    let chatInfo = null;
    if (chatInfoResponse.ok) {
      const chatInfoResult = await chatInfoResponse.json();
      if (chatInfoResult.ok) {
        chatInfo = chatInfoResult.result;
      }
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
    
    // Update community record with member count if available
    if (memberCount > 0) {
      await supabaseAdmin
        .from('communities')
        .update({ reach: memberCount })
        .eq('id', communityId);
    }
    
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

// Helper function to create Supabase client in Deno
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
