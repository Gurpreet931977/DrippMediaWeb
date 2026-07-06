import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irgplkartyhasfucpffn.supabase.co';
const supabaseKey = 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'; // The anon key from .env.local

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('users').select('email');
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  if (!data) {
    console.log("No data returned");
    return;
  }
  
  const emails = data.map(u => u.email);
  const counts = {};
  emails.forEach(e => counts[e] = (counts[e] || 0) + 1);
  const duplicates = Object.entries(counts).filter(([e, c]) => c > 1);
  
  console.log("Total users:", emails.length);
  console.log("Duplicates:", duplicates);
}
check();
