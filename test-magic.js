const apiKey = process.env.GEMINI_API_KEY || "YOUR_API_KEY";
const prompt = "test";
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

fetch(geminiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      response_mime_type: "application/json"
    }
  })
}).then(res => res.text()).then(console.log).catch(console.error);
