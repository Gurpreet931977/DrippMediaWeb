const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 13']
  });
  const page = await context.newPage();
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  console.log('Navigating to live admin-panel on MOBILE...');
  await page.goto('https://www.drippmedia.com/admin-panel', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('Admin-panel body on mobile:', await page.evaluate(() => document.body.innerText));
  
  await browser.close();
})();
