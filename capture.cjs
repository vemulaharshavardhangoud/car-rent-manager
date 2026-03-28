const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Capture console logs from browser
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}:`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.error(`[BROWSER ERROR]`, error.message);
    });

    await page.goto('https://car-rent-manager.vercel.app', { waitUntil: 'networkidle2' });
    
    // Wait for root rendering
    const content = await page.content();
    if (content.includes('Customer Hub') || content.includes('Owner Portal')) {
      console.log("SUCCESS: React App loaded properly.");
    } else {
      console.log("HTML Rendered Length:", content.length);
      console.log(content.substring(0, 500));
    }
    
    await browser.close();
  } catch (error) {
    console.error("Puppeteer Script Error:", error);
  }
})();
