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
  await page.waitForSelector("button[name='add']");

  const cookiesArray = await page.cookies();

  console.log("cookiesArray", cookiesArray);

  const cookieStr = cookiesArray.map((c) => `${c.name}=${c.value}`).join("; ");

  console.log("cookieStr", cookieStr);

  await page.evaluate(async (cookieStr) => {
    try {
      const response = await fetch("https://www.stanley1913.com/cart/add", {
        headers: {
          accept: "application/javascript",
          "accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7",
          "content-type":
            "multipart/form-data; boundary=----WebKitFormBoundaryWJpbFg00ijsrLGxn",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookieStr,
          Referer:
            "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz?variant=53972924825960",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body:
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
          "------WebKitFormBoundaryWJpbFg00ijsrLGxn--\r\n",
        method: "POST",
      });

      const data = await response.json();
      console.log("addToCart Response:", data);
    } catch (err) {
      console.error("addToCart fetch error:", err);
    }
  }, cookieStr);
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

  const shippingUrl =
    "https://www.stanley1913.com/checkouts/cn/Z2NwLWFzaWEtc291dGhlYXN0MTowMUpWVlJLNkpFTUdTVlhLVFZDQVlGN1EyVA/information";

  await page.goto(shippingUrl, { waitUntil: "networkidle2" });
};

const run = async () => {
  const page = await getPage();
  await page.goto(productUrl, { waitUntil: "networkidle2" });
  await addToCart(page);
  // await getShippingToken(page);
};

run();

