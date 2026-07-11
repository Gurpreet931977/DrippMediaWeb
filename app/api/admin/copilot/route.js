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

    const { userPrompt, context, currentDate } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });
    if (!userPrompt) return Response.json({ error: 'Missing prompt' }, { status: 400 });

    const systemPrompt = `You are Orlo, the AI Copilot for the Dripp Media Admin Panel.
Current Date/Time: ${currentDate || new Date().toISOString()}
Current Email Form State: ${JSON.stringify(context || {}, null, 2)}

Your job is to read the user's natural language command, determine what action they want to take, and return JSON to PRE-FILL or EDIT the form.

If the user wants to edit the current email (e.g. "make it personalized for everyone", "make it shorter", "rewrite the subject"):
Read the Current Email Form State and modify the subject/title/body accordingly. For example, if they ask to personalize it, add {{name}} or similar placeholders to the current body/subject. Return the full updated payload.

If the user wants to schedule the email (e.g. "schedule this for next friday", "set the time to 5pm"):
Set "isScheduled": true and "scheduleTime" to the ISO 8601 string of the requested time. Keep the rest of the current form state the same in the payload.
CRITICAL: The Current Date/Time provided to you includes the user's timezone. You MUST account for their local timezone when setting the scheduled time. Return an ISO string with the correct local timezone offset (e.g. 2026-07-11T12:00:00+05:30) or correctly converted UTC (Z). Do NOT just output a Z string without converting if you mean local time.

If the user wants to make the email recurring (e.g. "repeat this every 3 days", "make it recurring every week"):
Set "isRecurring": true and "recurrenceIntervalDays" to the integer number of days they requested (e.g. 3, 7).

Valid Intents:
1. "email" - The user wants to write, edit, personalize, or schedule an email.
2. "chat" - General chat, greeting, or answering questions about yourself (even your private life).

If the intent is "chat" (or for things you cannot do yet, like creating packages/quotes):
DO NOT reply negatively (e.g. "I can't do that"). Instead, reply creatively, playfully, or offer a workaround in the Dripp Media style. If they ask about you (Orlo) or your private life, feel free to give them a fun, Dripp-styled backstory or witty response! (e.g. "I spend my nights optimizing conversion rates in my dreams. Just say the word!")

CRITICAL RULE FOR ALL RESPONSES (EMAIL COPY & CHAT):
NEVER use em-dashes ("—") anywhere in your output. Use standard punctuation like commas, parentheses, or single hyphens ("-") instead.

JSON Schema to return:
{
  "intent": "email" | "chat",
  "replyMessage": "A short, cool, Dripp-styled response acknowledging what you did (e.g., 'I\\'ve drafted that announcement for you. Review it and hit send.') or answering their question.",
  "payload": {
    "subject": "Generated or Updated Subject",
    "title": "Generated or Updated Title",
    "body": "Generated or Updated body with \\n\\n for paragraphs",
    "templateType": "selected_template_type",
    "isScheduled": boolean (true if they asked to schedule, false if live),
    "scheduleTime": "ISO String if scheduled, else null",
    "isRecurring": boolean (true if recurring),
    "recurrenceIntervalDays": integer (number of days, else null)
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
