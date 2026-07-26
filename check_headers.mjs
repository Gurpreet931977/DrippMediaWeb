async function checkHeaders() {
    const url = "https://pub-72c28e7d3884434bac75ca152fdf30bb.r2.dev/Reels/1785104072547_Reels_MTB_Khalanga_Reel_Dripp_Media_web.mp4";
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log("Headers:");
        for (const [key, value] of res.headers.entries()) {
            console.log(`${key}: ${value}`);
        }
    } catch (e) {
        console.error(e);
    }
}
checkHeaders();
