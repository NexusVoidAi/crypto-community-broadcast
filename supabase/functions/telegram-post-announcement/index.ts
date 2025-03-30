
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  try {
    const { announcementId } = await req.json();
    
    if (!announcementId) {
      throw new Error('Missing announcement ID');
    }
    
    // Create a Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get platform settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('platform_settings')
      .select('telegram_bot_token, telegram_bot_username')
      .single();
      
    if (settingsError) throw settingsError;
    
    if (!settings?.telegram_bot_token) {
      throw new Error('Telegram bot token not configured');
    }
    
    const botToken = settings.telegram_bot_token;
    
    // Get announcement data
    const { data: announcement, error: announcementError } = await supabaseAdmin
      .from('announcements')
      .select('*, announcement_communities(community_id)')
      .eq('id', announcementId)
      .single();
      
    if (announcementError) throw announcementError;
    
    // Get communities data
    const communityIds = announcement.announcement_communities.map((ac: any) => ac.community_id);
    
    const { data: communities, error: communitiesError } = await supabaseAdmin
      .from('communities')
      .select('id, platform, platform_id')
      .in('id', communityIds)
      .eq('platform', 'TELEGRAM');
      
    if (communitiesError) throw communitiesError;
    
    // Format the announcement message
    let message = `📢 *${announcement.title}*\n\n${announcement.content}`;
    
    if (announcement.cta_text && announcement.cta_url) {
      message += `\n\n[${announcement.cta_text}](${announcement.cta_url})`;
    }
    
    // Post to each Telegram group
    const postResults = await Promise.all(
      communities.map(async (community) => {
        try {
          // Send message to telegram group
          const telegramResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: community.platform_id,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: false
              }),
            }
          );
          
          const telegramResult = await telegramResponse.json();
          
          if (!telegramResult.ok) {
            throw new Error(`Telegram error: ${telegramResult.description}`);
          }
          
          // Update announcement_communities with delivered status
          await supabaseAdmin
            .from('announcement_communities')
            .update({
              delivered: true,
              delivery_log: telegramResult
            })
            .eq('announcement_id', announcementId)
            .eq('community_id', community.id);
          
          return {
            community_id: community.id,
            success: true,
            message_id: telegramResult.result.message_id
          };
        } catch (error) {
          console.error(`Error posting to community ${community.id}:`, error);
          
          // Update announcement_communities with failed status
          await supabaseAdmin
            .from('announcement_communities')
            .update({
              delivered: false,
              delivery_log: { error: error.message }
            })
            .eq('announcement_id', announcementId)
            .eq('community_id', community.id);
          
          return {
            community_id: community.id,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    return new Response(JSON.stringify({ success: true, results: postResults }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error posting announcement to Telegram:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

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
        }),
        in: (column: string, values: any[]) => ({
          eq: (column2: string, value: any) => fetch(`${url}/rest/v1/${table}?select=${columns}&${column}=in.(${values.join(',')})&${column2}=eq.${value}`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            },
          }).then(res => res.json().then(data => ({ data, error: null }))),
        }),
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
