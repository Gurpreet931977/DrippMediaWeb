const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  console.log('Navigating to live admin-panel...');
  await page.goto('https://www.drippmedia.com/admin-panel', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('Admin-panel title:', await page.title());
  
  console.log('Navigating to live developer mode...');
  await page.goto('https://www.drippmedia.com/developermodeon', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('Developer mode title:', await page.title());

  await browser.close();
})();
