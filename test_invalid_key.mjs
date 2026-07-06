import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irgplkartyhasfucpffn.supabase.co';
const supabaseKey = 'invalid_key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('users')
    .select('highscore')
    .eq('email', 'test@example.com')
    .maybeSingle();
  console.log("data:", data);
  console.log("error:", error?.message);
}
test();
