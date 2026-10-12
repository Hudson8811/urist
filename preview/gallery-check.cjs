const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const base = 'http://127.0.0.1:4173/';
const errors = [];
const externalRequests = [];
const captions = ['Вход в офис «Арсенал»', 'Кабинет для консультаций', 'Рабочее пространство офиса', 'Холл бизнес-центра', 'Лестница в бизнес-центре'];

function monitor(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(base)) externalRequests.push(request.url());
  });
}

async function slide(page, index) {
  await page.waitForFunction(index => {
    const pswp = window.pswp;
    const image = pswp?.currSlide?.content?.element;
    return pswp?.currIndex === index && pswp.opener.isOpen && image?.complete && image.naturalWidth > 0
      && !pswp.mainScroll.isShifted() && pswp.animations.activeAnimations.length === 0;
  }, index);
  assert.equal(await page.locator('.office-gallery__caption').textContent(), captions[index]);
  assert.equal((await page.locator('.pswp__counter').textContent()).trim(), `${index + 1} / 5`);
}

async function closed(page) {
  await page.waitForFunction(() => !document.querySelector('.pswp') && !document.body.classList.contains('page--locked'));
  assert(await page.locator('.contacts__photo-link').evaluate(el => el === document.activeElement));
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    monitor(page);
    await page.goto(base, { waitUntil: 'networkidle' });
    const images = await page.locator('#office-gallery a').evaluateAll(async links => Promise.all(links.map(async link => {
      const image = new Image();
      image.src = link.href;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight, declaredWidth: +link.dataset.pswpWidth, declaredHeight: +link.dataset.pswpHeight };
    })));
    assert.equal(images.length, 5);
    images.forEach(image => {
      assert.equal(image.width, image.declaredWidth);
      assert.equal(image.height, image.declaredHeight);
    });
    await page.locator('.contacts__photo-link').scrollIntoViewIfNeeded();
    await page.locator('.contacts').screenshot({ path: path.join(__dirname, 'contacts-gallery-desktop.png') });
    await page.locator('.contacts__photo-link').click();
    await slide(page, 0);
    assert.equal(await page.locator('.pswp').getAttribute('aria-label'), 'Фотографии офиса «Арсенал»');
    assert(await page.locator('body').evaluate(el => el.classList.contains('page--locked')));
    for (let index = 1; index < 5; index++) {
      await page.getByRole('button', { name: 'Следующее фото' }).click();
      await slide(page, index);
    }
    await page.getByRole('button', { name: 'Следующее фото' }).click();
    await slide(page, 0);
    await page.keyboard.press('ArrowLeft');
    await slide(page, 4);
    await page.keyboard.press('ArrowRight');
    await slide(page, 0);
    await page.getByRole('button', { name: 'Предыдущее фото' }).click();
    await slide(page, 4);
    await page.getByRole('button', { name: 'Увеличить или уменьшить фото' }).click();
    await page.waitForFunction(() => window.pswp.currSlide.currZoomLevel > window.pswp.currSlide.zoomLevels.initial);
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Увеличить или уменьшить фото' }).click();
    await page.waitForFunction(() => window.pswp.currSlide.currZoomLevel === window.pswp.currSlide.zoomLevels.initial);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(__dirname, 'gallery-desktop.png'), animations: 'disabled' });
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      assert(await page.locator('.pswp').evaluate(el => el.contains(document.activeElement)));
    }
    await page.keyboard.press('Escape');
    await closed(page);
    await page.locator('.contacts__photo-link').press('Enter');
    await slide(page, 0);
    await page.getByRole('button', { name: 'Закрыть галерею' }).click();
    await closed(page);
    await page.locator('.contacts__photo-link').click();
    await slide(page, 0);
    await page.mouse.click(720, 90);
    await closed(page);

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    monitor(mobile);
    await mobile.goto(base, { waitUntil: 'networkidle' });
    await mobile.locator('.contacts').screenshot({ path: path.join(__dirname, 'contacts-gallery-mobile.png') });
    await mobile.locator('.contacts__photo-link').tap();
    await slide(mobile, 0);
    const session = await mobile.context().newCDPSession(mobile);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 280, y: 420 }] });
    for (const x of [240, 200, 160, 120, 80]) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 420 }] });
      await mobile.waitForTimeout(25);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await slide(mobile, 1);
    await mobile.getByRole('button', { name: 'Следующее фото' }).tap();
    await slide(mobile, 2);
    await mobile.getByRole('button', { name: 'Увеличить или уменьшить фото' }).tap();
    await mobile.waitForFunction(() => window.pswp.currSlide.currZoomLevel > window.pswp.currSlide.zoomLevels.initial);
    await mobile.waitForTimeout(250);
    await mobile.getByRole('button', { name: 'Увеличить или уменьшить фото' }).tap();
    await mobile.waitForFunction(() => window.pswp.currSlide.currZoomLevel === window.pswp.currSlide.zoomLevels.initial);
    await mobile.waitForTimeout(250);
    await mobile.getByRole('button', { name: 'Следующее фото' }).tap();
    await slide(mobile, 3);
    await mobile.screenshot({ path: path.join(__dirname, 'gallery-mobile.png'), animations: 'disabled' });
    for (const viewport of [{ width: 320, height: 640 }, { width: 844, height: 390 }]) {
      await mobile.setViewportSize(viewport);
      await mobile.waitForFunction(() => window.pswp.viewportSize.x === innerWidth);
      const bounds = await mobile.locator('.office-gallery__caption').boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
      assert(bounds.y >= 0 && bounds.y + bounds.height <= viewport.height + 1);
      assert(await mobile.getByRole('button', { name: 'Закрыть галерею' }).isVisible());
    }
    await mobile.getByRole('button', { name: 'Закрыть галерею' }).tap();
    await closed(mobile);

    // Local UMD assets also work without a server.
    await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
    await page.locator('.contacts__photo-link').click();
    await slide(page, 0);
    await page.getByRole('button', { name: 'Следующее фото' }).click();
    await slide(page, 1);
    await page.keyboard.press('Escape');
    await closed(page);

    const noJs = await browser.newPage({ javaScriptEnabled: false });
    await noJs.goto(base);
    await noJs.locator('.contacts__photo-link').click();
    assert(noJs.url().endsWith('/assets/images/gallery/entrance.webp'));
    assert.deepEqual(errors, []);
    assert.deepEqual(externalRequests, []);
    const result = { status: 'passed', photos: images.length, checks: ['dimensions', 'desktop arrows and loop', 'keyboard arrows and Escape', 'zoom', 'focus trap and return', 'close button and background', 'mobile swipe', 'mobile zoom', '320px and landscape', 'offline file', 'no-JavaScript fallback'], errors, externalRequests };
    fs.writeFileSync(path.join(__dirname, 'gallery-checks.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
