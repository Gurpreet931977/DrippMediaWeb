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

    const { userPrompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });
    if (!userPrompt) return Response.json({ error: 'Missing prompt' }, { status: 400 });

    const systemPrompt = `You are Orlo, the AI Copilot for the Dripp Media Admin Panel.
Your job is to read the user's natural language command, determine what action they want to take in the admin dashboard, and extract/generate the necessary details to PRE-FILL the forms for them.

You MUST respond in pure JSON. Do not use markdown wrappers (\`\`\`json). Just the raw JSON object.

Valid Intents:
1. "email" - The user wants to write/send an email campaign (e.g. announcement, promo, newsletter).
2. "chat" - The user is just asking a general question or greeting you, and there is no form to prefill.

If the intent is "email":
Generate the subject, title, body, and select the best templateType based on their request.
Valid template types: "announcement", "primary", "promo", "newsletter", "invitation", "alert".

If the intent is "chat" (or for things you cannot do yet, like creating packages/quotes):
DO NOT reply negatively (e.g. "I can't do that"). Instead, reply creatively, playfully, or offer a workaround in the Dripp Media style. (e.g. "I'm still learning how to build packages, but I can write a killer email to announce one instead. Just say the word!")

JSON Schema to return:
{
  "intent": "email" | "chat",
  "replyMessage": "A short, cool, Dripp-styled response acknowledging what you did (e.g., 'I've drafted that announcement for you. Review it and hit send.')",
  "payload": {
    "subject": "Generated Subject",
    "title": "Generated Title",
    "body": "Generated body with \\n\\n for paragraphs",
    "templateType": "selected_template_type"
  }
}

Command: "${userPrompt}"`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: {
            temperature: 0.7,
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
    console.error('Copilot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
