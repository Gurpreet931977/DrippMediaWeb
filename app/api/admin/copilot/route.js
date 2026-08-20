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

    const { userPrompt, chatHistory, context, systemContext, formContext, notionContext, currentDate, currentPath, model, isGenz, isVoiceCall } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });
    if (!userPrompt) return Response.json({ error: 'Missing prompt' }, { status: 400 });

    const supabase = getSupabase();
    let memoryContext = '';
    let statsContext = '';
    let adminIdentityContext = '';
    let notionSummary = '';

    if (notionContext && (notionContext.pageTitle || (notionContext.blocks && notionContext.blocks.length > 0) || notionContext.selectedText)) {
      const pageTitle = notionContext.pageTitle || notionContext.page?.title || notionContext.title || '';
      const blocks = notionContext.blocks || [];
      let blockText = '';
      if (Array.isArray(blocks) && blocks.length > 0) {
        blockText = blocks.map(b => {
          const text = b.text || (b[b.type]?.rich_text?.map(r => r.plain_text || r.text?.content || '').join('')) || '';
          if (!text.trim()) return '';
          const prefix = b.type === 'to_do' ? `[${b.checked ? 'X' : ' '}] ` : b.type?.startsWith('heading') ? '### ' : '- ';
          return `${prefix}${text}`;
        }).filter(Boolean).join('\n');
      }

      notionSummary = `\n\n## ACTIVE NOTION / STUDIO NOTES DOCUMENT:\nDocument Title: "${pageTitle || 'Untitled Document'}"\n${blockText ? `Document Content:\n${blockText}` : '(Document is currently empty or has no text blocks)'}`;
      if (notionContext.selectedText) {
        notionSummary += `\nCurrently Highlighted Text by Admin: "${notionContext.selectedText}"`;
      }
      if (notionContext.targetBlockId) {
        notionSummary += `\nTarget Block ID: ${notionContext.targetBlockId}`;
      }
    }
    
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
Current Active Studio Page: ${currentPath || 'Dripp Studio'}
Current Email Form State: ${JSON.stringify(context || {}, null, 2)}
Current System Docs State: ${JSON.stringify(systemContext || {}, null, 2)}
Current Active Form State: ${JSON.stringify(formContext || {}, null, 2)}${notionSummary}${adminIdentityContext}${memoryContext}${statsContext}
${isGenz ? "\nsince the user is in genz mode, respond using natural genz slang ('cook', 'w', 'aura', 'locked in', 'lore', 'vibes', 'no cap', 'based'). keep it casual and peer-like. no emojis." : ""}
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

## INTENT CLASSIFICATION RULES (CRITICAL):
1. "quote" - ANY message that describes, requests, or specifies a client proposal, quotation, scope of work, services, deliverables, website design/development project, video/social media retainer, or budget (e.g. "development for a real estate brand... quotation of 15 K which will include...", "build a website proposal for...", "30k quote for 10 reels", "add SEO and hosting to the package"). If the user is on the Quotes & Packages page (/dripp-studio/quote) or describes a client quotation/budget/deliverables, you MUST classify as "quote"!
2. "package" - User explicitly asks for a standalone PMP (Personal Marketing Plan) or Masterplan strategy, or is on the PMP Maker page (/dripp-studio/package).
3. "invoice" - Create or update an invoice, add line items/hours/rates, or user is on the Invoice page (/dripp-studio/invoice).
4. "email" - Write, edit, schedule, or personalize an email marketing campaign.
5. "system_doc" - Rewrite or modify an operational/system document.
6. "portfolio" - Fill out or update the Portfolio Manager form.
7. "learn" - User explicitly teaches you a rule or preference to remember.
8. "clear_chat" - User wants to reset or clear chat history.
9. "notion_edit" - Rewrite or replace a specific highlighted block in a Notion/Studio notes page.
10. "notion_task" - Check or uncheck a Notion to-do list task.
11. "chat" - ONLY for general conversational questions, strategic advice, knowledge lookup, definitions, greetings, or brainstorming that do NOT specify deliverables to build or update in a form.

## RULES FOR SPECIFIC INTENTS:

