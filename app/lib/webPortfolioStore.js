import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DATA_FILE = path.join(process.cwd(), 'scratch', 'web_portfolio_data.json');

export const INITIAL_WEB_PROJECTS = [
  {
    id: 'bharatup',
    title: 'BharatUp',
    tagline: 'A Home for Businesses Building What Comes Next',
    category: 'Enterprise Digital Platform',
    badge: 'Business Tech',
    desc: 'A high-performance digital presence engineered for business growth, high concurrency, and seamless client engagement.',
    url: 'https://www.bharatup.online/',
    displayUrl: 'bharatup.online',
    image: '/images/web-portfolio/bharatup.jpg',
    image_url: '/images/web-portfolio/bharatup.jpg',
    color: '#3b82f6',
    stats: [
      { label: 'Page Load Time', value: '0.40s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+280%' }
    ],
    techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Framer Motion'],
    tech_stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Framer Motion'],
    challenge: 'Building a modern, credible online presence for growing businesses that loads instantly and stands out from standard templates.',
    case_study_challenge: 'Building a modern, credible online presence for growing businesses that loads instantly and stands out from standard templates.',
    solution: 'We designed a custom, fast website with smooth animations, high-converting layouts, and effortless mobile browsing.',
    case_study_solution: 'We designed a custom, fast website with smooth animations, high-converting layouts, and effortless mobile browsing.',
    is_visible: true,
    sort_order: 100
  },
  {
    id: 'pinaka',
    title: 'Pinaka Care Clinic',
    tagline: 'Skin, Laser & Dermatology Clinic in South Bopal, Ahmedabad',
    category: 'Healthcare & Clinical Web',
    badge: 'Healthcare',
    desc: 'A modern medical clinic website built to help patients easily discover treatments, view doctor profiles, and book appointments online.',
    url: 'https://www.pinakacareclinic.com/',
    displayUrl: 'pinakacareclinic.com',
    image: '/images/web-portfolio/pinakacare.jpg',
    image_url: '/images/web-portfolio/pinakacare.jpg',
    color: '#10b981',
    stats: [
      { label: 'Page Load Time', value: '0.28s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+340%' }
    ],
    techStack: ['Next.js', 'React 18', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'],
    tech_stack: ['Next.js', 'React 18', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'],
    challenge: 'Traditional clinic websites are often cluttered and confusing, making it difficult for patients to quickly book an appointment.',
    case_study_challenge: 'Traditional clinic websites are often cluttered and confusing, making it difficult for patients to quickly book an appointment.',
    solution: 'We built a soothing, high-trust website where patients can explore treatments and book a doctor consultation in just a few taps.',
    case_study_solution: 'We built a soothing, high-trust website where patients can explore treatments and book a doctor consultation in just a few taps.',
    is_visible: true,
    sort_order: 90
  },
  {
    id: 'goatsociety',
    title: 'Goat Society',
    tagline: 'Authentic Decanted Fragrances & Lifestyle E-Commerce',
    category: 'Luxury Fragrance & Commerce',
    badge: 'Luxury E-Com',
    desc: 'An online fragrance store featuring authentic luxury perfumes, easy size selection, and smooth mobile checkout.',
    url: 'https://goatsociety.in/',
    displayUrl: 'goatsociety.in',
    image: '/images/web-portfolio/goatsociety.jpg',
    image_url: '/images/web-portfolio/goatsociety.jpg',
    color: '#f59e0b',
    stats: [
      { label: 'Page Load Time', value: '0.35s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+220%' }
    ],
    techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'E-Commerce Core', 'Cloudflare CDN'],
    tech_stack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'E-Commerce Core', 'Cloudflare CDN'],
    challenge: 'Showcasing luxury perfumes with clear bottle size options without slowing down the shopping experience on phones.',
    case_study_challenge: 'Showcasing luxury perfumes with clear bottle size options without slowing down the shopping experience on phones.',
    solution: 'We designed an elegant storefront with crisp product photos, 1-tap size pickers, and a fast, friction-free checkout.',
    case_study_solution: 'We designed an elegant storefront with crisp product photos, 1-tap size pickers, and a fast, friction-free checkout.',
    is_visible: true,
    sort_order: 80
  },
  {
    id: 'rasmlai',
    title: 'Rasmlai AI',
    tagline: 'A Safe Space to Express Every Emotion • AI Companion for Wellness',
    category: 'AI Companion & Product Web',
    badge: 'AI Application',
    desc: 'A private, voice-first AI companion website designed to help people express feelings, talk through ideas, and feel supported.',
    url: 'https://rasmlai.vercel.app/',
    displayUrl: 'rasmlai.vercel.app',
    image: '/images/web-portfolio/rasmlai.jpg',
    image_url: '/images/web-portfolio/rasmlai.jpg',
    color: '#8b5cf6',
    stats: [
      { label: 'Page Load Time', value: '0.32s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+310%' }
    ],
    techStack: ['Next.js 15', 'React 19', 'OpenAI API', 'Vercel AI SDK', 'Tailwind CSS'],
    tech_stack: ['Next.js 15', 'React 19', 'OpenAI API', 'Vercel AI SDK', 'Tailwind CSS'],
    challenge: 'Creating a warm, peaceful space where anyone feels safe and comfortable talking with an AI companion.',
    case_study_challenge: 'Creating a warm, peaceful space where anyone feels safe and comfortable talking with an AI companion.',
    solution: 'We built a minimalist, soothing interface with natural voice prompts, fluid transitions, and zero complicated setup steps.',
    case_study_solution: 'We built a minimalist, soothing interface with natural voice prompts, fluid transitions, and zero complicated setup steps.',
    is_visible: true,
    sort_order: 70
  }
];

