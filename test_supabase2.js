import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://irgplkartyhasfucpffn.supabase.co', 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U')
async function test() {
  const { data, error } = await supabase.from('scores').select('*').limit(1)
  console.log('Scores table:', data, error)
  
  const { data: d2, error: e2 } = await supabase.from('users').select('highscore').limit(1)
  console.log('Users highscore:', d2, e2)
}
test()
