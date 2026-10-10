const { spawn } = require('child_process');
const http = require('http');

async function checkScroll() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--disable-gpu',
    '--window-size=1400,900',
    '--remote-debugging-port=9233',
    '--user-data-dir=/tmp/chrome-scroll-test-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9233/json/list', (res) => {
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
        send('Page.navigate', { url: 'http://localhost:3000/invoice/d0kf7y4K?pwd=8268' });
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Page.loadEventFired') {
          setTimeout(async () => {
            send('Runtime.evaluate', {
              expression: `(() => {
                const doc = document.documentElement;
                const body = document.body;
                const wrap = document.querySelector('.invoice-page-wrap');
                const grid = document.querySelector('.invoice-grid');
                const left = document.querySelector('.invoice-left');
                const right = document.querySelector('.invoice-right');
                
                window.scrollTo(0, 300);
                const scrolledTo = window.scrollY;

                return {
                  docScrollHeight: doc.scrollHeight,
                  bodyScrollHeight: body.scrollHeight,
                  windowInnerHeight: window.innerHeight,
                  windowScrollY: scrolledTo,
                  wrapComputedOverflowX: wrap ? getComputedStyle(wrap).overflowX : null,
                  wrapComputedOverflowY: wrap ? getComputedStyle(wrap).overflowY : null,
                  bodyComputedOverflowX: getComputedStyle(body).overflowX,
                  bodyComputedOverflowY: getComputedStyle(body).overflowY,
                  docComputedOverflowX: getComputedStyle(doc).overflowX,
                  docComputedOverflowY: getComputedStyle(doc).overflowY,
                  leftPosition: left ? getComputedStyle(left).position : null,
                  leftHeight: left ? left.offsetHeight : null,
                  rightHeight: right ? right.offsetHeight : null,
                  gridHeight: grid ? grid.offsetHeight : null
                };
              })()`,
              returnByValue: true
            });
          }, 2000);
        } else if (msg.result && msg.result.result && msg.result.result.value) {
          console.log('Scroll inspection:', JSON.stringify(msg.result.result.value, null, 2));
          ws.close();
          chromeProcess.kill();
          process.exit(0);
        }
      };
    });
  });
}

checkScroll();
