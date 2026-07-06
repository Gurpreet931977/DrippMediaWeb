import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irgplkartyhasfucpffn.supabase.co';
const supabaseKey = 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'; // The anon key from .env.local

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  console.log("data:", data);
  console.log("error:", error);
}
test();
