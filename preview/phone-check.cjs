const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/phone-test', async route => {
      requests.push(route.request().postData());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    async function paste(phone, text) {
      await phone.focus();
      await phone.evaluate((input, value) => {
        input.select();
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', value);
        input.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
      }, text);
    }

    for (const selector of ['.consultation__form', '#consultation-modal form']) {
      if (selector.includes('modal')) await page.locator('.hero__button').click();
      const form = page.locator(selector);
      const phone = form.locator('[name="phone"]');
      const error = form.locator('.lead-form__error');
      const submit = form.locator('[type="submit"]');
      await form.evaluate(el => { el.dataset.endpoint = '/phone-test'; });

      await submit.click();
      assert.match(await error.textContent(), /Введите номер телефона/);
      await phone.fill('812');
      await phone.press('Tab');
      assert.match(await error.textContent(), /10 цифр/);
      await phone.focus();
      await phone.pressSequentially('abc+++()');
      assert.equal(await phone.inputValue(), '(812)');

      for (const value of ['+7 (812) 407-14-31', '88124071431', '8124071431']) {
        await paste(phone, value);
        assert.equal(await phone.inputValue(), '(812) 407-14-31');
        assert.equal(await phone.evaluate(el => el.validity.valid), true);
        assert.equal(await error.textContent(), '');
      }
      await phone.press('End');
      await phone.pressSequentially('55');
      assert.equal(await phone.inputValue(), '(812) 407-14-31');
      await paste(phone, '8461234567');
      await phone.press('End');
      await phone.pressSequentially('8');
      assert.equal(await phone.inputValue(), '(846) 123-45-67');
      await paste(phone, '8124071431');

      for (const value of ['+7 999 123 45 678', '651984981+651+984+988', '+380 99 123 45 67', 'abc9991234567']) {
        await paste(phone, value);
        assert.equal(await phone.inputValue(), '(812) 407-14-31');
        assert.equal(await phone.getAttribute('aria-invalid'), 'true');
        await submit.click();
        assert.equal(requests.length, selector.includes('modal') ? 1 : 0);
      }
      for (const value of ['9999999999', '2123456789']) {
        await paste(phone, value);
        await phone.press('Tab');
        assert.equal(await phone.evaluate(el => el.validity.valid), false);
        assert.match(await error.textContent(), /Проверьте номер/);
      }

      await paste(phone, '8124071431');
      await phone.evaluate(el => el.setSelectionRange(10, 10));
      await phone.press('Backspace');
      assert.equal(await phone.inputValue(), '(812) 401-43-1');
      await paste(phone, '8124071431');
      await phone.evaluate(el => el.setSelectionRange(9, 9));
      await phone.press('Delete');
      assert.equal(await phone.inputValue(), '(812) 407-43-1');
      await paste(phone, '8124071431');
      await phone.evaluate(el => el.setSelectionRange(6, 9));
      await phone.pressSequentially('999');
      assert.equal(await phone.inputValue(), '(812) 999-14-31');
      await phone.press('ControlOrMeta+A');
      await phone.press('Backspace');
      assert.equal(await phone.inputValue(), '');
      await phone.pressSequentially('+7 (812) 407-14-31');
      assert.equal(await phone.inputValue(), '(812) 407-14-31');
      await phone.press('ControlOrMeta+A');
      await phone.press('Backspace');
      await phone.pressSequentially('8124071431');
      assert.equal(await phone.inputValue(), '(812) 407-14-31');

      // Автозаполнение, согласие и формат запроса к будущему обработчику.
      await phone.fill('+7 999 123 45 67');
      assert.equal(await phone.inputValue(), '(999) 123-45-67');
      const before = requests.length;
      await submit.click();
      assert.equal(requests.length, before);
      await form.locator('[name="consent"]').check();
      await submit.click();
      await form.locator('.lead-form__status').filter({ hasText: 'Спасибо!' }).waitFor();
      assert.equal(requests.length, before + 1);
      assert.match(requests.at(-1), /name="phone"\r\n\r\n\+79991234567\r\n/);
      assert.equal(await phone.inputValue(), '');
      assert.equal(await error.textContent(), '');
      assert.equal(await phone.getAttribute('aria-invalid'), 'false');
      assert.match(await form.locator('.lead-form__status').textContent(), /Спасибо!/);
      if (selector.includes('modal')) await page.keyboard.press('Escape');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.hero__button').click();
    const mobilePhone = page.locator('#lead-phone');
    await mobilePhone.fill('99912');
    await mobilePhone.press('Tab');
    assert.equal(await mobilePhone.getAttribute('aria-invalid'), 'true');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(__dirname, 'phone-error-mobile.png'), animations: 'disabled' });
    await paste(mobilePhone, '+7 999 123 45 67');
    assert.equal(await mobilePhone.getAttribute('aria-invalid'), 'false');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ phoneChecks: 'passed', forms: 2, mockedSubmissions: requests.length, errors }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
