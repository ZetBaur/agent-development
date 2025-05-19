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
      if (!el) return "Element not found";
      if (el.disabled) return "Element is disabled";
      el.scrollIntoView();
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
  await page.evaluate(() =>
    document.querySelector("#ProductSubmitButton-").click()
  );
};

const checkout = async (page) => {
  console.log("checkout");

  await page.waitForSelector(".cart__checkout");

  await page.evaluate(() =>
    document
      .querySelector(".c-btn .c-btn--dark .u-full .cart__checkout")
      .click()
  );
};

const fillBilling = async (page) => {
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

  await page.waitForSelector('button[type="submit"]', { visible: true });
  await clickWithEvaluate(page, 'button[type="submit"]');

  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type="submit"]');
    return btn && !btn.disabled;
  });

  await clickWithEvaluate(page, 'button[type="submit"]');
};

async function waitForInputInFrame(page, selector, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const frame of page.frames()) {
      try {
        const input = await frame.$(selector);
        if (input) return frame;
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout waiting for ${selector} in any frame`);
}

const submitOrder = async (page) => {
  try {
    const cardNumberFrame = await waitForInputInFrame(
      page,
      'input[name="number"]'
    );

    await cardNumberFrame.type('input[name="number"]', "4308963903784205");

    //=====
    const cardExpiryFrame = await waitForInputInFrame(
      page,
      'input[name="expiry"]'
    );

    const expiryInput = await cardExpiryFrame.$('input[name="expiry"]');

    await expiryInput.focus();
    await expiryInput.type("012028", { delay: 100 }); // вводим сразу все 4 цифры

    //=====

    const cardVerificationFrame = await waitForInputInFrame(
      page,
      'input[name="verification_value"]'
    );

    const verificationInput = await cardVerificationFrame.$(
      'input[name="verification_value"]'
    );

    await verificationInput.focus();
    // await verificationInput.type("799", { delay: 100 });
  } catch (err) {
    console.error(" Не удалось найти iframe с полем ввода карты", err);
  }
};

const run = async () => {
  const page = await getPage();

  await addToCart(page);

  await checkout(page);
  //   await fillBilling(page);
  //   await submitOrder(page);
};

run();
