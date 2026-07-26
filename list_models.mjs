import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = envLocal.split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
    return acc;
}, {});

const apiKey = env['GEMINI_API_KEY'];
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
