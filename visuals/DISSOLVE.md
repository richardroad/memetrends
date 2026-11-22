# Расщепление: образы, которые распадаются

Сквозной мотив, который всплывает снова и снова: Луна расщепляется, иней тает в туман, роза распадается на атомы, силуэт уносит ветер. Похоже, это и есть зерно собственного стиля: **красота в момент распада и сборки.**

## Почему это работает на концерте

- **Есть процесс.** Распад и сборка сами по себе драматургия: целое → трещина → разлёт → пустота → новая сборка.
- **Естественно ложится на трек.** Нарастание: первые частицы отрываются. Дроп: образ разлетается. Брейкдаун: частицы висят в воздухе. Финал: всё собирается обратно.
- **Обратный ход ещё сильнее.** Если из хаоса пыли на дропе собирается роза или лицо, зал считывает это мгновенно.

## Как делать технически

**Вариант 1: генерация видео.** Image-to-video с промптом про распад. Быстро, но контроль слабый: частицы ведут себя как хотят, и иногда это выглядит дёшево.

**Вариант 2: генерация + TouchDesigner (сильнее).**
1. Генерируешь идеальный статичный кадр: роза в руке, силуэт.
2. В TD превращаешь картинку в облако частиц: каждый пиксель становится точкой со своим цветом.
3. Дальше управляешь распадом сам: ветер, шум, вихрь, гравитация. Порог распада ползёт по картинке, и сила зависит от трека.
4. Ту же систему можно запустить обратно: частицы слетаются и собирают образ.

Это даёт полный контроль над таймингом: распад ровно на дропе, а не когда захотелось генератору.

## Образы

### Роза в руке
- Рука держит розу, лепестки по одному отрываются и на лету распадаются на светящуюся пыль.
- Пыль закручивается и собирается в модель атома или в созвездие.
- Вариант со льдом: роза замерзает, покрывается инеем и рассыпается осколками (связь с «Инеем»).
- Обратный ход: из пыли на дропе собирается роза.

### Два силуэта
- Мужской и женский силуэт стоят друг напротив друга в пустоте.
- Порыв ветра срывает женский силуэт: он распадается на частицы, лепестки или птиц, и они обвивают второй силуэт.
- Частицы улетают, второй остаётся один. Или наоборот: частицы собираются у него за спиной в её контур.
- Связь с Сашей Вортекс: она сама становится ветром. Её силуэт распадается и превращается в вихрь.

### Ещё образы в этой линии
- **Мраморная статуя.** Трескается, изнутри пробивается свет, куски отлетают и висят в воздухе.
- **Портрет из мотыльков.** Лицо сложено из тысяч мотыльков, они вспархивают и разлетаются.
- **Песочные часы.** Песок не падает вниз, а поднимается и складывается в фигуру.
- **Рука тянется к свету.** Пальцы растворяются в светлячков.
- **Сердце.** Анатомическое сердце распадается на лепестки.
- **Зеркало.** Разбивается, и в каждом осколке свой мир.
- **Дым.** Дым от сигареты (отсылка к фото Платины) складывается в лицо и тут же развеивается.

## Промпты

Флаги `--ar` и `--style raw` только для Midjourney. Тёмный фон, один-два цвета.

### Роза
```
a hand holding a single red rose against a pure black background, the petals disintegrating into thousands of glowing particles drifting away, the dissolution starting from the edges of the petals, fine dust catching the light, dramatic side light, cinematic, elegant, high detail --ar 16:9 --style raw
```
```
a red rose breaking apart into atoms, petals turning into tiny glowing spheres that orbit around the remaining stem like an atomic model, scientific visualization meets fine art, black background, red and white light, precise and poetic --ar 16:9 --style raw
```
```
a rose completely covered in hoarfrost, frozen solid, shattering into ice shards and white powder, fragments suspended in mid-air, backlit, black background, cold silver light with deep red inside the petals, high-speed photography --ar 16:9 --style raw
```

### Два силуэта
```
two silhouettes facing each other in an empty dark space, a man and a woman, the woman's silhouette being torn apart by wind into thousands of particles and petals, the particles streaming past the man, dramatic backlight, fog, minimal, cinematic, emotional --ar 16:9 --style raw
```
```
a woman's silhouette dissolving into a swirling vortex of black feathers and light particles, her shape still readable at the center while the edges spiral away, black background, silver and pale violet, elegant, dynamic --ar 16:9 --style raw
```
```
a lone male silhouette standing in fog, behind him thousands of glowing particles gathering into the outline of a woman, light emanating from the forming shape, black background, cold and warm light meeting, cinematic, quiet --ar 16:9 --style raw
```

### Остальные образы
```
a white marble statue of a human torso cracking apart, intense light pouring out from inside through the cracks, fragments of marble floating around it, black background, dramatic, sculptural, cinematic --ar 16:9 --style raw
```
```
a human face made entirely of thousands of white moths, the moths beginning to take flight from the edges and scatter into darkness, the face slowly disappearing, black background, eerie and beautiful --ar 16:9 --style raw
```
```
an hourglass where the sand flows upward instead of down and forms the shape of a human figure above the glass, fine sand particles glowing in a single beam of light, black background, surreal, minimal --ar 16:9 --style raw
```
```
cigarette smoke curling upward and briefly forming the profile of a human face before dissolving, backlit smoke on a pure black background, delicate, high detail, monochrome --ar 16:9 --style raw
```

### Движение для видео
```
the object slowly disintegrates into glowing particles starting from the edges, the particles drift away on a gentle wind and spiral, very slow motion, the remaining form stays sharp, black background, seamless and smooth
```
```
reverse disintegration: thousands of particles fly in from the darkness and assemble into the shape, final form appears with a soft flash of light, slow motion
```
```
a gust of wind tears the silhouette apart into petals and particles that swirl into a vortex and fly out of frame, the other silhouette remains still, fog moves with the wind
```
