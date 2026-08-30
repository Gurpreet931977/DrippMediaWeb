import { GoogleGenerativeAI } from '@google/generative-ai';

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
        stats: [
          { label: 'Lighthouse Score', value: '99/100' },
          { label: 'Load Speed', value: '0.4s' },
          { label: 'Conversion Lift', value: '+280%' }
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are Orlo AI, the elite Chief Technology & Design Strategist at Dripp Media (an award-winning web design & development creative agency).

Generate a strategic, agency-grade Web Case Study for the following portfolio website:
- Project Name: "${title || 'Untitled Project'}"
- Live Website URL: "${url || 'https://example.com'}"
- Category / Domain: "${category || 'Web Application'}"
- Admin Notes / Context: "${notes || 'Modern web engineering and bespoke UI/UX design'}"

Strictly return ONLY a valid JSON object matching this exact schema (no markdown markdown backticks around JSON, just pure JSON):
{
  "tagline": "Punchy, elite one-sentence value proposition hook (under 12 words)",
  "category": "Strategic industry category (e.g. Healthcare & Clinical SaaS, Luxury E-Commerce, EdTech Platform, Generative AI Studio)",
  "badge": "Short 2-3 word pill badge",
  "description": "High-impact 2-sentence summary of the engineering and user experience",
  "challenge": "A compelling 2-3 sentence breakdown of the client problem, legacy blockers, or industry pain points",
  "solution": "A sophisticated 2-3 sentence explanation of the technical architecture, design decisions, edge caching, and performance optimizations delivered",
  "techStack": ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion", "Supabase", "PostgreSQL"],
  "stats": [
    { "label": "Lighthouse Score", "value": "99/100" },
    { "label": "Specific Metric", "value": "+340%" },
    { "label": "Speed / Latency", "value": "0.3s" }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean JSON markdown fences if any
    const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return Response.json(parsed);
  } catch (err) {
    console.error('Orlo Case Study generation error:', err);
    // Fallback on error
    return Response.json({
      tagline: `High-Performance Digital Architecture for Modern Growth`,
      category: 'Enterprise Web Application',
      badge: 'Production Web',
      description: `A digital experience built for high performance, sub-second latency, and intuitive conversion flows.`,
      challenge: `Traditional web platforms suffer from slow load times, confusing navigation, and outdated aesthetics that reduce engagement.`,
      solution: `Architected a modern, lightweight Next.js platform featuring server-side rendering, global edge caching, and interactive micro-animations.`,
      techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'PostgreSQL'],
      stats: [
        { label: 'Lighthouse Score', value: '99/100' },
        { label: 'Load Speed', value: '0.4s' },
        { label: 'Performance', value: '60 FPS' }
      ]
    });
  }
}