**For "quote" / "package" intent:**
- Extract all project details from the user prompt:
  - brandName: The brand/client name (e.g. "Real Estate Brand", "Aura Fitness"). If not explicitly named, infer a clean descriptive name.
  - packageType: "project" (for one-time web development, branding, or project builds) or "monthly" (for monthly retainers/management).
  - totalBudget: The total budget as an integer (e.g. "15 K" -> 15000, "50k" -> 50000, "1.5L" -> 150000).
  - packageTiers: Array of tiers containing itemized services.
    CRITICAL PRICING: Break down ALL requested deliverables into distinct service items with appropriate qty and rate. The sum of (qty * rate) across all items in a tier MUST equal the totalBudget! If total is 15000, distribute realistic rates across items so the sum is EXACTLY 15000.
    For each item in items:
      - name: Clear, professional title of the deliverable (e.g. "Custom Designed Website (Basic-Intermediate)", "Domain Implementation & Setup", "Basic Search Engine Optimization (SEO)", "Cloud Web Hosting Setup", "1 Month Maintenance & Bug Fixing")
      - desc: Same clear title
      - qty: Integer (usually 1)
      - rate: Integer price for this item (rates MUST sum to totalBudget)
      - details: Professional 1-2 sentence description of what is included in this deliverable.
  - services: Flat array of all the service items above (for cross-compatibility).
  - pmpStrategy: A rich, professional marketing/project strategy object with:
    - overview: 2-3 sentences explaining the strategic vision and approach.
    - targetAudience: Description of the target demographic/customers.
    - phases: Array of 3-4 structured phases ({ "title": "Phase 1: ...", "description": "..." }).
- In "replyMessage", provide a charming, confident, professional summary of the quote you prepared (mention the brand, total budget, number of deliverables, and highlights).

**For "invoice" intent:**
Read existing Active Form State. Extract clientName, brandName, clientEmail, totalBudget, services/items. Ensure each line item has desc, qty, and rate summing to totalBudget.

**For "chat" intent:**
- Give substantive, thoughtful, specific, beautifully structured replies.
- When asked to summarize a document, extract key insights, create action items, or analyze notes:
  - Thoroughly read the document from "ACTIVE NOTION / STUDIO NOTES DOCUMENT" above.
  - Provide a clear, organized breakdown with ### Key Insights and - [ ] Action Items.
  - Return this FULL detailed summary directly in "replyMessage".
- Answer marketing and strategy questions with real expertise. Give creative suggestions with real specifics.
- Reference prior context from Chat History naturally.
- NEVER say "Done. Check your form!" for chat, summarization, or questions.

**For "email" intent:**
If editing: Read Current Email Form State and modify accordingly. Return full updated payload.
If scheduling: Set "isScheduled": true, "scheduleTime" to ISO 8601 (+05:30).
If recurring: Set "isRecurring": true, "recurrenceIntervalDays" to integer days.
If excluding: Set "isBroadcast": true, "isExcluding": true, "specificEmail" to excluded list.
If targeting specific: Set "isBroadcast": false, "specificEmail" to target list.

**For "system_doc" intent:**
Read the "content" field in System Docs State. Apply user's changes. Return fully rewritten text as "rewrittenContent", and provide a summary of your changes in "replyMessage".

**For "notion_edit" intent:**
Read highlighted text or target block from Notion Context. Rewrite/improve as requested. Return as "rewrittenContent", and explain what was changed in "replyMessage".

**For "notion_task" intent:**
Read user's command and Notion Context. Identify task (fuzzy match). Set "action" to "check" or "uncheck", "taskText" to closest matching task.

**For "learn" intent:**
Extract clean rule into "learnedRule". Confirm warmly.

## FORMATTING RULES:
- NEVER use em-dashes ("—"). Use commas, hyphens (-), or parentheses instead.
- Keep replyMessage natural and conversational.
- For technical questions, give structured answers in your replyMessage.
- Always check if topic is new vs. continuation for "isNewTopic" field.

