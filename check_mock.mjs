async function checkMock() {
    const url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log("Mock Status:", res.status);
        console.log("Mock Headers:");
        for (const [k, v] of res.headers.entries()) console.log(k, v);
    } catch (e) {
        console.error(e);
    }
}
checkMock();
