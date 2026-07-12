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
    const { templateType, currentSubject, currentTitle, currentBody, userInstruction } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY is missing in env' }, { status: 500 });
    }

    // Dynamic angles to ensure variation when no user instruction is given
    const CREATIVE_ANGLES = [
      "A case study of designing a high-speed 3D WebGL website that doubled a luxury client's conversion rate.",
      "A story-driven email about a brand that looked cheap until we redesigned their visual identity, leading to a massive increase in pricing power.",
      "A growth hack email showing how one viral TikTok/Reel edit drove 1 million views in 48 hours for a SaaS startup.",
      "An announcement about a secret new Web3/AI landing page template we've been developing for high-ticket brands.",
      "A direct personal email asking if their current website is losing them clients due to slow loading speeds (focusing on Next.js optimization).",
      "A raw, behind-the-scenes look at how we shot a premium commercial for an elite lifestyle brand.",
      "A time-sensitive offer to get a free website conversion audit for the first 3 clients who reply.",
      "A contrarian take on why standard website templates are killing modern luxury brands.",
      "A velvet-rope invite to join a private group of founders getting custom UI/UX design blueprints.",
      "A breakdown of 3 visual hooks that keep viewers watching reels past the 3-second mark.",
      "A bold, unapologetic manifesto on why aesthetics and speed are the only things that matter in e-commerce.",
      "A case study of taking a brand from 0 to 100k followers using cinematic short-form storytelling.",
      "A checklist of 5 conversion mistakes 99% of premium brands make on their landing page.",
      "An invitation to view a secret interactive portfolio project we just launched."
    ];

    const chosenAngle = userInstruction 
      ? `Focus the email campaign heavily around this user instruction: "${userInstruction}"`
      : `Dynamically focus the campaign on this specific creative marketing angle: "${CREATIVE_ANGLES[Math.floor(Math.random() * CREATIVE_ANGLES.length)]}"`;

    // Determine if we are regenerating a specific field
    let regenerationDirective = "";
    if (currentSubject && currentTitle && !currentBody) {
      // Regenerating body
      regenerationDirective = `CRITICAL: The user wants to regenerate ONLY the body of the email. Keep the existing subject "${currentSubject}" and existing title "${currentTitle}" as they are, but rewrite the body to have a completely fresh, engaging narrative structure fitting the theme.`;
    } else if (currentSubject && currentBody && !currentTitle) {
      // Regenerating title
      regenerationDirective = `CRITICAL: The user wants to regenerate ONLY the title of the email. Keep the existing subject "${currentSubject}" and existing body "${currentBody}" as they are, but generate a completely fresh, creative header title fitting the theme.`;
    } else if (currentTitle && currentBody && !currentSubject) {
      // Regenerating subject
      regenerationDirective = `CRITICAL: The user wants to regenerate ONLY the subject of the email. Keep the existing title "${currentTitle}" and existing body "${currentBody}" as they are, but generate a completely fresh, high-converting subject line fitting the theme.`;
    }

    // 3. Build Prompt for Gemini
    const prompt = `You are the lead elite copywriter for Dripp Media.

CONTEXT ABOUT DRIPP MEDIA:
Dripp Media is a premium, state-of-the-art digital agency. Our core services are:
1. High-End Web Development (custom coded, 3D web experiences, next-gen React/Next.js sites)
2. Elite Digital Branding (identity, UI/UX, premium aesthetics)
3. Viral Video Production & Editing (short-form, long-form, high-retention visual hooks)

THEME AND TONE (CRITICAL):
You are generating an email for the "${templateType || 'announcement'}" template.
You MUST write the copy in the exact style and tone of this specific template:

- "announcement": Tone is aggressively bold, unapologetic, weapons-grade copy. Drop a nuke of an update. Authoritative and paradigm-breaking.
- "primary": Tone is a 1-to-1 personal email to a friend. Casual, direct, zero marketing speak. DO NOT sound like a brand. Avoid words like "sale" or "discount".
- "promo": Tone is pure, unfiltered urgency and aggressive growth-hacker energy. Make the offer sound so absurdly good they feel stupid for not clicking.
- "newsletter": Tone is highly engaging, edgy storytelling. Spill the tea, break the rules, keep them addicted to reading.
- "invitation": Tone is velvet rope exclusivity and high-end luxury. Make them feel like they just got handed the keys to a secret society.
- "alert": Tone is Defcon 1 urgency. Sirens blaring. Cut the pleasantries and tell them exactly what action to take right NOW.

CAMPAIGN FOCUS:
${chosenAngle}

${regenerationDirective}

User's current drafts (if relevant):
Current Subject: "${currentSubject || ''}"
Current Title: "${currentTitle || ''}"
Current Body: "${currentBody || ''}"

Rules:
1. Never use em-dashes ("—") anywhere in the copy. Use standard punctuation like commas, parentheses, or single hyphens ("-") instead.
2. Always use the exact string '{{name}}' (without quotes) as a placeholder to personally address the recipient.
3. Do NOT output any conversational text or markdown code blocks. Output ONLY valid JSON in this exact structure:
{
  "subject": "Email Subject Line",
  "title": "Large Header Title",
  "body": "The email body text. Use \\n\\n for paragraph breaks."
}

Ensure the output is creative, original, and does not just repeat or slightly rephrase the inputs unless they are already excellent. Make it punchy, engaging, and premium.`;

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
      const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanedText);

      // Preserve existing fields if they were intentionally excluded from regeneration
      if (currentSubject && currentTitle && !currentBody) {
        parsedResult.subject = currentSubject;
        parsedResult.title = currentTitle;
      } else if (currentSubject && currentBody && !currentTitle) {
        parsedResult.subject = currentSubject;
        parsedResult.body = currentBody;
      } else if (currentTitle && currentBody && !currentSubject) {
        parsedResult.title = currentTitle;
        parsedResult.body = currentBody;
      }
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
