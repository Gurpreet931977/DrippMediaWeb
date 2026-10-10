const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function captureDesktop() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--disable-gpu',
    '--window-size=1400,900',
    '--remote-debugging-port=9230',
    '--user-data-dir=/tmp/chrome-test-desktop-new-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9230/json/list', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      const list = JSON.parse(raw);
      const target = list.find(t => t.type === 'page') || list[0];
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      let id = 1;
      function send(method, params = {}) {
        const msgId = id++;
        ws.send(JSON.stringify({ id: msgId, method, params }));
        return msgId;
      }

      ws.onopen = () => {
        send('Runtime.enable');
        send('Page.enable');
        send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
        send('Page.navigate', { url: 'http://localhost:3000/invoice/d0kf7y4K?pwd=8268' });
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Page.loadEventFired') {
          setTimeout(() => {
            send('Page.captureScreenshot', { format: 'png' });
          }, 2500);
        } else if (msg.result && msg.result.data) {
          fs.writeFileSync('/Users/metagurpreet/.gemini/antigravity-ide/brain/aa9b5f05-9f2c-4418-a036-459820d43f18/scratch/desktop_verified.png', Buffer.from(msg.result.data, 'base64'));
          console.log('Saved desktop_verified.png');
          ws.close();
          chromeProcess.kill();
          process.exit(0);
        }
      };
    });
  });
}

captureDesktop();