## JSON SCHEMA (ALWAYS return this exact structure):
{
  "intent": "email" | "chat" | "learn" | "quote" | "package" | "system_doc" | "invoice" | "portfolio" | "clear_chat" | "notion_edit" | "notion_task",
  "isNewTopic": boolean,
  "replyMessage": "REQUIRED ALWAYS. Summary or conversation message.",
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
      { "name": "Package Tier Name", "items": [{ "name": "Service", "desc": "Service", "qty": 1, "rate": 0, "details": "" }] }
    ],
    "services": [
      { "name": "Service", "desc": "Service", "qty": 1, "rate": 0, "details": "" }
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
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
          })
        });

        const resData = await response.json();
        if (resData.error) {
          console.warn(`[Gemini Model ${modelToTry} Error]: ${resData.error.message}. Retrying without responseMimeType...`);
          // Fallback retry without responseMimeType in case model doesn't support it
          const retryRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
              generationConfig: { temperature: 0.7 }
            })
          });
          const retryData = await retryRes.json();
          if (retryData.candidates && retryData.candidates[0]?.content?.parts?.[0]?.text) {
            data = retryData;
            break;
          }
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
      if (!str || typeof str !== 'string') return null;
      const rawClean = str.trim();

      // 1. Direct JSON parse
      try { return JSON.parse(rawClean); } catch (e) {}

      // 2. Extract from markdown codeblock ```json ... ```
      const codeBlockMatch = rawClean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch && codeBlockMatch[1]) {
        const extracted = codeBlockMatch[1].trim();
        try { return JSON.parse(extracted); } catch (e) {}
      }

      // 3. Clean and state-machine repair
      const cleanAndRepair = (jsonString) => {
        let result = jsonString;
        result = result.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^\\:])\/\/.*$/gm, '$1');
        result = result.replace(/,\s*([}\]])/g, '$1');

        let repaired = '';
        let inString = false;
        let isEscaped = false;

        for (let i = 0; i < result.length; i++) {
          const ch = result[i];
          if (inString) {
            if (isEscaped) {
              repaired += ch;
              isEscaped = false;
            } else if (ch === '\\') {
              repaired += ch;
              isEscaped = true;
            } else if (ch === '"') {
              repaired += ch;
              inString = false;
            } else if (ch === '\n') {
              repaired += '\\n';
            } else if (ch === '\r') {
              // skip carriage return
            } else if (ch === '\t') {
              repaired += '\\t';
            } else {
              repaired += ch;
            }
          } else {
            if (ch === '"') {
              inString = true;
            }
            repaired += ch;
          }
        }
        return repaired;
      };

      const firstBrace = rawClean.indexOf('{');
      let candidate = firstBrace !== -1 ? rawClean.substring(firstBrace).trim() : rawClean;
      const lastBrace = candidate.lastIndexOf('}');
      if (lastBrace !== -1) {
        candidate = candidate.substring(0, lastBrace + 1);
      }

      try { return JSON.parse(candidate); } catch (e) {}

      const repaired = cleanAndRepair(candidate);
      try { return JSON.parse(repaired); } catch (e) {}

      // 4. Balance unclosed braces if truncated
      let openBraces = 0;
      let inStr = false;
      let esc = false;
      for (let i = 0; i < repaired.length; i++) {
        const c = repaired[i];
        if (inStr) {
          if (esc) esc = false;
          else if (c === '\\') esc = true;
          else if (c === '"') inStr = false;
        } else {
          if (c === '"') inStr = true;
          else if (c === '{') openBraces++;
          else if (c === '}') openBraces--;
        }
      }

      if (openBraces > 0) {
        let autoClosed = repaired + (inStr ? '"' : '') + '}'.repeat(openBraces);
        autoClosed = autoClosed.replace(/,\s*([}\]])/g, '$1');
        try { return JSON.parse(autoClosed); } catch (e) {}
      }

      // 5. Resilient heuristic fallback
      try {
        const intentMatch = str.match(/"intent"\s*:\s*"([^"]+)"/i);
        const replyMatch = str.match(/"replyMessage"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
        const budgetMatch = str.match(/"totalBudget"\s*:\s*"?([0-9kKmM.,]+)"?/i);
        const brandMatch = str.match(/"brandName"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
        
        if (intentMatch || replyMatch || brandMatch) {
          return {
            intent: intentMatch ? intentMatch[1] : (currentPath === '/dripp-studio/package' ? 'package' : 'quote'),
            replyMessage: replyMatch ? replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "Done! I've processed your request.",
            payload: {
              brandName: brandMatch ? brandMatch[1] : '',
              totalBudget: budgetMatch ? budgetMatch[1] : 0,
              services: [],
              packageTiers: []
            }
          };
        }
      } catch (e) {}

      return null;
    }

    let parsed = safeParseJSON(textOutput);

    if (!parsed) {
      // Ultimate fallback: return structured quote/action rather than error
      parsed = {
        intent: (currentPath === '/dripp-studio/package') ? 'package' : 'quote',
        replyMessage: "Done! I've updated the proposal with your project details and budget.",
        payload: {
          brandName: 'Client Project',
          totalBudget: 0,
          services: [],
          packageTiers: []
        }
      };
    }

    // Number parser helper for budgets and rates (handles "15k", "15 K", "15,000", "₹15000", "1.5L", etc.)
    const parseAmountNumber = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (!val || typeof val !== 'string') return 0;
      const cleaned = val.toLowerCase().replace(/,/g, '').trim();
      if (cleaned.endsWith('k')) {
        const num = parseFloat(cleaned.slice(0, -1));
        return isNaN(num) ? 0 : Math.round(num * 1000);
      }
      if (cleaned.endsWith('m') || cleaned.endsWith('cr')) {
        const num = parseFloat(cleaned.slice(0, -2));
        return isNaN(num) ? 0 : Math.round(num * 1000000);
      }
      if (cleaned.endsWith('l') || cleaned.endsWith('lac') || cleaned.endsWith('lakh')) {
        const num = parseFloat(cleaned.replace(/lakh|lac|l/, ''));
        return isNaN(num) ? 0 : Math.round(num * 100000);
      }
      const match = cleaned.match(/[\d.]+/);
      if (match) {
        const num = parseFloat(match[0]);
        return isNaN(num) ? 0 : Math.round(num);
      }
      return 0;
    };

    // Auto-normalize and validate payload for quote, package, and invoice
    if (parsed.payload) {
      if (parsed.payload.totalBudget !== undefined) {
        parsed.payload.totalBudget = parseAmountNumber(parsed.payload.totalBudget);
      }

      // Check if prompt describes a quote/package or if items exist
      const hasTiers = Array.isArray(parsed.payload.packageTiers) && parsed.payload.packageTiers.length > 0;
      const hasServices = Array.isArray(parsed.payload.services) && parsed.payload.services.length > 0;
      const hasItems = Array.isArray(parsed.payload.items) && parsed.payload.items.length > 0;

      if ((hasTiers || hasServices || hasItems || parsed.payload.totalBudget > 0 || parsed.payload.pmpStrategy) && parsed.intent === 'chat') {
        parsed.intent = (currentPath === '/dripp-studio/package') ? 'package' : 'quote';
      }

      // Sync and normalize packageTiers <-> services <-> items
      if (hasTiers) {
        parsed.payload.packageTiers = parsed.payload.packageTiers.map(tier => ({
          name: tier.name || 'Standard Package',
          items: (tier.items || tier.services || []).map(item => {
            const title = typeof item === 'string' ? item : (item.name || item.desc || 'Service Item');
            return {
              name: title,
              desc: title,
              qty: parseAmountNumber(item.qty) || 1,
              rate: parseAmountNumber(item.rate) || 0,
              details: item.details || ''
            };
          })
        }));

        // Flatten for services array
        if (!hasServices) {
          parsed.payload.services = parsed.payload.packageTiers[0]?.items || [];
        }
      } else if (hasServices) {
        const normalized = parsed.payload.services.map(s => {
          const title = typeof s === 'string' ? s : (s.name || s.desc || 'Service Item');
          return {
            name: title,
            desc: title,
            qty: parseAmountNumber(s.qty) || 1,
            rate: parseAmountNumber(s.rate) || 0,
            details: s.details || ''
          };
        });
        parsed.payload.services = normalized;
        parsed.payload.packageTiers = [{
          name: parsed.payload.brandName ? `${parsed.payload.brandName} Package` : 'Standard Package',
          items: normalized
        }];
      } else if (hasItems) {
        const normalized = parsed.payload.items.map(s => {
          const title = typeof s === 'string' ? s : (s.name || s.desc || 'Service Item');
          return {
            name: title,
            desc: title,
            qty: parseAmountNumber(s.qty) || 1,
            rate: parseAmountNumber(s.rate) || 0,
            details: s.details || ''
          };
        });
        parsed.payload.services = normalized;
        parsed.payload.packageTiers = [{
          name: parsed.payload.brandName ? `${parsed.payload.brandName} Package` : 'Standard Package',
          items: normalized
        }];
      }

      // Exact budget allocation / scaling if totalBudget is specified
      const targetBudget = parsed.payload.totalBudget || 0;
      if (targetBudget > 0 && parsed.payload.packageTiers && parsed.payload.packageTiers.length > 0) {
        parsed.payload.packageTiers.forEach(tier => {
          const items = tier.items || [];
          if (items.length > 0) {
            const sum = items.reduce((acc, it) => acc + ((it.qty || 1) * (it.rate || 0)), 0);
            if (sum === 0) {
              const perItem = Math.round(targetBudget / items.length);
              let running = 0;
              tier.items = items.map((it, idx) => {
                if (idx === items.length - 1) {
                  const rem = targetBudget - running;
                  return { ...it, rate: Math.max(0, Math.round(rem / (it.qty || 1))) };
                }
                const r = Math.round(perItem / (it.qty || 1));
                running += ((it.qty || 1) * r);
                return { ...it, rate: r };
              });
            } else if (Math.abs(sum - targetBudget) > 1) {
              const factor = targetBudget / sum;
              let running = 0;
              tier.items = items.map((it, idx) => {
                if (idx === items.length - 1) {
                  const rem = targetBudget - running;
                  return { ...it, rate: Math.max(0, Math.round(rem / (it.qty || 1))) };
                }
                const r = Math.round(it.rate * factor);
                running += ((it.qty || 1) * r);
                return { ...it, rate: r };
              });
            }
          }
        });
        if (parsed.payload.services && parsed.payload.packageTiers[0]?.items) {
          parsed.payload.services = parsed.payload.packageTiers[0].items;
        }
      }
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

    const targetBlockId = notionContext?.targetBlockId || notionContext?.blockId;
    if (parsed.intent === 'notion_edit' && parsed.payload?.rewrittenContent && targetBlockId) {
      try {
        const notionClient = new NotionClient({ auth: process.env.NOTION_API_KEY });
        const type = notionContext.targetBlockType || notionContext.type || 'paragraph';
        const content = parsed.payload.rewrittenContent;
        
        let blockPayload = {};
        if (['paragraph', 'heading_1', 'heading_2', 'heading_3', 'to_do'].includes(type)) {
          blockPayload = {
            [type]: {
              rich_text: [{ text: { content } }]
            }
          };
          if (type === 'to_do') blockPayload.to_do.checked = false;

          await notionClient.blocks.update({
            block_id: targetBlockId,
            ...blockPayload
          });
        }
      } catch (notionErr) {
        console.error('Failed to live-edit notion block:', notionErr);
      }
    }

    // Ensure replyMessage is NEVER empty or defaulting to 'check form'
    if (!parsed.replyMessage || parsed.replyMessage.trim() === '' || parsed.replyMessage.toLowerCase().includes('check your form')) {
      if (parsed.payload?.rewrittenContent) {
        parsed.replyMessage = parsed.payload.rewrittenContent;
      } else if (['quote', 'package'].includes(parsed.intent)) {
        const brand = parsed.payload?.brandName ? ` for ${parsed.payload.brandName}` : '';
        const budget = parsed.payload?.totalBudget ? ` with a budget of ₹${parsed.payload.totalBudget.toLocaleString()}` : '';
        const itemCount = parsed.payload?.packageTiers?.[0]?.items?.length || parsed.payload?.services?.length || 0;
        const itemText = itemCount > 0 ? ` with ${itemCount} itemized service deliverables` : '';
        parsed.replyMessage = `Done! I've structured the proposal${brand}${budget}${itemText} and populated the scope of services and PMP strategy!`;
      } else if (parsed.intent === 'invoice') {
        parsed.replyMessage = "Done! I've updated the invoice with the requested items and client details.";
      } else if (parsed.intent === 'email') {
        parsed.replyMessage = "Done! I've updated the email campaign details.";
      } else if (parsed.intent === 'portfolio') {
        parsed.replyMessage = "Done! I've updated the portfolio entry.";
      } else {
        parsed.replyMessage = "Done! I've processed your request.";
      }
    }

    return Response.json(parsed);
  } catch (error) {
    console.error('Copilot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
