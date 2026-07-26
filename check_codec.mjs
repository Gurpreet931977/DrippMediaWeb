async function downloadVideo() {
    console.log("Fetching first 2MB...");
    const url = "https://pub-72c28e7d3884434bac75ca152fdf30bb.r2.dev/Reels/1785102800923_Reels_MTB_Khalanga_Reel_Dripp_Media.mp4";
    const res = await fetch(url, { headers: { 'Range': 'bytes=0-2000000' } });
    const buffer = await res.arrayBuffer();
    const str = Buffer.from(buffer).toString('ascii');
    
    if (str.includes('hvc1') || str.includes('hev1')) {
        console.log("Codec: HEVC (H.265) detected!");
    } else if (str.includes('avc1')) {
        console.log("Codec: AVC (H.264) detected!");
    } else {
        console.log("Codec not found in first 2MB. String length:", str.length);
        console.log("Includes mp4a?", str.includes('mp4a'));
        console.log("Includes moov?", str.includes('moov'));
    }
}
downloadVideo();
