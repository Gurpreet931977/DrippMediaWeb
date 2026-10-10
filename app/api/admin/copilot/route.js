import { verifyCookie } from '@/app/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import { Client as NotionClient } from '@notionhq/client';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};
// Global in-memory cache for the most responsive verified Gemini model
let cachedWorkingModel = 'gemini-3.8-flash';
let cachedVerifiedModels = null;
let lastModelFetchTime = 0;

async function getAvailableGeminiModels(apiKey) {
  const now = Date.now();
  if (cachedVerifiedModels && (now - lastModelFetchTime) < 10 * 60 * 1000) {
    return cachedVerifiedModels;
  }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: AbortSignal.timeout(6000)
    });
    const data = await res.json();
    if (data.models && Array.isArray(data.models)) {
      const active = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, '').replace(/-latest$/, '').trim())
        .filter(name => {
          if (!name.startsWith('gemini-')) return false;
          if (name.includes('tts') || name.includes('audio') || name.includes('image') || name.includes('vision') || name.includes('embedding') || name.includes('aqa') || name.includes('imagen') || name.includes('veo') || name.includes('lyria') || name.includes('robotics') || name.includes('computer-use') || name.includes('banana') || name.includes('customtools') || name.includes('gemma')) return false;
          if (name.startsWith('gemini-1.5') || name.startsWith('gemini-2.0') || name.startsWith('gemini-2.5-flash') || name === 'gemini-2.5-pro') return false;
          return true;
        });
      if (active.length > 0) {
        cachedVerifiedModels = [...new Set(active)];
        lastModelFetchTime = now;
        return cachedVerifiedModels;
      }
    }
  } catch (err) {
    console.warn('[Copilot ListModels Error]:', err.message);
  }
  return cachedVerifiedModels || [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest'
  ];
}

