import { verifyCookie } from '@/app/lib/adminAuth';

export async function POST(request) {
  try {
    // 1. Authenticate Admin
    const cookieHeader = request.headers.get('cookie') || '';
    const COOKIE_NAME = 'dripp_admin_session';
    const cookieValue = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1);

    const adminEmail = verifyCookie(cookieValue);
    if (!adminEmail) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const { templateType, currentSubject, currentTitle, currentBody } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY is missing in env' }, { status: 500 });
    }

    // 3. Build Prompt for Gemini
    const prompt = `You are the lead elite copywriter for Dripp Media.

CONTEXT ABOUT DRIPP MEDIA:
Dripp Media is a premium, state-of-the-art digital agency. Our core services are:
1. High-End Web Development (custom coded, 3D web experiences, next-gen React/Next.js sites)
2. Elite Digital Branding (identity, UI/UX, premium aesthetics)
3. Viral Video Production & Editing (short-form, long-form, high-retention visual hooks)

CRITICAL INSTRUCTION FOR VARIETY:
On every single generation, you MUST invent a completely different scenario, angle, or offer. 
Pick ONE specific service from above (or invent a new wild growth strategy) and focus the email heavily on that. Make up a specific, hyper-creative scenario. BE SPECIFIC and wildly different every time.

THEME AND TONE (CRITICAL):
You are generating an email for the "${templateType || 'announcement'}" template.
You MUST write the copy in the exact style and tone of this specific template:

- "announcement": Tone is aggressively bold, unapologetic, weapons-grade copy. Drop a nuke of an update. Authoritative and paradigm-breaking.
- "primary": Tone is a 1-to-1 personal email to a friend. Casual, direct, zero marketing speak. DO NOT sound like a brand. Avoid words like "sale" or "discount".
- "promo": Tone is pure, unfiltered urgency and aggressive growth-hacker energy. Make the offer sound so absurdly good they feel stupid for not clicking.
- "newsletter": Tone is highly engaging, edgy storytelling. Spill the tea, break the rules, keep them addicted to reading.
- "invitation": Tone is velvet rope exclusivity and high-end luxury. Make them feel like they just got handed the keys to a secret society.
- "alert": Tone is Defcon 1 urgency. Sirens blaring. Cut the pleasantries and tell them exactly what action to take right NOW.

User's current drafts (may be empty):
Current Subject: "${currentSubject || ''}"
Current Title: "${currentTitle || ''}"
Current Body: "${currentBody || ''}"

Rules:
1. If the user provided a title, use it as inspiration to generate a matching subject and body.
2. If the user provided a body, rewrite it into our premium marketing format, and generate a matching subject and title.
3. If they provided all, rewrite them to be better.
4. If they provided none, generate completely new, fresh content based on the template type.
5. NEVER use em dashes (-) anywhere in the copy. Use regular hyphens (-) instead.
6. ALWAYS use the exact string '{{name}}' (without quotes) as a placeholder to personally address the recipient.
7. Do NOT output any conversational text or markdown code blocks. Output ONLY valid JSON in this exact structure:
{
  "subject": "Email Subject Line",
  "title": "Large Header Title",
  "body": "The email body text. Use \\n\\n for paragraph breaks."
}`;

    // 4. Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1.0,
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Gemini API Error]', err);
      return Response.json({ error: 'Failed to generate copy from AI' }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      return Response.json({ error: 'Invalid response from AI' }, { status: 500 });
    }
    
    let parsedResult;
    try {
      const cleanedText = rawText.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse JSON from AI', rawText);
      return Response.json({ error: 'AI returned invalid format' }, { status: 500 });
    }

    return Response.json(parsedResult);
  } catch (err) {
    console.error('[Magic Generate]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
