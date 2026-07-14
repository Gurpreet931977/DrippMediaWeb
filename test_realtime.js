import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irgplkartyhasfucpffn.supabase.co'
const supabaseAnonKey = 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log("Connecting...");
  const channel = supabase.channel('room:test', {
    config: { broadcast: { ack: true } }
  })
  
  channel.subscribe((status, err) => {
    console.log("Status:", status);
    if (err) console.log("Error:", err);
    if (status === 'SUBSCRIBED') {
      console.log("Success! Disconnecting...");
      supabase.removeChannel(channel).then(() => process.exit(0));
    }
  })
}

test();
