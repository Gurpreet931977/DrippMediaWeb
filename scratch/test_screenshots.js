const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testScreenshots() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9226',
    '--user-data-dir=/tmp/chrome-test-shots-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9226/json/list', (res) => {
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

      let mobileCaptured = false;

      ws.onopen = () => {
        send('Page.enable');
        // Test mobile first
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
            // Check cursor element
            send('Runtime.evaluate', { 
              expression: `({
                cursorExists: !!document.getElementById('invoice-custom-cursor'),
                cursorClasses: document.getElementById('invoice-custom-cursor')?.className,
                headerText: document.querySelector('.invoice-header h1')?.innerText,
                clientText: document.querySelector('.card-billed-to h2')?.innerText,
                firstItem: document.querySelector('.card-billed-items h4')?.innerText,
                totalDue: document.querySelector('.card-total-due span')?.innerText
              })`,
              returnByValue: true
            });
            send('Page.captureScreenshot', { format: 'png' });
          }, 2500);
        } else if (msg.result && msg.result.result && msg.result.result.value) {
          console.log('[DOM EVAL RESULT]:', msg.result.result.value);
        } else if (msg.result && msg.result.data) {
          if (!mobileCaptured) {
            mobileCaptured = true;
            fs.writeFileSync('/Users/metagurpreet/.gemini/antigravity-ide/brain/aa9b5f05-9f2c-4418-a036-459820d43f18/scratch/optimized_mobile_invoice.png', Buffer.from(msg.result.data, 'base64'));
            console.log('Saved optimized_mobile_invoice.png');
            
            // Now switch to desktop to capture desktop view
            send('Emulation.setDeviceMetricsOverride', {
              width: 1280,
              height: 850,
              deviceScaleFactor: 2,
              mobile: false
            });
            setTimeout(() => {
              send('Page.captureScreenshot', { format: 'png' });
            }, 1000);
          } else {
            fs.writeFileSync('/Users/metagurpreet/.gemini/antigravity-ide/brain/aa9b5f05-9f2c-4418-a036-459820d43f18/scratch/optimized_desktop_invoice.png', Buffer.from(msg.result.data, 'base64'));
            console.log('Saved optimized_desktop_invoice.png');
            ws.close();
            chromeProcess.kill();
            process.exit(0);
          }
        }
      };
    });
  });
}

testScreenshots();
