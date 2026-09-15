import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Validate whether a buffer is a real, high-resolution desktop screenshot (and not a loading GIF / placeholder / error HTML)
function isValidScreenshot(buffer, contentType = '') {
  if (!buffer || buffer.byteLength < 25000) return false;
  
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('gif') || ct.includes('html') || ct.includes('json') || ct.includes('text')) {
    return false;
  }

  const header = Buffer.from(buffer.slice(0, 8));
  
  // Reject GIF magic header ('GIF87a' or 'GIF89a' = 47 49 46 38)
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
    return false;
  }

  // Check valid image signatures
  const isJpg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
  const isWebp = header.toString('ascii', 0, 4) === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

  return isJpg || isPng || isWebp;
}

function getImageMime(buffer) {
  if (!buffer || buffer.byteLength < 4) return 'image/jpeg';
  const h = Buffer.from(buffer.slice(0, 4));
  if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4E && h[3] === 0x47) return 'image/png';
  if (h.toString('ascii', 0, 4) === 'RIFF') return 'image/webp';
  return 'image/jpeg';
}

function getImageExt(mime) {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

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

    // Resolve final canonical URL in case of HTTP 301/302/308 redirects (e.g. apex -> www)
    let resolvedUrl = targetUrl;
    try {
      const probeRes = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(5000)
      });
      if (probeRes.url) {
        resolvedUrl = probeRes.url;
      }
    } catch (probeErr) {
      // Non-fatal, fallback to targetUrl
    }

    const domainName = resolvedUrl.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '');
    const cleanSlug = (title || domainName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'web-project';
    
    const publicDir = path.join(process.cwd(), 'public', 'images', 'web-portfolio');

    let isFsWritable = false;
    try {
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      isFsWritable = true;
    } catch (e) {
      isFsWritable = false;
    }

    let finalImageUrl = null;
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    // Strategy 1: Ultra-reliable high-res cloud screenshot engines
    // 1. Thum.io (fastest, pristine 1600x1000 PNG viewport)
    // 2. Microlink (full headless Chromium cloud capture)
    // 3. WordPress mshots (ONLY accepted if valid JPEG/PNG > 25KB, rejecting loading GIFs)
    const cloudEngines = [
      {
        name: 'Thum.io',
        url: `https://image.thum.io/get/width/1600/crop/1000/noanimate/${resolvedUrl}`
      },
      {
        name: 'Microlink',
        url: `https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1600&viewport.height=1000`
      },
      {
        name: 'WordPress mshots',
        url: `https://s.wordpress.com/mshots/v1/${encodeURIComponent(resolvedUrl)}?w=1600`
      }
    ];

    for (const engine of cloudEngines) {
      try {
        const response = await fetch(engine.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(9000)
        });

        if (response.ok) {
          const ct = response.headers.get('content-type') || '';
          const buffer = await response.arrayBuffer();

          if (isValidScreenshot(buffer, ct)) {
            const buf = Buffer.from(buffer);
            const mime = getImageMime(buf);
            const ext = getImageExt(mime);
            const filename = `${cleanSlug}-${Date.now()}${ext}`;
            const outputPath = path.join(publicDir, filename);

            if (isFsWritable) {
              try {
                fs.writeFileSync(outputPath, buf);
                finalImageUrl = `/images/web-portfolio/${filename}`;
                break;
              } catch (writeErr) {
                // In serverless / read-only environment, fallback to data URL
              }
            }

            // Serverless / Read-only fallback: Return verified high-res Data URL
            const base64 = buf.toString('base64');
            finalImageUrl = `data:${mime};base64,${base64}`;
            break;
          }
        }
      } catch (engineErr) {
        console.warn(`Engine ${engine.name} capture attempt skipped:`, engineErr.message);
      }
    }

    // Strategy 2: Local Chrome Headless fallback (macOS dev environment)
    if (!finalImageUrl && isFsWritable && fs.existsSync(chromePath)) {
      try {
        const localFilename = `${cleanSlug}-${Date.now()}.png`;
        const localOutputPath = path.join(publicDir, localFilename);
        const command = `"${chromePath}" --headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage --window-size=1600,1000 --hide-scrollbars --virtual-time-budget=8000 --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" --screenshot="${localOutputPath}" "${resolvedUrl}"`;
        await execAsync(command).catch(() => {});

        if (fs.existsSync(localOutputPath)) {
          const stats = fs.statSync(localOutputPath);
          if (stats.size > 25000) {
            finalImageUrl = `/images/web-portfolio/${localFilename}`;
          }
        }
      } catch (err) {
        console.warn('Local Chrome capture error:', err.message);
      }
    }

    if (finalImageUrl) {
      return Response.json({
        success: true,
        image_url: finalImageUrl,
        normalized_url: resolvedUrl,
        suggested_title: title || domainName.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      });
    }

    return Response.json({ 
      success: false, 
      error: `Could not capture live screenshot from "${resolvedUrl}". Please verify the URL or upload a screenshot directly.` 
    }, { status: 422 });

  } catch (err) {
    console.error('Screenshot capture route exception:', err);
    return Response.json({ 
      success: false, 
      error: err.message || 'Server error during screenshot capture'
    }, { status: 500 });
  }
}
