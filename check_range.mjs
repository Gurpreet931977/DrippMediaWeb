async function checkRange() {
    const url = "https://pub-72c28e7d3884434bac75ca152fdf30bb.r2.dev/Reels/1785104072547_Reels_MTB_Khalanga_Reel_Dripp_Media_web.mp4";
    try {
        const res = await fetch(url, { headers: { 'Range': 'bytes=0-1000' } });
        console.log("Status:", res.status);
        console.log("Content-Range:", res.headers.get('content-range'));
        console.log("Content-Type:", res.headers.get('content-type'));
        console.log("Content-Length:", res.headers.get('content-length'));
    } catch (e) {
        console.error(e);
    }
}
checkRange();
