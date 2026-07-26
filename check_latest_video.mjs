import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = envLocal.split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length) acc[key.trim()] = val.join('=').trim();
    return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLatest() {
    const { data, error } = await supabase.from('portfolio_reels').select('*').order('created_at', { ascending: false }).limit(1);
    if (error) console.error(error);
    else {
        const url = data[0].videoSrc;
        console.log("Latest URL:", url);
        
        console.log("Fetching first 2MB of this URL to check codec/moov...");
        const res = await fetch(url, { headers: { 'Range': 'bytes=0-2000000' } });
        const buffer = await res.arrayBuffer();
        const str = Buffer.from(buffer).toString('ascii');
        
        if (str.includes('hvc1') || str.includes('hev1')) {
            console.log("Codec: HEVC (H.265) detected!");
        } else if (str.includes('avc1')) {
            console.log("Codec: AVC (H.264) detected!");
        } else {
            console.log("Codec not found in first 2MB.");
        }
        
        console.log("Includes moov atom?", str.includes('moov'));
    }
}
checkLatest();
