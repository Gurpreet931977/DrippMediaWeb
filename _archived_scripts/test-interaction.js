const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  console.log('Navigated to home');
  
  // Click Developer Mode
  const devBtn = await page.$('text="Developer Mode"');
  if (devBtn) {
    console.log('Found Developer Mode text, clicking parent button');
    await devBtn.evaluate(node => node.parentElement.querySelector('button').click());
  } else {
    console.log('Developer mode button not found');
  }
  
  await page.waitForTimeout(2000);
  console.log('Current URL:', page.url());
  
  await browser.close();
})();
