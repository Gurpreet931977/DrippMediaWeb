import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://irgplkartyhasfucpffn.supabase.co', 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U');
async function test() {
  const { data, error } = await supabase.from('email_campaigns').select('*').limit(1);
  console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
}
test();
