import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = envLocal.split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) {
        acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
    }
    return acc;
}, {});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Attempting to insert test record into portfolio_reels...");
    const { data, error } = await supabase
        .from('portfolio_reels')
        .insert([{
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            description: 'Test Upload from Script',
            musicText: 'Test Audio',
            category: 'Both',
            is_visible: true,
            sort_order: 1
        }])
        .select();

    if (error) {
        console.error("Insertion Error:", error.message);
    } else {
        console.log("Insertion Success! Inserted Data:", JSON.stringify(data, null, 2));
    }
}

testInsert();
