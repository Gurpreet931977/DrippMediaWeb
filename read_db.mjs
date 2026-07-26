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

async function readDatabase() {
    const { data: reels, error: reelsError } = await supabase.from('portfolio_reels').select('*');

    console.log("=== SUPABASE DATABASE READ RESULTS ===");
    console.log("portfolio_reels count:", reels ? reels.length : 0);
    console.log("portfolio_reels data:", JSON.stringify(reels, null, 2));
}

readDatabase();
