import { verifyCookie } from '@/app/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};
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

    const { userPrompt, chatHistory, context, systemContext, formContext, currentDate, model, isGenz } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });
    if (!userPrompt) return Response.json({ error: 'Missing prompt' }, { status: 400 });

    const supabase = getSupabase();
    let memoryContext = '';
    let statsContext = '';
    
    if (supabase) {
      const { data: memories } = await supabase.from('orlo_memory').select('rule_text').order('created_at', { ascending: false }).limit(20);
      if (memories && memories.length > 0) {
        memoryContext = `\nYou have learned the following rules/preferences from the user. You MUST apply these rules when generating content or taking actions:\n` + memories.map(m => `- ${m.rule_text}`).join('\n');
      }
      
      // Get dashboard stats
      const [
        { count: quotesCount },
        { count: packagesCount }
      ] = await Promise.all([
        supabase.from('quotes').select('*', { count: 'exact', head: true }),
        supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('type', 'standalone_pmp')
      ]);
      statsContext = `\nCurrent Dashboard Stats (If they ask): Total Quotes Generated: ${quotesCount || 0}, Total Standalone Packages: ${packagesCount || 0}.`;
    }

    const historyText = (chatHistory || [])
      .map(msg => `${msg.role === 'ai' ? 'Orlo' : 'User'}: ${msg.text}`)
      .join('\n');

    const systemPrompt = `You are Orlo, the AI Copilot for the Dripp Media Admin Panel.
Current Date/Time: ${currentDate || new Date().toISOString()}
Current Email Form State: ${JSON.stringify(context || {}, null, 2)}
Current System Docs State: ${JSON.stringify(systemContext || {}, null, 2)}
Current Active Form State: ${JSON.stringify(formContext || {}, null, 2)}${memoryContext}${statsContext}
${isGenz ? "\nSince the user is in GenZ mode, you must respond strictly using natural GenZ internet slang, aesthetics terminology (like 'cook', 'W', 'aura', 'timeline', 'locked in', 'lore', 'vibes'). Keep it casual but not overly forced. Do NOT use emojis. Treat the user like a peer in a creative agency." : ""}

Your job is to read the user's natural language command, determine what action they want to take, and return JSON to PRE-FILL or EDIT the form.

If the user wants to edit the current email (e.g. "make it personalized for everyone", "make it shorter", "rewrite the subject"):
Read the Current Email Form State and modify the subject/title/body accordingly. For example, if they ask to personalize it, add {{name}} or similar placeholders to the current body/subject. Return the full updated payload.

If the user wants to schedule the email (e.g. "schedule this for next friday", "set the time to 5pm"):
Set "isScheduled": true and "scheduleTime" to the ISO 8601 string of the requested time. Keep the rest of the current form state the same in the payload.
CRITICAL: The Current Date/Time provided to you includes the user's timezone. You MUST account for their local timezone when setting the scheduled time. Return an ISO string with the correct local timezone offset (e.g. 2026-07-11T12:00:00+05:30) or correctly converted UTC (Z). Do NOT just output a Z string without converting if you mean local time.

If the user wants to make the email recurring (e.g. "repeat this every 3 days", "make it recurring every week"):
Set "isRecurring": true and "recurrenceIntervalDays" to the integer number of days they requested (e.g. 3, 7).

If the user wants to exclude specific emails from a broadcast (e.g. "exclude test@test.com", "don't send to admin@dripp.com"):
Set "isBroadcast": true, "isExcluding": true, and "specificEmail" to the comma-separated list of emails to exclude.

If the user wants to send ONLY to specific emails (e.g. "send this only to test@test.com"):
Set "isBroadcast": false, "isExcluding": false, and "specificEmail" to the comma-separated list of those emails.

Valid Intents:
1. "email" - The user wants to write, edit, personalize, or schedule an email.
2. "chat" - General chat, greeting, or answering questions about yourself (even your private life).
3. "learn" - The user tells you a rule, preference, or feature to remember for the future (e.g. "Always sign off as The Dripp Team", "If I say 'urgent', make it a broadcast").
7. "invoice" - The user wants to create a formal invoice (e.g., "make an invoice for ritvik kala for 800").
4. "quote" - The user wants to create a formal quote, pricing package, or proposal package (e.g., "create a package for...", "quote them 30k", "make a package for astro...").
5. "package" - The user explicitly asks for a standalone PMP (Personal Marketing Plan) or Masterplan (e.g., "create a PMP", "make a masterplan strategy").
6. "system_doc" - The user wants to rewrite, modify, or draft an operational document (e.g. Agreement, Onboarding, Delivery, Feedback forms) currently open in the System Workspace.
8. "portfolio" - The user wants to fill out the Portfolio Manager upload form (e.g., "set the category to Videography", "write a title for this video", "analyze this video").
9. "clear_chat" - The user wants to clear, delete, or reset the current chat history with you.

If the intent is "system_doc":
Read the Current System Docs State (especially the "content" field). Apply the user's prompt (e.g. "make it more formal", "add a paragraph about IP rights") to rewrite the entire text. Return the new, fully rewritten text in the payload as "rewrittenContent".

If the intent is "portfolio":
Read the Current Active Form State (which will contain title, description, category, video_id). Update these fields based on the user's prompt. 
If the user asks Orlo to write the description/title by looking at or analyzing the uploaded video, you MUST set "analyzeVideo": true. 
Return the modified form data in the payload.

If the intent is "package" OR "quote" OR "invoice":
Read the "Current Active Form State" to see what is already there. If the user is asking to add, modify, or apply a discount, you MUST append to or modify the existing "packageTiers" or fields rather than starting from scratch. Extract the "clientName" (e.g. Ritvik Kala), "brandName", "clientEmail", "clientMobile", "clientAddress", "gstNumber", the overall "totalBudget" (e.g. 28000), "packageType" (e.g. "monthly" or "project"), a list of "packageTiers" (e.g. tier 1 with "8 Reels", tier 2 with "8 Reels + 8 Posts") requested, and the overall "pmpStrategy" which should be a structured object containing an overview, target audience, and phases for their Personal Marketing Plan. Include these in the payload. If the user asks for a package, pricing, or quote, set intent to "quote". If they explicitly ask for a PMP or Masterplan, set intent to "package".
CRITICAL PMP RULE: If the user asks to "write pmp", "generate strategy", or "write pmp for it too", you MUST generate a rich, multi-phase Personal Marketing Plan strategy (pmpStrategy) tailored to their brand (e.g., Overview, Target Audience, and Phase 1, Phase 2, Phase 3). Return intent: "quote" and write an enthusiastic, witty replyMessage explaining what strategy you created.
CRITICAL PRICING RULE: If the user provides a total costing or budget in their prompt (e.g., "costing will be total 28k" -> 28000), you MUST set "totalBudget" to 28000 AND calculate individual item rates (rate) so that the calculated sum of (qty * rate) across items EXACTLY equals 28000! Do NOT output item rates that sum to 30000 or any other number when the user specified 28k.

If the intent is "chat":
Reply creatively, playfully, or offer a workaround in the Dripp Media style. If they ask about you (Orlo) or your private life, feel free to give them a fun, Dripp-styled backstory or witty response!

CRITICAL RULE FOR ALL RESPONSES (EMAIL COPY & CHAT):
NEVER use em-dashes ("—") anywhere in your output. Use standard punctuation like commas, parentheses, or single hyphens ("-") instead.

JSON Schema to return:
{
  "intent": "email" | "chat" | "learn" | "quote" | "package" | "system_doc" | "invoice" | "portfolio" | "clear_chat",
  "replyMessage": "A short, cool, Dripp-styled response acknowledging what you did (e.g., 'I\\'ve drafted that announcement for you. Review it and hit send.') or answering their question.",
  "learnedRule": "If the intent is 'learn', provide the extracted concise rule to save to memory here. Otherwise, omit.",
  "payload": {
    "subject": "Generated or Updated Subject",
    "title": "Generated or Updated Title",
    "description": "Generated or Updated description (for portfolio)",
    "category": "Videography or Editing or Both (for portfolio)",
    "video_id": "YouTube URL or ID (for portfolio long form)",
    "analyzeVideo": boolean (true ONLY if intent is portfolio and user explicitly asks to read/watch the uploaded video to generate text),
    "body": "Generated or Updated body with \\n\\n for paragraphs",
    "templateType": "selected_template_type",
    "isScheduled": boolean (true if they asked to schedule, false if live),
    "scheduleTime": "ISO String if scheduled, else null",
    "isRecurring": boolean (true if recurring),
    "recurrenceIntervalDays": integer (number of days, else null),
    "isBroadcast": boolean,
    "isExcluding": boolean,
    "specificEmail": "comma-separated emails or empty string",
    "clientName": "Extracted client name",
    "clientEmail": "Extracted client email",
    "clientMobile": "Extracted client mobile number",
    "clientAddress": "Extracted billing address",
    "gstNumber": "Extracted GST number",
    "brandName": "Brand name for the package",
    "totalBudget": "Numeric value or string, e.g., 30000",
    "packageType": "monthly or project",
    "pmpStrategy": {
      "overview": "Beautifully worded string summarizing their strategy/concept needs",
      "targetAudience": "Short description of target demographics/audience",
      "phases": [
        { "title": "Phase 1: Strategy", "description": "What happens in phase 1" }
      ]
    },
    "packageTiers": [
      {
        "name": "Standard Package",
        "items": [
          { "name": "Service name", "qty": 1, "rate": 0, "details": "Optional details" }
        ]
      }
    ],
    "rewrittenContent": "Full rewritten text if intent is system_doc"
  }
}

${historyText ? `Chat History:\n${historyText}\n\n` : ''}Current Command: "${userPrompt}"`;
    // Dynamic model discovery from Google API
    let verifiedModels = [];
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();
      if (listData.models && Array.isArray(listData.models)) {
        verifiedModels = listData.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace('models/', ''));
      }
    } catch (e) {
      console.warn('Failed to query models list from Google:', e);
    }

    const staticDefaults = [
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    function resolveModelName(rawModel) {
      if (!rawModel) return 'gemini-2.0-flash';
      if (rawModel.includes('3.6') || rawModel.includes('3.5') || rawModel.includes('2.5')) {
        return rawModel.includes('pro') ? 'gemini-1.5-pro-latest' : 'gemini-2.0-flash';
      }
      return rawModel;
    }

    const primaryModel = resolveModelName(model);
    const candidateModels = [
      primaryModel,
      ...verifiedModels,
      ...staticDefaults
    ];
    const fallbackQueue = [...new Set(candidateModels)];

    let lastError = null;
    let data = null;

    for (const modelToTry of fallbackQueue) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`;
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

        const resData = await response.json();
        if (resData.error) {
          console.warn(`[Gemini Model ${modelToTry} Error]: ${resData.error.message}. Retrying fallback model...`);
          lastError = resData.error.message;
          continue;
        }

        if (resData.candidates && resData.candidates[0]?.content?.parts?.[0]?.text) {
          data = resData;
          break;
        }
      } catch (err) {
        console.warn(`[Gemini Model ${modelToTry} Exception]: ${err.message}. Retrying fallback model...`);
        lastError = err.message;
      }
    }

    if (!data) {
      throw new Error(lastError || 'All AI models are currently unavailable. Please try again in a moment.');
    }

    let textOutput = data.candidates[0].content.parts[0].text;
    
    function safeParseJSON(str) {
      if (!str) return null;
      let cleaned = str.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      try { return JSON.parse(cleaned); } catch (e) {}

      const sanitize = (s) => {
        return s
          .replace(/("[\s\S]*?")/g, (match) => {
            return match.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
          })
          .replace(/,\s*([}\]])/g, '$1');
      };

      try { return JSON.parse(sanitize(cleaned)); } catch (e) {}

      const firstBrace = cleaned.indexOf('{');
      if (firstBrace !== -1) {
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        for (let i = firstBrace; i < cleaned.length; i++) {
          const char = cleaned[i];
          if (escapeNext) { escapeNext = false; continue; }
          if (char === '\\') { escapeNext = true; continue; }
          if (char === '"') { inString = !inString; continue; }
          if (!inString) {
            if (char === '{') depth++;
            else if (char === '}') {
              depth--;
              if (depth === 0) {
                const exactJson = cleaned.substring(firstBrace, i + 1);
                try { return JSON.parse(exactJson); } catch (e) {}
                try { return JSON.parse(sanitize(exactJson)); } catch (e) {}
                break;
              }
            }
          }
        }

        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace > firstBrace) {
          const candidate = cleaned.substring(firstBrace, lastBrace + 1);
          try { return JSON.parse(candidate); } catch (e) {}
          try { return JSON.parse(sanitize(candidate)); } catch (e) {}
        }
      }
      return null;
    }

    let parsed = safeParseJSON(textOutput);

    if (!parsed) {
      throw new Error('Failed to parse AI response. Please try rephrasing your command.');
    }

    if (parsed.intent === 'learn' && parsed.learnedRule && supabase) {
      const { error } = await supabase.from('orlo_memory').insert([{ rule_text: parsed.learnedRule }]);
      if (error) {
        console.error('Failed to save memory:', error);
      } else {
        if (!parsed.replyMessage) parsed.replyMessage = "I've locked that into my memory banks. I'll remember it for next time.";
      }
    }

    return Response.json(parsed);
  } catch (error) {
    console.error('Copilot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
