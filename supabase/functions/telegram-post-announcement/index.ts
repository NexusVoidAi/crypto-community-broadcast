
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
    
    console.log(`Processing announcement ID: ${announcementId}`);
    
    // Create a Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get platform settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('platform_settings')
      .select('telegram_bot_token, telegram_bot_username')
      .single();
      
    if (settingsError) {
      console.error('Error fetching platform settings:', settingsError);
      throw settingsError;
    }
    
    if (!settings?.telegram_bot_token) {
      throw new Error('Telegram bot token not configured');
    }
    
    const botToken = settings.telegram_bot_token;
    
    // Get bot info first and cache it
    let botInfo;
    try {
      const botInfoResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const botInfoResult = await botInfoResponse.json();
      if (botInfoResult.ok) {
        botInfo = botInfoResult.result;
        console.log(`Bot Username: ${botInfo.username}, Bot ID: ${botInfo.id}`);
      } else {
        console.error(`Error getting bot info: ${botInfoResult.description}`);
      }
    } catch (error) {
      console.error(`Error getting bot info: ${error.message}`);
    }
    
    // Get announcement data
    const { data: announcement, error: announcementError } = await supabaseAdmin
      .from('announcements')
      .select('*, announcement_communities(community_id), announcement_media(url, type, caption)')
      .eq('id', announcementId)
      .single();
      
    if (announcementError) {
      console.error('Error fetching announcement:', announcementError);
      throw announcementError;
    }

    console.log('Fetched announcement data:', JSON.stringify(announcement));
    
    // Get communities data
    const communityIds = announcement.announcement_communities.map((ac) => ac.community_id);
    
    const { data: communities, error: communitiesError } = await supabaseAdmin
      .from('communities')
      .select('id, platform, platform_id, name')
      .in('id', communityIds)
      .eq('platform', 'TELEGRAM');
      
    if (communitiesError) {
      console.error('Error fetching communities:', communitiesError);
      throw communitiesError;
    }

    console.log(`Found ${communities.length} Telegram communities for announcement`);
    
    // Format the announcement message
    let message = `📢 *${announcement.title}*\n\n${announcement.content}`;
    
    // Add buttons if CTA is provided
    let inlineKeyboard;
    if (announcement.cta_text && announcement.cta_url) {
      inlineKeyboard = {
        inline_keyboard: [[{
          text: announcement.cta_text,
          url: announcement.cta_url
        }]]
      };
    }

    // Check if announcement has media
    const hasMedia = announcement.announcement_media && announcement.announcement_media.length > 0;
    
    // Post to each Telegram group
    const postResults = await Promise.all(
      communities.map(async (community) => {
        try {
          console.log(`Processing community ${community.name} (${community.platform_id})`);
          
          // First check if bot is admin in the group
          let isAdmin = false;
          if (botInfo) {
            try {
              isAdmin = await isBotAdminInGroup(community.platform_id, botToken, botInfo.id);
              if (!isAdmin) {
                console.log(`Bot is not admin in community ${community.platform_id}, but will still try to post`);
              } else {
                console.log(`Bot is admin in community ${community.platform_id}`);
              }
            } catch (error) {
              console.error(`Error checking admin status for ${community.id}:`, error);
            }
          }
          
          let telegramResult;
          
          // Send media messages if available
          if (hasMedia) {
            const firstMedia = announcement.announcement_media[0];
            
            if (announcement.announcement_media.length === 1) {
              // Send single media
              const endpoint = firstMedia.type.toLowerCase() === 'image' ? 'sendPhoto' : 'sendVideo';
              
              const telegramResponse = await fetch(
                `https://api.telegram.org/bot${botToken}/${endpoint}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: community.platform_id,
                    [firstMedia.type.toLowerCase() === 'image' ? 'photo' : 'video']: firstMedia.url,
                    caption: message,
                    parse_mode: 'Markdown',
                    reply_markup: inlineKeyboard
                  })
                }
              );
              
              telegramResult = await telegramResponse.json();
            } else {
              // Send media group for multiple media
              const mediaItems = announcement.announcement_media.map(item => ({
                type: item.type.toLowerCase() === 'image' ? 'photo' : 'video',
                media: item.url,
                caption: item === announcement.announcement_media[0] ? message : item.caption || ''
              }));
              
              const telegramResponse = await fetch(
                `https://api.telegram.org/bot${botToken}/sendMediaGroup`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: community.platform_id,
                    media: mediaItems
                  })
                }
              );
              
              telegramResult = await telegramResponse.json();
              
              // Send buttons as separate message if we have CTA
              if (inlineKeyboard) {
                const buttonResponse = await fetch(
                  `https://api.telegram.org/bot${botToken}/sendMessage`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: community.platform_id,
                      text: "Click below for more information:",
                      reply_markup: inlineKeyboard
                    })
                  }
                );
              }
            }
          } else {
            // Send text message
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
                  disable_web_page_preview: false,
                  reply_markup: inlineKeyboard
                }),
              }
            );
            
            telegramResult = await telegramResponse.json();
          }
          
          if (!telegramResult.ok) {
            console.error(`Telegram API error for ${community.name}:`, telegramResult.description);
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
            community_name: community.name,
            success: true,
            isAdmin,
            message_id: telegramResult.result?.message_id
          };
        } catch (error) {
          console.error(`Error posting to community ${community.id} (${community.name}):`, error);
          
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
            community_name: community.name,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    const successCount = postResults.filter(r => r.success).length;
    const failCount = postResults.filter(r => !r.success).length;
    
    console.log(`Announcement posting complete: ${successCount} successful, ${failCount} failed`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      results: postResults,
      successCount,
      failCount
    }), {
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

// Helper function to check if bot is admin in group
async function isBotAdminInGroup(chatId: string | number, botToken: string, botId: number) {
  try {
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
    
    if (!chatMember.ok) {
      console.error(`Error checking bot admin status: ${chatMember.description}`);
      return false;
    }
    
    return (
      chatMember.result.status === "administrator" || 
      chatMember.result.status === "creator"
    );
  } catch (error) {
    console.error("Error checking bot admin status:", error);
    return false;
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