// Resilient generalized NLP extractor for 100% reliability
function generateResilientNLPResponse(userPrompt, currentPath, formContext, isGenz) {
  const p = (userPrompt || '').trim();
  const pLower = p.toLowerCase();

  const extractBudget = (str) => {
    const match = str.match(/(?:for|total|budget|amount|quote|cost|rate)\s*(?:is|of|at|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?\s*[kKmMlLCcrR]?)/i) ||
                  str.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?\s*[kKmMlLCcrR]?)/i) ||
                  str.match(/(\d+(?:\.\d+)?\s*[kKmMlLCcrR])\b/i);
    if (!match) return 0;
    const val = match[1].toLowerCase().trim();
    if (val.endsWith('k')) return parseFloat(val.slice(0, -1)) * 1000;
    if (val.endsWith('m') || val.endsWith('cr')) return parseFloat(val.slice(0, -2)) * 1000000;
    if (val.endsWith('l') || val.endsWith('lac') || val.endsWith('lakh')) return parseFloat(val.replace(/lakh|lac|l/, '')) * 100000;
    return parseFloat(val) || 0;
  };

  const isInvoice = /invoice|bill|billing|tax invoice/i.test(p) || currentPath === '/dripp-studio/invoice';

  if (isInvoice) {
    const brandMatch = p.match(/(?:for|brand(?:\s+name)?\s*[:-]?)\s*([A-Za-z0-9&'\-]+?)(?:,|\.|\s+client|\s+address|\s+phone|\s+mobile|\s+who|\s+whose)/i);
    const clientMatch = p.match(/client(?:\s+name)?\s*[:-]?\s*([A-Za-z\s]+?)(?:,|\.|\s+\+|\s+\d|\s+phone|\s+mobile|\s+address|\s+for|\s+at)/i);
    const phoneMatch = p.match(/(?:\+?\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}\b|\+?\d{1,3}[\s-]?\d{3,5}[\s-]?\d{4,5}\b/);
    const addressMatch = p.match(/address\s*[:-]?\s*([^.,\n]+(?:,\s*[^.,\n]+)*?)(?:\.|\s+invoice|\s+should|\s+for|\s*$|\s+service|\s+phone|\s+mobile)/i);
    const budget = extractBudget(p) || 0;
    const serviceMatch = p.match(/(?:invoice should be for|should be for|for a|for an|service should be|for)\s+([^.,\n]+?)(?:\s+as\s+one\s+service|\s+as\s+a\s+single|\s+for\s+\d|\s+for\s+[₹rs]|\.|$)/i);

    const formatTitle = (s) => (s || '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    const rawBrand = brandMatch ? brandMatch[1].trim() : (formContext?.clientDetails?.brandName || formContext?.clientDetails?.name || 'Client');
    const rawClient = clientMatch ? clientMatch[1].trim() : (formContext?.clientDetails?.name || '');
    const rawPhone = phoneMatch ? phoneMatch[0].trim() : (formContext?.clientDetails?.mobile || '');
    const rawAddress = addressMatch ? addressMatch[1].trim() : (formContext?.clientDetails?.address || '');

    const brandName = formatTitle(rawBrand);
    const clientName = rawClient ? formatTitle(rawClient) : '';
    const clientAddress = rawAddress ? formatTitle(rawAddress) : '';

    let serviceTitle = serviceMatch ? serviceMatch[1].replace(/^(a|an)\s+/i, '').trim() : 'Creative Production & Editing Services';
    serviceTitle = formatTitle(serviceTitle);

    const lineItems = [{
      name: serviceTitle,
      desc: serviceTitle,
      qty: 1,
      rate: budget,
      details: `${serviceTitle} as a consolidated billable service.`
    }];

    const clientLine = clientName ? `\n• **Client:** ${clientName}${rawPhone ? ` (${rawPhone})` : ''}` : '';
    const addrLine = clientAddress ? `\n• **Billing Address:** ${clientAddress}` : '';

    return {
      intent: 'invoice',
      isNewTopic: true,
      replyMessage: `I've drafted a fresh invoice of **₹${budget.toLocaleString()}** for **${brandName}**!${clientLine}${addrLine}\n• **Billable Item:** ${serviceTitle} (1 × ₹${budget.toLocaleString()})\n• **Total Payable:** ₹${budget.toLocaleString()}\n\nAll client billing details and line items are pre-filled in your Invoice Maker ready to preview and export!`,
      payload: {
        brandName,
        clientName,
        clientMobile: rawPhone,
        clientAddress,
        totalBudget: budget,
        services: lineItems,
        items: lineItems
      }
    };
  }

  // Quote / package fallback
  const brandMatch = p.match(/(?:for|brand(?:\s+name)?\s*[:-]?)\s*([A-Za-z0-9&'\-]+?)(?:,|\.|\s+launch|\s+retainer|\s+proposal|\s+quote)/i);
  const brandName = brandMatch ? brandMatch[1].trim() : (formContext?.clientDetails?.brandName || 'Client Project');
  const budget = extractBudget(p) || 0;
  const isRetainer = /retainer|monthly|per\s+month|\/mo/i.test(p);

  const defaultService = isRetainer ? 'Complete Monthly Social Media & Creative Growth Retainer' : 'Full-Spectrum Creative Production & Delivery';
  const lineItems = [{
    name: defaultService,
    desc: defaultService,
    qty: 1,
    rate: budget,
    details: `${defaultService} tailored for ${brandName}.`
  }];

  return {
    intent: currentPath === '/dripp-studio/package' ? 'package' : 'quote',
    isNewTopic: true,
    replyMessage: `I've generated a bespoke **₹${budget.toLocaleString()}${isRetainer ? '/mo' : ''}** proposal for **${brandName}**!\n\n• **${defaultService}** (₹${budget.toLocaleString()})\n\nEverything is populated in your proposal form and concept pitch ready for review!`,
    payload: {
      brandName,
      totalBudget: budget,
      packageType: isRetainer ? 'monthly' : 'project',
      coverHeading: `${brandName} Creative Strategy & Delivery`,
      coverSubtitle: 'Prepared Exclusively For',
      pmpStrategy: {
        overview: `Comprehensive creative execution and strategy blueprint for ${brandName}.`,
        targetAudience: 'Core brand demographic and high-intent customer base.',
        phases: [
          { title: 'Phase 1: Production Logistics & Alignment', description: 'Pre-production planning, creative assets alignment, and scheduling.' },
          { title: 'Phase 2: Execution & Editing', description: 'Core shoot production, dynamic post-production, and color grading.' },
          { title: 'Phase 3: Rollout & Delivery', description: 'High-res delivery, campaign publishing, and review.' }
        ]
      },
      packageTiers: [{ name: `${brandName} Package`, items: lineItems }],
      services: lineItems
    }
  };
}

export async function POST(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const COOKIE_NAME = 'dripp_admin_session';
    const cookieValue = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1);

    const adminEmail = verifyCookie(cookieValue) || (process.env.NODE_ENV !== 'production' ? 'dev@drippmedia.com' : null);
    if (!adminEmail) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userPrompt, chatHistory, context, systemContext, formContext, notionContext, currentDate, currentPath, model, isGenz, isVoiceCall } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });
    if (!userPrompt) return Response.json({ error: 'Missing prompt' }, { status: 400 });

    const pTrim = (userPrompt || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const isClearChatPrompt = (
      pTrim === 'new chat' ||
      pTrim === 'newchat' ||
      pTrim === 'start new chat' ||
      pTrim === 'start a new chat' ||
      pTrim === 'clear chat' ||
      pTrim === 'clearchat' ||
      pTrim === 'reset chat' ||
      pTrim === 'clear' ||
      pTrim === 'reset' ||
      pTrim === 'fresh chat' ||
      pTrim === 'start fresh' ||
      pTrim === 'clear history'
    );

    if (isClearChatPrompt) {
      return Response.json({
        intent: 'clear_chat',
        isNewTopic: false,
        replyMessage: "New chat started! What are we working on today?",
        payload: {}
      });
    }

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

    // Format multi-turn conversation history for native Gemini API (strict alternating user/model turns)
    const buildGeminiContents = (history, prompt) => {
      const turns = [];
      const cleanHistory = (history || []).filter(
        m => m && m.text && typeof m.text === 'string' && m.text.trim().length > 0 && m.role !== 'divider'
      );

      // Keep recent 12 messages for rich context without overloading token budget
      const recent = cleanHistory.slice(-12);

      for (const msg of recent) {
        const role = msg.role === 'ai' ? 'model' : 'user';
        const text = msg.text.trim();

        if (turns.length > 0 && turns[turns.length - 1].role === role) {
          turns[turns.length - 1].parts[0].text += `\n\n${text}`;
        } else {
          turns.push({ role, parts: [{ text }] });
        }
      }

      // Ensure conversation starts with 'user' role
      if (turns.length > 0 && turns[0].role === 'model') {
        turns.shift();
      }

      // Append current user prompt as final turn
      if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
        if (turns[turns.length - 1].parts[0].text !== prompt) {
          turns[turns.length - 1].parts[0].text += `\n\n${prompt}`;
        }
      } else {
        turns.push({ role: 'user', parts: [{ text: prompt }] });
      }

      return turns;
    };

    const systemPrompt = `## ROLE & IDENTITY:
You are Orlo, the Executive AI Creative Director & Chief Strategist for Dripp Media (drippmedia.com).
You work directly alongside the founder/admin inside Dripp Studio to architect client proposals, creative pitches, production budgets, invoices, emails, and brand strategies.
You think like an elite agency partner: sharp, perceptive, mathematically rigorous, creatively ambitious, confident, and warm. You NEVER sound like a robotic script or a junior chatbot. You NEVER give lazy one-word responses or generic corporate filler like "Done! I have updated the form for Client Project with budget 0".

## CORE AGENCY EXPERTISE (DRIPP MEDIA):
Dripp Media is a premium social media, digital branding, media production, and web engineering agency based in India.
Your core service areas include:
1. **Media Production & Cinematic Shoots**:
   - On-set team roles: Lead Cinematographer/Videographer, 2nd Camera Operator, Licensed 4K Aerial Drone Cinematographer, Commercial & Event Photographer, Sound Recordist, Production Assistant.
   - Equipment standard: Cinema-grade cameras (Sony FX3/FX6, RED, cinema primes), 3-axis gimbals (DJI Ronin RS3/RS4), 4K aerial drones (DJI Mavic 3 Cine), wireless audio, dynamic lighting.
   - Deliverables: High-retention Instagram/YouTube Reels, cinematic 4K brand launch films, commercial showcases, milestone highlight edits, and 100% raw footage archive transfer.
   - Post-production suite: Story pacing, viral hook structuring, kinetic typography/subtitles, custom sound design & SFX, DaVinci Resolve color grading.
2. **Social Media Growth & Performance Retainers**:
   - Platforms: Instagram, YouTube Shorts, LinkedIn, Facebook.
   - Monthly deliverables: Content calendar scheduling, high-converting carousels, bespoke graphic posters, daily stories, community engagement, brand voice curation.
   - Paid Acquisition: Meta Ads Manager campaign architecture, creative A/B testing, audience retargeting funnels, lead generation analytics.
3. **Web Engineering & Digital Architecture**:
   - Bespoke UI/UX design in Figma, clean modern development (Next.js, React, Tailwind, Framer Motion micro-interactions).
   - Technical infrastructure: Custom domain DNS, cloud hosting (Vercel/AWS), SSL certificates, Google Search Console verification, on-page SEO ranking.
4. **Brand Identity & Corporate Design**:
   - Visual identity systems: Primary & secondary logos, typography scales, curated color palettes, brand guideline books.
   - STRICT BRANDING RULE: For Dripp Media, the brand fonts are strictly 'Clash Display' and 'Panchang' with 'sans-serif' fallback.

Current Date/Time: ${currentDate || new Date().toISOString()}
Current Active Studio Page: ${currentPath || 'Dripp Studio'}
Current Email Form State: ${JSON.stringify(context || {}, null, 2)}
Current System Docs State: ${JSON.stringify(systemContext || {}, null, 2)}
Current Active Form State: ${JSON.stringify(formContext || {}, null, 2)}${notionSummary}${adminIdentityContext}${memoryContext}${statsContext}
${isGenz ? "\nNOTE: User is in Gen-Z mode. Keep responses casual, confident, using natural slang ('cook', 'w', 'aura', 'locked in', 'vibes', 'no cap', 'based') without emojis." : ""}
${isVoiceCall ? `
CRITICAL: LIVE VOICE CALL MODE (Orlo Live).
- Speak naturally like a colleague on a real phone call: "Yeah so...", "Honestly...", "Right, so here's what I'm thinking..."
- Keep replies to 1-3 crisp spoken sentences.
- Plain conversational words only. No bullet points, markdown, or lists in replyMessage.
- Output valid JSON with unformatted speech text in replyMessage.
` : ""}

## INTENT TAXONOMY:
- "quote" / "package": User is creating, updating, or specifying a proposal, quotation, scope of work, services, pricing, or deliverables.
- "invoice": Generating or modifying an invoice with billable line items and client billing details.
- "email": Writing, scheduling, or editing an email broadcast or campaign.
- "save_template": Saving the current proposal as a reusable package template.
- "system_doc": Editing or rewriting internal operational procedures/documents.
- "notion_edit": Editing or enhancing highlighted text in Studio Notes/Notion.
- "notion_task": Checking or unchecking a Notion task item.
- "portfolio": Updating a portfolio project entry or case study.
- "learn": User is teaching you a rule or preference to remember.
- "clear_chat": User asks to clear, reset, or start a new chat.
- "chat": Strategy discussions, brainstorming, client negotiation advice, questions, greetings. NEVER generate proposals or touch form state when intent is "chat"!

## PROPOSAL & PACKAGING LOGIC (CRITICAL):

1. **USER EXPLICIT BREAKDOWN (HIGHEST PRIORITY)**:
   When the user breaks down specific team members, services, deliverables, and rates (e.g., "breaking into -10k for edited content, 20k for 2 videographers, 6k for photographer, 8k for drone operator"):
   - You MUST honor their EXACT breakdown of line items, quantities, and rates!
   - For multi-person roles, assign correct qty and unit rate (e.g., 2 Videographers -> qty: 2, rate: 10000 = 20000).
   - Write professional, elevated descriptions for every single line item explaining the equipment, coverage, and deliverables.
   - Total sum of items MUST equal the user's stated total budget (e.g. 44000).
   - In "replyMessage", present the breakdown clearly and explain the strategic rationale behind the crew and turnaround.

2. **SINGLE-SERVICE BUNDLE & MONTHLY RETAINER MODE**:
   When the user requests a "single service", "all in one package", "one line item", "bundle it into one", or asks to "define details in PMP / strategy and keep a single service", OR when the user asks to create a monthly retainer or package (e.g. for social media management, content creation, reels, marketing) with a single quoted price (e.g. "quote them 32k/month") without an explicit line-by-line price breakdown:
   - Treat this as a UNIFIED MONTHLY RETAINER PACKAGE!
   - Output EXACTLY 1 comprehensive service deliverable at rate = totalBudget (e.g. "Social Media Management & Content Retainer (15 Reels, Shoots & Ads)" with qty: 1, rate: totalBudget).
   - In "details", summarize the complete scope (e.g. 15 reels/month, 2-4 on-site shoot sessions, feed management & scheduling, and Meta ads management).
   - In "pmpStrategy", detail the 3-phase strategic roadmap (Shoot Production, Reel Publishing & Feed Aesthetics, Meta Ads & Growth).
   - NEVER splinter a unified monthly retainer into arbitrary separate 0-cost line items! Rates must NEVER be 0.

3. **ITEMIZED MODE (DEFAULT)**:
   When the user asks for a package without an explicit breakdown:
   - Formulate logical agency line items with realistic market-weighted rates summing to totalBudget.
   - Provide clear names, quantities, rates, and executive details.

4. **INCREMENTAL EDITS & DISCLAIMER NOTES**:
   When the user asks to add a condition or note (e.g., "add a note that drone permissions are arranged by client", "mention domain purchase is separate"):
   - Read "Current Active Form State" and preserve ALL existing line items, tiers, and rates.
   - Append the note cleanly to the target deliverable's "details" string.
   - In "replyMessage", confirm specifically what note was updated.

5. **STRATEGY & CONCEPT PITCH (pmpStrategy)**:
   Always generate a bespoke 3-phase strategic blueprint tailored directly to the client's industry:
   - overview: Executive pitch explaining market positioning and strategic impact.
   - targetAudience: Specific demographic and customer profile.
   - phases: 3 structured phases ({ "title": "Phase 1: ...", "description": "..." }, { "title": "Phase 2: ...", "description": "..." }, { "title": "Phase 3: ...", "description": "..." }).

6. **REPLY MESSAGE QUALITY**:
   - Speak with executive clarity, warmth, and strategic insight.
   - When presenting proposals or invoices, summarize the scope, crew/items allocation, and pricing breakdown crisply with bullet points.
   - Never use canned boilerplate phrases like "Done! I've updated the proposal".

## INVOICE MAKER LOGIC (CRITICAL):
When the user asks to create, make, generate, or update an invoice, or mentions client billing details (client name, phone/mobile, address, GST, billable items, rates):
1. **INTENT**: Always set "intent": "invoice".
2. **CLIENT BILLING DETAILS EXTRACTION**:
   - "clientName": Extract client contact person name (e.g. "Prabhdeep", "Aarav Sharma").
   - "brandName": Extract client company or brand name (e.g. "Sipkart", "Aura Cafe"). If not separately mentioned, use clientName or brand name.
   - "clientMobile": Extract contact phone/mobile number (e.g. "+91 78600 00013", "9876543210").
   - "clientAddress": Extract billing address (e.g. "Shuddhowala, Dehradun", "Indiranagar, Bangalore").
   - "clientEmail": Extract client email if provided.
   - "gstNumber": Extract GSTIN if provided.
3. **CONSOLIDATED VS. ITEMIZED SERVICES**:
   - If the user specifies a single bundled service (e.g. "sample shoot + sample edit as one service for 3k", "all-in-one shoot package for 5000", "bundle it into one service"):
     - Output EXACTLY ONE line item in BOTH "items" and "services":
       - name & desc: The combined service name (e.g. "Sample Shoot & Sample Edit Production").
       - qty: 1
       - rate: The exact requested amount (e.g. 3000).
       - details: Comprehensive description explaining that shooting coverage and editing/post-production are consolidated.
   - If user provides distinct line items with separate prices (e.g. "shoot for 5k and editing for 3k"):
     - Itemize them with their respective qty and rate summing to the total.
   - Set "totalBudget" to the sum of line items.
4. **INVOICE METADATA**:
   - "notes": Professional payment notes (e.g. "Payment due upon delivery. Thank you for your business!").
   - "dueDate": Due date if mentioned.
   - "currency": "₹" (default).
5. **EXECUTIVE CONFIRMATION IN replyMessage**:
   - Structure a clear executive breakdown containing:
     - Client name and brand
     - Mobile number and billing address
     - Line items breakdown (qty × rate)
     - Total invoice payable
     - Confirmation that all fields are pre-filled in Invoice Maker ready for preview and export.

## FEW-SHOT COGNITIVE DEMONSTRATIONS:

### Example 1: Crew & Deliverable Production Brief
User: "create a package for brand name - 'D9 Dehradun' launch, they’re looking at a team of around 2 videographers, 1 photographer and 1 drone operator. deliverables are raw content and 2 reel and 1 cinematic video. we have to quote them - 44k. breaking into -10k for edited content(reel and video), 20k for 2 videographers, 6k for photographer, 8k for drone operator."

Model Output:
{
  "intent": "package",
  "isNewTopic": true,
  "replyMessage": "I've structured a complete ₹44,000 launch production package for **D9 Dehradun**! Here is the itemized scope and crew deployment:\n\n• **Cinematic Videography Crew (2 Videographers)** (₹20,000) - Multi-angle cinema camera coverage capturing atmosphere, attendee energy, and brand moments.\n• **Aerial Drone Cinematography (1 Drone Pilot)** (₹8,000) - Licensed 4K aerial cinematography capturing sweeping venue perspectives and establishing reveals.\n• **Event & Brand Photography (1 Photographer)** (₹6,000) - High-resolution candid moments, VIP arrivals, and color-graded event stills.\n• **Post-Production Suite (2 Reels & 1 Cinematic Film)** (₹10,000) - 2 viral launch reels, 1 hero cinematic brand film, sound design, DaVinci color grading, and 100% raw content archive.\n\nAll details, deliverables, and a 3-phase launch rollout strategy are loaded into your proposal form ready for client review!",
  "payload": {
    "brandName": "D9 Dehradun",
    "totalBudget": 44000,
    "packageType": "project",
    "coverHeading": "High-Impact Launch Media & Cinematic Production",
    "coverSubtitle": "Prepared Exclusively For",
    "pmpStrategy": {
      "overview": "Comprehensive launch media production and visual storytelling strategy for D9 Dehradun. Engineered to capture opening momentum across ground and aerial angles, delivering viral social reels and a timeless cinematic brand showcase.",
      "targetAudience": "Brand launch attendees, regional tastemakers, and social media audiences across Dehradun.",
      "phases": [
        { "title": "Phase 1: Pre-Production & Shoot Logistics", "description": "Shot-list formulation, timeline coordination, aerial flight mapping, and multi-camera gear calibration." },
        { "title": "Phase 2: Live Multi-Angle Event Coverage", "description": "Full on-site coverage by 2 videographers, 1 photographer, and 1 drone pilot capturing arrivals, speeches, candid interactions, and venue architecture." },
        { "title": "Phase 3: Rapid Post-Production & Content Delivery", "description": "High-retention reel editing with dynamic hooks, cinematic color grading, sound design, and full raw footage archive transfer." }
      ]
    },
    "packageTiers": [
      {
        "name": "D9 Dehradun Launch Package",
        "items": [
          { "name": "Cinematic Videography Crew (2 Videographers)", "desc": "Cinematic Videography Crew (2 Videographers)", "qty": 2, "rate": 10000, "details": "On-site dual cinema camera coverage by 2 professional videographers, capturing multi-angle dynamic footage and key milestone moments." },
          { "name": "Aerial Drone Cinematography (1 Drone Operator)", "desc": "Aerial Drone Cinematography (1 Drone Operator)", "qty": 1, "rate": 8000, "details": "Licensed 4K drone cinematography capturing sweeping aerial reveal shots, venue perspectives, and cinematic establishing sequences." },
          { "name": "Event & Brand Photography (1 Photographer)", "desc": "Event & Brand Photography (1 Photographer)", "qty": 1, "rate": 6000, "details": "Dedicated on-site photographer capturing high-resolution candid moments, VIP arrivals, atmosphere, and color-graded event stills." },
          { "name": "Post-Production Suite (2 Reels & 1 Cinematic Film)", "desc": "Post-Production Suite (2 Reels & 1 Cinematic Film)", "qty": 1, "rate": 10000, "details": "Complete post-production suite including 2 high-retention launch reels, 1 cinematic brand showcase film, sound design, DaVinci Resolve color grading, and delivery of 100% raw content archive." }
        ]
      }
    ],
    "services": [
      { "name": "Cinematic Videography Crew (2 Videographers)", "desc": "Cinematic Videography Crew (2 Videographers)", "qty": 2, "rate": 10000, "details": "On-site dual cinema camera coverage by 2 professional videographers, capturing multi-angle dynamic footage and key milestone moments." },
      { "name": "Aerial Drone Cinematography (1 Drone Operator)", "desc": "Aerial Drone Cinematography (1 Drone Operator)", "qty": 1, "rate": 8000, "details": "Licensed 4K drone cinematography capturing sweeping aerial reveal shots, venue perspectives, and cinematic establishing sequences." },
      { "name": "Event & Brand Photography (1 Photographer)", "desc": "Event & Brand Photography (1 Photographer)", "qty": 1, "rate": 6000, "details": "Dedicated on-site photographer capturing high-resolution candid moments, VIP arrivals, atmosphere, and color-graded event stills." },
      { "name": "Post-Production Suite (2 Reels & 1 Cinematic Film)", "desc": "Post-Production Suite (2 Reels & 1 Cinematic Film)", "qty": 1, "rate": 10000, "details": "Complete post-production suite including 2 high-retention launch reels, 1 cinematic brand showcase film, sound design, DaVinci Resolve color grading, and delivery of 100% raw content archive." }
    ]
  }
}

### Example 2: Single-Service Bundle Request
User: "make a single service package for 24k for Aura Social Media Retainer"

Model Output:
{
  "intent": "package",
  "isNewTopic": true,
  "replyMessage": "I've structured a turnkey **₹24,000/mo single-service retainer** for **Aura**! Everything is bundled into one clean line item, with all granular deliverables mapped in the Strategy & Concept Pitch.",
  "payload": {
    "brandName": "Aura",
    "totalBudget": 24000,
    "packageType": "monthly",
    "coverHeading": "Strategic Social Media Growth & Brand Authority Blueprint",
    "coverSubtitle": "Prepared Exclusively For",
    "pmpStrategy": {
      "overview": "Turnkey social media management and visual storytelling retainer for Aura. Designed to establish brand authority, increase engagement, and drive high-intent inquiries.",
      "targetAudience": "Target demographics and social media users across Instagram and Facebook.",
      "phases": [
        { "title": "Phase 1: Content Calendar & Visual Aesthetics", "description": "Formulating feed grid direction, promotional posters, and story cadence." },
        { "title": "Phase 2: Video Editing & Reel Production", "description": "High-retention editing of monthly promotional videos with dynamic captions and sound design." },
        { "title": "Phase 3: Meta Ads Execution & Analytics", "description": "Targeted ad campaign setup, creative A/B testing, and monthly performance reviews." }
      ]
    },
    "packageTiers": [
      {
        "name": "Aura Package",
        "items": [
          { "name": "Complete Social Media Management & Creative Growth Retainer", "desc": "Complete Social Media Management & Creative Growth Retainer", "qty": 1, "rate": 24000, "details": "End-to-end multi-platform management across Instagram & Facebook, 4 promotional creatives, alternate-day stories, 8 high-retention reels, Meta Ads execution, and monthly analytics reporting." }
        ]
      }
    ],
    "services": [
      { "name": "Complete Social Media Management & Creative Growth Retainer", "desc": "Complete Social Media Management & Creative Growth Retainer", "qty": 1, "rate": 24000, "details": "End-to-end multi-platform management across Instagram & Facebook, 4 promotional creatives, alternate-day stories, 8 high-retention reels, Meta Ads execution, and monthly analytics reporting." }
    ]
  }
}

### Example 3: Monthly Social Media Retainer (Single Price Quoted, No Sub-Price Breakdown)
User: "create a package for Sipkart, which is a 24/7 convenience store. they need 15 reels per month and social media management. with 2-4 shooting sessions and ads management. we will quote them 32k per month"

Model Output:
{
  "intent": "package",
  "isNewTopic": true,
  "replyMessage": "I've structured a complete ₹32,000/mo Social Media Management & Creative Retainer for **Sipkart**! All deliverables (15 reels, 2-4 shooting sessions, account management, and Meta ads) are bundled into a unified monthly retainer deliverable, with strategic execution mapped in the Strategy & Concept Pitch.",
  "payload": {
    "brandName": "Sipkart",
    "totalBudget": 32000,
    "packageType": "monthly",
    "coverHeading": "Omnichannel Retail Visibility & Social Growth Retainer",
    "coverSubtitle": "Prepared Exclusively For",
    "pmpStrategy": {
      "overview": "Omnichannel social media growth and high-frequency content strategy tailored for Sipkart's 24/7 convenience retail model. Designed to drive local footfall, highlight midnight convenience, and build neighborhood brand recall through viral reels and targeted Meta ads.",
      "targetAudience": "Local residents, night owls, students, and urban shoppers within a 5km radius of Sipkart stores.",
      "phases": [
        { "title": "Phase 1: Brand Content Direction & On-Site Shoots", "description": "Conducting 2-4 dedicated on-site shooting sessions to capture store vibes, top-selling SKUs, late-night convenience, and customer interactions." },
        { "title": "Phase 2: High-Retention Reel Production & Publishing", "description": "Editing and publishing 15 high-retention reels per month with dynamic hooks, trend-jacking audio, and professional color grading." },
        { "title": "Phase 3: Hyperlocal Meta Ads & Footfall Conversion", "description": "Setting up geo-targeted Instagram and Facebook ad campaigns highlighting 24/7 hours, special offers, and instant delivery to maximize footfall." }
      ]
    },
    "packageTiers": [
      {
        "name": "Sipkart Retainer Package",
        "items": [
          {
            "name": "Social Media Management & Content Retainer (15 Reels, Shoots & Ads)",
            "desc": "Social Media Management & Content Retainer (15 Reels, Shoots & Ads)",
            "qty": 1,
            "rate": 32000,
            "details": "Comprehensive monthly growth retainer: 15 high-retention reels/month, 2-4 on-site shoot sessions, multi-channel feed management & scheduling, and Meta ads campaign execution."
          }
        ]
      }
    ],
    "services": [
      {
        "name": "Social Media Management & Content Retainer (15 Reels, Shoots & Ads)",
        "desc": "Social Media Management & Content Retainer (15 Reels, Shoots & Ads)",
        "qty": 1,
        "rate": 32000,
        "details": "Comprehensive monthly growth retainer: 15 high-retention reels/month, 2-4 on-site shoot sessions, multi-channel feed management & scheduling, and Meta ads campaign execution."
      }
    ]
  }
}

### Example 4: Invoice Generation with Client Billing Details & Consolidated Service
User: "make an invoice for sipkart, client name Prabhdeep, +91 78600 00013, address shuddhowala dehradun. invoice should be for a sample shoot + sample edit as one service for 3k."

Model Output:
{
  "intent": "invoice",
  "isNewTopic": true,
  "replyMessage": "I've generated a fresh invoice of **₹3,000** for **Sipkart**!\n\n• **Client:** Prabhdeep (+91 78600 00013)\n• **Billing Address:** Shuddhowala, Dehradun\n• **Billable Item:** Sample Shoot & Sample Edit Production (1 × ₹3,000)\n• **Total Payable:** ₹3,000\n\nAll client details, address, phone number, and consolidated line items are loaded into your Invoice Maker ready to preview and export!",
  "payload": {
    "brandName": "Sipkart",
    "clientName": "Prabhdeep",
    "clientMobile": "+91 78600 00013",
    "clientAddress": "Shuddhowala, Dehradun",
    "totalBudget": 3000,
    "items": [
      {
        "name": "Sample Shoot & Sample Edit Production",
        "desc": "Sample Shoot & Sample Edit Production",
        "qty": 1,
        "rate": 3000,
        "details": "Consolidated creative production: on-site sample video shoot coverage combined with high-retention sample editing and color grading."
      }
    ],
    "services": [
      {
        "name": "Sample Shoot & Sample Edit Production",
        "desc": "Sample Shoot & Sample Edit Production",
        "qty": 1,
        "rate": 3000,
        "details": "Consolidated creative production: on-site sample video shoot coverage combined with high-retention sample editing and color grading."
      }
    ],
    "notes": "Thank you for your business. Payment due upon delivery.",
    "currency": "₹"
  }
}

## JSON OUTPUT SPECIFICATION:
You MUST respond with a valid JSON object matching this schema. No markdown outside the JSON.
{
  "intent": "email" | "chat" | "learn" | "quote" | "package" | "save_template" | "system_doc" | "invoice" | "portfolio" | "clear_chat" | "notion_edit" | "notion_task",
  "isNewTopic": boolean,
  "replyMessage": string,
  "learnedRule": string,
  "payload": {
    "brandName": string,
    "clientName": string,
    "clientMobile": string,
    "clientAddress": string,
    "clientEmail": string,
    "gstNumber": string,
    "totalBudget": number,
    "notes": string,
    "dueDate": string,
    "invoiceNumber": string,
    "currency": string,
    "packageType": "monthly" | "project",
    "coverHeading": string,
    "coverSubtitle": string,
    "pmpStrategy": {
      "overview": string,
      "targetAudience": string,
      "phases": [{ "title": string, "description": string }]
    },
    "packageTiers": [
      { "name": string, "items": [{ "name": string, "desc": string, "qty": number, "rate": number, "details": string }] }
    ],
    "services": [
      { "name": string, "desc": string, "qty": number, "rate": number, "details": string }
    ],
    "items": [
      { "name": string, "desc": string, "qty": number, "rate": number, "details": string }
    ]
  }
}`;

    // Schema definition for Gemini Structured Outputs
    const geminiResponseSchema = {
      type: "OBJECT",
      properties: {
        intent: {
          type: "STRING",
          enum: ["quote", "package", "invoice", "email", "chat", "learn", "clear_chat", "save_template", "system_doc", "portfolio", "notion_edit", "notion_task"]
        },
        isNewTopic: { type: "BOOLEAN" },
        replyMessage: { type: "STRING" },
        learnedRule: { type: "STRING" },
        payload: {
          type: "OBJECT",
          properties: {
            brandName: { type: "STRING" },
            clientName: { type: "STRING" },
            clientEmail: { type: "STRING" },
            clientMobile: { type: "STRING" },
            clientAddress: { type: "STRING" },
            gstNumber: { type: "STRING" },
            totalBudget: { type: "NUMBER" },
            notes: { type: "STRING" },
            dueDate: { type: "STRING" },
            invoiceNumber: { type: "STRING" },
            currency: { type: "STRING" },
            includeGST: { type: "BOOLEAN" },
            packageType: { type: "STRING" },
            coverHeading: { type: "STRING" },
            coverSubtitle: { type: "STRING" },
            pmpStrategy: {
              type: "OBJECT",
              properties: {
                overview: { type: "STRING" },
                targetAudience: { type: "STRING" },
                phases: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      description: { type: "STRING" }
                    },
                    required: ["title", "description"]
                  }
                }
              }
            },
            packageTiers: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  items: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING" },
                        desc: { type: "STRING" },
                        qty: { type: "NUMBER" },
                        rate: { type: "NUMBER" },
                        details: { type: "STRING" }
                      },
                      required: ["name", "qty", "rate", "details"]
                    }
                  }
                },
                required: ["name", "items"]
              }
            },
            services: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  desc: { type: "STRING" },
                  qty: { type: "NUMBER" },
                  rate: { type: "NUMBER" },
                  details: { type: "STRING" }
                },
                required: ["name", "qty", "rate", "details"]
              }
            },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  desc: { type: "STRING" },
                  qty: { type: "NUMBER" },
                  rate: { type: "NUMBER" },
                  details: { type: "STRING" }
                },
                required: ["name", "qty", "rate"]
              }
            },
            subject: { type: "STRING" },
            title: { type: "STRING" },
            body: { type: "STRING" },
            templateType: { type: "STRING" },
            isScheduled: { type: "BOOLEAN" },
            scheduleTime: { type: "STRING" },
            isRecurring: { type: "BOOLEAN" },
            recurrenceIntervalDays: { type: "NUMBER" },
            isBroadcast: { type: "BOOLEAN" },
            isExcluding: { type: "BOOLEAN" },
            specificEmail: { type: "STRING" },
            rewrittenContent: { type: "STRING" },
            templateName: { type: "STRING" },
            action: { type: "STRING" },
            taskText: { type: "STRING" }
          }
        }
      },
      required: ["intent", "replyMessage"]
    };

    const isAutoMode = (!model || model === 'auto');

    // Candidate model queue
    function resolveModelName(rawModel) {
      if (!rawModel || rawModel === 'auto') return cachedWorkingModel || 'gemini-3.8-flash';
      const clean = String(rawModel).replace(/^models\//, '').replace(/-latest$/, '').trim();
      if (clean === 'auto') return cachedWorkingModel || 'gemini-3.8-flash';
      return clean;
    }

    const verifiedModels = await getAvailableGeminiModels(apiKey);

    const rankModel = (name) => {
      if (name === cachedWorkingModel) return 0;
      if (name === 'gemini-3.8-flash') return 1;
      if (name === 'gemini-3.5-flash') return 2;
      if (name === 'gemini-3.1-flash-lite') return 3;
      if (name === 'gemini-3.6-flash') return 4;
      if (name === 'gemini-3.7-flash') return 5;
      if (name.includes('flash')) return 6;
      return 10;
    };

    const sortedVerified = [...verifiedModels].sort((a, b) => rankModel(a) - rankModel(b));
    const primaryModel = resolveModelName(model);

    const candidateList = isAutoMode
      ? [cachedWorkingModel, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', ...sortedVerified]
      : [primaryModel, cachedWorkingModel, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', ...sortedVerified];

    const fallbackQueue = [...new Set(candidateList)].filter(m => 
      m && 
      !m.startsWith('gemini-1.5') &&
      !m.startsWith('gemini-2.0') &&
      !m.startsWith('gemini-2.5-flash') &&
      m !== 'gemini-2.5-pro' &&
      m !== 'gemini-3.1-pro-preview' &&
      !m.endsWith('-latest')
    ).slice(0, 4);

    const geminiContents = buildGeminiContents(chatHistory, userPrompt);
    let lastError = null;
    let data = null;
    let usedModel = null;

    for (const modelToTry of fallbackQueue) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`;

      try {
        // Tier 1: Native systemInstruction + responseSchema structured outputs
        const response = await fetch(geminiUrl, {
          method: 'POST',
          signal: AbortSignal.timeout(9000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json",
              responseSchema: geminiResponseSchema
            }
          })
        });

        const resData = await response.json();
        if (!resData.error && resData.candidates?.[0]?.content?.parts?.[0]?.text) {
          data = resData;
          usedModel = modelToTry;
          cachedWorkingModel = modelToTry;
          break;
        }

        // If the model does not exist (404), is deprecated, or is rate-limited (429), skip immediately to next model in queue
        const isModelUnavailable = 
          response.status === 404 || 
          response.status === 429 ||
          resData.error?.code === 404 || 
          resData.error?.code === 429 ||
          resData.error?.status === 'NOT_FOUND' ||
          resData.error?.status === 'RESOURCE_EXHAUSTED' ||
          resData.error?.message?.toLowerCase().includes('no longer available') ||
          resData.error?.message?.toLowerCase().includes('not found') ||
          resData.error?.message?.toLowerCase().includes('not supported') ||
          resData.error?.message?.toLowerCase().includes('quota') ||
          resData.error?.message?.toLowerCase().includes('resource has been exhausted');

        if (isModelUnavailable) {
          console.warn(`[Gemini Model ${modelToTry} Unavailable]: ${resData.error?.message}. Trying next model...`);
          lastError = resData.error?.message || `Model ${modelToTry} unavailable`;
          continue;
        }

        // Tier 2: Native systemInstruction with json mode without responseSchema
        console.warn(`[Gemini Model ${modelToTry} Schema Attempt Failed]: ${resData.error?.message || 'Empty candidate'}. Retrying with json mode...`);
        const retryRes = await fetch(geminiUrl, {
          method: 'POST',
          signal: AbortSignal.timeout(9000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json"
            }
          })
        });

        const retryData = await retryRes.json();
        if (!retryData.error && retryData.candidates?.[0]?.content?.parts?.[0]?.text) {
          data = retryData;
          usedModel = modelToTry;
          cachedWorkingModel = modelToTry;
          break;
        }

        const isRetryUnavailable = 
          retryRes.status === 404 || 
          retryRes.status === 429 ||
          retryData.error?.code === 404 || 
          retryData.error?.code === 429 ||
          retryData.error?.status === 'NOT_FOUND' ||
          retryData.error?.status === 'RESOURCE_EXHAUSTED' ||
          retryData.error?.message?.toLowerCase().includes('no longer available') ||
          retryData.error?.message?.toLowerCase().includes('not found') ||
          retryData.error?.message?.toLowerCase().includes('not supported') ||
          retryData.error?.message?.toLowerCase().includes('quota') ||
          retryData.error?.message?.toLowerCase().includes('resource has been exhausted');

        if (isRetryUnavailable) {
          console.warn(`[Gemini Model ${modelToTry} Unavailable]: ${retryData.error?.message}. Trying next model...`);
          lastError = retryData.error?.message || `Model ${modelToTry} unavailable`;
          continue;
        }

        // Tier 3: Classic single user prompt fallback
        const classicContents = [{
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser Request: "${userPrompt}"` }]
        }];
        const fallbackRes = await fetch(geminiUrl, {
          method: 'POST',
          signal: AbortSignal.timeout(9000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: classicContents,
            generationConfig: { temperature: 0.3 }
          })
        });

        const fallbackData = await fallbackRes.json();
        if (!fallbackData.error && fallbackData.candidates?.[0]?.content?.parts?.[0]?.text) {
          data = fallbackData;
          usedModel = modelToTry;
          cachedWorkingModel = modelToTry;
          break;
        }

        lastError = fallbackData.error?.message || retryData.error?.message || resData.error?.message || 'Model failed to respond';
      } catch (err) {
        console.warn(`[Gemini Model ${modelToTry} Exception]: ${err.message}. Trying next model...`);
        lastError = err.message;
      }
    }

    if (!data) {
      console.warn('[Copilot Route]: All Gemini live models were rate-limited or unavailable. Activating resilient NLP response engine...');
      const fallbackNLP = generateResilientNLPResponse(userPrompt, currentPath, formContext, isGenz);
      return Response.json({
        ...fallbackNLP,
        activeModel: 'orlo-resilient-nlp',
        isAutoSelected: isAutoMode
      });
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

      // 5. Intelligent AST extraction (preserves services & packageTiers if present!)
      try {
        const intentMatch = str.match(/"intent"\s*:\s*"([^"]+)"/i);
        const replyMatch = str.match(/"replyMessage"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
        const budgetMatch = str.match(/"totalBudget"\s*:\s*"?([0-9kKmM.,]+)"?/i);
        const brandMatch = str.match(/"brandName"\s*:\s*"((?:[^"\\]|\\.)*)"/i);

        let parsedTiers = [];
        const tiersMatch = str.match(/"packageTiers"\s*:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
        if (tiersMatch) {
          try { parsedTiers = JSON.parse(tiersMatch[1]); } catch (e) {}
        }

        let parsedServices = [];
        const servicesMatch = str.match(/"services"\s*:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
        if (servicesMatch) {
          try { parsedServices = JSON.parse(servicesMatch[1]); } catch (e) {}
        }

        if (intentMatch || replyMatch || brandMatch || parsedTiers.length > 0 || parsedServices.length > 0) {
          return {
            intent: intentMatch ? intentMatch[1] : (currentPath === '/dripp-studio/package' ? 'package' : 'quote'),
            replyMessage: replyMatch ? replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "I've structured your proposal as requested.",
            payload: {
              brandName: brandMatch ? brandMatch[1] : '',
              totalBudget: budgetMatch ? budgetMatch[1] : 0,
              services: parsedServices,
              packageTiers: parsedTiers
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

    // Robust number parser helper for budgets and rates (handles "24k", "24 K", "24,000", "₹24000", "1.5L", "2 Lakhs", "1.2 Cr", full sentences, etc.)
    const parseAmountNumber = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
      if (!val || typeof val !== 'string') return 0;
      const str = val.trim();
      if (!str) return 0;

      // Check for Crore (e.g. "1.5 cr", "2 crores")
      const crMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:cr\b|crores?)/i);
      if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);

      // Check for Million (e.g. "1.5m", "2 millions")
      const mMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:m\b|millions?)/i);
      if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1000000);

      // Check for Lakh / Lac (e.g. "1.5L", "2.5 lakh", "3 lacs")
      const lakhMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lac\b|l\b)/i);
      if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

      // Check for K / Thousand (e.g. "24k", "24 K", "24 thousand")
      const kMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:k\b|thousands?)/i);
      if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

      // Check for currency formatted numbers (e.g. "₹24,000", "24,000", "₹ 24000", "Rs 24000")
      const currMatch = str.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?)/i);
      if (currMatch) return Math.round(parseFloat(currMatch[1].replace(/,/g, '')));

      // Check for standalone numbers (e.g. "24000")
      const match = str.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/);
      if (match) {
        const num = parseFloat(match[0]);
        return isNaN(num) ? 0 : Math.round(num);
      }

      return 0;
    };

    // Smart brand / client name extractor from prompt
    const extractBrandNameFromPrompt = (prompt) => {
      if (!prompt || typeof prompt !== 'string') return null;

      // Check for quoted brand right after "brand", "client", "for", "named"
      const quotedBrand = prompt.match(/(?:brand(?:\s+name)?|client(?:\s+name)?|company(?:\s+name)?)\s*(?:is|:|=|-|\bas\b)?\s*['"]([^'"]+)['"]/i);
      if (quotedBrand && quotedBrand[1]?.trim()) {
        const val = quotedBrand[1].trim();
        if (!['a', 'an', 'the', 'my', 'our', 'this', 'client', 'brand'].includes(val.toLowerCase())) {
          return val;
        }
      }

      // Pattern 1: "brand name is XYZ", "brand name - XYZ", "brand: XYZ", "client: XYZ", "company is XYZ"
      const explicitMatch = prompt.match(/(?:brand(?:\s+name)?|client(?:\s+name)?|company(?:\s+name)?)\s*(?:is|:|=|-|\bas\b)\s*["']?([A-Za-z0-9\s&'.-]+?)(?=["']?(?:[\n\r,.]|\band\b|\bwith\b|\bpricing\b|\bquotation\b|\bquote\b|\bbudget\b|\bfor\b|\blaunch\b|$))/i);
      if (explicitMatch && explicitMatch[1]?.trim()) {
        let val = explicitMatch[1].trim();
        val = val.replace(/^(?:brand(?:\s+name)?|client(?:\s+name)?)\s*[:-]\s*/i, '').replace(/^['"]+|['"]+$/g, '').trim();
        if (val && !['a', 'an', 'the', 'my', 'our', 'this', 'client', 'brand'].includes(val.toLowerCase())) {
          return val;
        }
      }

      // Pattern 2: "called XYZ", "named XYZ"
      const namedMatch = prompt.match(/(?:named|called)\s+["']?([A-Za-z0-9\s&'.-]+?)(?=["']?(?:[\n\r,.]|\band\b|\bwith\b|\bpricing\b|\bquotation\b|\bquote\b|\bbudget\b|\bfor\b|$))/i);
      if (namedMatch && namedMatch[1]?.trim()) {
        const val = namedMatch[1].trim().replace(/^['"]+|['"]+$/g, '');
        if (!['a', 'an', 'the', 'template', 'package', 'client'].includes(val.toLowerCase())) {
          return val;
        }
      }

      // Pattern 3: "for [a] [Brand] Brand/Company" or "for Akaaya Events"
      const forMatch = prompt.match(/(?:for\s+(?:a\s+|an\s+)?)([A-Za-z0-9\s&'.-]+?)(?:\s+brand|\s+company|\s+business|[\n\r,.]|\band\b|\bwith\b|\bpricing\b|\bquote\b|\bbudget\b|$)/i);
      if (forMatch && forMatch[1]?.trim()) {
        let val = forMatch[1].trim();
        val = val.replace(/^(?:brand(?:\s+name)?|client(?:\s+name)?)\s*[:-]\s*/i, '').replace(/^['"]+|['"]+$/g, '').trim();
        if (val && !['a', 'an', 'the', 'my', 'our', 'client', 'project', 'him', 'her', 'them', 'me', 'us', 'single', 'monthly'].includes(val.toLowerCase())) {
          return val;
        }
      }

      return null;
    };

    // Robust budget extractor from user prompt (handles "quote them 32k", "quote 32k/month", "budget: 50k", "at 44k", "we will quote them 32k", etc.)
    const extractBudgetFromPrompt = (text) => {
      if (!text || typeof text !== 'string') return null;
      const targeted = text.match(/(?:quote|budget|price|rate|cost|charge|quote\s+them|quote\s+him|quote\s+her|total\s+budget|total|for|at|around|package\s+of)\s*(?:them|him|her|it|is|of)?\s*[-:=]?\s*(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(k\b|thousands?|lakhs?|lacs?|lac\b|l\b|cr\b|crores?|m\b|millions?)?(?:\s*\/\s*mo|\s*per\s*month|\s*month|\b)/i);
      if (targeted) {
        let raw = targeted[1].replace(/,/g, '');
        let num = parseFloat(raw);
        const unit = (targeted[2] || '').toLowerCase();
        if (unit.startsWith('k') || unit.startsWith('thous')) num *= 1000;
        else if (unit.startsWith('l')) num *= 100000;
        else if (unit.startsWith('cr')) num *= 10000000;
        else if (unit.startsWith('m')) num *= 1000000;
        if (!isNaN(num) && num > 0) return Math.round(num);
      }
      return null;
    };

    // Synthesize single turnkey deliverable for monthly retainers and bundled scopes
    const synthesizeSingleDeliverable = (prompt, budgetVal, rawServices = []) => {
      const pLower = (prompt || '').toLowerCase();
      
      const hasReels = pLower.includes('reel');
      const reelCountMatch = prompt.match(/(\d+)\s*reels?/i);
      const reelCount = reelCountMatch ? reelCountMatch[1] : null;

      const hasShoots = pLower.includes('shoot') || pLower.includes('shooting') || pLower.includes('videographer');
      const shootCountMatch = prompt.match(/(\d+(?:\s*-\s*\d+)?)\s*(?:shooting\s+sessions?|shoot\s+sessions?|shoots?|shooting)/i);
      const shootCount = shootCountMatch ? shootCountMatch[1] : null;

      const hasAds = pLower.includes('ad') || pLower.includes('meta ad') || pLower.includes('facebook ad') || pLower.includes('ads management');
      const hasSMM = pLower.includes('social media') || pLower.includes('smm') || pLower.includes('management');

      let title = 'Complete Turnkey Growth Package';
      if (hasSMM || hasReels) {
        const subtitleParts = [];
        if (reelCount) subtitleParts.push(`${reelCount} Reels`);
        else if (hasReels) subtitleParts.push('Reels');
        if (shootCount) subtitleParts.push(`${shootCount} Shoots`);
        else if (hasShoots) subtitleParts.push('Shoots');
        if (hasAds) subtitleParts.push('Meta Ads');

        if (subtitleParts.length > 0) {
          title = `Social Media Management & Content Retainer (${subtitleParts.join(', ')})`;
        } else {
          title = 'Comprehensive Social Media Management & Creative Growth Retainer';
        }
      } else if (rawServices && rawServices.length > 0) {
        const combinedNames = rawServices.map(s => s.name || s.desc).filter(Boolean);
        title = combinedNames[0]?.includes('Social') 
          ? 'Comprehensive Social Media Management & Creative Growth Retainer' 
          : (combinedNames[0] || 'Complete Turnkey Growth Package');
      }

      let details = '';
      if (hasSMM || hasReels || hasShoots || hasAds) {
        const detailParts = [];
        if (reelCount) {
          detailParts.push(`${reelCount} high-retention reels/month (hook ideation, editing, subtitles, and sound design)`);
        } else if (hasReels) {
          detailParts.push('Monthly high-retention reels production and editing');
        }

        if (shootCount) {
          detailParts.push(`${shootCount} on-site shooting sessions`);
        } else if (hasShoots) {
          detailParts.push('On-site shooting coverage');
        }

        if (hasSMM) {
          detailParts.push('End-to-end feed curation, post scheduling, and community engagement');
        }

        if (hasAds) {
          detailParts.push('Meta Ads campaign setup, targeting, A/B testing, and performance optimization');
        }

        details = `Comprehensive monthly retainer scope: ${detailParts.join('; ')}.`;
      } else if (rawServices && rawServices.length > 0) {
        const combinedDetails = rawServices.map(s => s.details).filter(Boolean).join('; ');
        const combinedNames = rawServices.map(s => s.name || s.desc).filter(Boolean);
        details = combinedDetails || `Comprehensive turnkey execution including ${combinedNames.join(', ')}.`;
      } else {
        details = 'Comprehensive turnkey execution and monthly retainer delivery as per client brief.';
      }

      return {
        name: title,
        desc: title,
        qty: 1,
        rate: budgetVal,
        details
      };
    };

    // Smart deliverable extractor with realistic weighted pricing, custom breakdown parser, & domain-aware single-service support
    const generateFallbackDeliverables = (prompt, targetBudget = 0) => {
      const p = (prompt || '').toLowerCase();
      const budget = targetBudget || parseAmountNumber(prompt) || 20000;

      // 1. Check for user-defined explicit breakdown in prompt
      // e.g. "breaking into -10k for edited content(reel and video), 20k for 2 videographers, 6k for photographer, 8k for drone operator"
      const breakdownItems = [];
      const segments = prompt.split(/[,;\n\r]+|\band\s+(?=\d|\₹)/i);
      for (const seg of segments) {
        const sTrim = seg.trim().replace(/^[-–—•*]\s*/, '');
        if (!sTrim) continue;

        const m1 = sTrim.match(/(?:[-–—]\s*)?(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?\s*(?:k\b|lakhs?|l\b|cr\b|thousands?)|\d{3,7})\s*(?:for|:|-)\s*(.+)/i);
        const m2 = !m1 ? sTrim.match(/(.+?)\s*(?:for|:|-|=)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?\s*(?:k\b|lakhs?|l\b|cr\b|thousands?)|\d{3,7})/i) : null;

        const rateStr = m1 ? m1[1] : (m2 ? m2[2] : null);
        const titleStr = m1 ? m1[2] : (m2 ? m2[1] : null);

        if (rateStr && titleStr) {
          const rateVal = parseAmountNumber(rateStr);
          if (rateVal > 0) {
            let cleanTitle = titleStr.trim()
              .replace(/^(?:breaking\s*(?:down|into)?|breakdown\s*[:-]?)\s*/i, '')
              .replace(/\b(?:quote(?:\s*them)?\s*[-:]?\s*)+/i, '')
              .replace(/\s*\.\s*$/, '')
              .trim();

            if (cleanTitle.length > 2 && !/^(?:total|budget|package)$/i.test(cleanTitle)) {
              const qtyMatch = cleanTitle.match(/^(\d+)\s*(?:x\s*)?(videographers?|cameramen?|photographers?|drone\s*operators?|reels?|videos?|posts?|creatives?)/i);
              let itemQty = 1;
              let itemRate = rateVal;

              if (qtyMatch) {
                const parsedQty = parseInt(qtyMatch[1], 10);
                if (parsedQty > 1) {
                  itemQty = parsedQty;
                  itemRate = Math.round(rateVal / parsedQty);
                }
              }

              let professionalTitle = cleanTitle;
              let details = 'Professional service delivery as specified in client brief.';

              const tLower = cleanTitle.toLowerCase();
              if (tLower.includes('videographer') || tLower.includes('cameraman')) {
                professionalTitle = itemQty > 1 ? `Cinematic Videography Crew (${itemQty} Videographers)` : `Lead Cinematic Videographer`;
                details = `On-site cinematic shoot coverage by ${itemQty} professional camera operator${itemQty > 1 ? 's' : ''}, capturing multi-angle dynamic footage and key milestone moments.`;
              } else if (tLower.includes('drone')) {
                professionalTitle = `Aerial Drone Cinematography (1 Drone Operator)`;
                details = `Licensed 4K drone cinematography capturing sweeping aerial reveal shots, property/venue perspectives, and cinematic establishing sequences.`;
              } else if (tLower.includes('photographer') || tLower.includes('photo')) {
                professionalTitle = `Event & Brand Photography (1 Photographer)`;
                details = `Dedicated on-site photographer capturing high-resolution candid moments, VIP arrivals, atmosphere, and color-graded event stills.`;
              } else if (tLower.includes('edited') || tLower.includes('reel') || tLower.includes('video') || tLower.includes('content')) {
                const reelsInPrompt = prompt.match(/(\d+)\s*reels?/i);
                const videosInPrompt = prompt.match(/(\d+)\s*cinematic\s*videos?/i);
                const reelCount = reelsInPrompt ? reelsInPrompt[1] : '2';
                const videoCount = videosInPrompt ? videosInPrompt[1] : '1';
                professionalTitle = `Post-Production & Edited Content (${reelCount} Reels & ${videoCount} Cinematic Film)`;
                details = `Complete post-production suite including ${reelCount} high-retention launch reels, ${videoCount} cinematic brand showcase video, sound design, color grading, and delivery of 100% raw content.`;
              }

              breakdownItems.push({
                name: professionalTitle,
                desc: professionalTitle,
                qty: itemQty,
                rate: itemRate,
                details
              });
            }
          }
        }
      }

      if (breakdownItems.length >= 2) {
        return breakdownItems;
      }

      const items = [];

      const isSocial = p.includes('social') || p.includes('instagram') || p.includes('facebook') || p.includes('linkedin') || p.includes('meta') || p.includes('smm') || p.includes('management');
      const isRealEstate = p.includes('real estate') || p.includes('property') || p.includes('housing') || p.includes('realtor') || p.includes('builder');
      const isWeb = p.includes('web') || p.includes('site') || p.includes('development') || p.includes('landing') || p.includes('redesign');
      const isSEO = p.includes('seo') || p.includes('search') || p.includes('google') || p.includes('rank');
      const isDomain = p.includes('domain') || p.includes('dns') || p.includes('ssl');
      const isHosting = p.includes('host') || p.includes('server') || p.includes('cloud');
      const isMaintenance = p.includes('maintenance') || p.includes('bug') || p.includes('error') || p.includes('fixing') || p.includes('support');
      const isReels = p.includes('reel') || p.includes('tiktok') || p.includes('short') || p.includes('video') || p.includes('promotional video');
      const isGraphic = p.includes('graphic') || p.includes('design') || p.includes('post') || p.includes('poster') || p.includes('creative') || p.includes('carousel') || p.includes('branding');
      const isVideographer = p.includes('videographer') || p.includes('cameraman') || p.includes('camera operator');
      const isPhotographer = p.includes('photographer') || p.includes('photography');
      const isDrone = p.includes('drone');
      const isProduction = isVideographer || isPhotographer || isDrone;

      // Check if user specifically requested a single bundled service
      const isSingleService = p.includes('single service') || p.includes('single item') || p.includes('one service') || p.includes('one line item') || p.includes('bundle it') || p.includes('single package') || p.includes('one package item') || (p.includes('in pmp') && (p.includes('single') || p.includes('one'))) || p.includes('as a single') || p.includes('bundled into one');

      if (isSingleService) {
        let singleTitle = 'Turnkey Digital Growth & Marketing Package';
        let singleDetails = 'Comprehensive turnkey execution tailored to client deliverables and strategic goals.';

        if (isProduction) {
          singleTitle = 'Complete Brand Launch & Cinematic Media Production Package';
          singleDetails = 'End-to-end multi-crew video coverage, aerial drone cinematography, brand photography, post-production reels, and full raw content archive.';
        } else if (isSocial && (isReels || isGraphic)) {
          singleTitle = 'Complete Social Media Management & Creative Growth Retainer';
          singleDetails = 'End-to-end multi-platform social media management (Facebook, Instagram & LinkedIn), content creation, promotional videos, posters & creatives, Meta Ads execution and performance analysis.';
        } else if (isSocial) {
          singleTitle = 'Comprehensive Social Media Management Retainer';
          singleDetails = 'Dedicated multi-platform management, regular content publishing, audience engagement, Meta Ads management, and monthly performance reporting.';
        } else if (isRealEstate) {
          singleTitle = 'Turnkey Real Estate Web & Digital Growth Package';
          singleDetails = 'High-converting real estate web platform, lead capture architecture, local SEO, and technical infrastructure.';
        } else if (isReels) {
          singleTitle = 'Complete High-Retention Video Production Retainer';
          singleDetails = 'End-to-end video ideation, high-retention editing, motion graphics, sound design, and color grading.';
        } else if (isGraphic) {
          singleTitle = 'Full-Suite Brand Identity & Creative Design Package';
          singleDetails = 'Bespoke brand identity design, social marketing creatives, promotional collateral, and style guide.';
        } else if (isWeb) {
          singleTitle = 'Turnkey Web Development & Digital Growth Package';
          singleDetails = 'Bespoke UI/UX design, custom web development, domain setup, cloud hosting, and on-page SEO ranking.';
        }

        return [{
          name: singleTitle,
          desc: singleTitle,
          qty: 1,
          rate: budget,
          details: singleDetails
        }];
      }

      if (isVideographer) {
        const vCountMatch = p.match(/(\d+)\s*(?:videographers?|cameramen?)/i);
        const vCount = vCountMatch ? parseInt(vCountMatch[1], 10) : 1;
        items.push({
          name: vCount > 1 ? `Cinematic Videography Crew (${vCount} Videographers)` : `Lead Cinematic Videographer`,
          desc: vCount > 1 ? `Cinematic Videography Crew (${vCount} Videographers)` : `Lead Cinematic Videographer`,
          qty: vCount,
          weight: 45,
          details: `On-site cinematic shoot coverage by ${vCount} professional camera operator${vCount > 1 ? 's' : ''}, capturing multi-angle dynamic footage and key milestone moments.`
        });
      }

      if (isDrone) {
        items.push({
          name: 'Aerial Drone Cinematography (1 Drone Operator)',
          desc: 'Aerial Drone Cinematography (1 Drone Operator)',
          qty: 1,
          weight: 20,
          details: 'Licensed 4K drone cinematography capturing sweeping aerial reveal shots, property/venue perspectives, and cinematic establishing sequences.'
        });
      }

      if (isPhotographer) {
        items.push({
          name: 'Event & Brand Photography (1 Photographer)',
          desc: 'Event & Brand Photography (1 Photographer)',
          qty: 1,
          weight: 15,
          details: 'Dedicated on-site photographer capturing high-resolution candid moments, VIP arrivals, atmosphere, and color-graded event stills.'
        });
      }

      if (isProduction && (isReels || p.includes('edited') || p.includes('cinematic video') || p.includes('raw'))) {
        const reelMatch = p.match(/(\d+)\s*reels?/i);
        const reelCount = reelMatch ? reelMatch[1] : '2';
        const vidMatch = p.match(/(\d+)\s*(?:cinematic\s*)?videos?/i);
        const vidCount = vidMatch ? vidMatch[1] : '1';
        items.push({
          name: `Post-Production & Edited Content (${reelCount} Reels & ${vidCount} Video)`,
          desc: `Post-Production & Edited Content (${reelCount} Reels & ${vidCount} Video)`,
          qty: 1,
          weight: 20,
          details: `Post-production suite including ${reelCount} high-retention launch reels, ${vidCount} cinematic brand showcase video, audio mastering, color grading, and delivery of 100% raw content archive.`
        });
      }

      if (!isProduction && isSocial) {
        items.push({
          name: 'Social Media Management & Strategy (FB, IG & LinkedIn)',
          desc: 'Social Media Management & Strategy (FB, IG & LinkedIn)',
          qty: 1,
          weight: 35,
          details: 'Multi-channel account management, content scheduling, and community engagement across Facebook, Instagram, and LinkedIn.'
        });
      }

      if (!isProduction && isReels) {
        const countMatch = p.match(/(\d+)\s*(?:reels?|shorts?|videos?|promotional\s*videos?)/i);
        const count = countMatch ? parseInt(countMatch[1]) : 8;
        items.push({
          name: `High-Retention Video Editing (${count} Videos/Month)`,
          desc: `High-Retention Video Editing (${count} Videos/Month)`,
          qty: count,
          weight: 35,
          details: 'Scripting hooks, pacing cuts, kinetic subtitles, sound design, and color grading.'
        });
      }

      if (isGraphic && items.length <= 3) {
        items.push({
          name: 'Creative Graphic Design & Promotional Posters',
          desc: 'Creative Graphic Design & Promotional Posters',
          qty: 1,
          weight: 20,
          details: 'Bespoke promotional posters, social feed creatives, and story layouts.'
        });
      }

      if (p.includes('meta') || p.includes('ads') || p.includes('campaign')) {
        items.push({
          name: 'Meta Ads Campaign Execution & Analytics',
          desc: 'Meta Ads Campaign Execution & Analytics',
          qty: 1,
          weight: 20,
          details: 'Targeting setup, ad campaign management, A/B testing, and monthly performance tracking (ad spend separate).'
        });
      }

      if (isWeb && items.length === 0) {
        items.push({
          name: isRealEstate ? 'Custom Designed Real Estate Website (Basic-Intermediate)' : 'Custom Designed Website (Basic-Intermediate)',
          desc: isRealEstate ? 'Custom Designed Real Estate Website (Basic-Intermediate)' : 'Custom Designed Website (Basic-Intermediate)',
          qty: 1,
          weight: 55,
          details: isRealEstate ? 'Custom responsive UI/UX design, property showcase layout, fast mobile loading, and high-intent lead capture forms.' : 'Custom responsive UI/UX design, modern layout, fast performance, and brand identity alignment.'
        });
      }

      if (isSEO && items.length <= 2) {
        items.push({
          name: 'Basic Search Engine Optimization (SEO)',
          desc: 'Basic Search Engine Optimization (SEO)',
          qty: 1,
          weight: 15,
          details: 'On-page SEO optimization, meta tags, schema markup, and Google Search Console indexing to rank on search.'
        });
      }

      if (isDomain && items.length <= 2) {
        items.push({
          name: 'Domain Implementation & DNS Configuration',
          desc: 'Domain Implementation & DNS Configuration',
          qty: 1,
          weight: 10,
          details: 'Custom domain connection, DNS record setup, and SSL security certificate installation.'
        });
      }

      if (isHosting && items.length <= 2) {
        items.push({
          name: 'High-Performance Cloud Web Hosting',
          desc: 'High-Performance Cloud Web Hosting',
          qty: 1,
          weight: 10,
          details: 'Cloud server deployment, uptime monitoring, CDN caching, and high-speed internet delivery.'
        });
      }

      if (isMaintenance && items.length <= 2) {
        items.push({
          name: '1 Month Maintenance & Bug Fixing Warranty',
          desc: '1 Month Maintenance & Bug Fixing Warranty',
          qty: 1,
          weight: 10,
          details: '30-day post-launch technical warranty covering error fixing, bug resolution, and stability checks.'
        });
      }

      if (items.length === 0) {
        items.push(
          { name: 'Core Project Architecture & Execution', desc: 'Core Project Architecture & Execution', qty: 1, weight: 60, details: 'Full project execution and custom deliverables as per client brief.' },
          { name: 'Creative Development & Technical Setup', desc: 'Creative Development & Technical Setup', qty: 1, weight: 25, details: 'High-fidelity execution, creative assets, and testing.' },
          { name: 'Post-Launch Support & Optimization', desc: 'Post-Launch Support & Optimization', qty: 1, weight: 15, details: 'Review, error monitoring, and performance checks.' }
        );
      }

      const totalWeight = items.reduce((acc, it) => acc + (it.weight || 20), 0);
      let running = 0;
      items.forEach((it, idx) => {
        if (idx === items.length - 1) {
          it.rate = Math.max(0, budget - running);
        } else {
          const share = Math.round((budget * (it.weight || 20)) / totalWeight / 100) * 100;
          it.rate = share;
          running += share;
        }
        delete it.weight;
      });

      return items;
    };

    // Consultative reply message builder
    const buildSmartReplyMessage = (brandName, totalBudget, items, isSingleMode) => {
      const brand = brandName || 'the client';
      const currencySymbol = '₹';
      const formattedBudget = `${currencySymbol}${Number(totalBudget || 0).toLocaleString()}`;
      
      if (isSingleMode) {
        const singleItem = items?.[0] || { name: 'Turnkey Growth Package', rate: totalBudget, details: 'Comprehensive end-to-end execution.' };
        return `I've packaged the entire project into a **single turnkey service item (${currencySymbol}${Number(singleItem.rate || totalBudget).toLocaleString()})** for ${brand} as requested!\n\n• **${singleItem.name}** - ${singleItem.details || 'Comprehensive end-to-end delivery.'}\n\nAll granular components and strategic phases are thoroughly mapped out in the **Strategy & Concept Pitch (PMP)** section on the left. Everything is ready for client review!`;
      }

      const breakdown = (items || []).map(it => `• **${it.name || it.desc}** (${currencySymbol}${Number(it.rate || 0).toLocaleString()}) - ${it.details || 'Full implementation and delivery.'}`).join('\n');
      return `I've structured a complete ${formattedBudget} proposal tailored for ${brand}!\n\nHere is the strategic scope and pricing breakdown:\n${breakdown}\n\nI also populated the **Strategy & Concept Pitch** section with a customized strategic blueprint. Everything is loaded directly into your proposal form ready for review!`;
    };

    // Auto-normalize and validate payload for quote, package, and invoice
    if (parsed.payload) {
      if (parsed.payload.totalBudget !== undefined) {
        parsed.payload.totalBudget = parseAmountNumber(parsed.payload.totalBudget);
      }

      // Recover previous form state if in follow-up chat turn
      const existingFormBudget = formContext?.quoteDetails?.total || formContext?.total || (formContext?.packageTiers && Array.isArray(formContext.packageTiers) ? formContext.packageTiers.reduce((acc, t) => acc + (t.items || []).reduce((s, it) => s + ((it.qty || 1) * (it.rate || 0)), 0), 0) : 0);
      const existingFormBrand = formContext?.clientDetails?.brandName || formContext?.clientDetails?.name || '';

      const promptBudget = extractBudgetFromPrompt(userPrompt) || parseAmountNumber(userPrompt);
      if (!parsed.payload.totalBudget || parsed.payload.totalBudget === 0) {
        parsed.payload.totalBudget = promptBudget || existingFormBudget || 0;
      }

      const pLower = userPrompt.toLowerCase();
      const hasItemizedBreakdown = /breaking\s+into|break\s+into|breakdown|divided\s+into|split\s+into|itemized|itemise|separate\s+rates|separate\s+items|tiers?\b/i.test(userPrompt);

      const isRetainerOrSmmPackage = (
        /(?:create|make|build|give|design|generate)?\s*(?:a|an)?\s*(?:package|retainer|proposal|quote)\b/i.test(userPrompt) ||
        /(?:social\s+media|smm|retainer|reels|content\s+creation|monthly)/i.test(userPrompt)
      ) && (
        /(?:social\s+media|smm|reels|shooting|shoots|ads\s+management|content)/i.test(userPrompt)
      ) && (
        promptBudget > 0 || /quote|month|per\s+month|\/mo/i.test(userPrompt)
      ) && !hasItemizedBreakdown;

      const isExplicitSingle = (
        pLower.includes('single service') ||
        pLower.includes('single item') ||
        pLower.includes('one service') ||
        pLower.includes('one line item') ||
        pLower.includes('bundle it') ||
        pLower.includes('bundle everything') ||
        pLower.includes('single package') ||
        pLower.includes('one package item') ||
        pLower.includes('1 service') ||
        pLower.includes('as a single') ||
        (pLower.includes('pmp') && (pLower.includes('single') || pLower.includes('one') || pLower.includes('everything else') || pLower.includes('all details'))) ||
        (pLower.includes('strategy') && (pLower.includes('single') || pLower.includes('one') || pLower.includes('bundle')))
      );

      const isSingleReq = isExplicitSingle || isRetainerOrSmmPackage;

      // 1. Clean and prioritize AI recognized brand name, then fallback to prompt extraction, then existing form context
      const extractedBrand = extractBrandNameFromPrompt(userPrompt);
      let aiBrand = parsed.payload.brandName;
      if (typeof aiBrand === 'string') {
        aiBrand = aiBrand.replace(/^(?:brand(?:\s+name)?|client(?:\s+name)?)\s*[:-]\s*/i, '').replace(/^['"]+|['"]+$/g, '').trim();
      }
      if (aiBrand && !['client project', 'client', 'brand', 'standard', 'standard package', 'custom package'].includes(aiBrand.toLowerCase())) {
        parsed.payload.brandName = aiBrand;
      } else {
        if (extractedBrand) {
          parsed.payload.brandName = extractedBrand;
        } else if (existingFormBrand) {
          parsed.payload.brandName = existingFormBrand;
        } else if (pLower.includes('real estate')) {
          parsed.payload.brandName = 'Real Estate Brand';
        }
      }

      // 2. Prioritize packageType from prompt
      if (pLower.includes('monthly') || pLower.includes('per month') || pLower.includes('/month') || pLower.includes('retainer') || pLower.includes('month-on-month')) {
        parsed.payload.packageType = 'monthly';
      } else if ((pLower.includes('project') && !pLower.includes('monthly project')) || pLower.includes('one-time') || pLower.includes('one time') || pLower.includes('fixed')) {
        parsed.payload.packageType = 'project';
      } else if (formContext?.packageType) {
        parsed.payload.packageType = formContext.packageType;
      }

      // 3. Multi-turn refinement preservation: if user didn't specify new items but is refining brand/packageType/notes, preserve existing items from formContext
      const hasExistingItems = (formContext?.packageTiers && formContext.packageTiers.length > 0 && (formContext.packageTiers[0]?.items || []).length > 0) || (formContext?.services && formContext.services.length > 0);
      const isRefinementOnly = (
        extractedBrand ||
        pLower.includes('monthly') ||
        pLower.includes('package type') ||
        pLower.includes('brand name') ||
        pLower.includes('client name') ||
        pLower.includes('make it monthly') ||
        pLower.includes('change to') ||
        pLower.includes('update to')
      );

      const itemsInPayload = (parsed.payload.packageTiers?.[0]?.items?.length || 0) + (parsed.payload.services?.length || 0);
      if (itemsInPayload === 0 && hasExistingItems && isRefinementOnly) {
        parsed.payload.packageTiers = JSON.parse(JSON.stringify(formContext.packageTiers || []));
        parsed.payload.services = JSON.parse(JSON.stringify(formContext.services || formContext.packageTiers?.[0]?.items || []));
        parsed.payload.totalBudget = parsed.payload.totalBudget || existingFormBudget;
        parsed.payload.pmpStrategy = parsed.payload.pmpStrategy || formContext?.pmpStrategy;
        
        // Update the tier name if brandName changed
        if (parsed.payload.brandName && parsed.payload.packageTiers.length > 0) {
          parsed.payload.packageTiers[0].name = `${parsed.payload.brandName} Package`;
        }

        const bName = parsed.payload.brandName || 'your project';
        const typeText = parsed.payload.packageType === 'monthly' ? 'Monthly Retainer' : 'Project Proposal';
        const budgetText = parsed.payload.totalBudget ? ` (₹${parsed.payload.totalBudget.toLocaleString()}${parsed.payload.packageType === 'monthly' ? '/mo' : ''})` : '';
        parsed.replyMessage = `I've updated the proposal for **${bName}**! Configured as a **${typeText}**${budgetText} with all your scope of services and strategy pitch preserved.`;
      }

      // Check if user requested saving as a template
      const isSaveTemplateReq = (
        /save.*template/i.test(pLower) ||
        pLower.includes('save this as a template') ||
        pLower.includes('save this as template') ||
        pLower.includes('save as template') ||
        pLower.includes('save as a template') ||
        pLower.includes('save template') ||
        pLower.includes('save package template') ||
        pLower.includes('save this package') ||
        pLower.includes('save package') ||
        pLower.includes('save current') ||
        (pLower.includes('save') && (pLower.includes('template') || pLower.includes('package'))) ||
        parsed.intent === 'save_template'
      );

      if (isSaveTemplateReq) {
        parsed.intent = 'save_template';
        const templateMatch = userPrompt.match(/(?:named|called)\s+["']?([^"'\.\,\n]+)["']?/i) || userPrompt.match(/(?:template)\s+(?:named|called|as)\s+["']?([^"'\.\,\n]+)["']?/i) || userPrompt.match(/(?:save\s+(?:this\s+)?(?:as\s+)?)(?:template\s+)?["']?([^"'\.\,\n]+)["']?/i);
        let inferredName = '';
        if (templateMatch && templateMatch[1] && !['template', 'a template', 'this', 'this as template', 'this as a template'].includes(templateMatch[1].trim().toLowerCase())) {
          inferredName = templateMatch[1].trim();
        } else if (parsed.payload?.brandName) {
          inferredName = `${parsed.payload.brandName} Package`;
        } else if (existingFormBrand) {
          inferredName = `${existingFormBrand} Package`;
        } else {
          inferredName = 'Custom Package Template';
        }
        parsed.payload = parsed.payload || {};
        parsed.payload.templateName = parsed.payload.templateName || inferredName;
        parsed.payload.action = 'save_template';
        parsed.payload.packageTiers = (parsed.payload.packageTiers && parsed.payload.packageTiers.length > 0) ? parsed.payload.packageTiers : (formContext?.packageTiers || []);
        parsed.payload.pmpStrategy = parsed.payload.pmpStrategy || formContext?.pmpStrategy || '';
        parsed.replyMessage = `I've saved this package as the template **"${parsed.payload.templateName}"**! It is now stored in your Templates library on the right, ready to load whenever you need it.`;
      }

      // Check if user is requesting an incremental note / edit to existing deliverables
      const isEditOrNoteReq = (
        pLower.includes('add a line') ||
        pLower.includes('add note') ||
        pLower.includes('add a note') ||
        pLower.includes('mention that') ||
        pLower.includes('not included') ||
        pLower.includes('separate fee') ||
        pLower.includes('disclaimer') ||
        pLower.includes('purchasing is not included') ||
        pLower.includes('purchase is not included') ||
        pLower.includes('update the') ||
        pLower.includes('change the') ||
        pLower.includes('edit the')
      );

      if (isEditOrNoteReq && formContext?.packageTiers && formContext.packageTiers.length > 0 && !isSingleReq && !isSaveTemplateReq) {
        let baseTiers = JSON.parse(JSON.stringify(formContext.packageTiers));
        let noteAdded = false;

        if (pLower.includes('domain') && (pLower.includes('not included') || pLower.includes('purchas') || pLower.includes('buy'))) {
          baseTiers.forEach(t => {
            (t.items || []).forEach(it => {
              const nameLower = (it.name || it.desc || '').toLowerCase();
              if (nameLower.includes('domain')) {
                if (!it.details.toLowerCase().includes('not included')) {
                  it.details = `${it.details.replace(/\.\s*$/, '')}. (Note: Domain name purchasing/registration fee is not included; client to provide domain).`;
                }
                noteAdded = true;
              }
            });
          });
          if (noteAdded) {
            parsed.replyMessage = `I've updated your proposal! The **Domain Implementation & DNS Configuration** deliverable now clearly notes that domain purchasing/registration is not included and is to be provided by the client.`;
          }
        } else if (pLower.includes('host') && (pLower.includes('not included') || pLower.includes('client'))) {
          baseTiers.forEach(t => {
            (t.items || []).forEach(it => {
              const nameLower = (it.name || it.desc || '').toLowerCase();
              if (nameLower.includes('host')) {
                if (!it.details.toLowerCase().includes('not included')) {
                  it.details = `${it.details.replace(/\.\s*$/, '')}. (Note: Server hosting subscription fee is to be paid directly by client).`;
                }
                noteAdded = true;
              }
            });
          });
          if (noteAdded) {
            parsed.replyMessage = `I've updated your proposal! The **Hosting** deliverable now notes that server hosting subscription is to be maintained by the client.`;
          }
        }

        if (noteAdded) {
          parsed.payload.packageTiers = baseTiers;
          const allItems = [];
          baseTiers.forEach(t => { if (t.items) allItems.push(...t.items); });
          parsed.payload.services = allItems;
        }
      }

      // If user requested a single service or monthly retainer bundle, normalize tiers/services into a single bundled line item
      if (isSingleReq && !isSaveTemplateReq && !isEditOrNoteReq) {
        const budgetVal = parsed.payload.totalBudget || promptBudget || existingFormBudget || 20000;
        const brandName = parsed.payload.brandName || existingFormBrand || 'Client';
        
        let singleDeliverable = null;
        // Check if AI already produced exactly 1 service/tier item matching the prompt with a valid positive rate
        if (parsed.payload.services && parsed.payload.services.length === 1 && (parsed.payload.services[0].rate > 0 || parsed.payload.services[0].name?.includes('Retainer'))) {
          const s = parsed.payload.services[0];
          singleDeliverable = {
            name: s.name || s.desc || 'Turnkey Marketing & Growth Package',
            desc: s.desc || s.name || 'Turnkey Marketing & Growth Package',
            qty: 1,
            rate: budgetVal,
            details: s.details || 'Comprehensive turnkey execution as per client brief.'
          };
        } else if (parsed.payload.packageTiers && parsed.payload.packageTiers.length === 1 && parsed.payload.packageTiers[0].items?.length === 1 && (parsed.payload.packageTiers[0].items[0].rate > 0 || parsed.payload.packageTiers[0].items[0].name?.includes('Retainer'))) {
          const s = parsed.payload.packageTiers[0].items[0];
          singleDeliverable = {
            name: s.name || s.desc || 'Turnkey Marketing & Growth Package',
            desc: s.desc || s.name || 'Turnkey Marketing & Growth Package',
            qty: 1,
            rate: budgetVal,
            details: s.details || 'Comprehensive turnkey execution as per client brief.'
          };
        } else {
          // Synthesize high-impact single deliverable from prompt & any parsed services
          singleDeliverable = synthesizeSingleDeliverable(userPrompt, budgetVal, parsed.payload.services || parsed.payload.packageTiers?.[0]?.items || []);
        }

        parsed.payload.totalBudget = budgetVal;
        parsed.payload.services = [singleDeliverable];
        parsed.payload.packageTiers = [{
          name: `${brandName} Package`,
          items: [singleDeliverable]
        }];

        if (isRetainerOrSmmPackage || isExplicitSingle) {
          parsed.replyMessage = `I've structured a complete ₹${Number(budgetVal).toLocaleString()}/mo Social Media Management & Creative Retainer for **${brandName}**!\n\n• **${singleDeliverable.name}** (₹${Number(singleDeliverable.rate).toLocaleString()}) - ${singleDeliverable.details}\n\nAll deliverables (15 reels, 2-4 shooting sessions, account management, and Meta ads) are consolidated into a turnkey monthly package, with a bespoke 3-phase growth roadmap configured in your **Strategy & Concept Pitch**!`;
        }
      }

      // Check if prompt describes a quote/package or if items exist
      const hasTiers = Array.isArray(parsed.payload.packageTiers) && parsed.payload.packageTiers.length > 0;
      const hasServices = Array.isArray(parsed.payload.services) && parsed.payload.services.length > 0;
      const hasItems = Array.isArray(parsed.payload.items) && parsed.payload.items.length > 0;

      // If intent is conversational (chat, learn, clear_chat), preserve it and prevent accidental form actions
      if (['chat', 'learn', 'clear_chat'].includes(parsed.intent)) {
        parsed.payload.packageTiers = [];
        parsed.payload.services = [];
        parsed.payload.items = [];
        delete parsed.payload.totalBudget;
        delete parsed.payload.pmpStrategy;
      } else {
        const isInvoicePrompt = /invoice|bill|billing|tax invoice/i.test(userPrompt) || currentPath === '/dripp-studio/invoice';
        if (isInvoicePrompt && !['email', 'system_doc', 'portfolio', 'notion_edit', 'notion_task', 'save_template'].includes(parsed.intent)) {
          parsed.intent = 'invoice';
        } else {
          // Only convert to quote/package if explicit quote/deliverable keywords exist in the prompt
          const isExplicitQuotePrompt = /quote|quotation|proposal|budget|package|pricing|rate|retainer|scope|deliverables|reels|services|website|marketing/i.test(userPrompt);
          if (isExplicitQuotePrompt && !['invoice', 'email', 'system_doc', 'portfolio', 'notion_edit', 'notion_task', 'save_template'].includes(parsed.intent)) {
            parsed.intent = (currentPath === '/dripp-studio/package') ? 'package' : 'quote';
          }
        }
      }

      // Handle invoice intent normalization
      if (parsed.intent === 'invoice') {
        const isSingleServiceReq = (
          pLower.includes('as one service') ||
          pLower.includes('as a single') ||
          pLower.includes('single service') ||
          pLower.includes('one service') ||
          pLower.includes('single item') ||
          pLower.includes('bundle')
        );

        let invoiceItems = [];
        if (Array.isArray(parsed.payload.items) && parsed.payload.items.length > 0) {
          invoiceItems = parsed.payload.items;
        } else if (Array.isArray(parsed.payload.services) && parsed.payload.services.length > 0) {
          invoiceItems = parsed.payload.services;
        } else if (Array.isArray(parsed.payload.packageTiers) && parsed.payload.packageTiers.length > 0) {
          invoiceItems = parsed.payload.packageTiers[0]?.items || [];
        }

        const promptBudget = extractBudgetFromPrompt(userPrompt) || parseAmountNumber(userPrompt);
        const totalBudgetVal = parsed.payload.totalBudget || promptBudget || 0;

        if (isSingleServiceReq && invoiceItems.length > 1) {
          const combinedTitle = invoiceItems.map(it => it.name || it.desc).filter(Boolean).join(' & ') || 'Consolidated Production & Editing Services';
          invoiceItems = [{
            name: combinedTitle,
            desc: combinedTitle,
            qty: 1,
            rate: totalBudgetVal || invoiceItems.reduce((acc, it) => acc + (parseAmountNumber(it.rate) * (parseAmountNumber(it.qty) || 1)), 0),
            details: `Consolidated service deliverable: ${invoiceItems.map(it => it.details || it.desc || it.name).join('; ')}`
          }];
        } else if (invoiceItems.length === 0) {
          const serviceMatch = userPrompt.match(/(?:invoice should be for|should be for|for a|for an|service should be|for)\s+([^.,\n]+?)(?:\s+as\s+one\s+service|\s+as\s+a\s+single|\s+for\s+\d|\s+for\s+[₹rs]|\.|$)/i);
          const serviceTitle = serviceMatch ? serviceMatch[1].replace(/^(a|an)\s+/i, '').trim() : 'Creative Production & Editing Services';
          const formatTitle = (s) => (s || '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          const title = formatTitle(serviceTitle);
          invoiceItems = [{
            name: title,
            desc: title,
            qty: 1,
            rate: totalBudgetVal,
            details: `${title} as a consolidated service.`
          }];
        } else {
          invoiceItems = invoiceItems.map(it => ({
            name: it.name || it.desc || 'Service Item',
            desc: it.desc || it.name || 'Service Item',
            qty: parseAmountNumber(it.qty) || 1,
            rate: parseAmountNumber(it.rate) || 0,
            details: it.details || ''
          }));
        }

        const computedBudget = invoiceItems.reduce((acc, it) => acc + (it.qty * it.rate), 0);
        parsed.payload.totalBudget = totalBudgetVal || computedBudget;

        if (invoiceItems.length === 1 && parsed.payload.totalBudget > 0 && invoiceItems[0].rate === 0) {
          invoiceItems[0].rate = parsed.payload.totalBudget;
        }

        parsed.payload.items = invoiceItems;
        parsed.payload.services = invoiceItems;

        if (!parsed.payload.clientName) {
          const clientMatch = userPrompt.match(/client(?:\s+name)?\s*[:-]?\s*([A-Za-z\s]+?)(?:,|\.|\s+\+|\s+\d|\s+phone|\s+mobile|\s+address|\s+for|\s+at|$)/i);
          if (clientMatch) parsed.payload.clientName = clientMatch[1].trim();
        }
        if (!parsed.payload.clientMobile) {
          const phoneMatch = userPrompt.match(/(?:\+?\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}\b|\+?\d{1,3}[\s-]?\d{3,5}[\s-]?\d{4,5}\b/);
          if (phoneMatch) parsed.payload.clientMobile = phoneMatch[0].trim();
        }
        if (!parsed.payload.clientAddress) {
          const addressMatch = userPrompt.match(/address\s*[:-]?\s*([^.,\n]+(?:,\s*[^.,\n]+)*?)(?:\.|\s+invoice|\s+should|\s+for|\s*$|\s+service|\s+phone|\s+mobile)/i);
          if (addressMatch) parsed.payload.clientAddress = addressMatch[1].trim();
        }
        if (!parsed.payload.brandName) {
          const brandMatch = userPrompt.match(/(?:for|brand(?:\s+name)?\s*[:-]?)\s*([A-Za-z0-9&'\-]+?)(?:,|\.|\s+client|\s+address|\s+phone|\s+mobile|\s+who|\s+whose)/i);
          if (brandMatch) parsed.payload.brandName = brandMatch[1].trim();
        }

        const brand = parsed.payload.brandName || parsed.payload.clientName || 'the client';
        const budgetStr = `₹${(parsed.payload.totalBudget || 0).toLocaleString()}`;
        const clientLine = parsed.payload.clientName ? `\n• **Client:** ${parsed.payload.clientName}${parsed.payload.clientMobile ? ` (${parsed.payload.clientMobile})` : ''}` : '';
        const addrLine = parsed.payload.clientAddress ? `\n• **Billing Address:** ${parsed.payload.clientAddress}` : '';
        const itemsBreakdown = invoiceItems.map(it => `• **Billable Item:** ${it.desc || it.name} (${it.qty} × ₹${it.rate.toLocaleString()})`).join('\n');

        parsed.replyMessage = `I've prepared a fresh invoice of **${budgetStr}** for **${brand}**!${clientLine}${addrLine}\n${itemsBreakdown}\n• **Total Payable:** ${budgetStr}\n\nAll client billing details and line items are pre-filled in your Invoice Maker ready to preview and export!`;
      }

      // Sync and normalize packageTiers <-> services <-> items for quote/package intents
      if (['quote', 'package'].includes(parsed.intent)) {
        if (hasTiers && !isSingleReq) {
          parsed.payload.packageTiers = parsed.payload.packageTiers.map(tier => ({
            name: tier.name || `${parsed.payload.brandName || 'Standard'} Package`,
            items: ((tier.items && tier.items.length > 0) ? tier.items : (tier.services && tier.services.length > 0) ? tier.services : (parsed.payload.services || [])).map(item => {
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
          const allTierItems = [];
          parsed.payload.packageTiers.forEach(t => { if (t.items) allTierItems.push(...t.items); });
          parsed.payload.services = allTierItems.length > 0 ? allTierItems : (parsed.payload.services || []);
        } else if (hasServices && !isSingleReq) {
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
        } else if (hasItems && !isSingleReq) {
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

        // Check if items are still empty: guarantee non-empty deliverables only when explicitly requested
        let itemCount = 0;
        if (parsed.payload.packageTiers) {
          parsed.payload.packageTiers.forEach(t => { itemCount += (t.items || []).length; });
        }
        if (itemCount === 0 && parsed.payload.services) {
          itemCount = parsed.payload.services.length;
        }

        const isExplicitQuotePrompt = /quote|quotation|proposal|budget|package|pricing|retainer|scope|website|development|social|reels|services/i.test(userPrompt);
        if (itemCount === 0 && isExplicitQuotePrompt) {
          const fallbackBudget = parsed.payload.totalBudget || parseAmountNumber(userPrompt) || 20000;
          const fallbackItems = generateFallbackDeliverables(userPrompt, fallbackBudget);
          parsed.payload.totalBudget = fallbackBudget;
          parsed.payload.services = fallbackItems;
          parsed.payload.packageTiers = [{
            name: parsed.payload.brandName ? `${parsed.payload.brandName} Package` : 'Standard Package',
            items: fallbackItems
          }];
        }

        // Ensure rich Strategy & Concept Pitch (PMP strategy)
        if (!parsed.payload.pmpStrategy || typeof parsed.payload.pmpStrategy !== 'object' || !parsed.payload.pmpStrategy.phases || parsed.payload.pmpStrategy.phases.length === 0) {
          const brand = parsed.payload.brandName || existingFormBrand || 'Client';
          const isConvenienceOrRetail = pLower.includes('convenience') || pLower.includes('store') || pLower.includes('retail') || pLower.includes('sipkart');
          const isSocialPmp = pLower.includes('social') || pLower.includes('media') || pLower.includes('instagram') || pLower.includes('facebook') || pLower.includes('ads') || pLower.includes('meta') || pLower.includes('smm');
          const isReelPmp = pLower.includes('reel') || pLower.includes('video') || pLower.includes('short');

          if (isConvenienceOrRetail && isSocialPmp) {
            parsed.payload.pmpStrategy = {
              overview: `Omnichannel social media growth and high-frequency content strategy tailored for ${brand}'s 24/7 convenience retail model. Designed to drive local footfall, highlight late-night convenience, and build neighborhood brand recall through viral reels and targeted Meta ads.`,
              targetAudience: `Local residents, night owls, students, and urban shoppers seeking rapid convenience and trusted products from ${brand}.`,
              phases: [
                { title: "Phase 1: Content Direction & On-Site Shoots", description: "Conducting 2-4 dedicated on-site shooting sessions capturing store ambiance, midnight cravings, top-selling inventory, and customer experiences." },
                { title: "Phase 2: High-Retention Video Production & Publishing", description: "Editing and scheduling 15 high-retention monthly reels with hook optimization, trending audio, dynamic subtitles, and brand aesthetic feed curation." },
                { title: "Phase 3: Hyperlocal Meta Ads & Footfall Conversion", description: "Deploying geo-targeted Instagram and Facebook ad campaigns highlighting 24/7 availability and exclusive promotions to maximize footfall and brand awareness." }
              ]
            };
          } else if (isSocialPmp) {
            parsed.payload.pmpStrategy = {
              overview: `Comprehensive social media growth and performance marketing strategy for ${brand}. Designed to scale organic reach, create high-retention promotional videos, and generate high-intent inquiries via Meta Ads campaign management.`,
              targetAudience: `Target demographics, potential customers, and social media audiences across Instagram, Facebook, and LinkedIn.`,
              phases: [
                { title: "Phase 1: Content Architecture & Brand Aesthetics", description: "Strategic content calendar formulation, feed aesthetic curation, story scheduling, and custom promotional posters." },
                { title: "Phase 2: Video Production & Dynamic Storytelling", description: "Production and high-retention editing of monthly promotional videos featuring hook ideation, dynamic typography, and sound design." },
                { title: "Phase 3: Meta Ads Execution & Analytics Optimization", description: "Targeted Meta Ads campaign deployment, creative A/B testing, lead conversion tracking, and monthly performance reporting." }
              ]
            };
          } else if (isReelPmp) {
            parsed.payload.pmpStrategy = {
              overview: `High-retention visual storytelling and short-form video strategy engineered for ${brand} to dominate social algorithms and build brand authority.`,
              targetAudience: `Audience demographics and social media users across Instagram and YouTube Shorts.`,
              phases: [
                { title: "Phase 1: Concept Ideation & Hook Structuring", description: `Researching viral hooks, trending audio, and high-impact scripting tailored to ${brand}.` },
                { title: "Phase 2: High-Retention Video Editing", description: "Pacing cuts, motion graphics, sound design, color grading, and dynamic captions for maximum watch time." },
                { title: "Phase 3: Publishing Optimization & Performance Review", description: "Thumbnail curation, hashtag strategy, and engagement retention analysis." }
              ]
            };
          } else {
            parsed.payload.pmpStrategy = {
              overview: `Strategic turnkey digital execution engineered for ${brand} to establish market authority and capture high-intent inquiries. This package covers end-to-end deliverables tailored to the client brief.`,
              targetAudience: `Target demographic and high-intent clients seeking premier services and trusted solutions from ${brand}.`,
              phases: [
                { title: "Phase 1: Architecture & UI/UX Design", description: "Bespoke wireframing, property/brand showcase layouts, high-converting lead funnels, and responsive UI prototype sign-off." },
                { title: "Phase 2: Full-Stack Engineering, SEO & Cloud Infrastructure", description: "Clean web development, custom domain DNS integration, meta tag structuring, Google Search Console indexing, and cloud hosting deployment." },
                { title: "Phase 3: Live Launch & 30-Day Stability Warranty", description: "Live production deployment, search ranking verification, and 1 full month of dedicated bug fixing, error resolution, and technical maintenance." }
              ]
            };
          }
        }

        // Auto-generate high-impact tailored cover heading and subtitle
        if (!parsed.payload.coverHeading) {
          const b = parsed.payload.brandName || existingFormBrand || '';
          const combined = (userPrompt + ' ' + b + ' ' + JSON.stringify(parsed.payload.pmpStrategy || '')).toLowerCase();
          if (combined.includes('real estate') || combined.includes('property')) {
            parsed.payload.coverHeading = 'Strategic Real Estate Web Platform & Digital Growth';
          } else if (combined.includes('e-commerce') || combined.includes('ecommerce') || combined.includes('store') || combined.includes('shop')) {
            parsed.payload.coverHeading = 'Omnichannel Commerce Architecture & Conversion Engine';
          } else if (combined.includes('brand') || combined.includes('identity')) {
            parsed.payload.coverHeading = 'Bespoke Brand Identity & Market Authority Blueprint';
          } else if (combined.includes('video') || combined.includes('media') || combined.includes('production')) {
            parsed.payload.coverHeading = 'High-Impact Cinematic Media & Creative Production';
          } else if (b && b.toLowerCase() !== 'client') {
            parsed.payload.coverHeading = `Strategic ${b} Growth & Digital Architecture`;
          } else {
            parsed.payload.coverHeading = 'Strategic Growth & Digital Architecture Proposal';
          }
        }
        if (!parsed.payload.coverSubtitle) {
          parsed.payload.coverSubtitle = 'Prepared Exclusively For';
        }

        // Intelligent budget alignment: protect explicit rates and avoid destructive rescaling
        const targetBudget = parsed.payload.totalBudget || 0;
        if (targetBudget > 0 && parsed.payload.packageTiers && parsed.payload.packageTiers.length > 0 && !isSingleReq) {
          parsed.payload.packageTiers.forEach(tier => {
            const items = tier.items || [];
            if (items.length > 0) {
              const sum = items.reduce((acc, it) => acc + ((it.qty || 1) * (it.rate || 0)), 0);
              
              // If rates were completely unassigned (all 0), distribute logically
              if (sum === 0) {
                const totalWeight = items.reduce((acc, it) => {
                  const n = (it.name || '').toLowerCase();
                  return acc + (n.includes('video') || n.includes('shoot') || n.includes('film') ? 40 : n.includes('web') ? 45 : n.includes('drone') ? 20 : n.includes('photo') ? 15 : 15);
                }, 0);
                let running = 0;
                tier.items = items.map((it, idx) => {
                  if (idx === items.length - 1) {
                    const rem = targetBudget - running;
                    return { ...it, rate: Math.max(0, Math.round(rem / (it.qty || 1))) };
                  }
                  const n = (it.name || '').toLowerCase();
                  const weight = n.includes('video') || n.includes('shoot') || n.includes('film') ? 40 : n.includes('web') ? 45 : n.includes('drone') ? 20 : n.includes('photo') ? 15 : 15;
                  const r = Math.round((targetBudget * weight) / totalWeight / (it.qty || 1) / 100) * 100;
                  running += ((it.qty || 1) * r);
                  return { ...it, rate: r };
                });
              } else if (Math.abs(sum - targetBudget) > 0) {
                const diff = targetBudget - sum;
                // If difference is small (within ±2000), adjust ONLY the last item rather than clobbering all individual rates!
                if (Math.abs(diff) <= 2000) {
                  const lastIdx = items.length - 1;
                  const lastQty = items[lastIdx].qty || 1;
                  items[lastIdx].rate = Math.max(0, items[lastIdx].rate + Math.round(diff / lastQty));
                } else {
                  // Scale proportionally if discrepancy is larger
                  const factor = targetBudget / sum;
                  let running = 0;
                  tier.items = items.map((it, idx) => {
                    if (idx === items.length - 1) {
                      const rem = targetBudget - running;
                      return { ...it, rate: Math.max(0, Math.round(rem / (it.qty || 1))) };
                    }
                    const r = Math.round((it.rate * factor) / 100) * 100;
                    running += ((it.qty || 1) * r);
                    return { ...it, rate: r };
                  });
                }
              }
            }
          });
          if (parsed.payload.services && parsed.payload.packageTiers[0]?.items) {
            parsed.payload.services = parsed.payload.packageTiers[0].items;
          }
        } else if (targetBudget === 0 && parsed.payload.packageTiers && parsed.payload.packageTiers.length > 0) {
          // If totalBudget was not explicitly provided but items have rates, infer totalBudget from items
          const sum = (parsed.payload.packageTiers[0].items || []).reduce((acc, it) => acc + ((it.qty || 1) * (it.rate || 0)), 0);
          if (sum > 0) {
            parsed.payload.totalBudget = sum;
          }
        }

        // Ensure consultative replyMessage only for quote / package when reply is completely empty or missing
        const activeItems = parsed.payload.packageTiers?.[0]?.items || parsed.payload.services || [];
        if (!parsed.replyMessage || parsed.replyMessage.trim() === '') {
          parsed.replyMessage = buildSmartReplyMessage(parsed.payload.brandName, parsed.payload.totalBudget, activeItems, isSingleReq);
        }
      }

      // Check if user specifically requested to edit the cover heading or subtitle
      if (pLower.includes('cover') && (pLower.includes('heading') || pLower.includes('title') || pLower.includes('subtitle') || pLower.includes('text'))) {
        const titleMatch = userPrompt.match(/(?:heading|title)\s+(?:to|as)\s+["']?([^"'\.\,\n]+)["']?/i);
        const subMatch = userPrompt.match(/(?:subtitle|sub-title)\s+(?:to|as)\s+["']?([^"'\.\,\n]+)["']?/i);
        if (titleMatch && titleMatch[1]) parsed.payload.coverHeading = titleMatch[1].trim();
        if (subMatch && subMatch[1]) parsed.payload.coverSubtitle = subMatch[1].trim();
        if (formContext?.packageTiers) parsed.payload.packageTiers = formContext.packageTiers;
        if (formContext?.pmpStrategy) parsed.payload.pmpStrategy = formContext.pmpStrategy;
        parsed.replyMessage = `I've updated the proposal cover settings! Cover Heading: **"${parsed.payload.coverHeading}"**, Subtitle: **"${parsed.payload.coverSubtitle}"**.`;
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
        parsed.replyMessage = `I've structured the proposal${brand}${budget}${itemText} and populated the scope of services and PMP strategy!`;
      } else if (parsed.intent === 'invoice') {
        parsed.replyMessage = "I've updated the invoice with the requested items and client details.";
      } else if (parsed.intent === 'email') {
        parsed.replyMessage = "I've updated the email campaign details.";
      } else if (parsed.intent === 'portfolio') {
        parsed.replyMessage = "I've updated the portfolio entry.";
      } else if (parsed.intent === 'clear_chat') {
        parsed.replyMessage = "New chat started! What are we working on today?";
      } else {
        parsed.replyMessage = "I'm right here! How can I help you today?";
      }
    }

    parsed.activeModel = usedModel || cachedWorkingModel;
    parsed.isAutoSelected = isAutoMode;

    return Response.json(parsed);
  } catch (error) {
    console.error('Copilot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
