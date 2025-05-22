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
  page.waitForSelector("button[name='add']");

  let cookies = await page.cookies();

  await page.evaluate(async (cookies) => {
    const response = await fetch("https://www.stanley1913.com/cart/add", {
      headers: {
        accept: "application/javascript",
        "accept-language": "en-US,en;q=0.9",
        "content-type":
          "multipart/form-data; boundary=----WebKitFormBoundarybQJFYpxhn19D94qX",
        priority: "u=1, i",
        "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        cookie: cookies,
        Referer:
          "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz?variant=53972924825960",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: '------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="form_type"\r\n\r\nproduct\r\n------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="utf8"\r\n\r\n✓\r\n------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="id"\r\n\r\n53972924825960\r\n------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="properties[Shipping]"\r\n\r\n\r\n------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="product-id"\r\n\r\n14973183197544\r\n------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="section-id"\r\n\r\ntemplate--24563549667688__4b86bc5c-f0d6-46d6-8684-1235f066332e\r\n------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="quantity"\r\n\r\n1\r\n------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="sections"\r\n\r\ncart-notification-product,cart-notification-button,cart-icon-bubble\r\n------WebKitFormBoundarybQJFYpxhn19D94qX\r\nContent-Disposition: form-data; name="sections_url"\r\n\r\n/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz\r\n------WebKitFormBoundarybQJFYpxhn19D94qX--\r\n',
      method: "POST",
    });

    const data = await response.json();

    console.log("addToCart Response:", data);

    // return response;
  }, cookies);
};

const getShippingToken = async (page) => {
  const cookies = await page.cookies();

  const response = await page.evaluate(async (cookies) => {
    async function getResponse() {
      let resp = await fetch("https://www.stanley1913.com/cart.js", {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          priority: "u=1, i",
          "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          cookie: cookies,
          Referer:
            "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz?variant=53972924825960",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      });

      const res = await resp.json();

      console.log("resdata", res.data);

      return res;
    }

    return await getResponse();
  }, cookies);

  console.log("Token", response.token);

  let shippingUrl =
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
