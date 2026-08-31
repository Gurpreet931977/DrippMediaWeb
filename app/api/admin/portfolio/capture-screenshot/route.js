import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    const { url, title } = await request.json();

    if (!url || !url.trim()) {
      return Response.json({ error: 'Live Website URL is required' }, { status: 400 });
    }

    // Normalize URL
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const domainName = targetUrl.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '');
    const cleanSlug = (title || domainName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'web-project';
    
    const filename = `${cleanSlug}-${Date.now()}.jpg`;
    const publicDir = path.join(process.cwd(), 'public', 'images', 'web-portfolio');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, filename);
    const publicUrl = `/images/web-portfolio/${filename}`;

    let captured = false;
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    // Tier 1: Local Chrome Headless (macOS server / local dev)
    if (fs.existsSync(chromePath)) {
      try {
        const command = `"${chromePath}" --headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage --window-size=1600,1000 --hide-scrollbars --virtual-time-budget=7000 --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --screenshot="${outputPath}" "${targetUrl}"`;
        await execAsync(command).catch((err) => {
          console.warn('Chrome process notice:', err.message);
        });

        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
          captured = true;
        }
      } catch (err) {
        console.warn('Local Chrome capture error:', err.message);
      }
    }

    // Tier 2: High-Resolution Cloud Screenshot Fallbacks
    if (!captured) {
      const fallbackServices = [
        `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&embed=screenshot.url`,
        `https://image.thum.io/get/width/1600/crop/1000/noanimate/${targetUrl}`,
        `https://s.wordpress.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=1600`
      ];

      for (const serviceUrl of fallbackServices) {
        try {
          const response = await fetch(serviceUrl, { signal: AbortSignal.timeout(10000) });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (buffer.byteLength > 2000) {
              fs.writeFileSync(outputPath, Buffer.from(buffer));
              captured = true;
              break;
            }
          }
        } catch (fallbackErr) {
          console.warn(`Fallback ${serviceUrl} failed:`, fallbackErr.message);
        }
      }
    }

    if (captured && fs.existsSync(outputPath)) {
      return Response.json({
        success: true,
        image_url: publicUrl,
        normalized_url: targetUrl,
        suggested_title: title || domainName.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      });
    }

    return Response.json({ 
      success: false, 
      error: `Could not capture live screenshot from "${targetUrl}". Please verify the URL or upload a screenshot directly.` 
    }, { status: 422 });

  } catch (err) {
    console.error('Screenshot capture route exception:', err);
    return Response.json({ 
      success: false, 
      error: err.message || 'Server error during screenshot capture'
    }, { status: 500 });
  }
}
