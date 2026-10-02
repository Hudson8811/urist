const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
    await Promise.all([...document.images].map(image => image.decode()));
  });

  const results = [];
  for (const width of [1920, 1440, 1280, 1024, 768, 600, 390, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      broken: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src),
      headerOverflow: document.querySelector('.header__inner').scrollWidth > document.querySelector('.header__inner').clientWidth,
    }));
    assert(layout.scroll <= width, `Horizontal overflow at ${width}: ${layout.scroll}`);
    assert(!layout.broken.length, `Broken images: ${layout.broken}`);
    assert(!layout.headerOverflow, `Header overflow at ${width}`);
    results.push(layout);
    if ([1440, 390, 768].includes(width)) await page.screenshot({ path: path.join(__dirname, `desktop-${width}.png`), fullPage: true, animations: 'disabled' });
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.hero__button').click();
  assert(await page.locator('#consultation-modal').evaluate(el => el.open));
  assert.equal(await page.locator('#lead-name').evaluate(el => el === document.activeElement), true);
  await page.locator('#lead-name').fill('Тестовый посетитель');
  await page.locator('#lead-phone').fill('123');
  await page.locator('#consultation-modal [name="consent"]').check();
  await page.locator('#consultation-modal [type="submit"]').click();
  assert.equal(await page.locator('#lead-phone').evaluate(el => el.validity.valid), false);
  await page.locator('#lead-phone').fill('+7 999 123 45 67');
  await page.locator('#consultation-modal [type="submit"]').click();
  assert.match(await page.locator('#modal-status').textContent(), /заявка не отправлена/);
  await page.screenshot({ path: path.join(__dirname, 'modal-desktop.png'), animations: 'disabled' });
  await page.locator('#consultation-modal [data-privacy]').click();
  assert(await page.locator('#info-modal').evaluate(el => el.open));
  await page.keyboard.press('Escape');
  assert(await page.locator('#consultation-modal').evaluate(el => el.open));
  assert(await page.locator('body').evaluate(el => el.classList.contains('page--locked')));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.body.classList.contains('page--locked'));
  assert.equal(await page.locator('.hero__button').evaluate(el => el === document.activeElement), true);

  await page.locator('.service-card__button').nth(2).click();
  assert.equal(await page.locator('#consultation-modal [name="subject"]').inputValue(), 'Спор со страховой компанией');
  await page.mouse.click(8, 8);
  assert.equal(await page.locator('#consultation-modal').evaluate(el => el.open), false);
  await page.locator('.faq__question').first().click();
  assert(await page.locator('.faq__item').first().evaluate(el => el.open));
  await page.locator('.faq__question').nth(1).click();
  await page.waitForFunction(() => !document.querySelector('.faq__item').open);
  await page.locator('[data-faq-toggle]').click();
  assert.equal(await page.locator('#faq-extra').getAttribute('hidden'), null);

  // Проверка подготовленного интерфейса отправки без обращения к серверу.
  await page.route('**/test-lead', route => route.fulfill({ json: { success: true } }));
  await page.locator('.consultation__form').evaluate(form => { form.dataset.endpoint = '/test-lead'; });
  await page.locator('#callback-phone').fill('89991234567');
  await page.locator('.consultation__form [name="consent"]').check();
  await page.locator('.consultation__form [type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('#callback-status').textContent.includes('Заявка отправлена'));
  await page.unroute('**/test-lead');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.locator('.nav__link[href="#services"]').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
  await page.locator('.services [data-next]').click();
  await page.waitForFunction(() => document.querySelector('#services-track').scrollLeft > 200);
  await page.locator('.services .carousel__dot').nth(4).click();
  await page.waitForFunction(() => document.querySelectorAll('.services .carousel__dot')[4].getAttribute('aria-current') === 'true');
  await page.locator('.consultation__mobile-button').click();
  assert(await page.locator('#consultation-modal').evaluate(el => el.open));
  await page.screenshot({ path: path.join(__dirname, 'modal-mobile.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(__dirname, 'checks.json'), JSON.stringify({ layouts: results, interactiveChecks: 'passed', errors }, null, 2));
  console.log(JSON.stringify({ layouts: results, interactiveChecks: 'passed', errors }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
