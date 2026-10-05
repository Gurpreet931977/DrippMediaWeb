import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

const execAsync = promisify(exec);

// Detect whether an image buffer is essentially a blank/solid unrendered canvas
// (e.g. solid white or pastel preloader screen with >95% identical pixel values).
function isImageBlank(input) {
  if (!input) return true;
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buf.length < 500) return true;

  // Check PNG
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  if (isPng) {
    try {
      let offset = 8;
      const idatChunks = [];
      let width = 0, height = 0, colorType = 0;
      while (offset < buf.length) {
        const len = buf.readUInt32BE(offset);
        const type = buf.toString('ascii', offset + 4, offset + 8);
        if (type === 'IHDR') {
          width = buf.readUInt32BE(offset + 8);
          height = buf.readUInt32BE(offset + 12);
          colorType = buf[offset + 17];
        } else if (type === 'IDAT') {
          idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
        }
        offset += 12 + len;
      }
      if (idatChunks.length === 0 || width < 10 || height < 10) return true;

      const raw = zlib.inflateSync(Buffer.concat(idatChunks));
      const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
      const stride = 1 + width * bytesPerPixel;

      let diffCount = 0;
      let totalSamples = 0;
      const firstPixel = [raw[1], raw[2], raw[3]];
      const stepY = Math.max(1, Math.floor(height / 20));
      const stepX = Math.max(1, Math.floor(width / 20));

      for (let y = Math.floor(height * 0.1); y < height * 0.9; y += stepY) {
        const rowOffset = y * stride;
        for (let x = Math.floor(width * 0.1); x < width * 0.9; x += stepX) {
          const pxOffset = rowOffset + 1 + x * bytesPerPixel;
          if (pxOffset + 2 < raw.length) {
            totalSamples++;
            const r = raw[pxOffset];
            const g = raw[pxOffset + 1];
            const b = raw[pxOffset + 2];
            if (Math.abs(r - firstPixel[0]) > 12 || Math.abs(g - firstPixel[1]) > 12 || Math.abs(b - firstPixel[2]) > 12) {
              diffCount++;
            }
          }
        }
      }
      // If fewer than 5% of pixels differ from the baseline, it's an unrendered/blank canvas
      return totalSamples > 0 && (diffCount / totalSamples < 0.05);
    } catch (e) {
      return false;
    }
  }

  // Check JPEG
  const isJpg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  if (isJpg) {
    if (buf.length < 22000) return true;
  }

  return false;
}

// Validate whether a buffer is a real, high-resolution desktop screenshot (and not a loading GIF / placeholder / error HTML / blank image)
function isValidScreenshot(buffer, contentType = '') {
  if (!buffer) return false;
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (buf.byteLength < 25000) return false;
  
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('gif') || ct.includes('html') || ct.includes('json') || ct.includes('text')) {
    return false;
  }

  const header = buf.subarray(0, 8);
  
  // Reject GIF magic header ('GIF87a' or 'GIF89a' = 47 49 46 38)
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
    return false;
  }

  // Check valid image signatures
  const isJpg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
  const isWebp = header.toString('ascii', 0, 4) === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';

  if (!isJpg && !isPng && !isWebp) return false;

  // Reject blank / solid unrendered canvases
  if (isImageBlank(buf)) {
    return false;
  }

  return true;
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