let memoryWebItems = null;

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'; 
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export function readLocalWebItems() {
  if (memoryWebItems !== null) return memoryWebItems;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      memoryWebItems = JSON.parse(data);
      if (Array.isArray(memoryWebItems) && memoryWebItems.length > 0) {
        return memoryWebItems;
      }
    }
  } catch (e) {
    console.warn('Failed to read web portfolio data file:', e.message);
  }

  memoryWebItems = [...INITIAL_WEB_PROJECTS];
  saveLocalWebItems(memoryWebItems);
  return memoryWebItems;
}

export function saveLocalWebItems(items) {
  memoryWebItems = items;
  try {
    ensureDirExists(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    try {
      const tmpPath = path.join('/tmp', 'web_portfolio_data.json');
      fs.writeFileSync(tmpPath, JSON.stringify(items, null, 2), 'utf8');
    } catch (err) {}
  }
}

export async function getWebPortfolioItems() {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('portfolio_web')
        .select('*')
        .order('sort_order', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Supabase table may not exist yet, proceed to local store
  }

  const local = readLocalWebItems();
  return [...local].sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
}

export async function addWebPortfolioItem(itemData) {
  const newItem = {
    id: itemData.id || `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: itemData.title,
    tagline: itemData.tagline || '',
    category: itemData.category || 'Enterprise Digital Platform',
    badge: itemData.badge || itemData.category || 'Production',
    desc: itemData.desc || itemData.description || '',
    url: itemData.url,
    displayUrl: itemData.display_url || itemData.displayUrl || (itemData.url ? itemData.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''),
    display_url: itemData.display_url || itemData.displayUrl || (itemData.url ? itemData.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''),
    image: itemData.image_url || itemData.image || '/images/web-portfolio/bharatup.jpg',
    image_url: itemData.image_url || itemData.image || '/images/web-portfolio/bharatup.jpg',
    video: itemData.video_url || itemData.video || '',
    video_url: itemData.video_url || itemData.video || '',
    color: itemData.color || '#ebd73f',
    stats: itemData.stats || [],
    pillars: itemData.pillars || [],
    techStack: Array.isArray(itemData.tech_stack || itemData.techStack) ? (itemData.tech_stack || itemData.techStack) : [],
    tech_stack: Array.isArray(itemData.tech_stack || itemData.techStack) ? (itemData.tech_stack || itemData.techStack) : [],
    challenge: itemData.case_study_challenge || itemData.challenge || '',
    case_study_challenge: itemData.case_study_challenge || itemData.challenge || '',
    solution: itemData.case_study_solution || itemData.solution || '',
    case_study_solution: itemData.case_study_solution || itemData.solution || '',
    is_visible: itemData.is_visible !== false,
    sort_order: itemData.sort_order || Date.now()
  };

  // Try Supabase insert
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('portfolio_web').insert([newItem]);
    }
  } catch (e) {}

  // Update local file store
  const current = readLocalWebItems();
  const updated = [newItem, ...current];
  saveLocalWebItems(updated);
  return newItem;
}

export async function updateWebPortfolioItem(id, updates) {
  // Try Supabase update
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('portfolio_web').update(updates).eq('id', id);
    }
  } catch (e) {}

  // Update local file store
  const current = readLocalWebItems();
  const updated = current.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    return item;
  });
  saveLocalWebItems(updated);
  return updated.find(i => i.id === id) || { id, ...updates };
}

export async function deleteWebPortfolioItem(id) {
  // Try Supabase delete
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('portfolio_web').delete().eq('id', id);
    }
  } catch (e) {}

  // Update local file store
  const current = readLocalWebItems();
  const updated = current.filter(item => item.id !== id);
  saveLocalWebItems(updated);
  return { success: true };
}
