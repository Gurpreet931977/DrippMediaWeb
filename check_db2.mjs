import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uimrmlrmzomomzpmbhyq.supabase.co"; // get from .env.local
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbXJtbHJtem9tb216cG1iaHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzMTg4MDQsImV4cCI6MjAzMzg5NDgwNH0.V2zLd_ZfE_2Q_8J_W8n_G_k_L_M_N_O_P_Q_R_S_T"; // fake key, I need the real one from env

import fs from 'fs';
const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = envLocal.split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key.trim()] = val.join('=').trim();
    return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDb() {
    const { data, error } = await supabase.from('portfolio_reels').select('*').order('created_at', { ascending: false }).limit(2);
    console.log(JSON.stringify(data, null, 2));
}
checkDb();
