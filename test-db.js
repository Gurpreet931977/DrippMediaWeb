import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://irgplkartyhasfucpffn.supabase.co', 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U');
async function test() {
  const { data, error } = await supabase.from('email_campaigns').select('recurrence_end_date').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}
test();


