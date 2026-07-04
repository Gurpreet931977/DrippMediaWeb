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
    const { email, security_phrase, new_password } = data;

    if (!email || !security_phrase || !new_password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, security_phrase')
      .eq('email', email)
      .single();

    if (error || !user) {
      return Response.json({ error: 'Invalid email or security phrase' }, { status: 401 });
    }

    // Verify security phrase
    // We compare case-insensitive or exact, based on how they entered it initially.
    // AuthModal originally did a direct match.
    if (user.security_phrase !== security_phrase) {
       return Response.json({ error: 'Invalid email or security phrase' }, { status: 401 });
    }

    // Hash the new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(new_password, salt);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password reset update error:', updateError);
      return Response.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return Response.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Password reset error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
