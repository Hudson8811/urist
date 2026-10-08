/* Без библиотек. Поведение привязано к data-атрибутам, оформление — к БЭМ. */
(() => {
  'use strict';

  const body = document.body;
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const consultationModal = document.querySelector('#consultation-modal');
  const infoModal = document.querySelector('#info-modal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Открыть меню');
    nav.classList.remove('header__nav--open');
  }

  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(expanded));
    menuToggle.setAttribute('aria-label', expanded ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('header__nav--open', expanded);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', closeMenu);

  function openModal(dialog) {
    if (dialog.open) return;
    body.classList.add('page--locked');
    dialog.showModal();
  }

  document.querySelectorAll('.modal').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (!document.querySelector('.modal[open]')) body.classList.remove('page--locked');
    });
    // Закрываем только после нажатия и отпускания на подложке.
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', event => {
      const rect = dialog.getBoundingClientRect();
      pressedOutside = event.target === dialog && (
        event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom
      );
    });
    dialog.addEventListener('click', event => {
      if (pressedOutside && event.target === dialog) dialog.close();
      pressedOutside = false;
    });
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-modal]');
    if (trigger) {
      const subject = trigger.dataset.modal;
      consultationModal.querySelector('[name="subject"]').value = subject;
      consultationModal.querySelector('#modal-title').textContent = subject === 'Консультация юриста' ? 'Получить консультацию' : subject;
      consultationModal.querySelector('.lead-form__status').textContent = '';
      closeMenu();
      openModal(consultationModal);
      consultationModal.querySelector('[name="name"]').focus({ preventScroll: true });
    }

    const close = event.target.closest('[data-close]');
    if (close) close.closest('dialog').close();

    if (event.target.closest('[data-privacy]')) {
      document.querySelector('#info-title').textContent = 'Обработка персональных данных';
      document.querySelector('#info-content').textContent = 'В этой демонстрационной версии данные формы не отправляются и не сохраняются. Имя, номер телефона и описание вопроса предназначены для обратной связи по вашему обращению. Вы можете закрыть форму в любой момент.';
      openModal(infoModal);
    }

    const reviewButton = event.target.closest('[data-review]');
    if (reviewButton) {
      const card = reviewButton.closest('.review-card');
      document.querySelector('#info-title').textContent = card.querySelector('.review-card__name').textContent;
      document.querySelector('#info-content').textContent = card.querySelector('.review-card__quote').textContent;
      openModal(infoModal);
    }
  });

  const faqToggle = document.querySelector('[data-faq-toggle]');
  faqToggle.addEventListener('click', () => {
    const expanded = faqToggle.getAttribute('aria-expanded') !== 'true';
    faqToggle.setAttribute('aria-expanded', String(expanded));
    faqToggle.firstChild.textContent = expanded ? 'Свернуть вопросы' : 'Все вопросы';
    document.querySelector('#faq-extra').hidden = !expanded;
  });
  document.querySelectorAll('.faq__item').forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) document.querySelectorAll('.faq__item[open]').forEach(other => {
        if (other !== item) other.open = false;
      });
    });
  });

  document.querySelector('[data-reviews-toggle]').addEventListener('click', event => {
    const toggle = event.currentTarget;
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.firstChild.textContent = expanded ? 'Свернуть отзывы' : 'Все отзывы';
    // На десктопе уже видны все три отзыва; открываем их в одном окне.
    const text = document.createDocumentFragment();
    document.querySelectorAll('.review-card').forEach(card => {
      const paragraph = document.createElement('p');
      paragraph.textContent = `${card.querySelector('.review-card__name').textContent} — ${card.querySelector('.review-card__quote').textContent}`;
      text.append(paragraph);
    });
    document.querySelector('#info-title').textContent = 'Отзывы наших клиентов';
    document.querySelector('#info-content').replaceChildren(text);
    openModal(infoModal);
    infoModal.addEventListener('close', () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.firstChild.textContent = 'Все отзывы';
    }, { once: true });
  });

  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.carousel__track');
    const cards = [...track.children];
    const dots = carousel.querySelector('[data-dots]');
    let activeIndex = 0;

    function show(index) {
      const next = (index + cards.length) % cards.length;
      track.scrollTo({ left: cards[next].offsetLeft - cards[0].offsetLeft, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }

    cards.forEach((card, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', `Карточка ${index + 1} из ${cards.length}`);
      dot.setAttribute('aria-controls', track.id);
      dot.addEventListener('click', () => show(index));
      dots.append(dot);
    });

    function update() {
      const maxScroll = track.scrollWidth - track.clientWidth;
      // Последняя карточка уже полностью видна, даже если она уже контейнера.
      activeIndex = maxScroll > 0 && track.scrollLeft >= maxScroll - 2 ? cards.length - 1 : cards.reduce((nearest, card, index) => {
        const distance = Math.abs(card.offsetLeft - cards[0].offsetLeft - track.scrollLeft);
        const current = Math.abs(cards[nearest].offsetLeft - cards[0].offsetLeft - track.scrollLeft);
        return distance < current ? index : nearest;
      }, 0);
      [...dots.children].forEach((dot, index) => {
        dot.classList.toggle('carousel__dot--active', index === activeIndex);
        dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
      });
    }
    carousel.querySelector('[data-next]').addEventListener('click', () => show(activeIndex + 1));
    carousel.querySelector('[data-previous]').addEventListener('click', () => show(activeIndex - 1));
    track.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(track);
    update();
  });

  function phoneDigits(value) {
    return value.replace(/\D/g, '');
  }

  function parsePhone(value) {
    const text = value.trim();
    if (/[^\d\s()+.\-\u2010-\u2015]/.test(text)) {
      return { error: 'Введите номер без букв и посторонних символов.' };
    }
    if (text.includes('+') && !/^\+7[^+]*$/.test(text)) {
      return { error: 'Используйте номер с кодом +7.' };
    }
    let digits = phoneDigits(text);
    if (text.startsWith('+7') || (digits.length === 11 && /^[78]/.test(digits))) {
      digits = digits.slice(1);
    }
    if (digits.length > 10) return { error: 'После +7 должно быть 10 цифр. Проверьте номер.' };
    return { digits };
  }

  function formatPhone(digits) {
    if (!digits) return '';
    let value = `(${digits.slice(0, 3)}`;
    if (digits.length >= 3) value += ')';
    if (digits.length > 3) value += ` ${digits.slice(3, 6)}`;
    if (digits.length > 6) value += `-${digits.slice(6, 8)}`;
    if (digits.length > 8) value += `-${digits.slice(8, 10)}`;
    return value;
  }

  function phoneCaret(value, digitIndex) {
    let position = 0;
    let count = 0;
    while (position < value.length && count < digitIndex) {
      if (/\d/.test(value[position])) count += 1;
      position += 1;
    }
    while (position < value.length && /\D/.test(value[position])) position += 1;
    return position;
  }

  document.querySelectorAll('[data-lead-form]').forEach(form => {
    const phone = form.elements.phone;
    const status = form.querySelector('.lead-form__status');
    const submit = form.querySelector('[type="submit"]');
    const phoneField = phone.closest('.phone-field');
    const phoneError = document.getElementById(`${phone.id}-error`);
    let lastPhoneValue = '';
    let rejectedInput = '';
    let showPhoneError = false;

    function validatePhone(showError = showPhoneError) {
      const digits = phoneDigits(phone.value);
      let message = rejectedInput;
      if (!message && !digits) message = 'Введите номер телефона.';
      else if (!message && digits.length !== 10) message = 'Введите номер полностью: 10 цифр после +7.';
      else if (!message && (!/^[3489]/.test(digits) || /^(\d)\1{9}$/.test(digits))) {
        message = 'Проверьте номер. Например: +7 (812) 407-14-31.';
      }
      showPhoneError = showError;
      phone.setCustomValidity(message);
      const visibleError = showError && Boolean(message);
      phone.setAttribute('aria-invalid', String(visibleError));
      phoneField.classList.toggle('phone-field--invalid', visibleError);
      phoneError.textContent = visibleError ? message : '';
      return !message;
    }

    function writePhone(digits, caretIndex = digits.length) {
      phone.value = formatPhone(digits);
      lastPhoneValue = phone.value;
      rejectedInput = '';
      if (document.activeElement === phone) {
        const caret = phoneCaret(phone.value, caretIndex);
        phone.setSelectionRange(caret, caret);
      }
      if (!form.hasAttribute('aria-busy')) status.textContent = '';
      validatePhone();
    }

    function rejectPhone(message) {
      phone.value = lastPhoneValue;
      rejectedInput = message;
      validatePhone(true);
    }

    function insertPhone(digits, pasted = false) {
      const current = phoneDigits(phone.value);
      const start = phoneDigits(phone.value.slice(0, phone.selectionStart)).length;
      const end = phoneDigits(phone.value.slice(0, phone.selectionEnd)).length;
      let next = current.slice(0, start) + digits + current.slice(end);
      let caret = start + digits.length;
      // Код +7 уже виден слева; полные вставленные номера разбирает parsePhone.
      if (!current && next === '7') {
        next = next.slice(1);
        caret -= 1;
      }
      if (next.length > 10) {
        if (pasted) rejectPhone('После +7 должно быть 10 цифр. Проверьте номер.');
        return;
      }
      writePhone(next, Math.max(0, caret));
    }

    phone.addEventListener('beforeinput', event => {
      if (!event.cancelable || event.isComposing) return;
      if (event.inputType === 'insertText') {
        event.preventDefault();
        if ((event.data || '').length > 1) {
          const parsed = parsePhone(event.data);
          if (parsed.error) rejectPhone(parsed.error);
          else insertPhone(parsed.digits, true);
        } else if (/^\d$/.test(event.data || '')) insertPhone(event.data);
      } else if (['deleteContentBackward', 'deleteContentForward', 'deleteByCut'].includes(event.inputType)) {
        event.preventDefault();
        const digits = phoneDigits(phone.value);
        let start = phoneDigits(phone.value.slice(0, phone.selectionStart)).length;
        let end = phoneDigits(phone.value.slice(0, phone.selectionEnd)).length;
        if (phone.selectionStart === phone.selectionEnd) {
          if (event.inputType === 'deleteContentBackward') start = Math.max(0, start - 1);
          else end = Math.min(digits.length, end + 1);
        }
        writePhone(digits.slice(0, start) + digits.slice(end), start);
      }
    });
    phone.addEventListener('paste', event => {
      if (!event.clipboardData) return;
      event.preventDefault();
      const parsed = parsePhone(event.clipboardData.getData('text'));
      if (parsed.error) rejectPhone(parsed.error);
      else insertPhone(parsed.digits, true);
    });
    // Автозаполнение и клавиатуры, не поддерживающие beforeinput.
    function normalizePhoneInput(event) {
      if (event.isComposing) return;
      const caret = phoneDigits(phone.value.slice(0, phone.selectionStart)).length;
      const parsed = parsePhone(phone.value);
      if (parsed.error) rejectPhone(parsed.error);
      else writePhone(parsed.digits, caret - (phoneDigits(phone.value).length - parsed.digits.length));
    }
    phone.addEventListener('input', normalizePhoneInput);
    phone.addEventListener('compositionend', normalizePhoneInput);
    phone.addEventListener('blur', () => validatePhone(true));
    phone.addEventListener('invalid', () => validatePhone(true));
    form.addEventListener('reset', () => {
      queueMicrotask(() => {
        lastPhoneValue = phone.value;
        rejectedInput = '';
        validatePhone(false);
      });
    });
    const initialPhone = parsePhone(phone.value);
    if (initialPhone.error) rejectPhone(initialPhone.error);
    else writePhone(initialPhone.digits);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const digits = phoneDigits(phone.value);
      if (!validatePhone(true)) {
        phone.reportValidity();
        return;
      }
      if (!form.reportValidity()) return;
      status.classList.remove('lead-form__status--error');

      // При интеграции с WordPress укажите URL обработчика в data-endpoint.
      // Ожидаемый ответ: JSON { "success": true }. Для nonce используйте hidden input.
      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        status.textContent = 'Форма заполнена корректно. Это демонстрация: заявка не отправлена.';
        return;
      }

      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      status.textContent = 'Отправляем заявку…';
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      try {
        const data = new FormData(form);
        data.set('phone', `+7${digits}`);
        const response = await fetch(endpoint, { method: 'POST', body: data, signal: controller.signal, credentials: 'same-origin' });
        if (!response.ok) throw new Error('Request failed');
        const result = await response.json();
        if (result.success !== true) throw new Error('Request not accepted');
        status.textContent = 'Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.';
        form.reset();
      } catch {
        status.classList.add('lead-form__status--error');
        status.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +7 (812) 407-14-31.';
      } finally {
        window.clearTimeout(timeout);
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
    });
  });
})();
