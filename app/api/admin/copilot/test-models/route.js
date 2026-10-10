export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey, {
      signal: AbortSignal.timeout(6000)
    });
    const data = await res.json();

    if (data.models && Array.isArray(data.models)) {
      const validModels = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, '').replace(/-latest$/, '').trim())
        .filter(name => {
          if (!name.startsWith('gemini-')) return false;
          // Filter out modalities/sub-types that are not general text models
          if (name.includes('tts') || name.includes('audio') || name.includes('image') || name.includes('vision') || name.includes('embedding') || name.includes('aqa') || name.includes('imagen') || name.includes('veo') || name.includes('lyria') || name.includes('robotics') || name.includes('computer-use') || name.includes('banana') || name.includes('customtools') || name.includes('gemma')) return false;
          // Filter out deprecated models that return 404
          if (name.startsWith('gemini-1.5') || name.startsWith('gemini-2.0') || name.startsWith('gemini-2.5-flash') || name === 'gemini-2.5-pro') return false;
          return true;
        });

      const defaults = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash'];
      const uniqueModels = [...new Set([...defaults, ...validModels])];
      const recommended = uniqueModels.find(m => m === 'gemini-3.8-flash') || uniqueModels.find(m => m === 'gemini-3.5-flash') || uniqueModels[0] || 'gemini-3.8-flash';
      return Response.json({ recommended, models: uniqueModels });
    }

    const defaults = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash'];
    return Response.json({ recommended: 'gemini-3.8-flash', models: defaults });
  } catch (err) {
    const defaults = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash'];
    return Response.json({ recommended: 'gemini-3.8-flash', models: defaults, error: err.message });
  }
}

