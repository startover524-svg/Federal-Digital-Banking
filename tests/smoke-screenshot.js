const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  const url = process.env.TARGET_URL || 'http://localhost:5173/';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url + '#apply', { waitUntil: 'networkidle2' });

  // Fill signup form
  await page.type('#signup-first-name', 'Test');
  await page.type('#signup-last-name', 'User');
  await page.type('#signup-account-number', '123456789');
  await page.type('#signup-pin', '1234');
  await page.type('#signup-ssn-last4', '0000');
  await page.type('#signup-username', 'testuser');
  await page.type('#signup-password', 'password');

  await Promise.all([
    page.click('#signup-form button[type=submit]');
  // small pause to allow UI update (avoid page.waitForTimeout incompatibility in some runners)
  await new Promise((res) => setTimeout(res, 500));

  // wait for header register to be hidden
  await page.waitForFunction(() => {
    const el = document.getElementById('header-register');
    if (!el) return true;
    const style = window.getComputedStyle(el);
    return style.display === 'none';
  }, { timeout: 5000 });

  // take screenshot
  const outDir = './test-output';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const path = `${outDir}/signed-in.png`;
  await page.screenshot({ path, fullPage: true });
  console.log('screenshot saved to', path);

  await browser.close();
})();
