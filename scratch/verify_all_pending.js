const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function runVerification() {
  console.log('--- STARTING CDP VERIFICATION OF ALL PENDING INVOICE & PRINT SYSTEM FEATURES ---');
  const port = 9240;
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--window-size=1400,1000',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/chrome-verify-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      const list = JSON.parse(raw);
      const target = list[0];
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      let id = 1;
      const callbacks = new Map();

      function send(method, params = {}) {
        return new Promise((resolve) => {
          const msgId = id++;
          callbacks.set(msgId, resolve);
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
          const cb = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          cb(msg.result);
        }
      };

      ws.onopen = async () => {
        console.log('Connected to Chrome CDP WebSocket');
        await send('Runtime.enable');
        await send('Page.enable');
        await send('DOM.enable');
        await send('Emulation.setDeviceMetricsOverride', {
          width: 1400,
          height: 1000,
          deviceScaleFactor: 2,
          mobile: false
        });

        console.log('Navigating to http://localhost:3000/invoice/d0kf7y4K?pwd=8268');
        await send('Page.navigate', { url: 'http://localhost:3000/invoice/d0kf7y4K?pwd=8268' });
        await new Promise(r => setTimeout(r, 3500));

        // 1. Evaluate Paisa & Typography
        const evalPaisa = await send('Runtime.evaluate', {
          expression: `(() => {
            const totalDueCard = document.querySelector('.card-total-due');
            const totalPaisa = document.querySelector('.card-total-due .paisa-decimal');
            const itemPaisa = document.querySelector('.paisa-decimal');
            const wholeRupees = document.querySelector('.card-total-due .rupee-whole');
            return {
              totalCardFound: !!totalDueCard,
              totalCardText: totalDueCard ? totalDueCard.innerText.replace(/\\n/g, ' ') : null,
              totalPaisaColor: totalPaisa ? window.getComputedStyle(totalPaisa).color : null,
              totalPaisaFont: totalPaisa ? window.getComputedStyle(totalPaisa).fontFamily : null,
              totalPaisaSize: totalPaisa ? window.getComputedStyle(totalPaisa).fontSize : null,
              wholeRupeesColor: wholeRupees ? window.getComputedStyle(wholeRupees).color : null,
              itemPaisaColor: itemPaisa ? window.getComputedStyle(itemPaisa).color : null,
              itemPaisaFont: itemPaisa ? window.getComputedStyle(itemPaisa).fontFamily : null,
            };
          })()`,
          returnByValue: true
        });
        console.log('1. Paisa Evaluation:', JSON.stringify(evalPaisa.result?.value, null, 2));

        // 2. Evaluate Scroll Telemetry
        const evalScroll = await send('Runtime.evaluate', {
          expression: `(async () => {
            const startY = window.scrollY;
            window.scrollBy(0, 450);
            await new Promise(r => setTimeout(r, 300));
            const afterY = window.scrollY;
            return {
              startY,
              afterY,
              canScroll: afterY > startY,
              docHeight: document.documentElement.scrollHeight,
              winHeight: window.innerHeight,
              overflowHtml: window.getComputedStyle(document.documentElement).overflowX,
              overflowBody: window.getComputedStyle(document.body).overflowX
            };
          })()`,
          awaitPromise: true,
          returnByValue: true
        });
        console.log('2. Scroll Telemetry:', JSON.stringify(evalScroll.result?.value, null, 2));

        // 3. Evaluate QR Code & Bank Card
        const evalQR = await send('Runtime.evaluate', {
          expression: `(() => {
            const qrImg = document.getElementById('invoice-qr-img');
            const bankCard = document.querySelector('.card-payment-details');
            return {
              qrExists: !!qrImg,
              qrComplete: qrImg ? qrImg.complete : false,
              qrNaturalWidth: qrImg ? qrImg.naturalWidth : 0,
              qrSrcStart: qrImg ? qrImg.src.substring(0, 30) : null,
              hasBankCard: !!bankCard,
              bankText: bankCard ? bankCard.innerText.replace(/\\n/g, ' ') : null
            };
          })()`,
          returnByValue: true
        });
        console.log('3. QR Code & Bank Card:', JSON.stringify(evalQR.result?.value, null, 2));

        // 4. Capture Screen Media Screenshot
        const screenShot = await send('Page.captureScreenshot', { format: 'png' });
        const screenshotDir = '/Users/metagurpreet/.gemini/antigravity-ide/brain/aa9b5f05-9f2c-4418-a036-459820d43f18/scratch';
        fs.writeFileSync(path.join(screenshotDir, 'verified_screen_invoice.png'), Buffer.from(screenShot.data, 'base64'));
        console.log('Saved verified_screen_invoice.png');

        // 5. Emulate Print Media & Test Print Styles
        console.log('Emulating print media via Emulation.setEmulatedMedia...');
        await send('Emulation.setEmulatedMedia', { media: 'print' });
        await new Promise(r => setTimeout(r, 600));

        const evalPrint = await send('Runtime.evaluate', {
          expression: `(() => {
            const body = document.body;
            const invoiceCard = document.querySelector('.card-total-due');
            const actionBar = document.querySelector('.action-bar-container');
            const cursor = document.getElementById('invoice-custom-cursor');
            return {
              bodyBg: window.getComputedStyle(body).backgroundColor,
              bodyColor: window.getComputedStyle(body).color,
              cardTotalBg: invoiceCard ? window.getComputedStyle(invoiceCard).backgroundColor : null,
              actionBarDisplay: actionBar ? window.getComputedStyle(actionBar).display : null,
              cursorDisplay: cursor ? window.getComputedStyle(cursor).display : null,
            };
          })()`,
          returnByValue: true
        });
        console.log('5. Print Media Styles:', JSON.stringify(evalPrint.result?.value, null, 2));

        const printShot = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(screenshotDir, 'verified_print_invoice.png'), Buffer.from(printShot.data, 'base64'));
        console.log('Saved verified_print_invoice.png');

        // 6. Navigate to /dripp-studio/invoice
        console.log('Navigating to http://localhost:3000/dripp-studio/invoice...');
        await send('Emulation.setEmulatedMedia', { media: 'screen' });
        await send('Page.navigate', { url: 'http://localhost:3000/dripp-studio/invoice' });
        await new Promise(r => setTimeout(r, 3000));

        const evalStudio = await send('Runtime.evaluate', {
          expression: `(() => {
            const selects = Array.from(document.querySelectorAll('select'));
            const dueSelect = selects.find(s => s.options && Array.from(s.options).some(o => o.text.includes('Receipt') || o.text.includes('Net 7')));
            const options = dueSelect ? Array.from(dueSelect.options).map(o => ({ value: o.value, text: o.text })) : [];
            return {
              hasDueSelect: !!dueSelect,
              selectedVal: dueSelect ? dueSelect.value : null,
              options: options
            };
          })()`,
          returnByValue: true
        });
        console.log('6. Studio Invoice Due Date Select:', JSON.stringify(evalStudio.result?.value, null, 2));

        const studioShot = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(screenshotDir, 'verified_studio_maker.png'), Buffer.from(studioShot.data, 'base64'));
        console.log('Saved verified_studio_maker.png');

        ws.close();
        chromeProcess.kill();
        console.log('--- ALL CDP VERIFICATIONS FINISHED SUCCESSFULLY ---');
        process.exit(0);
      };
    });
  });
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
