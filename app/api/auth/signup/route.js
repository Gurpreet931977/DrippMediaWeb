import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    const data = await request.json();
    const { name, email, phone, nature, password, security_phrase } = data;

    if (!name || !email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return Response.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Insert user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        { 
          name, 
          email, 
          phone, 
          nature, 
          password: hashedPassword, 
          security_phrase,
          highscore: 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Signup error:', error);
      return Response.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Don't send the password back to the client
    delete newUser.password;

    return Response.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
