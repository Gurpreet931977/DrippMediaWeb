import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const data = await request.json();
    const { email, password } = data;

    if (!email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user (either by email or by name/player tag)
    let query = supabase.from('users').select('*');
    if (email.includes('@')) {
      query = query.eq('email', email);
    } else {
      query = query.ilike('name', email);
    }
    
    const { data: user, error } = await query.single();

    if (error || !user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Compare passwords
    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Don't send the password back to the client
    delete user.password;

    return Response.json(user, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
