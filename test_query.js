import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const now = new Date().toISOString();
  console.log('Querying email_campaigns...', now);
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now);

  console.log('Data:', data);
  console.log('Error:', error);
}

test();
