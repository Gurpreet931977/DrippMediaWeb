import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://irgplkartyhasfucpffn.supabase.co', 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U')
async function test() {
  const { data, error } = await supabase.from('users').select('name, highscore').order('highscore', { ascending: false }).limit(3)
  console.log('Leaderboard data:', data)
  console.log('Leaderboard error:', error)
}
test()
