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
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function readDatabase() {
    console.log("Fetching reels...");
    const { data: reels, error: reelsError } = await supabase.from('portfolio_reels').select('*');
    console.log("reels error:", reelsError);
    console.log("reels data:", reels);

    console.log("\nFetching long form...");
    const { data: lf, error: lfError } = await supabase.from('portfolio_long_form').select('*');
    console.log("long form error:", lfError);
    console.log("long form data:", lf);
}

readDatabase();
