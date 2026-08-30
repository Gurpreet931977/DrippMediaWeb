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
      { label: 'Lighthouse Score', value: '99/100' },
      { label: 'Active Reach', value: '25K+' },
      { label: 'Page Load Speed', value: '0.4s' }
    ],
    techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Framer Motion'],
    tech_stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Framer Motion'],
    challenge: 'Creating a high-credibility digital gateway that communicates modern business acceleration with sub-second performance.',
    case_study_challenge: 'Creating a high-credibility digital gateway that communicates modern business acceleration with sub-second performance.',
    solution: 'We architected a lightweight, server-rendered Next.js application with edge caching, dark aesthetic, and frictionless responsiveness.',
    case_study_solution: 'We architected a lightweight, server-rendered Next.js application with edge caching, dark aesthetic, and frictionless responsiveness.',
    is_visible: true,
    sort_order: 100
  },
  {
    id: 'pinaka',
    title: 'Pinaka Care Clinic',
    tagline: 'Skin, Laser & Dermatology Clinic in South Bopal, Ahmedabad',
    category: 'Healthcare & Clinical Web',
    badge: 'Healthcare',
    desc: 'A clinical healthcare platform built to streamline patient consultation bookings, doctor profiles, and multi-specialty dermatology services.',
    url: 'https://www.pinakacareclinic.com/',
    displayUrl: 'pinakacareclinic.com',
    image: '/images/web-portfolio/pinakacare.jpg',
    image_url: '/images/web-portfolio/pinakacare.jpg',
    color: '#10b981',
    stats: [
      { label: 'Booking Conversion', value: '+340%' },
      { label: 'Mobile Readiness', value: '100%' },
      { label: 'TTFB Server Latency', value: '0.28s' }
    ],
    techStack: ['Next.js', 'React 18', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'],
    tech_stack: ['Next.js', 'React 18', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'],
    challenge: 'Medical clinics often suffer from confusing appointment layouts and outdated interfaces that reduce patient trust.',
    case_study_challenge: 'Medical clinics often suffer from confusing appointment layouts and outdated interfaces that reduce patient trust.',
    solution: 'Designed a soothing, high-trust visual language with instant slot booking, clean treatment catalog, and fast mobile intake.',
    case_study_solution: 'Designed a soothing, high-trust visual language with instant slot booking, clean treatment catalog, and fast mobile intake.',
    is_visible: true,
    sort_order: 90
  },
  {
    id: 'goatsociety',
    title: 'Goat Society',
    tagline: 'Authentic Decanted Fragrances & Lifestyle E-Commerce',
    category: 'Luxury Fragrance & Commerce',
    badge: 'Luxury E-Com',
    desc: 'An exclusive e-commerce boutique featuring 100% authentic decanted fragrances, sterile extraction standards, and sleek catalog navigation.',
    url: 'https://goatsociety.in/',
    displayUrl: 'goatsociety.in',
    image: '/images/web-portfolio/goatsociety.jpg',
    image_url: '/images/web-portfolio/goatsociety.jpg',
    color: '#f59e0b',
    stats: [
      { label: 'Catalog Performance', value: '60 FPS' },
      { label: 'User Retention', value: '+220%' },
      { label: 'Checkout Speed', value: '< 2s' }
    ],
    techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'E-Commerce Core', 'Cloudflare CDN'],
    tech_stack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'E-Commerce Core', 'Cloudflare CDN'],
    challenge: 'Creating a high-end luxury aesthetic that showcases perfume notes and sizes clearly without slowing down mobile catalog scrolling.',
    case_study_challenge: 'Creating a high-end luxury aesthetic that showcases perfume notes and sizes clearly without slowing down mobile catalog scrolling.',
    solution: 'Crafted minimal typography, high-res visual product cards, and instant decant size selectors for maximum checkout efficiency.',
    case_study_solution: 'Crafted minimal typography, high-res visual product cards, and instant decant size selectors for maximum checkout efficiency.',
    is_visible: true,
    sort_order: 80
  },
  {
    id: 'rasmlai',
    title: 'Rasmlai AI',
    tagline: 'A Safe Space to Express Every Emotion • AI Companion for Wellness',
    category: 'AI Companion & Product Web',
    badge: 'AI Application',
    desc: 'A voice-first AI companion workspace engineered to help users process feelings, express emotions, and engage in reflective dialogue.',
    url: 'https://rasmlai.vercel.app/',
    displayUrl: 'rasmlai.vercel.app',
    image: '/images/web-portfolio/rasmlai.jpg',
    image_url: '/images/web-portfolio/rasmlai.jpg',
    color: '#8b5cf6',
    stats: [
      { label: 'AI Response Latency', value: '12ms' },
      { label: 'Architecture', value: 'Edge AI' },
      { label: 'Lighthouse Score', value: '100/100' }
    ],
    techStack: ['Next.js 15', 'React 19', 'OpenAI API', 'Vercel AI SDK', 'Tailwind CSS'],
    tech_stack: ['Next.js 15', 'React 19', 'OpenAI API', 'Vercel AI SDK', 'Tailwind CSS'],
    challenge: 'Creating a calming, intimate digital environment where users feel secure expressing deep emotions.',
    case_study_challenge: 'Creating a calming, intimate digital environment where users feel secure expressing deep emotions.',
    solution: 'Engineered an ultra-clean, minimal interface with fluid animations, intuitive voice prompts, and zero friction onboarding.',
    case_study_solution: 'Engineered an ultra-clean, minimal interface with fluid animations, intuitive voice prompts, and zero friction onboarding.',
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
    color: itemData.color || '#ebd73f',
    stats: itemData.stats || [],
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
