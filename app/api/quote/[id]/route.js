import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('[quote/id] CRITICAL: Supabase env vars missing.');
}
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

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

export async function PATCH(request, context) {
  try {
    const { signatureImage, signedBy, signedAt } = await request.json();
    const { id } = await context.params;

    if (!signatureImage || !signedBy) {
       return NextResponse.json({ error: 'Signature data missing' }, { status: 400 });
    }

    // 1. Fetch current quote
    const { data: existingData, error: fetchError } = await supabase
      .from('shared_quotes')
      .select('quote_data')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // 2. Append signature data
    const updatedQuoteData = {
      ...existingData.quote_data,
      signature: signatureImage,
      signedBy: signedBy,
      signedAt: signedAt || new Date().toISOString()
    };

    // 3. Save back
    const { error: updateError } = await supabase
      .from('shared_quotes')
      .update({ quote_data: updatedQuoteData })
      .eq('id', id);

    if (updateError) {
       return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, quote: updatedQuoteData }, { status: 200 });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
