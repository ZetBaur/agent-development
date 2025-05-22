const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const productUrl =
  "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz?variant=53972924825960";

const getPage = async () => {
  const browser = await puppeteer.launch({ headless: false, timeout: 0 }); // <- важно
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000); // <- глобальный таймаут
  return page;
};

// const parseCookies = async (page) => {
//   const cookies = await page.cookies();

//   let cookieList = "";

//   for (let i = 0; i < cookies.length; i++) {
//     let cookie = cookies[i];
//     let cookieString = cookie.name + "=" + cookie.value;

//     if (i != cookies.length - 1) {
//       cookieString = cookieString + "; ";
//     }
//     cookieList = cookieList + cookieString;
//   }

//   return cookieList;
// };

const parseCookies = async (page) => {
  const cookies = await page.cookies();

  console.log("cookies", cookies);

  return cookies;
};

const addToCart = async (page) => {
  await page.waitForSelector("button[name='add']");

  const cookies = await parseCookies(page);
  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  // const productId =await page
  //   .evaluate(() => document.querySelector("input[name='product-id']"))
  //   .getAttribute("value");

  const getInputValue = async (page, name) => {
    return await page.evaluate((name) => {
      const input = document.querySelector(`input[name="${name}"]`);
      return input?.value || null;
    }, name);
  };

  const id = await getInputValue(page, "id");
  const sectionId = await getInputValue(page, "section-id");
  const productId = await getInputValue(page, "product-id");

  const requestBody =
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="form_type"\r\n\r\n' +
    "product\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="utf8"\r\n\r\n' +
    "✓\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="id"\r\n\r\n' +
    `${id}\r\n` +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="properties[Shipping]"\r\n\r\n' +
    "\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="product-id"\r\n\r\n' +
    `${productId}\r\n` +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="section-id"\r\n\r\n' +
    `${sectionId}\r\n` +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="quantity"\r\n\r\n' +
    "1\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="sections"\r\n\r\n' +
    "cart-notification-product,cart-notification-button,cart-icon-bubble\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="sections_url"\r\n\r\n' +
    "/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn--\r\n";

  const result = await page.evaluate(
    async ({ cookieStr, requestBody }) => {
      try {
        const response = await fetch("/cart/add", {
          method: "POST",
          headers: {
            accept: "application/javascript",
            "content-type":
              "multipart/form-data; boundary=----WebKitFormBoundaryWJpbFg00ijsrLGxn",
            "x-requested-with": "XMLHttpRequest",
            cookie: cookieStr,
          },
          body: requestBody,
        });

        const text = await response.text();
        return text;
      } catch (err) {
        return { error: err.message };
      }
    },
    { cookieStr, requestBody }
  );

  // console.log("Response:", result);

  // await browser.close();
};

const getShippingToken = async (page) => {
  const cookies = await parseCookies(page);

  const cookieStr = cookies
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const cartUrl = "https://www.stanley1913.com/cart.js";

  const productReferer =
    "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz";

  const { cartData, error } = await page.evaluate(
    async ({ cookieStr, referer, cartUrl }) => {
      try {
        const response = await fetch(cartUrl, {
          method: "GET",
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            cookie: cookieStr,
            referer: referer,
          },
        });

        const cartData = await response.json();
        return { cartData };
      } catch (err) {
        return { error: err.message };
      }
    },
    { cookieStr, referer: productReferer, cartUrl }
  );

  if (error) {
    console.error("Ошибка при получении cart.js:", error);
    return;
  }

  const token = cartData?.token?.split("?")[0];

  if (!token) {
    console.error("Токен не найден в cartData");
    return;
  }

  const shippingUrl = `https://www.stanley1913.com/checkouts/cn/${token}/information`;
  await page.goto(shippingUrl, { waitUntil: "networkidle2" });
};
// const getShippingToken = async (page) => {
//   const cookies = await page.cookies();
//   const cookieHeader = cookies
//     .map(({ name, value }) => `${name}=${value}`)
//     .join("; ");

//   const cartUrl = "https://www.stanley1913.com/cart.js";

//   const response = await fetch(cartUrl, {
//     headers: {
//       accept: "*/*",
//       "accept-language": "en-US,en;q=0.9",
//       "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": '"macOS"',
//       "sec-fetch-dest": "empty",
//       "sec-fetch-mode": "cors",
//       "sec-fetch-site": "same-origin",
//       cookie: cookieHeader,
//       referer: productUrl,
//       "Referrer-Policy": "strict-origin-when-cross-origin",
//     },
//     method: "GET",
//   });

//   const cartData = await response.json();

//   // console.log("Cart data:", cartData);
//   // console.log("Token:", cartData?.token);

//   const token = cartData?.token.split("?")[0];

//   const shippingUrl = `https://www.stanley1913.com/checkouts/cn/${token}/information`;

//   await page.goto(shippingUrl, { waitUntil: "networkidle2" });
// };

const run = async () => {
  const page = await getPage();
  // await page.goto(productUrl, { waitUntil: "networkidle2" });

  await page.goto(productUrl, {
    waitUntil: "domcontentloaded", // менее требовательный вариант
    timeout: 60000, // 60 секунд
  });
  await addToCart(page);
  await getShippingToken(page);
};

run();
