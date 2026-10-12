/* Локальная галерея PhotoSwipe. Без JavaScript обложка открывает сам снимок. */
(() => {
  'use strict';
  const gallery = document.querySelector('#office-gallery');
  if (!gallery || !window.PhotoSwipeLightbox || !window.PhotoSwipe) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: 'a[data-pswp-width]',
    pswpModule: PhotoSwipe,
    mainClass: 'office-gallery',
    bgOpacity: 0.98,
    showHideAnimationType: 'fade',
    showAnimationDuration: reducedMotion ? 0 : 200,
    hideAnimationDuration: reducedMotion ? 0 : 200,
    zoomAnimationDuration: reducedMotion ? 0 : 200,
    paddingFn: viewport => ({ top: 60, bottom: 65, left: viewport.x < 600 ? 12 : 60, right: viewport.x < 600 ? 12 : 60 }),
    closeTitle: 'Закрыть галерею',
    zoomTitle: 'Увеличить или уменьшить фото',
    arrowPrevTitle: 'Предыдущее фото',
    arrowNextTitle: 'Следующее фото',
    errorMsg: 'Не удалось загрузить фото. Попробуйте открыть галерею ещё раз.',
    indexIndicatorSep: ' / ',
    preload: [1, 1]
  });
  lightbox.addFilter('itemData', item => {
    item.alt = item.element?.dataset.galleryCaption || 'Фотография офиса';
    return item;
  });
  lightbox.on('uiRegister', () => {
    lightbox.pswp.ui.registerElement({
      name: 'gallery-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      onInit: (element, pswp) => {
        element.classList.add('office-gallery__caption');
        element.setAttribute('aria-live', 'polite');
        pswp.on('change', () => {
          element.textContent = pswp.currSlide.data.alt;
        });
      }
    });
  });
  lightbox.on('beforeOpen', () => document.body.classList.add('page--locked'));
  lightbox.on('afterInit', () => lightbox.pswp.element.setAttribute('aria-label', 'Фотографии офиса «Арсенал»'));
  lightbox.on('bindEvents', () => lightbox.pswp.element.focus({ preventScroll: true }));
  lightbox.on('keydown', event => {
    const key = event.originalEvent;
    if (key.key !== 'Tab' || key.altKey || key.ctrlKey || key.metaKey) return;
    const buttons = [...lightbox.pswp.element.querySelectorAll('button:not([disabled])')]
      .filter(button => button.offsetParent !== null);
    if (!buttons.length) return;
    const current = buttons.indexOf(document.activeElement);
    const next = current < 0 ? (key.shiftKey ? buttons.length - 1 : 0)
      : (current + (key.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    key.preventDefault();
    event.preventDefault();
    buttons[next].focus();
  });
  lightbox.on('destroy', () => {
    if (!document.querySelector('.modal[open]')) {
      document.body.classList.remove('page--locked');
      gallery.querySelector('.contacts__photo-link').focus({ preventScroll: true });
    }
  });
  lightbox.init();
})();
