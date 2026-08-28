import { createClient } from '@supabase/supabase-js';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { applyLedgerToItems, setItemReviewStatus, clearItemReviewStatus } from '../../../../../lib/portfolioReviewLedger.js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
  // Use service role key to bypass RLS for admin operations!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'; 
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'live', 'held', or null/all

    const supabase = getSupabase();
    let query = supabase
      .from(tableName)
      .select('*')
      .order('sort_order', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    let itemsWithLedger = applyLedgerToItems(data || []);

    if (status === 'live') {
      itemsWithLedger = itemsWithLedger.filter(i => i.is_visible !== false && i.held_for_review !== true);
    } else if (status === 'held') {
      itemsWithLedger = itemsWithLedger.filter(i => i.is_visible === false || i.held_for_review === true);
    }

    return Response.json(itemsWithLedger);
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
    
    // Add default visibility if not specified
    if (body.is_visible === undefined) {
      body.is_visible = true;
    }

    let { data, error } = await supabase
      .from(tableName)
      .insert([body])
      .select();

    if (error) {
      // If error is due to unknown column, try stripping review columns
      const safeBody = { ...body };
      delete safeBody.held_for_review;
      delete safeBody.review_reason;
      delete safeBody.review_date;

      const fallback = await supabase.from(tableName).insert([safeBody]).select();
      if (fallback.error) throw fallback.error;
      data = fallback.data;
    }

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

    // Sync with review ledger
    if (updates.held_for_review === false && updates.is_visible === true) {
      clearItemReviewStatus(id);
    } else if (updates.held_for_review === true || updates.is_visible === false) {
      setItemReviewStatus(id, {
        is_visible: updates.is_visible,
        held_for_review: updates.held_for_review !== undefined ? updates.held_for_review : true,
        review_reason: updates.review_reason || 'Held for review',
        review_date: updates.review_date || new Date().toISOString()
      });
    }

    const supabase = getSupabase();
    let { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      // If error is caused by columns not present in the table schema, sanitize and retry
      console.warn(`Update on ${tableName} failed (${error.message}). Attempting sanitized retry.`);
      const safeUpdates = { ...updates };
      delete safeUpdates.held_for_review;
      delete safeUpdates.review_reason;
      delete safeUpdates.review_date;

      const fallback = await supabase
        .from(tableName)
        .update(safeUpdates)
        .eq('id', id)
        .select();

      if (fallback.error) {
        console.warn(`Fallback update also encountered error: ${fallback.error.message}. Ledger remains updated.`);
      } else {
        data = fallback.data;
      }
    }

    const finalItem = (data && data[0]) ? data[0] : { id, ...updates };
    const merged = applyLedgerToItems([finalItem])[0];
    return Response.json(merged);
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
