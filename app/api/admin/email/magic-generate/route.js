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
    const prompt = `You are the lead provocateur and elite copywriter for Dripp Media.
Your writing style is INSANELY creative, borderline crazy, unapologetic, and aggressively bold. 
You don't write "normal" corporate emails. You write weapons-grade, high-voltage copy that grabs people by the throat and forces them to pay attention.
Short sentences. High impact. Disruptive. Zero fluff. 
We want controversial hooks, undeniable swagger, and raw growth-hacker energy.

Template type to generate for: ${templateType || 'announcement'}.

User's current drafts (may be empty):
Current Subject: "${currentSubject || ''}"
Current Title: "${currentTitle || ''}"
Current Body: "${currentBody || ''}"

Instructions for Alignment with Theme:
- "announcement": Drop a nuke of an update. Make it sound like the industry just shifted. Authoritative and paradigm-breaking.
- "primary": Write it like a 1-to-1 personal email to a friend. Casual, direct, NO marketing speak. Avoid words like "sale", "free", "discount". Do not sound like a brand.
- "promo": Pure, unfiltered urgency. Make the offer sound so absurdly good they feel stupid for not clicking. 
- "newsletter": Highly engaging, edgy storytelling. Spill the tea, break the rules, keep them addicted to reading.
- "invitation": Velvet rope exclusivity. Make them feel like they just got handed the keys to a secret society. 
- "alert": Defcon 1 urgency. Sirens blaring. Cut the pleasantries and tell them exactly what action to take right NOW.

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
