export async function POST(request) {
  try {
    const { url, title, category, notes } = await request.json();

    if (!title && !url) {
      return Response.json({ error: 'Title or URL is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return smart fallback case study if API key is not present
      return Response.json({
        tagline: `High-Performance Digital Architecture for ${title || 'Modern Brands'}`,
        category: category || 'Enterprise Web Application',
        badge: category || 'Web Platform',
        description: `An engineered digital experience built for high performance, sub-second latency, and intuitive conversion flows.`,
        challenge: `Legacy web solutions often struggle with high bounce rates, slow mobile load times, and clunky user journeys that hinder customer retention and brand authority.`,
        solution: `We architected a modern, lightweight Next.js platform featuring server-side rendering, global edge caching, and interactive micro-animations that establish market dominance.`,
        techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Supabase', 'Vercel Edge'],
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

    const prompt = `You are Orlo AI, the elite Chief Technology & Design Strategist at Dripp Media (an award-winning web design & development creative agency).

Generate a strategic, agency-grade Web Case Study for the following portfolio website:
- Project Name: "${title || 'Untitled Project'}"
- Live Website URL: "${url || 'https://example.com'}"
- Category / Domain: "${category || 'Web Application'}"
- Admin Notes / Context: "${notes || 'Modern web engineering and bespoke UI/UX design'}"

Strictly return ONLY a valid JSON object matching this exact schema (no markdown formatting, no backticks, just raw JSON):
{
  "tagline": "Punchy, elite one-sentence value proposition hook (under 12 words)",
  "category": "Strategic industry category (e.g. Healthcare & Clinical Web, Luxury Fragrance & Commerce, EdTech Platform, Generative AI Studio)",
  "badge": "Short 2-3 word pill badge",
  "description": "High-impact 2-sentence summary of the engineering and user experience",
  "challenge": "A compelling 2-3 sentence breakdown of the client problem, legacy blockers, or industry pain points in simple client-friendly terms",
  "solution": "A sophisticated 2-3 sentence explanation of the technical architecture, custom design, and speed optimizations delivered",
  "pillars": [
    { "title": "01 / SUB-SECOND SPEED", "desc": "Edge-rendered architecture ensuring instant page delivery." },
    { "title": "02 / BESPOKE DESIGN", "desc": "Custom brand aesthetic engineered for maximum client conversion." },
    { "title": "03 / MOBILE PERFECTION", "desc": "Flawless responsiveness across all devices and screen sizes." }
  ],
  "techStack": ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion", "Supabase", "PostgreSQL"],
  "stats": [
    { "label": "Page Load Time", "value": "0.35s" },
    { "label": "SEO Score", "value": "100%" },
    { "label": "Conversion Growth", "value": "+300%" }
  ]
}`;

    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
    let textOutput = '';

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1000
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (textOutput) break;
        }
      } catch (e) {
        // try next model
      }
    }

    if (!textOutput) {
      throw new Error('No output received from Orlo AI');
    }

    // Clean JSON markdown fences
    const cleanedJson = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return Response.json(parsed);
  } catch (err) {
    console.error('Orlo Case Study generation error:', err);
    // Fallback on error
    return Response.json({
      tagline: `High-Performance Digital Architecture for Modern Growth`,
      category: 'Enterprise Digital Platform',
      badge: 'Production Web',
      description: `A digital experience built for high performance, sub-second latency, and intuitive conversion flows.`,
      challenge: `Traditional web platforms suffer from slow load times, confusing navigation, and outdated aesthetics that reduce engagement.`,
      solution: `Architected a modern, lightweight Next.js platform featuring server-side rendering, global edge caching, and interactive micro-animations.`,
      techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'PostgreSQL'],
      stats: [
        { label: 'Page Load Time', value: '0.35s' },
        { label: 'SEO Score', value: '100%' },
        { label: 'Conversion Growth', value: '+300%' }
      ]
    });
  }
}
