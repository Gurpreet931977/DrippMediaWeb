import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request, context) {
  try {
    const { password } = await request.json();
    const { id } = await context.params;
    
    // Fetch the quote from Supabase
    const { data, error } = await supabase
      .from('shared_quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (data.password !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // If password matches, return the quote data
    return NextResponse.json({ quote: data.quote_data }, { status: 200 });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
