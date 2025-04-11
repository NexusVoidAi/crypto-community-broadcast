
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
    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Create storage bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    const announcementsBucketExists = buckets?.some(bucket => bucket.name === 'announcements');
    
    if (!announcementsBucketExists) {
      const { data, error } = await supabaseAdmin
        .storage
        .createBucket('announcements', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf']
        });
        
      if (error) throw error;
      
      console.log("Created announcements bucket:", data);
    }
    
    // Set RLS policy for the bucket to allow public reads and authenticated uploads
    const { error: policyError } = await supabaseAdmin.rpc('create_storage_policy', {
      bucket_name: 'announcements',
      policy_name: 'allow_public_read',
      definition: "bucket_id = 'announcements' AND operation = 'SELECT'",
      policy_role: 'anon'
    });
    
    if (policyError) {
      console.error("Error setting read policy:", policyError);
    }
    
    const { error: uploadPolicyError } = await supabaseAdmin.rpc('create_storage_policy', {
      bucket_name: 'announcements',
      policy_name: 'allow_authenticated_uploads',
      definition: "bucket_id = 'announcements' AND operation IN ('INSERT', 'UPDATE') AND auth.role() = 'authenticated'",
      policy_role: 'authenticated'
    });
    
    if (uploadPolicyError) {
      console.error("Error setting upload policy:", uploadPolicyError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Storage bucket initialized successfully",
        bucketExists: announcementsBucketExists
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error creating storage bucket:', error);
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

// Helper function to create a storage policy
function createStoragePolicy(client, bucket, name, definition, role = 'authenticated') {
  return client.rpc('create_storage_policy', {
    bucket_name: bucket,
    policy_name: name,
    definition: definition,
    policy_role: role
  });
}
