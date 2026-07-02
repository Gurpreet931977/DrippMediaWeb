import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irgplkartyhasfucpffn.supabase.co'
const supabaseAnonKey = 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('users').select('*').limit(1)
  console.log('Users schema:', data, error)
}
test()
