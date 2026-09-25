export async function POST(request) {
  try {
    const { url, title: inputTitle, category: inputCategory, notes } = await request.json();

    if (!inputTitle && !url) {
      return Response.json({ error: 'Title or URL is required' }, { status: 400 });
    }

    let targetUrl = (url || '').trim();
    if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    let cleanDomain = targetUrl ? targetUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : '';
    let scrapedData = { title: '', ogTitle: '', description: '', bodySnippet: '' };
    let detectedStack = [];

    // 1. Scrape live website metadata and detect tech stack if URL is provided
    if (targetUrl) {
      try {
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(6500)
        });

        if (res.ok) {
          if (res.url) {
            cleanDomain = res.url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
          }
          const html = await res.text();
          
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) scrapedData.title = titleMatch[1].trim();

          const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
          if (ogTitleMatch) scrapedData.ogTitle = ogTitleMatch[1].trim();

          const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
          if (descMatch) scrapedData.description = descMatch[1].trim();

          const bodyClean = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 2000);

          scrapedData.bodySnippet = bodyClean;

          // Detect live architectural stack from HTML tokens & scripts
          if (html.includes('_next/static') || html.includes('__NEXT_DATA__')) detectedStack.push('Next.js 15');
          else if (html.includes('react')) detectedStack.push('React 18');
          
          if (html.includes('clashdisplay') || html.includes('ClashDisplay')) detectedStack.push('Clash Display Typography');
          if (html.includes('satoshi') || html.includes('Satoshi')) detectedStack.push('Satoshi Font System');
          if (html.includes('tailwind') || /class=["'][^"']*p-\d/i.test(html)) detectedStack.push('Tailwind CSS');
          if (html.includes('framer') || html.includes('motion')) detectedStack.push('Framer Motion');
          if (html.includes('gsap') || html.includes('ScrollTrigger')) detectedStack.push('GSAP Motion');
          if (html.includes('three') || html.includes('webgl')) detectedStack.push('WebGL / Three.js');
          if (html.includes('supabase')) detectedStack.push('Supabase Edge');
          if (html.includes('cloudflare')) detectedStack.push('Cloudflare CDN');
        }
      } catch (scrapeErr) {
        console.warn('Live site scrape attempt timed out / skipped:', scrapeErr.message);
      }
    }

    // Determine clean brand title
    let derivedTitle = inputTitle || '';
    if (!derivedTitle) {
      if (scrapedData.title) {
        derivedTitle = scrapedData.title.split(/[·|\-–—:]/)[0].trim();
      }
      if (!derivedTitle && scrapedData.ogTitle) {
        derivedTitle = scrapedData.ogTitle.split(/[·|\-–—:]/)[0].trim();
      }
      if (!derivedTitle && cleanDomain) {
        derivedTitle = cleanDomain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    }
    if (!derivedTitle) derivedTitle = 'Web Portfolio Project';

    // 2. Check if GEMINI_API_KEY is present for AI synthesis
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const prompt = `You are Orlo AI, Chief Technology & Design Strategist at Dripp Media (an elite award-winning web creative agency).

Synthesize a comprehensive, ultra-premium Web Project Case Study for:
- Project Name: "${derivedTitle}"
- Live Website URL: "${targetUrl || 'https://example.com'}"
- Scraped Page Title: "${scrapedData.title || ''}"
- Scraped Description: "${scrapedData.description || ''}"
- Content Sample: "${scrapedData.bodySnippet.slice(0, 500)}"
- Admin Context: "${notes || ''}"

Return ONLY a valid JSON object matching this exact schema (no markdown, no backticks):
{
  "title": "${derivedTitle}",
  "tagline": "Punchy, elite one-sentence value proposition hook (under 10 words)",
  "category": "Pick best match: Enterprise Digital Platform | E-Commerce & Online Store | High-Converting Landing Page | SaaS & B2B Web App | Portfolio & Creative Studio | Healthcare & Clinical Web | Luxury Fragrance & Commerce | AI Companion & Product Web | Fintech & Payment Systems | E-Learning & EdTech Platform | Startup & Product Launch | Creative Agency & Studio | Corporate & Business Web | Hospitality & Real Estate | Restaurant, Food & Beverage | B2B Industrial & Global Trade | Mobile App Showcase & Micro-Site | Web3 & Digital Culture | Media, Editorial & Publication | Personal Brand & Creator",
  "displayUrl": "${cleanDomain || 'example.com'}",
  "challenge": "2-3 sentences explaining the client problem, legacy blockers, or industry challenges",
  "solution": "2-3 sentences explaining the bespoke architecture, kinetic motion design, and performance optimizations delivered",
  "pillars": [
    { "title": "01 / SUB-SECOND TTFB", "desc": "Edge-rendered architecture ensuring instant delivery across global nodes." },
    { "title": "02 / KINETIC MOTION", "desc": "60 FPS physics-based micro-interactions tailored for high conversion." },
    { "title": "03 / SCALABLE EDGE", "desc": "Zero cold-start compute with automated cloud cache invalidation." }
  ],
  "techStack": ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion", "Cloudflare Edge", "Supabase"],
  "stats": [
    { "label": "Page Load Time", "value": "0.38s" },
    { "label": "SEO Score", "value": "100%" },
    { "label": "Conversion Growth", "value": "+280%" }
  ]
}`;

      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
      for (const model of modelsToTry) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (textOutput) {
              const cleanedJson = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanedJson);
              return Response.json({
                ...parsed,
                title: parsed.title || derivedTitle,
                displayUrl: parsed.displayUrl || cleanDomain,
                techStack: Array.isArray(parsed.techStack) && parsed.techStack.length > 0 
                  ? parsed.techStack 
                  : (detectedStack.length >= 2 ? detectedStack : ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'])
              });
            }
          }
        } catch (e) {}
      }
    }

    // 3. Smart Heuristic / NLP Synthesizer (Zero API Key Fallback)
    const textCorpus = `${scrapedData.title} ${scrapedData.ogTitle} ${scrapedData.description} ${scrapedData.bodySnippet} ${derivedTitle}`.toLowerCase();

    // Determine category with intelligent priority & boundary checks
    let category = inputCategory || 'Enterprise Digital Platform';
    if (!inputCategory || inputCategory === 'Enterprise Digital Platform') {
      if (/\b(metal|metals|metallurg|metallist|scrap|steel|aluminium|aluminum|copper|brass|bronze|zinc|lead|nickel|alloy|alloys|furnace|furnaces|foundry|foundries|industrial|manufactur|commodity|commodities|logistics|freight|shipping|cargo|import|export|trade\s*house|raw\s*material|circular\s*economy|recycle\s*cans?|smelting)\b/i.test(textCorpus)) {
        category = 'B2B Industrial & Global Trade';
      } else if (/\b(shop|store|cart|checkout|ecommerce|e-commerce|shopify|woocommerce|catalog|retail|merch|buy\s*online|order\s*now)\b/i.test(textCorpus)) {
        category = 'E-Commerce & Online Store';
      } else if (/\b(landing\s*page|waitlist|lead\s*gen|lead\s*capture|pre-order|campaign|launch\s*page|funnel|get\s*early\s*access)\b/i.test(textCorpus)) {
        category = 'High-Converting Landing Page';
      } else if (/\b(clinic|health|doctor|skin|medical|laser|dermatolog|dental|hospital|patient|wellness\s*clinic)\b/i.test(textCorpus)) {
        category = 'Healthcare & Clinical Web';
      } else if (/\b(fragrance|perfume|cologne|scent|decant|luxury\s*apparel|luxury\s*fashion|couture)\b/i.test(textCorpus)) {
        category = 'Luxury Fragrance & Commerce';
      } else if (/\b(ai\s*companion|generative\s*ai|llm|chatgpt|neural\s*network|machine\s*learning\s*model)\b/i.test(textCorpus)) {
        category = 'AI Companion & Product Web';
      } else if (/\b(saas|cloud\s*software|dashboard|workflow|crm|erp|b2b\s*app|platform\s*app)\b/i.test(textCorpus)) {
        category = 'SaaS & B2B Web App';
      } else if (/\b(startup|stealth|seed\s*round|beta\s*release|product\s*hunt|join\s*waitlist)\b/i.test(textCorpus)) {
        category = 'Startup & Product Launch';
      } else if (/\b(restaurant|cafe|bistro|dining|culinary|food|coffee|bakery|menu|chef)\b/i.test(textCorpus)) {
        category = 'Restaurant, Food & Beverage';
      } else if (/\b(edtech|e-learning|curriculum|academy|students?|syllabus|courses?|tuition|bootcamp|pedagogy|tutoring|university|school)\b/i.test(textCorpus) && !/\b(terms|learn\s*more|footer)\b/i.test(textCorpus)) {
        category = 'E-Learning & EdTech Platform';
      } else if (/\b(fintech|payment|neobank|banking|investing|hedge\s*fund|defi|crypto|token|wallet|invoice|billing|credit\s*card|checkout)\b/i.test(textCorpus)) {
        category = 'Fintech & Payment Systems';
      } else if (/\b(hotel|resort|real\s*estate|property|villa|stay|travel|architect|interior)\b/i.test(textCorpus)) {
        category = 'Hospitality & Real Estate';
      } else if (/\b(mobile\s*app|ios\s*app|android\s*app|app\s*store|testflight|download\s*app)\b/i.test(textCorpus)) {
        category = 'Mobile App Showcase & Micro-Site';
      } else if (/\b(studio|creative\s*agency|branding\s*agency|motion\s*design|portfolio)\b/i.test(textCorpus)) {
        category = 'Portfolio & Creative Studio';
      } else if (/\b(web3|nft|blockchain|dao|metaverse)\b/i.test(textCorpus)) {
        category = 'Web3 & Digital Culture';
      }
    }

    // Determine tagline
    let tagline = '';
    if (scrapedData.ogTitle && scrapedData.ogTitle.includes('·')) {
      tagline = scrapedData.ogTitle.split('·')[1].trim();
    } else if (scrapedData.title && scrapedData.title.includes('·')) {
      tagline = scrapedData.title.split('·')[1].trim();
    } else if (scrapedData.title && scrapedData.title.includes('|')) {
      tagline = scrapedData.title.split('|')[1].trim();
    } else if (scrapedData.description) {
      tagline = scrapedData.description.length > 85 ? scrapedData.description.slice(0, 82).replace(/[.,;]\s*$/, '') + '...' : scrapedData.description;
    } else {
      tagline = `High-Performance Digital Architecture for ${derivedTitle}`;
    }

    let challenge = '';
    let solution = '';
    let pillars = [
      { title: '01 / SUB-SECOND TTFB', desc: 'Edge-rendered architecture ensuring instant page delivery across global nodes.' },
      { title: '02 / KINETIC MOTION', desc: '60 FPS physics-based micro-interactions tailored for high conversion and brand prestige.' },
      { title: '03 / SCALABLE EDGE', desc: 'Zero cold-start compute with automated cloud cache invalidation and maximum uptime.' }
    ];
    let stats = [
      { label: 'Page Load Time', value: '0.34s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+280%' }
    ];

    if (category === 'E-Commerce & Online Store') {
      challenge = `High mobile cart abandonment, sluggish product catalog navigation, and slow checkout friction severely erode revenue in modern online shopping.`;
      solution = `Engineered a lightning-fast headless e-commerce store for ${derivedTitle} with sub-second product filtering, kinetic micro-interactions, and a frictionless 1-tap checkout pipeline.`;
      pillars = [
        { title: '01 / SUB-SECOND CATALOG', desc: 'Instant product filtering and zero-latency variant switching powered by edge caching.' },
        { title: '02 / 1-TAP CHECKOUT', desc: 'Friction-free mobile checkout pipeline eliminating cart abandonment drop-offs.' },
        { title: '03 / KINETIC SHOWCASE', desc: 'High-definition 60 FPS visual merchandising that commands premium brand positioning.' }
      ];
      stats = [
        { label: 'Page Load Time', value: '0.31s' },
        { label: 'SEO Score', value: '100%' },
        { label: 'Checkout Conversion', value: '+260%' }
      ];
    } else if (category === 'High-Converting Landing Page') {
      challenge = `High bounce rates on paid traffic and low inquiry rates caused by slow hero renders and unclear, template-driven value propositions.`;
      solution = `Architected a high-converting, kinetic landing page for ${derivedTitle} featuring sub-second global edge rendering, persuasive visual storytelling, and a friction-free lead capture funnel.`;
      pillars = [
        { title: '01 / SUB-SECOND HERO', desc: 'Instant first contentful paint ensuring visitors engage before bouncing.' },
        { title: '02 / CONVERSION FUNNEL', desc: 'Strategically paced visual hierarchy guiding visitors directly into inquiry triggers.' },
        { title: '03 / 60 FPS POLISH', desc: 'Bespoke physics-driven micro-interactions that elevate brand trust and credibility.' }
      ];
      stats = [
        { label: 'Page Load Time', value: '0.24s' },
        { label: 'SEO Score', value: '100%' },
        { label: 'Lead Capture Growth', value: '+380%' }
      ];
    } else if (category === 'B2B Industrial & Global Trade') {
      challenge = scrapedData.description
        ? `Global scrap, metals, and industrial commodity trading relies on rock-solid trust, transparent material specifications, and cross-border logistics across multiple continents. Traditional static websites fail to convey metallurgical standards, causing friction in direct procurement inquiries.`
        : `Legacy trade platforms suffer from slow load times, unverified specifications, and fragmented buyer inquiry workflows that reduce high-value deal conversion.`;
      solution = `We architected an elite, high-velocity Next.js trading platform for ${derivedTitle} featuring real-time grade manifests, sub-second global edge caching, kinetic trade route visualizers, and streamlined RFQ / direct inquiry desks.`;
      pillars = [
        { title: '01 / SUB-SECOND TTFB', desc: 'Global edge delivery ensuring immediate page loads across international trading desks.' },
        { title: '02 / METALLURGICAL SPECS', desc: 'Interactive non-ferrous grade indexing for rapid material and composition verification.' },
        { title: '03 / HIGH-CONVERSION RFQ', desc: 'Frictionless procurement inquiry workflows connecting suppliers directly to furnaces and foundries.' }
      ];
      stats = [
        { label: 'Page Load Time', value: '0.32s' },
        { label: 'SEO Score', value: '100%' },
        { label: 'Direct Trade Inquiries', value: '+260%' }
      ];
    } else if (category === 'Healthcare & Clinical Web') {
      challenge = `Patients expect instant, comforting digital experiences with transparent treatment details. Outdated clinical portals with complex navigation create anxiety and cause high appointment drop-off rates.`;
      solution = `Engineered a serene, high-trust digital clinical portal for ${derivedTitle} featuring sub-second treatment discovery, verified doctor credentials, and a frictionless 2-tap online appointment flow.`;
      stats = [
        { label: 'Page Load Time', value: '0.28s' },
        { label: 'SEO Score', value: '100%' },
        { label: 'Patient Bookings', value: '+340%' }
      ];
    } else if (category === 'Luxury Fragrance & Commerce') {
      challenge = `Luxury fragrance commerce demands exquisite visual storytelling and tactile pacing. Clunky templates and slow product catalog transitions detract from brand prestige and depress mobile cart conversions.`;
      solution = `Crafted a bespoke editorial e-commerce experience for ${derivedTitle} with cinematic typography, instant olfactory note filtering, and an ultra-smooth single-pane mobile checkout pipeline.`;
      stats = [
        { label: 'Page Load Time', value: '0.35s' },
        { label: 'SEO Score', value: '100%' },
        { label: 'Checkout Conversion', value: '+320%' }
      ];
    } else {
      challenge = scrapedData.description
        ? `Delivering a credible, high-trust digital platform for ${derivedTitle} that communicates market leadership while eliminating high bounce rates, unoptimized mobile layouts, and latency bottlenecks.`
        : `Legacy digital solutions often struggle with slow page loading, unoptimized mobile interfaces, and fragmented customer journeys that hurt conversions and brand authority.`;
      solution = `We engineered a bespoke Next.js architecture for ${derivedTitle} featuring sub-second global edge delivery, 60 FPS micro-animations, responsive layout systems, and conversion-optimized CTAs.`;
    }

    const finalTechStack = detectedStack.length >= 2 
      ? Array.from(new Set([...detectedStack, 'TypeScript', 'Cloudflare Edge']))
      : ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'];

    return Response.json({
      title: derivedTitle,
      tagline,
      category,
      displayUrl: cleanDomain,
      challenge,
      solution,
      pillars,
      stats,
      techStack: finalTechStack
    });

  } catch (err) {
    console.error('Case study synthesis error:', err);
    return Response.json({
      title: 'Web Project',
      tagline: 'High-Performance Web Experience & Digital Architecture',
      category: 'Enterprise Digital Platform',
      displayUrl: 'example.com',
      challenge: 'Traditional web platforms suffer from slow load times, confusing navigation, and outdated aesthetics that reduce engagement.',
      solution: 'Architected a modern, lightweight Next.js platform featuring server-side rendering, global edge caching, and interactive micro-animations.',
      techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'PostgreSQL'],
      pillars: [
        { title: '01 / SUB-SECOND TTFB', desc: 'Edge-rendered architecture ensuring instant delivery across global nodes.' },
        { title: '02 / KINETIC MOTION', desc: '60 FPS physics-based micro-interactions tailored for high conversion.' },
        { title: '03 / SCALABLE EDGE', desc: 'Zero cold-start compute with automated cloud cache invalidation.' }
      ],
      stats: [
        { label: 'Page Load Time', value: '0.35s' },
        { label: 'SEO Score', value: '100%' },
        { label: 'Conversion Growth', value: '+300%' }
      ]
    });
  }
}
