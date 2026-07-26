export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'Missing API key' });

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    const data = await res.json();

    if (data.models) {
      const modelNames = data.models.map(m => m.name).filter(n => n.includes('gemini'));
      return Response.json({ models: modelNames });
    }
    
    return Response.json({ error: data });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
