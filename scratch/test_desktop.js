const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testDesktop() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--window-size=1400,1000',
    '--remote-debugging-port=9229',
    '--user-data-dir=/tmp/chrome-test-desktop-debug-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9229/json/list', (res) => {
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
        send('Runtime.enable');
        send('Log.enable');
        send('Page.enable');
        send('Page.navigate', { url: 'http://localhost:3000/invoice/d0kf7y4K?pwd=8268' });
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[CONSOLE]', msg.params.args.map(a => a.value || a.description).join(' '));
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
        } else if (msg.method === 'Page.loadEventFired') {
          console.log('Load event fired. Waiting 2.5s for quote data fetch...');
          setTimeout(() => {
            send('Runtime.evaluate', { expression: 'document.querySelector(".invoice-header h1")?.innerText' });
            send('Page.captureScreenshot', { format: 'png' });
          }, 3000);
        } else if (msg.result && msg.result.result && msg.result.result.value) {
          console.log('Invoice title evaluated:', msg.result.result.value);
        } else if (msg.result && msg.result.data) {
          fs.writeFileSync('/Users/metagurpreet/.gemini/antigravity-ide/brain/aa9b5f05-9f2c-4418-a036-459820d43f18/scratch/optimized_desktop_invoice_wide.png', Buffer.from(msg.result.data, 'base64'));
          console.log('Saved optimized_desktop_invoice_wide.png');
          ws.close();
          chromeProcess.kill();
          process.exit(0);
        }
      };
    });
  });
}

testDesktop();
