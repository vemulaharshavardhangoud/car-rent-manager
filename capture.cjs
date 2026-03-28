const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Capture ALL logs
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}:`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.error(`[BROWSER ERROR]`, error.message);
    });
    
    page.on('requestfailed', request => {
      console.log(`[NETWORK ERROR] ${request.url()} - ${request.failure().errorText}`);
    });

    console.log("Navigating to https://car-rent-manager.vercel.app/");
    await page.goto('https://car-rent-manager.vercel.app/', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for a second for React to render
    await new Promise(r => setTimeout(r, 2000));
    
    const content = await page.content();
    if (content.includes('Customer Hub')) {
      console.log("SUCCESS: String 'Customer Hub' found in HTML.");
    } else {
      console.log("HTML Rendered Length:", content.length);
    }
    
    // Also test the bad subpath they were using
    console.log("Navigating to https://car-rent-manager.vercel.app/car-rent-manager/#/login");
    await page.goto('https://car-rent-manager.vercel.app/car-rent-manager/#/login', { waitUntil: 'networkidle0', timeout: 30000 });
    
    await browser.close();
  } catch (error) {
    console.error("Puppeteer Script Error:", error);
  }
})();
