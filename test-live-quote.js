const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  console.log('Navigating to live quote page...');
  await page.goto('https://www.drippmedia.com/admin-panel/quote', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Quote title:', await page.title());

  await browser.close();
})();
