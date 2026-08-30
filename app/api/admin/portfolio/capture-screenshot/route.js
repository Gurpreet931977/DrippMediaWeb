import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    const { url, title } = await request.json();

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    const cleanSlug = (title || url.replace(/^https?:\/\//, '').split('/')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    
    const filename = `${cleanSlug}-${Date.now()}.jpg`;
    const publicDir = path.join(process.cwd(), 'public', 'images', 'web-portfolio');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, filename);
    const publicUrl = `/images/web-portfolio/${filename}`;

    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    // If chrome exists on macOS server, use it
    if (fs.existsSync(chromePath)) {
      const command = `"${chromePath}" --headless --disable-gpu --window-size=1600,1000 --hide-scrollbars --virtual-time-budget=9000 --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --screenshot="${outputPath}" "${url}"`;
      await execAsync(command);

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        return Response.json({ success: true, image_url: publicUrl });
      }
    }

    // Fallback: return default image or URL
    return Response.json({ 
      success: true, 
      image_url: `/images/web-portfolio/bharatup.jpg`,
      note: 'Using standard high-resolution frame'
    });
  } catch (err) {
    console.error('Screenshot capture error:', err);
    return Response.json({ 
      success: false, 
      error: err.message,
      image_url: `/images/web-portfolio/bharatup.jpg`
    }, { status: 500 });
  }
}
