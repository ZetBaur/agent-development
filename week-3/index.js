const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const productUrl =
  "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz?variant=53972924825960";

const getPage = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  return page;
};

const parseCookies = async (page) => {
  const cookies = await page.cookies();

  let cookieList = "";

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    let cookieString = cookie.name + "=" + cookie.value;

    if (i != cookies.length - 1) {
      cookieString = cookieString + "; ";
    }
    cookieList = cookieList + cookieString;
  }

  return cookieList;
};

const addToCart = async (page) => {
  await page.waitForSelector("button[name='add']");

  const cookies = await page.cookies();

  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const requestBody =
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="form_type"\r\n\r\n' +
    "product\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="utf8"\r\n\r\n' +
    "✓\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="id"\r\n\r\n' +
    "53972924825960\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="properties[Shipping]"\r\n\r\n' +
    "\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="product-id"\r\n\r\n' +
    "14973183197544\r\n" +
    "------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\n" +
    'Content-Disposition: form-data; name="section-id"\r\n\r\n' +
    "template--24563549667688__4b86bc5c-f0d6-46d6-8684-1235f066332e\r\n" +
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
  // Получаем cookie с текущей страницы
  const cookies = await page.cookies();
  const cookieHeader = cookies
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const cartUrl = "https://www.stanley1913.com/cart.js";
  const refererUrl =
    "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz?variant=53972924825960";

  // Выполняем fetch-запрос на стороне Node.js, а не браузера
  const response = await fetch(cartUrl, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      cookie: cookieHeader,
      referer: refererUrl,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    method: "GET",
  });

  const cartData = await response.json();

  console.log("Cart data:", cartData);
  console.log("Token:", cartData?.token); // Убедись, что `token` действительно есть в ответе

  // Переходим на страницу оформления доставки
  const shippingUrl =
    "https://www.stanley1913.com/checkouts/cn/Z2NwLWFzaWEtc291dGhlYXN0MTowMUpWVlJLNkpFTUdTVlhLVFZDQVlGN1EyVA/information";
  await page.goto(shippingUrl, { waitUntil: "networkidle2" });
};

const run = async () => {
  const page = await getPage();
  await page.goto(productUrl, { waitUntil: "networkidle2" });
  await addToCart(page);
  await getShippingToken(page);
};

run();
