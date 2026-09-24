export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    const data = await res.json();

    if (data.models && Array.isArray(data.models)) {
      // Filter out beta/preview/experimental/gemma/nano models to keep the UI clean
      const validModels = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => {
          const name = m.name.replace(/^models\//, '').trim();
          // Normalize dead unversioned 1.5 aliases to active supported endpoints
          if (name === 'gemini-1.5-pro') return 'gemini-1.5-pro-latest';
          if (name === 'gemini-1.5-flash') return 'gemini-1.5-flash-latest';
          return name;
        })
        .filter(name => {
          // Only allow core Gemini 1.5, 2.0, and 2.5 models
          if (!name.startsWith('gemini-')) return false;
          if (name.includes('preview') || name.includes('experimental') || name.includes('lite') || name.includes('vision') || name.includes('001') || name.includes('002')) return false;
          // Never output the deprecated unpinned gemini-1.5-pro alias
          if (name === 'gemini-1.5-pro') return false;
          return true;
        });
        
      // Ensure we don't have duplicates and default to modern verified models
      const defaults = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-2.5-pro'];
      const uniqueModels = [...new Set([...validModels, ...defaults])].filter(m => m !== 'gemini-1.5-pro');
      return Response.json({ models: uniqueModels });
    }
    
    return Response.json({ error: data.error?.message || 'Failed to list models' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
