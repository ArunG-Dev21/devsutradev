import {test, expect} from '@playwright/test';

test.describe('Storefront smoke tests', () => {
  test('home page loads without runtime errors', async ({page}) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter known noisy third-party errors that aren't ours.
        if (!/favicon|google|gtag|analytics|hotjar/i.test(text)) {
          consoleErrors.push(text);
        }
      }
    });

    const response = await page.goto('/', {waitUntil: 'domcontentloaded'});
    expect(response?.status(), 'home should return 2xx').toBeLessThan(400);

    // Page has a title and a body.
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('body')).toBeVisible();

    // Document has rendered something — body should not be empty.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);

    expect(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('robots.txt is served', async ({request}) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.toLowerCase()).toContain('user-agent');
  });

  test('cart page is reachable', async ({page}) => {
    const response = await page.goto('/cart', {waitUntil: 'domcontentloaded'});
    expect(response?.status(), 'cart should return 2xx').toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('search page is reachable', async ({page}) => {
    const response = await page.goto('/search?q=mala', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status(), 'search should return 2xx').toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('unknown route returns 404', async ({page}) => {
    const response = await page.goto('/this-route-definitely-does-not-exist-xyz', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(404);
  });
});

test.describe('Add-to-cart flow', () => {
  test('first product link adds an item to cart', async ({page}) => {
    await page.goto('/', {waitUntil: 'domcontentloaded'});

    const firstProductLink = page.locator('a[href*="/products/"]').first();
    if ((await firstProductLink.count()) === 0) {
      test.skip(true, 'No products on home page — skipping add-to-cart smoke');
      return;
    }

    await firstProductLink.click();
    await page.waitForURL(/\/products\//);
    await expect(page.locator('body')).toBeVisible();

    // The Add-to-Cart submit button. Inner text varies; we match by submit role
    // inside a CartForm (POST to /cart).
    const addBtn = page
      .locator('form[action*="/cart"] button[type="submit"]')
      .first();

    if ((await addBtn.count()) === 0) {
      test.skip(true, 'No add-to-cart button found on this PDP — skipping');
      return;
    }

    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click();

    // Wait for the cart action to settle. We don't assert on UI here because the
    // notification implementation is custom; just confirm the cart page now has lines.
    await page.waitForTimeout(2000);
    const cartResponse = await page.goto('/cart', {waitUntil: 'domcontentloaded'});
    expect(cartResponse?.status()).toBeLessThan(400);

    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    // If the cart is genuinely empty after add (rare), we surface that.
    expect(bodyText, 'cart should not show empty state after add').not.toMatch(
      /your cart is empty|cart is empty/,
    );
  });
});
