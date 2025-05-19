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

const fillShippingData = async (page) => {
  await page.waitForSelector("#email", { visible: true });

  await page.type("#email", "zetbaur@gmail.com");
  await page.type("#TextField0", "John");
  await page.type("#TextField1", "Zheten");

  await page.evaluate(() => {
    const input = document.querySelector("#shipping-address1");

    if (input) {
      input.value = "1234 Elm Street";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  await page.type("#TextField4", "Los Angeles");
  await page.select("#Select1", "CA");
  await page.type("#TextField5", "90001");

  await page.evaluate(() => {
    const input = document.querySelector("input#TextField6");

    if (input) {
      input.value = "+77017129288";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  await clickWithEvaluate(page, 'button[type="submit"]');

  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type="submit"]');
    return btn && !btn.disabled;
  });

  await clickWithEvaluate(page, 'button[type="submit"]');
};

const submitPayment = async (page) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let iframeCardNumber = await page.waitForSelector(
    "iframe[title='Field container for: Card number']"
  );
  let innerPage = await iframeCardNumber.contentFrame();
  await innerPage.type("input[id='number']", "4308963903784205");

  //===========

  let iframeCardExpiry = await page.waitForSelector(
    "iframe[title='Field container for: Expiration date (MM / YY)']"
  );

  innerPage = await iframeCardExpiry.contentFrame();

  if (innerPage) {
    await innerPage.evaluate(() => {
      const input = document.querySelector("input[id='expiry']");

      if (input) {
        input.value = "01/28";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  } else {
    console.error("no contentFrame");
  }

  //===========

  let iframeVerification = await page.waitForSelector(
    "iframe[title='Field container for: Security code']"
  );
  innerPage = await iframeVerification.contentFrame();
  await innerPage.type("input[id='verification_value']", "799");

  await page.click("button[type='submit']");
};

const run = async () => {
  const page = await getPage();
  await addToCart(page);
  await checkout(page);
  await fillShippingData(page);
  await submitPayment(page);
};

run();