async function captureFromEndpoints(endpoints, cleanSlug, prefix, publicDir, isFsWritable) {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(18000)
      });

      if (response.ok) {
        const ct = response.headers.get('content-type') || '';
        const buffer = await response.arrayBuffer();

        if (isValidScreenshot(buffer, ct)) {
          const buf = Buffer.from(buffer);
          const mime = getImageMime(buf);
          const ext = getImageExt(mime);
          const filename = `${cleanSlug}-${prefix}-${Date.now()}${ext}`;
          const outputPath = path.join(publicDir, filename);

          if (isFsWritable) {
            try {
              fs.writeFileSync(outputPath, buf);
              return `/images/web-portfolio/${filename}`;
            } catch (writeErr) {
              // Fallback to data URL
            }
          }

          const base64 = buf.toString('base64');
          return `data:${mime};base64,${base64}`;
        }
      }
    } catch (err) {
      // Continue to next endpoint candidate
    }
  }
  return null;
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

    // 3 Distinct Capture Targets:
    // 1. Preloader / Initial Brand Intro (1.8s delay to capture splash/opening logo without being blank)
    // 2. Hero Section (full load, 6.5s delay to let client preloaders finish and animations settle)
    // 3. In Between Site / Mid-Page (scrolled down ~850px with 6.5s delay)
    const targets = [
      {
        id: 'preloader',
        label: '01 • PRELOADER / INTRO',
        sublabel: 'Initial Splash & Opening Logo',
        endpoints: [
          `https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1600&viewport.height=1000&waitForTimeout=1800`,
          `https://image.thum.io/get/width/1600/crop/1000/wait/2/${resolvedUrl}`,
          `https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1600&viewport.height=1000&waitForTimeout=1000`
        ]
      },
      {
        id: 'hero',
        label: '02 • HERO SECTION',
        sublabel: 'Header & Main Hero Fold',
        endpoints: [
          `https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1600&viewport.height=1000&waitForTimeout=6500`,
          `https://image.thum.io/get/width/1600/crop/1000/wait/7/${resolvedUrl}`,
          `https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1600&viewport.height=1000&waitForTimeout=4000`,
          `https://image.thum.io/get/width/1600/crop/1000/wait/4/${resolvedUrl}`
        ]
      },
      {
        id: 'middle',
        label: '03 • IN BETWEEN SITE',
        sublabel: 'Mid-Page Features & Showcase',
        endpoints: [
          `https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1600&viewport.height=1000&scrollTo=850&waitForTimeout=6500`,
          `https://image.thum.io/get/width/1600/crop/1000/scroll/850/wait/6/${resolvedUrl}`,
          `https://image.thum.io/get/width/1600/crop/1000/scroll/850/${resolvedUrl}`,
          `https://api.microlink.io/?url=${encodeURIComponent(resolvedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1600&viewport.height=1000&scrollTo=700`
        ]
      }
    ];

    // Run all 3 captures in parallel
    const captureResults = await Promise.allSettled(
      targets.map(t => captureFromEndpoints(t.endpoints, cleanSlug, t.id, publicDir, isFsWritable))
    );

    const capturedOptions = [];
    targets.forEach((t, idx) => {
      const res = captureResults[idx];
      const imgUrl = res.status === 'fulfilled' ? res.value : null;
      if (imgUrl) {
        capturedOptions.push({
          id: t.id,
          label: t.label,
          sublabel: t.sublabel,
          image_url: imgUrl
        });
      }
    });

    // Strategy 2: Local Chrome Headless fallback if needed
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (capturedOptions.length === 0 && isFsWritable && fs.existsSync(chromePath)) {
      try {
        const localFilename = `${cleanSlug}-hero-${Date.now()}.png`;
        const localOutputPath = path.join(publicDir, localFilename);
        const command = `"${chromePath}" --headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage --window-size=1600,1000 --hide-scrollbars --virtual-time-budget=6000 --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" --screenshot="${localOutputPath}" "${resolvedUrl}"`;
        await execAsync(command).catch(() => {});

        if (fs.existsSync(localOutputPath)) {
          const stats = fs.statSync(localOutputPath);
          if (stats.size > 20000) {
            const localUrl = `/images/web-portfolio/${localFilename}`;
            capturedOptions.push({
              id: 'hero',
              label: '02 • HERO SECTION',
              sublabel: 'Header & Main Hero Fold',
              image_url: localUrl
            });
          }
        }
      } catch (err) {
        console.warn('Local Chrome capture error:', err.message);
      }
    }

    if (capturedOptions.length > 0) {
      // Prioritize hero as primary default image, or first available
      const primaryOption = capturedOptions.find(o => o.id === 'hero') || capturedOptions[0];
      const fallbackUrl = primaryOption.image_url;

      // Ensure all 3 standard targets have non-blank options for the interactive UI
      const finalOptions = targets.map(t => {
        const found = capturedOptions.find(o => o.id === t.id);
        return {
          id: t.id,
          label: t.label,
          sublabel: t.sublabel,
          image_url: (found && found.image_url) ? found.image_url : fallbackUrl
        };
      });

      return Response.json({
        success: true,
        image_url: primaryOption.image_url,
        options: finalOptions,
        normalized_url: resolvedUrl,
        suggested_title: title || domainName.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      });
    }

    return Response.json({ 
      success: false, 
      error: `Could not capture live frames from "${resolvedUrl}". Please verify the URL or upload a screenshot directly.` 
    }, { status: 422 });

  } catch (err) {
    console.error('Screenshot capture route exception:', err);
    return Response.json({ 
      success: false, 
      error: err.message || 'Server error during screenshot capture'
    }, { status: 500 });
  }
}
