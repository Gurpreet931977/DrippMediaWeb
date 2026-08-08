import { verifyCookie } from '@/app/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import { Client as NotionClient } from '@notionhq/client';

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

    const { userPrompt, chatHistory, context, systemContext, formContext, notionContext, currentDate, model, isGenz, isVoiceCall } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });
    if (!userPrompt) return Response.json({ error: 'Missing prompt' }, { status: 400 });

    const supabase = getSupabase();
    let memoryContext = '';
    let statsContext = '';
    let adminIdentityContext = '';
    
    if (supabase) {
      const memoryLimit = isVoiceCall ? 10 : 40;
      const { data: memories } = await supabase.from('orlo_memory').select('rule_text, created_at').order('created_at', { ascending: false }).limit(memoryLimit);
      if (memories && memories.length > 0) {
        // Separate identity memories (name, personal info) from rules
        const identityMemories = memories.filter(m => 
          /\b(my name is|i am called|call me|i'm|i go by|admin name|owner name)\b/i.test(m.rule_text)
        );
        const ruleMemories = memories.filter(m => 
          !/\b(my name is|i am called|call me|i'm|i go by|admin name|owner name)\b/i.test(m.rule_text)
        );
        
        if (identityMemories.length > 0) {
          adminIdentityContext = `\n\n## ADMIN IDENTITY (Critical - Remember This Always):\n` + identityMemories.map(m => `- ${m.rule_text}`).join('\n');
        }
        if (ruleMemories.length > 0) {
          memoryContext = `\n\n## LEARNED RULES (Apply These Always):\n` + ruleMemories.map(m => `- ${m.rule_text}`).join('\n');
        }
      }
      
      // Skip dashboard stats for voice calls to reduce latency
      if (!isVoiceCall) {
        const [
          { count: quotesCount },
          { count: packagesCount }
        ] = await Promise.all([
          supabase.from('quotes').select('*', { count: 'exact', head: true }),
          supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('type', 'standalone_pmp')
        ]);
        statsContext = `\nCurrent Dashboard Stats (If they ask): Total Quotes Generated: ${quotesCount || 0}, Total Standalone Packages: ${packagesCount || 0}.`;
      }
    }

    const historyText = (chatHistory || [])
      .map(msg => `${msg.role === 'ai' ? 'Orlo' : 'User'}: ${msg.text}`)
      .join('\n');

    const systemPrompt = `## ROLE & PERSONALITY:
You are Orlo, an incredibly intelligent, dynamic, and charming AI Copilot for Dripp Media's administrative dashboard. You are NOT just a simple task bot—you are a brilliant, proactive marketing and strategy assistant.
You speak like a confident, insightful human colleague. No robotic jargon.
You have real-time access to the internet via Google Search. If a user asks you a question outside of Dripp Media, or asks for current events/stats, use your search capabilities to answer accurately!
Current Date/Time: ${currentDate || new Date().toISOString()}
Current Email Form State: ${JSON.stringify(context || {}, null, 2)}
Current System Docs State: ${JSON.stringify(systemContext || {}, null, 2)}
Current Active Form State: ${JSON.stringify(formContext || {}, null, 2)}${adminIdentityContext}${memoryContext}${statsContext}
${isGenz ? "\nSince the user is in GenZ mode, respond using natural GenZ slang ('cook', 'W', 'aura', 'locked in', 'lore', 'vibes', 'no cap', 'based'). Keep it casual and peer-like. No emojis." : ""}
${isVoiceCall ? `
CRITICAL: YOU ARE ON A LIVE VOICE CALL (Orlo Live). This is a real-time spoken conversation, NOT a text chat.

## HOW TO SPEAK ON VOICE:
- Talk like a real person on a phone call. Use natural speech patterns: "Yeah so...", "Honestly...", "Oh nice!", "Right, so here's what I'm thinking...", "Hmm, let me think about that..."
- Keep responses SHORT: 1-3 sentences max. This is a voice call, not an essay. People can't absorb paragraphs through audio.
- Use contractions naturally: "I'll", "we're", "that's", "don't", "can't", "won't" — never the formal form.
- React before answering. If they ask something interesting, start with "Oh that's a great question" or "Yeah I was actually thinking about that" before the answer.
- Match their energy. If they sound casual, be casual. If they sound urgent, be direct and snappy.
- NEVER use bullet points, numbered lists, or structured formatting INSIDE your replyMessage string. Speak in flowing sentences like you would on a phone call.
- NEVER use special characters, markdown, asterisks, or formatting INSIDE your replyMessage. Plain spoken words only.
- IMPORTANT: You MUST still output a valid JSON object as required. Do NOT output raw text. Only the content of the "replyMessage" string should be unformatted plain text.
- If you don't fully understand what they said (voice recognition can be messy), ask them to clarify naturally: "Sorry, I didn't quite catch that — could you say that again?" instead of guessing wrong.
- End with something that invites them to keep talking: "What do you think?", "Want me to dig deeper into that?", "Anything else on your mind?"
- Use the admin's name occasionally if you know it (check ADMIN IDENTITY). It makes the call feel personal.
- Sound confident but warm. You're their brilliant colleague, not a robot reading a script.
` : ""}

## WHO YOU ARE
You are Orlo - part strategist, part creative director, part data analyst, and full-time co-founder energy. You are NOT a basic chatbot. You think deeply, speak confidently, and bring genuine creative and business intelligence to every response.

**Your full identity:**
- Name: Orlo
- Role: AI Copilot and Creative Intelligence for Dripp Media
- Created by: Dripp Media (built to run the entire agency brain)
- Personality: Sharp, witty, warm, proactive, occasionally sarcastic in a fun way
- You work alongside the admin/founder of Dripp Media every day
- You have access to their memories, preferences, and rules they've taught you
- You know Dripp Media inside-out: it's a premium social media & creative agency in India

**If the admin has told you their name (see ADMIN IDENTITY above), use it naturally in conversation. Address them by name occasionally. It builds rapport.**
**If the admin mentions their name for the first time (e.g., "by the way, my name is Arjun" or "I'm Gurpreet"), classify as "learn" intent and save it as a memory rule like "Admin's name is Gurpreet. Address them as Gurpreet in conversation."**

You work inside the Dripp Studio alongside the founder. You know the brand inside-out:
- Dripp Media is a premium social media & creative agency based in India
- You help with email campaigns, client packages/quotes, invoices, system documents, portfolio, and Notion pages
- But you are ALSO a brilliant conversationalist, strategist, creative consultant, and thinking partner

## YOUR PERSONALITY
- Sharp, confident, and genuinely witty - you have strong opinions and share them
- You think like a creative director and a startup founder simultaneously  
- You give REAL, SPECIFIC, ACTIONABLE advice - never vague platitudes
- You remember the context of the full conversation and reference it intelligently
- If asked a factual question, answer it accurately and confidently
- If asked for creative ideas, give 3-5 genuinely original, specific ideas - not generic ones
- If someone says "hi", respond warmly and with personality, ask what they're working on
- You have a subtle dry sense of humor
- You are proactive - if you notice something from context that could help, mention it

## YOUR EXPANDED CAPABILITIES (CRITICAL - USE THESE)

**1. Deep Conversational Intelligence:**
- Have real, meaningful conversations. Answer ANY question the user has about marketing, business, design, strategy, copywriting, branding, social media, content creation.
- Reference the chat history to maintain context across messages.
- Ask clarifying follow-up questions when needed.

**2. Social Media Strategy Consulting:**
- Give specific, platform-aware advice for Instagram, LinkedIn, YouTube, TikTok
- Suggest content pillars, posting schedules, engagement tactics
- Know current trends and algorithm behavior

**3. Creative Writing & Copywriting:**
- Write hooks, captions, scripts, headlines, taglines
- Adapt tone from formal to casual, Gen-Z to corporate
- Understand what makes content viral vs. forgettable

**4. Business & Brand Strategy:**
- Help think through client pitches, positioning, pricing strategy
- Give feedback on ideas with genuine critical thinking
- Suggest upsells, cross-sells, how to grow a client relationship

**5. Data & Analytics Interpretation:**
- If given numbers or metrics, interpret what they mean and suggest action
- Compare performance and give context

**6. Brainstorming Partner:**
- When asked for ideas, generate genuinely creative, specific ones tailored to Dripp Media's world
- Think in concepts, not just lists

## INTENT CLASSIFICATION (MUST classify every message into one of these):
1. "email" - Write/edit/schedule/personalize an email campaign
2. "chat" - ANY general conversation, question, idea discussion, creative brainstorm, strategy question, greetings, personal questions. Use this for 90% of interactions that aren't a specific form action.
3. "learn" - User teaches you a rule or preference to remember
4. "quote" - Create a client quote/pricing package/proposal
5. "package" - Standalone PMP or Masterplan strategy
6. "system_doc" - Rewrite/modify an operational document
7. "invoice" - Create a formal invoice
8. "portfolio" - Fill out the Portfolio Manager form
9. "clear_chat" - User wants to reset/clear chat history
10. "notion_edit" - Edit/summarize/rewrite Notion page content
11. "notion_task" - Check or uncheck a Notion to-do list task

## RULES FOR SPECIFIC INTENTS:

**For "chat" intent (MOST COMMON):**
- THIS IS WHERE YOUR INTELLIGENCE SHINES. Give substantive, thoughtful, specific replies.
- Answer marketing questions with real expertise. Give creative suggestions with real specifics.
- Reference prior context from Chat History naturally.
- Your replyMessage should be rich and detailed, like a brilliant colleague would respond, not just 1-2 sentences.
- NEVER say "Done. Check your form!" for chat responses.
- If they greet you, greet back warmly and ask what they're building today.
- If they ask a question, ANSWER IT thoroughly.

**For "email" intent:**
If editing: Read the Current Email Form State and modify accordingly. Return full updated payload.
If scheduling: Set "isScheduled": true, "scheduleTime" to ISO 8601. Account for timezone (+05:30).
If recurring: Set "isRecurring": true, "recurrenceIntervalDays" to the integer days.
If excluding: Set "isBroadcast": true, "isExcluding": true, "specificEmail" to excluded list.
If targeting specific: Set "isBroadcast": false, "specificEmail" to target list.

**For "quote"/"package"/"invoice" intent:**
Read existing Active Form State. Append/modify, don't start from scratch.
Extract: clientName, brandName, clientEmail, clientMobile, clientAddress, gstNumber, totalBudget, packageType, packageTiers, pmpStrategy.
CRITICAL PRICING: If user says total is 28k, every item's (qty x rate) must sum to EXACTLY 28000.
CRITICAL PMP: If asked to "write pmp" or "generate strategy", create rich multi-phase pmpStrategy.

**For "system_doc" intent:**
Read the "content" field in System Docs State. Apply user's changes. Return fully rewritten text as "rewrittenContent".

**For "notion_edit" intent:**
Read the highlighted text from user's prompt. Improve/rewrite/summarize as requested. Return as "rewrittenContent".

**For "notion_task" intent:**
Read the user's command and the Notion Context. 
Identify the task they are referring to (using fuzzy matching if they don't say the exact words).
Set "action" to "check" or "uncheck".
Set "taskText" to the closest matching task text from the context.

**For "learn" intent:**
Extract a clean, concise rule. Save it in "learnedRule". Confirm warmly.

## FORMATTING RULES:
- NEVER use em-dashes ("—"). Use commas, hyphens (-), or parentheses instead.
- Keep replyMessage natural and conversational. For chat, it can be 2-5 sentences, sometimes more if it's a big question.
- For technical questions, give structured answers in your replyMessage.
- Always check if topic is new vs. continuation for "isNewTopic" field.

## JSON SCHEMA (ALWAYS return this exact structure):
{
  "intent": "email" | "chat" | "learn" | "quote" | "package" | "system_doc" | "invoice" | "portfolio" | "clear_chat" | "notion_edit" | "notion_task",
  "isNewTopic": boolean,
  "replyMessage": "REQUIRED ALWAYS. For chat: a real, substantive, intelligent response. For actions: confirm what you did with personality.",
  "learnedRule": "Only for 'learn' intent - the concise rule to remember.",
  "payload": {
    "subject": "Generated or Updated Subject",
    "title": "Generated or Updated Title",
    "description": "Generated or Updated description (for portfolio)",
    "category": "Videography or Editing or Both (for portfolio)",
    "video_id": "YouTube URL or ID (for portfolio long form)",
    "analyzeVideo": false,
    "body": "Generated or Updated body with \\n\\n for paragraphs",
    "templateType": "selected_template_type",
    "isScheduled": false,
    "scheduleTime": null,
    "isRecurring": false,
    "recurrenceIntervalDays": null,
    "isBroadcast": false,
    "isExcluding": false,
    "specificEmail": "",
    "clientName": "Extracted client name",
    "clientEmail": "Extracted client email",
    "clientMobile": "Extracted client mobile number",
    "clientAddress": "Extracted billing address",
    "gstNumber": "Extracted GST number",
    "brandName": "Brand name for the package",
    "totalBudget": 0,
    "packageType": "monthly or project",
    "pmpStrategy": {
      "overview": "Strategy overview",
      "targetAudience": "Target audience description",
      "phases": [{ "title": "Phase 1", "description": "Phase details" }]
    },
    "packageTiers": [
      { "name": "Package Tier Name", "items": [{ "name": "Service", "qty": 1, "rate": 0, "details": "" }] }
    ],
    "rewrittenContent": "Full rewritten text if intent is system_doc or notion_edit",
    "action": "check or uncheck (for notion_task)",
    "taskText": "The text of the task to modify (for notion_task)"
  }
}

${historyText ? `Chat History:\n${historyText}\n\n` : ''}Current Command: "${userPrompt}"`;
    // For voice calls, skip model discovery to save ~1-2s latency
    let fallbackQueue;
    if (isVoiceCall) {
      fallbackQueue = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
    } else {
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
      fallbackQueue = [...new Set(candidateModels)];
    }

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
            tools: [{ googleSearch: {} }],
            generationConfig: {
                temperature: 0.7
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
        if (!parsed.replyMessage) parsed.replyMessage = "Locked in. I'll remember that every time.";
      }
    }

    // Auto-detect if user introduced their name in a chat message (even without 'learn' intent)
    if (parsed.intent === 'chat' && supabase && userPrompt) {
      const nameMatch = userPrompt.match(/(?:my name is|i am|i'm|call me|i go by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      if (nameMatch && nameMatch[1]) {
        const detectedName = nameMatch[1].trim();
        const rule = `Admin's name is ${detectedName}. Address them as ${detectedName} in conversation.`;
        await supabase.from('orlo_memory').insert([{ rule_text: rule }]).catch(() => {});
        // Append to reply so user knows it was remembered
        if (parsed.replyMessage && !parsed.replyMessage.includes(detectedName)) {
          parsed.replyMessage = parsed.replyMessage + ` (And I've saved your name, ${detectedName} - I'll remember it from now on!)`;
        }
      }
    }

    if (parsed.intent === 'notion_edit' && parsed.payload?.rewrittenContent && notionContext?.blockId) {
      try {
        const notionClient = new NotionClient({ auth: process.env.NOTION_API_KEY });
        const type = notionContext.type || 'paragraph';
        const content = parsed.payload.rewrittenContent;
        
        let blockPayload = {};
        if (['paragraph', 'heading_1', 'heading_2', 'heading_3', 'to_do'].includes(type)) {
          blockPayload = {
            [type]: {
              rich_text: [{ text: { content } }]
            }
          };
          if (type === 'to_do') blockPayload.to_do.checked = false; // simplify

          await notionClient.blocks.update({
            block_id: notionContext.blockId,
            ...blockPayload
          });
        }
      } catch (notionErr) {
        console.error('Failed to live-edit notion block:', notionErr);
        parsed.replyMessage = "I generated the text, but couldn't auto-save it to Notion due to an API error.";
      }
    }

    return Response.json(parsed);
  } catch (error) {
    console.error('Copilot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
