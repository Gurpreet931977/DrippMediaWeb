const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.status() === 404) {
      console.log('404:', response.url());
    }
  });

  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('Navigating to admin-panel...');
  await page.goto('http://localhost:3000/admin-panel', { waitUntil: 'networkidle' });
  
  console.log('Admin-panel title:', await page.title());
  
  await browser.close();
})();
