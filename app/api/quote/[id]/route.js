import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

export async function POST(request, { params }) {
  try {
    const { password } = await request.json();
    const id = params.id;
    
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
