const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key');
const channel = supabase.channel('room1');
console.log(channel);
