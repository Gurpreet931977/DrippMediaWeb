import { NextResponse } from 'next/server';

function parseISO8601Duration(duration) {
    if (!duration) return '0:00';
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    const h = match[1] ? parseInt(match[1]) : 0;
    const m = match[2] ? parseInt(match[2]) : 0;
    const s = match[3] ? parseInt(match[3]) : 0;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();

        const titleMatch = html.match(/<meta\s+itemprop="name"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : '';
        
        const descMatch = html.match(/<meta\s+itemprop="description"\s+content="([^"]+)"/i);
        let description = descMatch ? descMatch[1] : '';
        
        const durationMatch = html.match(/<meta\s+itemprop="duration"\s+content="([^"]+)"/i);
        const durationISO = durationMatch ? durationMatch[1] : '';
        const duration = parseISO8601Duration(durationISO);
        
        const thumbnailMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        const thumbnail = thumbnailMatch ? thumbnailMatch[1] : '';

        return NextResponse.json({ title, description, duration, thumbnail });
    } catch (error) {
        console.error('Error fetching YouTube info:', error);
        return NextResponse.json({ error: 'Failed to fetch YouTube info' }, { status: 500 });
    }
}
