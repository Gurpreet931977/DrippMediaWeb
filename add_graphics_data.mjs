import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


const supabase = createClient(supabaseUrl, supabaseKey);

const categories = ['Logo Design', 'Poster Design', 'Thumbnail Design', 'UI/UX Design', 'Branding'];
const titles = ['Neon Brand Identity', 'Event Poster Vibe', 'Tech Startup Logo', 'Creative Thumbnail', 'Web Redesign'];

const caseStudies = [
  "This project focused on creating a bold, eye-catching aesthetic. We used high-contrast colors and custom typography to make the brand instantly recognizable.",
  "The goal was to design something clean and modern. By stripping away unnecessary elements, we created a minimalist design that speaks volumes.",
  "This was built for maximum engagement. We used vibrant gradients and dynamic layouts to capture attention in less than a second.",
  "Designed specifically to resonate with a younger demographic. It blends modern aesthetics with retro elements to create a nostalgic yet fresh vibe.",
  "A complete visual overhaul. We maintained the core identity but modernized the geometry and color palette for a premium feel."
];

async function updateGraphics() {
  const { data: graphics, error: fetchErr } = await supabase.from('portfolio_graphics').select('*');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  
  for (let graphic of graphics) {
    const updates = {};
    if (!graphic.category || graphic.category === 'Uncategorized') {
      updates.category = categories[Math.floor(Math.random() * categories.length)];
    }
    if (!graphic.title) {
      updates.title = titles[Math.floor(Math.random() * titles.length)];
    }
    if (!graphic.case_study) {
      updates.case_study = caseStudies[Math.floor(Math.random() * caseStudies.length)];
    }
    
    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase.from('portfolio_graphics').update(updates).eq('id', graphic.id);
      if (updateErr) console.error('Update error for', graphic.id, updateErr);
      else console.log('Updated', graphic.id, updates);
    }
  }
  
  console.log('Done updating graphics data!');
}

updateGraphics();
