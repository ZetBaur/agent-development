import fetch from "node-fetch";
import puppeteer from "puppeteer-extra";
import pStealth from "puppeteer-extra-plugin-stealth";

puppeteer.use(pStealth());

const STORE_FRONT_ACCESS_TOKEN = "2a1ffada6512bf238885987120eba877";

const SHOPIFY_STORE_URL =
  "https://www.stanley1913.com/api/unstable/graphql.json";

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createCheckout = async () => {
  const cartInput = {
    lines: [
      {
        merchandiseId: "gid://shopify/ProductVariant/39681110278203",
        quantity: 1,
      },
    ],
    buyerIdentity: {
      email: "baurtest@gmail.com",
      phone: "+77017129299",
    },
    delivery: {
      addresses: [
        {
          address: {
            deliveryAddress: {
              address1: "1601 JEROME AVENUE",
              city: "ASTORIA",
              countryCode: "US",
              firstName: "Dum",
              lastName: "Dumn",
              zip: "97103",
              phone: "+77017129299",
            },
          },
        },
      ],
    },
  };

  const query = `
    mutation {
      cartCreate(input: {
        lines: [{
          merchandiseId: "${cartInput.lines[0].merchandiseId}",
          quantity: ${cartInput.lines[0].quantity}
        }],
        buyerIdentity: {
          email: "${cartInput.buyerIdentity.email}",
          phone: "${cartInput.buyerIdentity.phone}"
        },
        delivery: {
          addresses: [{
            address: {
              deliveryAddress: {
                address1: "${cartInput.delivery.addresses[0].address.deliveryAddress.address1}",
                city: "${cartInput.delivery.addresses[0].address.deliveryAddress.city}",
                countryCode: ${cartInput.delivery.addresses[0].address.deliveryAddress.countryCode},
                firstName: "${cartInput.delivery.addresses[0].address.deliveryAddress.firstName}",
                lastName: "${cartInput.delivery.addresses[0].address.deliveryAddress.lastName}",
                zip: "${cartInput.delivery.addresses[0].address.deliveryAddress.zip}",
                phone: "${cartInput.delivery.addresses[0].address.deliveryAddress.phone}"
              }
            }
          }]
        }
      }) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_STORE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STORE_FRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.data?.cartCreate?.cart) {
      console.log(
        "Cart created successfully, URL:",
        data.data.cartCreate.cart.checkoutUrl
      );
      return data.data.cartCreate.cart;
    } else {
      console.error(
        "Error with creating cart:",
        data.data?.cartCreate?.userErrors
      );
      return null;
    }
  } catch (error) {
    console.error("Error creating checkout:", error);
    return null;
  }
};

const openCheckoutInBrowser = async (checkoutUrl) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    await page.goto(`${checkoutUrl}`, { waitUntil: "domcontentloaded" });

    await page.click("button[type=submit]");
    await page.waitForNavigation();
    await wait(500);
    await page.click("button[type=submit]");

    await wait(2000);

    let iframeCardNumber = await page.waitForSelector(
      "iframe[title='Field container for: Card number']"
    );
    let innerPage = await iframeCardNumber.contentFrame();
    await innerPage.type("input[id='number']", "4308963903784205");

    await wait(2000);
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
    }

    await wait(2000);
    let iframeVerification = await page.waitForSelector(
      "iframe[title='Field container for: Security code']"
    );
    innerPage = await iframeVerification.contentFrame();
    await innerPage.type("input[id='verification_value']", "799");

    await wait(500);
    await page.click("button[type=submit]");
  } catch (error) {
    console.error("Error during Puppeteer interaction:", error);
  }
};

const getProducts = async () => {
  const query = `
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_STORE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STORE_FRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    console.log("Доступные товары:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Ошибка при получении товаров:", error);
    return null;
  }
};

const initiateCheckout = async () => {
  try {
    await getProducts();

    const checkout = await createCheckout();
    if (!checkout) return;

    await openCheckoutInBrowser(checkout.checkoutUrl);
  } catch (error) {
    console.error("Error:", error);
  }
};

initiateCheckout();
