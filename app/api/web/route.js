import { createClient } from '@supabase/supabase-js';

const DEFAULT_PROJECTS = [
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
    color: '#3b82f6',
    stats: [
      { label: 'Lighthouse Score', value: '99/100' },
      { label: 'Active Reach', value: '25K+' },
      { label: 'Page Load Speed', value: '0.4s' }
    ],
    techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Framer Motion'],
    challenge: 'Creating a high-credibility digital gateway that communicates modern business acceleration with sub-second performance.',
    solution: 'We architected a lightweight, server-rendered Next.js application with edge caching, dark aesthetic, and frictionless responsiveness.',
    is_visible: true,
    sort_order: 1
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
    color: '#10b981',
    stats: [
      { label: 'Booking Conversion', value: '+340%' },
      { label: 'Mobile Readiness', value: '100%' },
      { label: 'TTFB Server Latency', value: '0.28s' }
    ],
    techStack: ['Next.js', 'React 18', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'],
    challenge: 'Medical clinics often suffer from confusing appointment layouts and outdated interfaces that reduce patient trust.',
    solution: 'Designed a soothing, high-trust visual language with instant slot booking, clean treatment catalog, and fast mobile intake.',
    is_visible: true,
    sort_order: 2
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
    color: '#f59e0b',
    stats: [
      { label: 'Catalog Performance', value: '60 FPS' },
      { label: 'User Retention', value: '+220%' },
      { label: 'Checkout Speed', value: '< 2s' }
    ],
    techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'E-Commerce Core', 'Cloudflare CDN'],
    challenge: 'Creating a high-end luxury aesthetic that showcases perfume notes and sizes clearly without slowing down mobile catalog scrolling.',
    solution: 'Crafted minimal typography, high-res visual product cards, and instant decant size selectors for maximum checkout efficiency.',
    is_visible: true,
    sort_order: 3
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
    color: '#8b5cf6',
    stats: [
      { label: 'AI Response Latency', value: '12ms' },
      { label: 'Architecture', value: 'Edge AI' },
      { label: 'Lighthouse Score', value: '100/100' }
    ],
    techStack: ['Next.js 15', 'React 19', 'OpenAI API', 'Vercel AI SDK', 'Tailwind CSS'],
    challenge: 'Creating a calming, intimate digital environment where users feel secure expressing deep emotions.',
    solution: 'Engineered an ultra-clean, minimal interface with fluid animations, intuitive voice prompts, and zero friction onboarding.',
    is_visible: true,
    sort_order: 4
  }
];

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'; 
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return Response.json(DEFAULT_PROJECTS);
    }

    const { data, error } = await supabase
      .from('portfolio_web')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return Response.json(DEFAULT_PROJECTS);
    }

    // Format DB items if needed
    const formatted = data
      .filter(item => item.is_visible !== false)
      .map(item => ({
        id: item.id || String(item.title).toLowerCase().replace(/\s+/g, '-'),
        title: item.title,
        tagline: item.tagline || '',
        category: item.category || 'Web Application',
        badge: item.badge || item.category || 'Production',
        desc: item.desc || item.description || '',
        url: item.url,
        displayUrl: item.display_url || item.displayUrl || (item.url ? item.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''),
        image: item.image_url || item.image || '/images/web-portfolio/bharatup.jpg',
        color: item.color || '#ebd73f',
        stats: Array.isArray(item.stats) ? item.stats : (typeof item.stats === 'string' ? JSON.parse(item.stats || '[]') : []),
        techStack: Array.isArray(item.tech_stack || item.techStack) 
          ? (item.tech_stack || item.techStack) 
          : ((item.tech_stack || item.techStack || '').split(',').map(s => s.trim()).filter(Boolean)),
        challenge: item.case_study_challenge || item.challenge || '',
        solution: item.case_study_solution || item.solution || '',
        is_visible: item.is_visible !== false,
        sort_order: item.sort_order || 0
      }));

    return Response.json(formatted.length > 0 ? formatted : DEFAULT_PROJECTS);
  } catch (err) {
    return Response.json(DEFAULT_PROJECTS);
  }
}
