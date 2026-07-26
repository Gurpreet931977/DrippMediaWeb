import { createClient } from '@supabase/supabase-js';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use service role key to bypass RLS for admin operations!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const tableMap = {
  'reels': 'portfolio_reels',
  'short-form': 'portfolio_reels',
  'long-form': 'portfolio_long_form',
  'graphics': 'portfolio_graphics'
};

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const type = resolvedParams.type.toLowerCase();
  const tableName = tableMap[type];
  
  if (!tableName) return Response.json({ error: 'Invalid portfolio type' }, { status: 400 });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('sort_order', { ascending: false });

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const resolvedParams = await params;
  const type = resolvedParams.type.toLowerCase();
  const tableName = tableMap[type];
  if (!tableName) return Response.json({ error: 'Invalid portfolio type' }, { status: 400 });

  try {
    const body = await request.json();
    const supabase = getSupabase();
    
    // Add default visibility
    body.is_visible = true;

    const { data, error } = await supabase
      .from(tableName)
      .insert([body])
      .select();

    if (error) throw error;
    return Response.json(data[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const resolvedParams = await params;
  const type = resolvedParams.type.toLowerCase();
  const tableName = tableMap[type];
  if (!tableName) return Response.json({ error: 'Invalid portfolio type' }, { status: 400 });

  try {
    const { id, ...updates } = await request.json();
    if (!id) return Response.json({ error: 'ID is required' }, { status: 400 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return Response.json(data[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const type = resolvedParams.type.toLowerCase();
  const tableName = tableMap[type];
  if (!tableName) return Response.json({ error: 'Invalid portfolio type' }, { status: 400 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return Response.json({ error: 'ID is required' }, { status: 400 });

    const supabase = getSupabase();

    // 1. Fetch the existing item to get the file URL
    const { data: itemData, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // 2. Delete from Cloudflare R2 if it has an R2 URL
    if (itemData) {
      const fileUrl = itemData.videoSrc || itemData.video_src || itemData.imgSrc || itemData.img_src || itemData.url || itemData.src;
      const publicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-72c28e7d3884434bac75ca152fdf30bb.r2.dev';
      
      if (fileUrl && fileUrl.startsWith(publicUrlBase)) {
        // Extract the object key by removing the public URL base and leading slash
        const objectKey = fileUrl.replace(publicUrlBase, '').replace(/^\//, '');
        
        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        const bucketName = process.env.R2_BUCKET_NAME || 'portfolio';

        if (accountId && accessKeyId && secretAccessKey) {
          const s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          });

          try {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: bucketName,
              Key: decodeURIComponent(objectKey)
            }));
            console.log(`Successfully deleted ${objectKey} from R2`);
          } catch (s3Error) {
            console.error("Failed to delete from R2:", s3Error);
            // We can proceed to delete the DB record even if S3 delete fails
          }
        }
      }
    }

    // 3. Delete from Supabase
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
