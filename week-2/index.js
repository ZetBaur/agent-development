const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const ac = require("@antiadmin/anticaptchaofficial");

const URL = "https://google.com/recaptcha/api2/demo";
const API_KEY = "800106fc72c54f9bfb69313e87dc78d2";
const WEBSITE_KEY = "6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-";

const getPage = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const [page] = await browser.pages();
  return page;
};

const getToken = async () => {
  const token = await ac.solveRecaptchaV2Proxyless(URL, WEBSITE_KEY);

  console.log(token);

  return token;
};

const solveRecaptchaAndSubmit = async (page) => {
  const token = await getToken();

  await page.evaluate((token) => {
    document.querySelector("textarea[id='g-recaptcha-response']").innerHTML =
      token;
  }, token);

  await page.click("input[type='submit']");
};

const run = async () => {
  const page = await getPage();
  await page.goto(URL);
  solveRecaptchaAndSubmit(page);
};

run();
