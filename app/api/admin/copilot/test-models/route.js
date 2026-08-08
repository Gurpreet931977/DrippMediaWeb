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
        .map(m => m.name.replace('models/', ''))
        .filter(name => {
          // Only allow core Gemini 1.5, 2.0, and 2.5 models
          if (!name.startsWith('gemini-')) return false;
          if (name.includes('preview') || name.includes('experimental') || name.includes('lite') || name.includes('vision') || name.includes('001') || name.includes('002')) return false;
          return true;
        });
        
      // Ensure we don't have duplicates
      const uniqueModels = [...new Set(validModels)];
      return Response.json({ models: uniqueModels });
    }
    
    return Response.json({ error: data.error?.message || 'Failed to list models' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
