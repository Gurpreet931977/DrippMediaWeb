import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use service role key to bypass RLS for admin operations!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const tableMap = {
  'reels': 'portfolio_reels',
  'long-form': 'portfolio_long_form',
  'graphics': 'portfolio_graphics'
};

export async function GET(request, { params }) {
  const { type } = params;
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
  const { type } = params;
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
  const { type } = params;
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
  const { type } = params;
  const tableName = tableMap[type];
  if (!tableName) return Response.json({ error: 'Invalid portfolio type' }, { status: 400 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return Response.json({ error: 'ID is required' }, { status: 400 });

    const supabase = getSupabase();
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
