// Health check endpoint for Orlo Copilot AI availability
let cachedHealth = null;
let lastCheckTime = 0;
const CACHE_TTL = 20 * 1000; // 20 seconds cache to prevent flooding Google API

export async function GET(request) {
  try {
    const now = Date.now();
    const url = new URL(request.url);
    const forceFresh = url.searchParams.get('fresh') === 'true';

    if (!forceFresh && cachedHealth && (now - lastCheckTime) < CACHE_TTL) {
      return Response.json(cachedHealth);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      cachedHealth = {
        status: 'offline',
        healthy: false,
        reason: 'Missing GEMINI_API_KEY in environment',
        timestamp: now
      };
      lastCheckTime = now;
      return Response.json(cachedHealth, { status: 503 });
    }

    const startTime = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        signal: AbortSignal.timeout(4500)
      });
      const latency = Date.now() - startTime;
      const data = await res.json();

      if (res.status === 200 && data.models && Array.isArray(data.models)) {
        const textModels = data.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, '').replace(/-latest$/, ''))
          .filter(n => !n.startsWith('gemini-1.5') && !n.startsWith('gemini-2.0') && !n.includes('tts') && !n.includes('audio') && !n.includes('image'));

        const activeModel = textModels.includes('gemini-3.8-flash') ? 'gemini-3.8-flash' : (textModels[0] || 'gemini-3.5-flash');

        cachedHealth = {
          status: 'online',
          healthy: true,
          activeModel,
          availableCount: textModels.length,
          latency,
          message: 'Gemini AI is operational and ready',
          timestamp: now
        };
        lastCheckTime = now;
        return Response.json(cachedHealth);
      }

      // Check if Google is rate limiting or returning 429
      if (res.status === 429 || data.error?.code === 429 || data.error?.status === 'RESOURCE_EXHAUSTED') {
        cachedHealth = {
          status: 'degraded',
          healthy: true,
          activeModel: 'orlo-resilient-nlp',
          reason: 'Gemini API is rate limited. Resilient mode active.',
          latency,
          timestamp: now
        };
        lastCheckTime = now;
        return Response.json(cachedHealth);
      }

      // Other non-200 response from Google
      cachedHealth = {
        status: 'degraded',
        healthy: false,
        reason: data.error?.message || `Google API returned status ${res.status}`,
        activeModel: 'orlo-resilient-nlp',
        latency,
        timestamp: now
      };
      lastCheckTime = now;
      return Response.json(cachedHealth);
    } catch (fetchErr) {
      // Timeout or network unreachable
      cachedHealth = {
        status: 'degraded',
        healthy: false,
        reason: fetchErr.name === 'TimeoutError' ? 'Google API timeout' : fetchErr.message,
        activeModel: 'orlo-resilient-nlp',
        timestamp: now
      };
      lastCheckTime = now;
      return Response.json(cachedHealth);
    }
  } catch (err) {
    return Response.json({
      status: 'offline',
      healthy: false,
      reason: err.message,
      timestamp: Date.now()
    }, { status: 500 });
  }
}
