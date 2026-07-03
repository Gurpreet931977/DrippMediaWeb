const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('Navigating to live developer mode...');
  await page.goto('https://www.drippmedia.com/developermodeon', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Dev mode title:', await page.title());

  await browser.close();
})();
