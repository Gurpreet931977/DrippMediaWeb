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

    // 1. Scrape live website metadata if URL is provided
    if (targetUrl) {
      try {
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(6000)
        });

        if (res.ok) {
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
            .slice(0, 1500);

          scrapedData.bodySnippet = bodyClean;
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
  "category": "Pick best match: Enterprise Digital Platform | Healthcare & Clinical Web | Luxury Fragrance & Commerce | AI Companion & Product Web | SaaS & B2B Web App | E-Learning & EdTech Platform | Web3 & Digital Culture | Portfolio & Creative Studio | Fintech & Payment Systems | Hospitality & Real Estate",
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
                displayUrl: parsed.displayUrl || cleanDomain
              });
            }
          }
        } catch (e) {}
      }
    }

    // 3. Smart Heuristic / NLP Synthesizer (Zero API Key Fallback)
    const textCorpus = `${scrapedData.title} ${scrapedData.ogTitle} ${scrapedData.description} ${scrapedData.bodySnippet} ${derivedTitle}`.toLowerCase();

    // Determine category
    let category = inputCategory || 'Enterprise Digital Platform';
    if (!inputCategory || inputCategory === 'Enterprise Digital Platform') {
      if (/\b(clinic|health|doctor|skin|medical|laser|dermatolog|dental|hospital|care)\b/i.test(textCorpus)) {
        category = 'Healthcare & Clinical Web';
      } else if (/\b(fragrance|perfume|luxury|apparel|fashion|shop|store|cart|e-commerce|scent|decant)\b/i.test(textCorpus)) {
        category = 'Luxury Fragrance & Commerce';
      } else if (/\b(ai|llm|gpt|bot|model|neural|generative|companion)\b/i.test(textCorpus)) {
        category = 'AI Companion & Product Web';
      } else if (/\b(saas|software|dashboard|workflow|crm|erp|b2b app|platform app)\b/i.test(textCorpus)) {
        category = 'SaaS & B2B Web App';
      } else if (/\b(learn|course|edtech|education|academy|school|student|teach)\b/i.test(textCorpus)) {
        category = 'E-Learning & EdTech Platform';
      } else if (/\b(finance|payment|crypto|trading|fintech|bank|invest|wallet|invoice)\b/i.test(textCorpus)) {
        category = 'Fintech & Payment Systems';
      } else if (/\b(hotel|resort|real estate|property|villa|stay|travel|architect|interior)\b/i.test(textCorpus)) {
        category = 'Hospitality & Real Estate';
      } else if (/\b(studio|creative|agency|designer|artist|portfolio|photograph)\b/i.test(textCorpus)) {
        category = 'Portfolio & Creative Studio';
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

    const challenge = scrapedData.description
      ? `Delivering a credible, high-trust digital platform for ${derivedTitle} that communicates market leadership while eliminating high bounce rates, clunky mobile checkout, and latency bottlenecks.`
      : `Legacy digital solutions often struggle with slow page loading, unoptimized mobile interfaces, and fragmented customer journeys that hurt conversions and brand authority.`;

    const solution = `We engineered a bespoke Next.js architecture for ${derivedTitle} featuring sub-second global edge delivery, 60 FPS micro-animations, responsive layout systems, and conversion-optimized CTAs.`;

    return Response.json({
      title: derivedTitle,
      tagline,
      category,
      displayUrl: cleanDomain,
      challenge,
      solution,
      techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge', 'Supabase'],
      pillars: [
        { title: '01 / SUB-SECOND TTFB', desc: 'Edge-rendered architecture ensuring instant page delivery across global nodes.' },
        { title: '02 / KINETIC MOTION', desc: '60 FPS physics-based micro-interactions tailored for high conversion and brand prestige.' },
        { title: '03 / SCALABLE EDGE', desc: 'Zero cold-start compute with automated cloud cache invalidation and maximum uptime.' }
      ],
      stats: [
        { label: 'Page Load Time', value: '0.38s' },
        { label: 'SEO Score', value: '100%' },
        { label: 'Conversion Growth', value: '+300%' }
      ]
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