fetch("https://www.stanley1913.com/cart/add", {
  headers: {
    accept: "application/javascript",
    "accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7",
    "content-type":
      "multipart/form-data; boundary=----WebKitFormBoundaryWJpbFg00ijsrLGxn",
    priority: "u=1, i",
    "sec-ch-ua":
      '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
    cookie:
      "cart_currency=USD; secure_customer_sig=; BVBRANDID=814abf96-5c6a-445d-a836-7c31456e9574; localization=US; OptanonAlertBoxClosed=2025-05-18T08:43:54.818Z; _shopify_y=95D49DC0-5f0b-46E0-86e1-8aee1e52fb50; _orig_referrer=; _landing_page=%2Fproducts%2F; _gcl_au=1.1.1751661692.1747557836; _ga=GA1.1.511956974.1747557836; _pin_unauth=dWlkPU5tRXpPR0ppTTJNdFl6ZzRaaTAwWlRsaUxXSXlOell0TVRFM01XTmtZVFJrT0RFeQ; _fbp=fb.1.1747557836065.378285061509738876; _ttp=01JVH90S8TH81ABQT3T391WCAW_.tt.0; _cs_c=0; sa-user-id=s%253A0-ac021008-a8df-5852-42ee-12570e927775.pnon9KPu75m%252BGJnshmrWq4cuP2FjaC%252BBYL89SAQM2zc; sa-user-id-v2=s%253ArAIQCKjfWFJC7hJXDpJ3dQKEIrc.PaKQlyMESc1Oav8DdLDFSGdYyKs0tcPHynkPmlvOUZ8; sa-user-id-v3=s%253AAQAKICF84dVg36ddiGZX2OKpfim1P5LeIbR4ig09-jyt3lNXEAMYAyCRiaPBBjABOgQv-638QgQRQOZS.zd%252FtyNVotwzVludkGwUpyXPlpYZCwwJe4AEBIEDSzvg; __BillyPix_uid=v0.4.6-srhxodmh-matetcmv; __BillyPix_sid=ID-36-2AD6EC; addshoppers.com=2%7C1%3A0%7C10%3A1747557837%7C15%3Aaddshoppers.com%7C44%3AODNmZDI4Nzc0NzI0NGQ4ODlhMTk3ZjNjYTMzNjFjNTA%3D%7C4b06f5125566a074e61275a3bdcbbd48af0cde90a18c6bd559836c91c219ffe7; _hjSessionUser_1962792=eyJpZCI6IjQxMWE5Y2RhLWNlNGYtNTc4Ni04Y2UwLTc4ZmNkMGUwYTQwZCIsImNyZWF0ZWQiOjE3NDc1NTc4MzY4MTYsImV4aXN0aW5nIjp0cnVlfQ==; _cs_cvars=%7B%221%22%3A%5B%22item_brand%22%2C%22Quenchers%22%5D%2C%222%22%3A%5B%22item_category%22%2C%22Tumblers%22%5D%2C%223%22%3A%5B%22item_variant%22%2C%22Twilight%22%5D%2C%224%22%3A%5B%22pageType%22%2C%22product%22%5D%7D; _ga_HL54PQL9WM=GS2.1.s1747596314$o3$g1$t1747596331$j0$l0$h0; cart=Z2NwLWFzaWEtc291dGhlYXN0MTowMUpWU1BQVjNZSjBNUVhBNFE0TjlHMkg2MQ%3Fkey%3D8c153caf235343cb8a0e2f5459d9140e; skip_shop_pay=false; hide_shopify_pay_for_checkout=false; cart_sig=2fc3abe31167e7c5ef49ad251e9d967d; checkout_session_token__cn__Z2NwLWFzaWEtc291dGhlYXN0MTowMUpWU1BQVjNZSjBNUVhBNFE0TjlHMkg2MQ=%7B%22token%22%3A%22AAEBopEDu9vEWDgRsR49o01bB185PSJaxxRsmmkIp_I-T6odD90Xs4hF85BOKtnC4kptbO3WYpK3qLhGfuQPCs9EpXmGBGCQQCg3rDoyQKynOC0thFFqovRZSXyjRfSAo5B7qiJdyRpO3oUZml0iNC1RmtuJgRwZ5BRrjxo1euIXw7cOVyNtpSVuP8C72SYypPYDs5WcZpe8Y8R98dnJ0QWfyMvU_sb4MJQB_YI5aRmofVVXAc0Ajs_RyrAUNCH4y1dQZMY2wUnj-tE%22%2C%22locale%22%3A%22en-US%22%2C%22checkout_session_identifier%22%3A%229ce0519887cdf84ec169fdf7a644414d%22%7D; checkout_session_lookup=%7B%22version%22%3A1%2C%22keys%22%3A%5B%7B%22source_id%22%3A%22Z2NwLWFzaWEtc291dGhlYXN0MTowMUpWU1BQVjNZSjBNUVhBNFE0TjlHMkg2MQ%22%2C%22checkout_session_identifier%22%3A%229ce0519887cdf84ec169fdf7a644414d%22%2C%22source_type_abbrev%22%3A%22cn%22%2C%22updated_at%22%3A%222025-05-21T15%3A23%3A03.599Z%22%7D%5D%7D; _shopify_essential=:AZbza4gRAAEAw-tBT0P1rXZRBXd-jQEvmdfdORfKAO9tAqCiigCOr2zW7IZCnylYSPf-3tW0ldePq4yC_KozO0amzsaF-vNSUCok1xsoMZ1MhlRlaz8ea2pbe5VQ-Wf7CT9IwhO2qp_RLECzLYPgsfB4fa3dInb5PqMfnvCxsy2yNklu69xSVzF2ABCFbf9tRUMZj7nyE5GxnNHUHypzGDHiU77avGYwBkq67S47A373lcE7YW7lJlfI9iLGoOR1mFO3tZ-scjj61c0BVVWgu6nN5fqwaHBVtq-MB2zoPb9aY5SGvxW_5LmzBFDEly5DGr0jUd-7GiPdS0xkqgUbkT0Z_s0fz2IQKT9eTgjVUPYLSblLMVoOeZHlVqW_1DfCiQgNCP82V13vEXWupkhjk0vjf7m1:; _shopify_s=1486CDDA-b09b-42A4-902c-440b8c163574; _shopify_sa_t=2025-05-22T13%3A39%3A04.808Z; _shopify_sa_p=; OptanonConsent=isGpcEnabled=0&datestamp=Thu+May+22+2025+20%3A39%3A05+GMT%2B0700+(%D0%98%D0%BD%D0%B4%D0%BE%D0%BA%D0%B8%D1%82%D0%B0%D0%B9)&version=202502.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=a96d5a3a-257a-4728-b797-21e441f12aba&interactionCount=2&isAnonUser=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1&AwaitingReconsent=false&intType=1&geolocation=KZ%3B75; BVBRANDSID=b466c8ac-e68e-4099-92d3-2a3716536a7f; shopify_pay_redirect=pending; ttcsid_C5504DL6KGKN7QK7RDH0=1747921145453::noj_xBZxA5pUB4khZ88G.4.1747921145453; ttcsid=1747921145454::GTwfkKXzS0EcwbuKPrbm.4.1747921145454; __BillyPix_session_id=v0.4.6-u1zqusub-mazf4c0r_1747921146075; __kla_id=eyJjaWQiOiJPR0l3TmpsbE9EWXROalU0WVMwMFl6TmpMVGt4TTJVdE5qY3daVEZqWWpabE5UUXkiLCIkcmVmZXJyZXIiOnsidHMiOjE3NDc1NTc4MzUsInZhbHVlIjoiIiwiZmlyc3RfcGFnZSI6Imh0dHBzOi8vd3d3LnN0YW5sZXkxOTEzLmNvbS9wcm9kdWN0cy8ifSwiJGxhc3RfcmVmZXJyZXIiOnsidHMiOjE3NDc5MjExNDcsInZhbHVlIjoiIiwiZmlyc3RfcGFnZSI6Imh0dHBzOi8vd3d3LnN0YW5sZXkxOTEzLmNvbS9wcm9kdWN0cy9tb3RoZXJzLWRheS1xdWVuY2hlci1oMi0wLWZsb3dzdGF0ZS10dW1ibGVyLTQwLW96P3ZhcmlhbnQ9NTM5NzI5MjQ4MjU5NjAifX0=; _ga_0LZK6PTNTR=GS2.1.s1747921151$o5$g0$t1747921151$j60$l0$h0$dZYhOerFl_rXP1h1GmaCz5Vdv1ts6QkpZkA; _rdt_uuid=1747557836195.c2655699-5dd3-414a-80fc-4a528058f62f; tfpsi=d1f143af-0b0f-47d4-a43b-12fee9b29e0a; _uetsid=a1c4ec40365611f09f1f1f2b88908606|4b77xr|2|fw4|0|1967; _hjSession_1962792=eyJpZCI6IjFkOGFjNDM3LWUyNGQtNDlhNC04N2I0LTJkOGZkY2FhYWVlZSIsImMiOjE3NDc5MjExNTY3MzgsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MX0=; _uetvid=3c23ca0033c411f08940fd1a2518e3bb|1hp8qwa|1747921156921|1|1|bat.bing.com/p/insights/c/e; _cs_id=47c4c072-da7e-a03e-edcd-a7bc2c8c68ec.1747557836.4.1747921159.1747921159.1743520772.1781721836446.1.x; _tracking_consent=%7B%22con%22%3A%7B%22CMP%22%3A%7B%22a%22%3A%221%22%2C%22m%22%3A%221%22%2C%22p%22%3A%221%22%2C%22s%22%3A%221%22%7D%7D%2C%22v%22%3A%222.1%22%2C%22region%22%3A%22US%22%2C%22reg%22%3A%22%22%2C%22cus%22%3A%7B%22onetrust.groups%22%3A%22C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1%22%2C%22onetrust.datestamp%22%3A%222025-05-18T08%3A43%3A54.818Z%22%7D%2C%22purposes%22%3A%7B%22a%22%3Atrue%2C%22p%22%3Atrue%2C%22m%22%3Atrue%2C%22t%22%3Atrue%7D%2C%22display_banner%22%3Afalse%2C%22sale_of_data_region%22%3Afalse%2C%22consent_id%22%3A%22584C1C72-bb04-4390-b1c4-7db0cd9cff3d%22%7D; _cs_s=1.5.1.9.1747922960923; keep_alive=eyJ2IjoxLCJ0cyI6MTc0NzkyMTE3NTA3OCwiZW52Ijp7IndkIjowLCJ1YSI6MSwiY3YiOjEsImJyIjoxfSwiYmh2Ijp7Im1hIjoyNywiY2EiOjAsImthIjowLCJzYSI6MiwidCI6MzAsIm5tIjoxLCJ2YyI6MH0sInNlcyI6eyJwIjo0LCJzIjoxNzQ3NTk2MzEzMjQxLCJkIjozMjQ4NjB9fQ%3D%3D; _dd_s=rum=0&expire=1747922077676",
    Referer:
      "https://www.stanley1913.com/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz?variant=53972924825960",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },
  body: '------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="form_type"\r\n\r\nproduct\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="utf8"\r\n\r\n✓\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="id"\r\n\r\n53972924825960\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="properties[Shipping]"\r\n\r\n\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="product-id"\r\n\r\n14973183197544\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="section-id"\r\n\r\ntemplate--24563549667688__4b86bc5c-f0d6-46d6-8684-1235f066332e\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="quantity"\r\n\r\n1\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="sections"\r\n\r\ncart-notification-product,cart-notification-button,cart-icon-bubble\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn\r\nContent-Disposition: form-data; name="sections_url"\r\n\r\n/products/mothers-day-quencher-h2-0-flowstate-tumbler-40-oz\r\n------WebKitFormBoundaryWJpbFg00ijsrLGxn--\r\n',
  method: "POST",
});
