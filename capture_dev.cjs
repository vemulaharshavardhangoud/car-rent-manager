const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log(`[DEV CONSOLE] ${msg.type().toUpperCase()}:`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.error(`[DEV ERROR]`, error.message, error.stack);
    });

    console.log("Navigating to http://localhost:5173/");
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
    
    await browser.close();
  } catch (error) {
    console.error("Puppeteer Script Error:", error);
  }
})();
