const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const productUrl =
  "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz?variant=53972924825960";

const getPage = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const [page] = await browser.pages();
  return page;
};

async function clickWithEvaluate(page, selector) {
  try {
    await page.waitForSelector(selector, { visible: true });

    const result = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.click();
      return "clicked";
    }, selector);

    console.log("Clicked via evaluate:", result);
  } catch (err) {
    console.error(`Failed to click ${selector}:`, err);
  }
}

const addToCart = async (page) => {
  await page.goto(productUrl, { waitUntil: "networkidle2" });
  await clickWithEvaluate(page, "#ProductSubmitButton-");
};

const checkout = async (page) => {
  console.log("checkout");
  await clickWithEvaluate(page, ".cart__checkout");
};

const run = async () => {
  const page = await getPage();

  await addToCart(page);

  await checkout(page);
};

run();
