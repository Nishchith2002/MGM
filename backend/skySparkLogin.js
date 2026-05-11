
const puppeteer = require("puppeteer");
require("dotenv").config();

async function loginToSkySpark(username, password) {
  const SKY_HOST=process.env.SKY_HOST


  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1200,800'
    ]
  });

  const page = await browser.newPage();

  await page.goto(`${SKY_HOST}/user/login`, {
    timeout: 120000,
    waitUntil: "domcontentloaded"
  });

  await page.waitForSelector('input[name="username"]', { visible: true });
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);

  await Promise.all([
    page.click('input[type="submit"], button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120000 })
  ]);

  const cookies = await page.cookies();
  const cookie = cookies.find(c => c.name.includes("skyarc-auth"));

  await browser.close();

  if (!cookie) throw new Error("SkySpark login failed: Cookie missing");
  return cookie;
}

module.exports = { loginToSkySpark };
