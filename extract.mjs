import fs from 'fs';
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

async function extractFrame() {
    try {
        const { stdout } = await execFileAsync('./node_modules/ffmpeg-static/ffmpeg.exe', [
            '-i', 'temp.mp4'
        ]);
    } catch (e) {
        console.log("FFmpeg Output:\n", e.stderr);
    }
}
extractFrame();
