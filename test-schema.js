import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://irgplkartyhasfucpffn.supabase.co', 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U');
async function test() {
  const { data, error } = await supabase.rpc('get_schema_columns', { table_name: 'email_campaigns' });
  if (error) {
     console.log('No rpc. Trying to fetch data to inspect headers...');
     // Can't easily inspect headers if no data
  }
}
test();
