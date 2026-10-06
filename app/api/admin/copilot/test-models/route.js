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
          const name = m.name.replace(/^models\//, '').replace(/-latest$/, '').trim();
          if (name === 'gemini-2.5-pro') return 'gemini-3.1-pro-preview';
          return name;
        })
        .filter(name => {
          if (!name.startsWith('gemini-')) return false;
          if (name === 'gemini-2.5-pro') return false;
          if (name === 'gemini-3.1-pro-preview') return true;
          if (name.includes('preview') || name.includes('experimental') || name.includes('lite') || name.includes('vision') || name.includes('001') || name.includes('002')) return false;
          return true;
        });
        
      // Ensure we don't have duplicates and default to modern verified models
      const defaults = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-3.1-pro-preview'];
      const uniqueModels = [...new Set([...validModels, ...defaults])].filter(m => m !== 'gemini-2.5-pro' && !m.endsWith('-latest'));
      const recommended = uniqueModels.find(m => m === 'gemini-2.0-flash') || uniqueModels.find(m => m.includes('flash')) || uniqueModels[0] || 'gemini-2.0-flash';
      return Response.json({ recommended, models: uniqueModels });
    }
    
    const defaults = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-3.1-pro-preview'];
    return Response.json({ recommended: 'gemini-2.0-flash', models: defaults });
  } catch (err) {
    const defaults = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-3.1-pro-preview'];
    return Response.json({ recommended: 'gemini-2.0-flash', models: defaults, error: err.message });
  }
}
