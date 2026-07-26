import fs from 'fs';

async function checkUrl() {
    const url = "https://pub-72c28e7d3884434bac75ca152fdf30bb.r2.dev/Reels/1785103378472_Reels_MTB_Khalanga_Reel_Dripp_Media_web.mp4";
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log("Status:", res.status);
        console.log("Content-Type:", res.headers.get('content-type'));
        console.log("Content-Length:", res.headers.get('content-length'));
    } catch (e) {
        console.error(e);
    }
}
checkUrl();
