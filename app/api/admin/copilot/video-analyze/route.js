import { verifyCookie } from '@/app/lib/adminAuth';

export async function POST(request) {
  try {
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

    const { frames, prompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });
    if (!frames || frames.length === 0) return Response.json({ error: 'No frames provided' }, { status: 400 });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
    
    // Construct inline data for each frame
    const imageParts = frames.map(b64 => ({
        inlineData: {
            mimeType: "image/jpeg",
            data: b64
        }
    }));
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
            role: "user", 
            parts: [
                ...imageParts,
                { text: prompt }
            ] 
        }],
        generationConfig: {
            temperature: 0.8,
            responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const textOutput = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(textOutput);

    return Response.json(parsed);
  } catch (error) {
    console.error('Video analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
