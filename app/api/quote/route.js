import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Generate a unique ID for the quote link
    const id = Math.random().toString(36).substr(2, 9);
    
    const payload = {
      id,
      password: data.password,
      quote_data: data
    };

    // Attempt to insert into Supabase
    const { error } = await supabase
      .from('shared_quotes')
      .insert([payload]);

    if (error) {
      console.error('Supabase error saving quote:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ id }, { status: 200 });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
