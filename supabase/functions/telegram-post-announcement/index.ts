
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
    // Extract request body
    const { announcementId } = await req.json();

    if (!announcementId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing announcementId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Posting announcement ${announcementId} to Telegram communities`);

    // Extract environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Create a simple Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get the announcement details
    const { data: announcement, error: announcementError } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();
      
    if (announcementError || !announcement) {
      console.error("Error fetching announcement:", announcementError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch announcement" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get platform settings to retrieve bot token
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('platform_settings')
      .select('telegram_bot_token')
      .single();
      
    if (settingsError || !settings?.telegram_bot_token) {
      console.error("Error fetching Telegram bot token:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Telegram bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const botToken = settings.telegram_bot_token;
    
    // Get the announcement communities
    const { data: communities, error: communitiesError } = await supabaseAdmin
      .from('announcement_communities')
      .select(`
        id,
        community:communities(id, name, platform, platform_id)
      `)
      .eq('announcement_id', announcementId);
      
    if (communitiesError) {
      console.error("Error fetching communities:", communitiesError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch communities" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Filter to only get Telegram communities
    const telegramCommunities = communities?.filter(c => c.community?.platform === 'TELEGRAM') || [];
    
    if (telegramCommunities.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No Telegram communities to post to" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${telegramCommunities.length} Telegram communities`);
    
    // Format the announcement message
    let messageText = `*${announcement.title}*\n\n`;
    messageText += announcement.content;
    
    // Track successful and failed deliveries
    const results = [];
    
    // Send the message to each Telegram community
    for (const community of telegramCommunities) {
      if (!community.community?.platform_id) {
        results.push({
          communityId: community.community?.id,
          success: false,
          error: "Missing platform_id"
        });
        continue;
      }
      
      try {
        const chatId = community.community.platform_id;
        console.log(`Sending message to chat ID: ${chatId}`);
        
        // Create inline keyboard for CTA button if it exists
        const inlineKeyboard = announcement.cta_url && announcement.cta_text ? {
          inline_keyboard: [[{ text: announcement.cta_text, url: announcement.cta_url }]]
        } : undefined;

        console.log("CTA data:", { 
          hasUrl: !!announcement.cta_url, 
          hasText: !!announcement.cta_text,
          keyboard: inlineKeyboard 
        });
        
        let responseData;
        
        // Check if the announcement has media
        if (announcement.media_url) {
          console.log("Media URL detected:", announcement.media_url);
          
          // Determine media type from URL
          const isVideo = /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(announcement.media_url);
          const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(announcement.media_url);
          const fileType = isVideo ? "video" : isImage ? "image" : "document";
          
          console.log(`Detected media type: ${fileType}`);
          
          let endpoint = "";
          let bodyParams = {};
          
          if (isVideo) {
            endpoint = "sendVideo";
            bodyParams = {
              chat_id: chatId,
              video: announcement.media_url,
              caption: `*${announcement.title}*\n\n${announcement.content}`,
              parse_mode: 'Markdown',
              reply_markup: inlineKeyboard
            };
          } else if (isImage) {
            endpoint = "sendPhoto";
            bodyParams = {
              chat_id: chatId,
              photo: announcement.media_url,
              caption: `*${announcement.title}*\n\n${announcement.content}`,
              parse_mode: 'Markdown',
              reply_markup: inlineKeyboard
            };
          } else {
            endpoint = "sendDocument";
            bodyParams = {
              chat_id: chatId,
              document: announcement.media_url,
              caption: `*${announcement.title}*\n\n${announcement.content}`,
              parse_mode: 'Markdown',
              reply_markup: inlineKeyboard
            };
          }
          
          console.log(`Sending to endpoint: ${endpoint}`, JSON.stringify(bodyParams));
          
          const response = await fetch(
            `https://api.telegram.org/bot${botToken}/${endpoint}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyParams)
            }
          );
          
          responseData = await response.json();
          console.log(`Media API response:`, responseData);
        } else {
          // No media, just send text with optional button
          const response = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: messageText,
                parse_mode: 'Markdown',
                disable_web_page_preview: false,
                reply_markup: inlineKeyboard
              })
            }
          );
          
          responseData = await response.json();
          console.log("Text message API response:", responseData);
        }
        
        if (responseData.ok) {
          // Update announcement_communities with delivery status
          await supabaseAdmin
            .from('announcement_communities')
            .update({
              delivered: true,
              delivery_log: responseData
            })
            .eq('id', community.id);
            
          results.push({
            communityId: community.community.id,
            success: true,
            messageId: responseData.result?.message_id
          });
        } else {
          // Update announcement_communities with error
          await supabaseAdmin
            .from('announcement_communities')
            .update({
              delivered: false,
              delivery_log: responseData
            })
            .eq('id', community.id);
            
          results.push({
            communityId: community.community.id,
            success: false,
            error: responseData.description
          });
        }
      } catch (error) {
        console.error(`Error sending to community ${community.community.id}:`, error);
        
        // Update announcement_communities with error
        await supabaseAdmin
          .from('announcement_communities')
          .update({
            delivered: false,
            delivery_log: { error: error.message }
          })
          .eq('id', community.id);
          
        results.push({
          communityId: community.community.id,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Announcement posted to ${successCount} of ${telegramCommunities.length} communities`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
        single: () => fetch(`${url}/rest/v1/${table}?select=${columns}&limit=1`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
          },
        }).then(res => res.json().then(data => ({ data: data?.[0] || null, error: null }))),
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
