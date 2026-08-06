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

    const { frames, prompt, model } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });
    if (!frames || frames.length === 0) return Response.json({ error: 'No frames provided' }, { status: 400 });

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

    // Construct inline data for each frame
    const imageParts = frames.map(b64 => ({
        inlineData: {
            mimeType: "image/jpeg",
            data: b64
        }
    }));

    let data = null;
    let lastError = null;

    for (const modelToTry of fallbackQueue) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`;
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
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        case_study: { type: "string" }
                    },
                    required: ["title", "description", "case_study"]
                }
            }
          })
        });

        const resData = await response.json();
        if (resData.error) {
          console.warn(`[Video Analyze Model ${modelToTry} Error]: ${resData.error.message}. Trying next fallback...`);
          lastError = resData.error.message;
          continue;
        }

        if (resData.candidates && resData.candidates[0]?.content?.parts?.[0]?.text) {
          data = resData;
          break;
        }
      } catch (err) {
        console.warn(`[Video Analyze Model ${modelToTry} Exception]: ${err.message}. Trying next fallback...`);
        lastError = err.message;
      }
    }

    if (!data) {
      throw new Error(lastError || 'All AI models are currently unavailable. Please try again.');
    }

    let textOutput = data.candidates[0].content.parts[0].text;
    
    function safeParseJSON(str) {
      if (!str) return null;
      let cleaned = str.replace(/```json/gi, '').replace(/```/g, '').trim();
      try { return JSON.parse(cleaned); } catch (e) {}
      
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
                break;
              }
            }
          }
        }
        
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace > firstBrace) {
          try {
            const candidate = cleaned.substring(firstBrace, lastBrace + 1)
              .replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(candidate);
          } catch (e) {}
        }
      }
      return null;
    }

    const parsed = safeParseJSON(textOutput);
    if (parsed) {
      return Response.json(parsed);
    } else {
      console.error('Failed to parse Gemini output:', textOutput);
      return Response.json({ title: textOutput.replace(/[^a-zA-Z0-9\s#]/g, '').trim() });
    }
  } catch (error) {
    console.error('Video analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
