import fs from 'fs';
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

async function analyzeVideo() {
    const url = "https://pub-72c28e7d3884434bac75ca152fdf30bb.r2.dev/Reels/1785104072547_Reels_MTB_Khalanga_Reel_Dripp_Media_web.mp4";
    console.log("Downloading video...", url);
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    
    fs.writeFileSync('temp.mp4', Buffer.from(buffer));
    console.log("Downloaded. Running ffprobe...");
    
    try {
        const { stdout } = await execFileAsync('./node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe', [
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=codec_name,profile,pix_fmt,width,height,r_frame_rate,bit_rate',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            'temp.mp4'
        ]);
        console.log("FFprobe Output:\n", stdout);
    } catch (e) {
        console.error("FFprobe error:", e);
    }
}
analyzeVideo();
