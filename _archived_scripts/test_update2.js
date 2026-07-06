import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irgplkartyhasfucpffn.supabase.co'
const supabaseAnonKey = 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  await supabase.from('users').update({ highscore: 0 }).eq('email', 'gs335860@gmail.com');
}

test();
