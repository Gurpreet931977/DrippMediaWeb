const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
fetch(url)
  .then(res => res.text())
  .then(html => {
    const titleMatch = html.match(/<meta\s+itemprop="name"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    const descMatch = html.match(/<meta\s+itemprop="description"\s+content="([^"]+)"/i);
    const description = descMatch ? descMatch[1] : '';
    
    const durationMatch = html.match(/<meta\s+itemprop="duration"\s+content="([^"]+)"/i);
    const duration = durationMatch ? durationMatch[1] : '';
    
    const thumbnailMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const thumbnail = thumbnailMatch ? thumbnailMatch[1] : '';

    console.log({ title, description, duration, thumbnail });
  });
