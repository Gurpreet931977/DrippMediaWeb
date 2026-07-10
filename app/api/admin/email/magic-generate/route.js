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
    const prompt = `You are an elite marketing copywriter for Dripp Media. 
You write highly-converting, punchy, modern email copy. Short sentences, aggressive growth tone, no fluff.
Template type to generate for: ${templateType || 'announcement'}.

User's current drafts (may be empty):
Current Subject: "${currentSubject || ''}"
Current Title: "${currentTitle || ''}"
Current Body: "${currentBody || ''}"

Instructions:
1. If the user provided a title, use it as inspiration to generate a matching subject and body.
2. If the user provided a body, rewrite it into our premium marketing format, and generate a matching subject and title.
3. If they provided all, rewrite them to be better.
4. If they provided none, generate completely new, fresh content based on the template type.
5. Do NOT output any conversational text or markdown code blocks. Output ONLY valid JSON in this exact structure:
{
  "subject": "Email Subject Line",
  "title": "Large Header Title",
  "body": "The email body text. Use \\n\\n for paragraph breaks."
}`;

    // 4. Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
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
      parsedResult = JSON.parse(rawText);
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
