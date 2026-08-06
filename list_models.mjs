import fs from 'fs';

let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    for (const envFile of ['.env.local', '.env']) {
        if (fs.existsSync(envFile)) {
            const content = fs.readFileSync(envFile, 'utf8');
            const match = content.match(/GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
            if (match && match[1]) {
                apiKey = match[1].trim();
                break;
            }
        }
    }
}

console.log('API Key starts with:', apiKey ? apiKey.substring(0, 5) : 'MISSING');

fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
  .then(r => r.json())
  .then(data => {
      if (data.models) {
          console.log(data.models.map(m => m.name));
      } else {
          console.log('Error fetching models:', data);
      }
  })
  .catch(console.error);
