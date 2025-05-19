const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ac = require("@antiadmin/anticaptchaofficial");

puppeteer.use(StealthPlugin());

const URL = "https://google.com/recaptcha/api2/demo";
// const API_KEY = "800106fc72c54f9bfb69313e87dc78d2";
const API_KEY = "a725f7ff819271ff5cfa6bf229dbad75";
const WEBSITE_KEY = "6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-";

ac.setAPIKey(API_KEY);

const getPage = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const [page] = await browser.pages();
  return page;
};

const getToken = async () => {
  try {
    const token = await ac.solveRecaptchaV2Proxyless(URL, WEBSITE_KEY);
    console.log("reCAPTCHA Token:", token);
    return token;
  } catch (err) {
    console.error("error getting token:", err);
    throw err;
  }
};

const solveRecaptchaAndSubmit = async (page) => {
  const token = await getToken();

  await page.waitForSelector("textarea#g-recaptcha-response");

  await page.evaluate((token) => {
    document.querySelector("textarea#g-recaptcha-response").value = token;
  }, token);

  await page.waitForSelector("input[type='submit']");
  await page.click("input[type='submit']");
};

const run = async () => {
  try {
    const page = await getPage();
    await page.goto(URL, { waitUntil: "networkidle2" });
    await solveRecaptchaAndSubmit(page);
  } catch (err) {
    console.error("error in run():", err);
  }
};

run();
