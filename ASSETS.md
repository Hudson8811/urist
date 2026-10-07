# Изображения

Фотография бизнес-центра «Меридиан» предоставлена пользователем. Остальные растровые иллюстрации созданы встроенным ImageGen, затем перекодированы в WebP. Внешних фотостоков и удалённых изображений нет. Люди на портретах вымышленные; это иллюстрации для макета.

## `assets/images/saint-petersburg.webp`

1920 × 640 px. Итоговый запрос:

> Use case: photorealistic-natural. Asset type: panoramic background for a law firm website. Output panoramic aspect ratio 3:1, 1920 by 640 pixels. Realistic Saint Isaac's Cathedral in Saint Petersburg at deep blue twilight, warm illuminated gold dome, full architecture with the entire spire and facade visible at the right third of the wide panorama, small trees, golden street lamps and park foreground. The LEFT HALF of the panoramic image should be empty atmospheric dark navy blue sky and subdued park, for readable heading overlay. Wide distant architectural photography, cathedral takes only 80% of image height and 40% of total image width, no close-up. Navy midnight and antique gold color harmony, beautifully detailed. No text, no logos, no watermark, no border.

## `assets/images/justice.webp`

1000 × 667 px. Итоговый запрос:

> Use case: product-mockup. Asset type: law firm about section photograph, landscape 1536x1024. A realistic fine bronze statue of blindfolded Lady Justice holding an elegant balance scale in her raised right hand, waist-up, classical draped gown. Statue on left center, scales visible on right. Dark elegant legal library with out-of-focus old brown leather books behind, warm rim lighting, antique brass highlights, refined cinematic photography. Whole head and scales visible with space at all edges for responsive crop. No text, no logos, no letters, no border.

## `assets/images/office-meridian.webp`

452 × 800 px. Фотография входа в бизнес-центр «Меридиан» предоставлена пользователем. Сохранена в WebP без генерации, ретуши и изменения размеров. В блоке контактов CSS кадрирует вертикальный снимок с сохранением вывески.


## `assets/images/portraits.webp`

600 × 200 px, три иллюстративных портрета в одном спрайте. CSS показывает соответствующую треть без дополнительных запросов. Итоговый запрос:

> Use case: photorealistic-natural. Asset type: a single horizontal sprite strip of three fictional generic customer portrait photos for a website mockup. Output exactly 3:1 aspect ratio. Three equally sized SQUARE photo panels side-by-side, with absolutely no space, no borders or dividers between panels. Each head centered exactly in its own third, full head and shoulders visible, plain light warm gray background, subtle natural studio light. Left panel: friendly 38-year-old dark-haired man with a neat short dark beard, white shirt, navy blazer. Center panel: friendly 34-year-old woman with shoulder-length light brown hair in a cream blouse. Right panel: friendly 42-year-old clean-shaven dark-haired man with short haircut and navy suit, white shirt. Natural modest smiles, realistic editorial headshots. No text, no letters, no watermark.

## Логотип и эмблема

`assets/images/lion.png` — лев со щитом из предоставленного пользователем логотипа, фон и надписи удалены встроенным ImageGen. Изображение уменьшено и сжато для сайта с сохранением прозрачности.

Итоговый запрос обработки:

> Use case: background-extraction. Edit target: the attached gold Arsenal law firm logo. Extract ONLY the existing golden lion head inside its shield from the upper part of this exact image. Preserve the lion and shield geometry, facial details, flowing mane, gold tones and original proportions precisely. Remove ALL beige background including every negative space inside the shield and between the mane shapes, remove all lettering АРСЕНАЛ / ЮРИДИЧЕСКОЕ АГЕНТСТВО and all horizontal decorations below the emblem. The output must contain only the SAME lion-and-shield emblem on true transparent background, tightly framed with a small uniform transparent margin, fully visible with no clipping. Do not redesign, simplify, add strokes, add text, add shadows on the background, or change the emblem silhouette. Clean alpha edges suitable for a dark navy website header.

`assets/images/logo.svg` — готовый горизонтальный логотип для шапки и подвала. Эмблема встроена в файл, надписи векторные. Размер нижней строки увеличен с 7,3 до 11,4 единицы; обе строки имеют ширину 193 единицы и совпадающие правые края.

Фавиконы `assets/images/favicon-lion-32.png` и `assets/images/favicon-lion-192.png` созданы из `lion.png`: только лев со щитом, без надписей, с прозрачным фоном. Размеры — 32 × 32 и 192 × 192 px.

## Другие векторные материалы

`icons.svg` и `map.svg` нарисованы для этой вёрстки. Карта условная; для точного маршрута служит ссылка на Яндекс Карты. Спрайт иконок из `icons.svg` также встроен в `index.html`, чтобы иконки работали при открытии HTML напрямую с диска.
