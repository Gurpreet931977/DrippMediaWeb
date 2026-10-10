const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function captureMobile() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9225',
    '--user-data-dir=/tmp/chrome-test-mobile-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9225/json/list', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      const list = JSON.parse(raw);
      const target = list[0];
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      let id = 1;
      function send(method, params = {}) {
        const msgId = id++;
        ws.send(JSON.stringify({ id: msgId, method, params }));
        return msgId;
      }

      ws.onopen = () => {
        send('Page.enable');
        send('Emulation.setDeviceMetricsOverride', {
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          mobile: true
        });
        send('Page.navigate', { url: 'http://localhost:3000/invoice/d0kf7y4K?pwd=8268' });
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Page.loadEventFired') {
          setTimeout(() => {
            send('Page.captureScreenshot', { format: 'png' });
          }, 2500);
        } else if (msg.result && msg.result.data) {
          fs.writeFileSync('/Users/metagurpreet/.gemini/antigravity-ide/brain/aa9b5f05-9f2c-4418-a036-459820d43f18/scratch/current_mobile_invoice.png', Buffer.from(msg.result.data, 'base64'));
          console.log('Mobile screenshot saved to current_mobile_invoice.png');
          ws.close();
          chromeProcess.kill();
          process.exit(0);
        }
      };
    });
  });
}

captureMobile();
