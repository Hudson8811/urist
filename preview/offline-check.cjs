const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
  await page.locator('.hero__button').click();
  assert(await page.locator('#consultation-modal').evaluate(el => el.open));
  await page.keyboard.press('Escape');
  const details = await page.evaluate(async () => {
    document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
    await Promise.all([...document.images].map(image => image.decode()));
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const invalidLinks = [...document.querySelectorAll('a[href^="#"]')].map(el => el.getAttribute('href')).filter(href => !document.getElementById(href.slice(1)));
    return {
      duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      invalidLinks,
      iconsVisible: document.querySelector('.stats__icon use').getBBox().width > 0,
      formLabels: [...document.querySelectorAll('input:not([type="hidden"]), textarea')].every(input => input.labels.length > 0),
    };
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(details.duplicateIds, []);
  assert.deepEqual(details.invalidLinks, []);
  assert(details.iconsVisible);
  assert(details.formLabels);
  console.log(JSON.stringify({ offline: 'passed', ...details, errors }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
