# Саша Вортекс: визуал-вихрь для диджей-сетов

Вортекс — это вихрь. Вся визуальная система строится вокруг вращения, затягивания в центр и выброса наружу.

## Главная идея: сет как ураган

У урагана есть готовая драматургия, и она совпадает с устройством диджей-сета:

- **Формирование.** Начало сета: облака и частицы начинают медленно закручиваться, вихря ещё нет.
- **Затягивание.** На нарастании вращение ускоряется, спираль сжимается, всё тянет к центру.
- **Глаз бури.** Брейкдаун: внутри урагана тишина. Центр экрана чистый, спокойный, ясное небо или пустота, а по краям продолжает бушевать стена.
- **Удар.** Дроп: вихрь выбрасывает всё наружу, частицы, осколки, свет.
- **Рассеивание.** Конец трека или переход: вихрь распадается и превращается в следующий стиль.

Так визуал не дёргается в такт, а живёт вместе с аркой трека. Бас задаёт давление и плотность, нарастание задаёт скорость вращения, тишина открывает глаз бури.

## Стили

Один и тот же вихрь в разных материалах. Можно менять стиль на каждый трек или блок сета.

1. **Стихия.** Настоящая суперячейка, торнадо в степи, вращающиеся облака, съёмка с дрона и таймлапс.
2. **Жидкость.** Водоворот, чернила в воде, закрученные потоки краски, макро.
3. **Космос.** Спиральная галактика, аккреционный диск чёрной дыры, искривление света.
4. **Фрактал.** Логарифмические спирали, бесконечное погружение во фрактал, спирали Фибоначчи как в подсолнухе.
5. **Символы.** Вихрь из букв, глифов и цифр, её имя, затягиваемое в воронку, кириллица и японская катакана вперемешку.
6. **Материя.** Песок, пепел, перья, лепестки, осколки стекла, шёлковые ленты, которые закручивает ветер.
7. **Свет.** Спирали света на длинной выдержке, лазерные лучи, светящиеся следы.
8. **Оп-арт.** Чёрно-белые гипнотические спирали, одна тонкая линия, минимализм. Особенно сильно на LED.
9. **Со спутника.** Глаз урагана сверху: облачная спираль над тёмным океаном.

## Почему здесь хорош TouchDesigner

В отличие от инея, вихрь — это то, что реалтайм-графика делает по-настоящему красиво. Основные приёмы:

- **Feedback-тоннель.** Feedback TOP плюс Transform с лёгким поворотом и уменьшением. Каждый кадр затягивается внутрь, получается бесконечная воронка. Это база, из которой растёт половина вихревых визуалов.
- **Твирл сгенерированного видео.** Берёшь клип из генерации (облака, чернила) и закручиваешь его в GLSL через полярные координаты. Сила закрутки идёт от трека.
- **Частицы.** Тысячи частиц с силой вихря и curl noise, они затягиваются в центр и вылетают на дропе.
- **Текст по спирали.** Её имя или символы, размноженные instancing-ом по логарифмической спирали.
- **Слои.** Генерация (материал и фактура) снизу, реалтайм-вращение и частицы сверху.

Связка с треком:
- **Нарастание** → скорость вращения и сжатие спирали.
- **Бас** → давление: плотность, контраст, сила затягивания.
- **Хай-хэты** → искры и мелкие частицы по краю.
- **Брейкдаун** → открывается глаз бури.

## Промпты

Как обычно: кадр в Midjourney или Flux, потом image-to-video. Флаги `--ar` и `--style raw` только для Midjourney. Чёрный фон и 1–2 цвета, чтобы на LED выглядело дорого.

### 1. Стихия
```
massive rotating supercell thunderstorm at night seen from the ground, the cloud structure forming a perfect spiral, lightning illuminating the vortex from inside, a thin tornado descending to the dark plain, cold blue and violet light, epic scale, cinematic, long exposure feeling --ar 16:9 --style raw
```
```
looking straight up into the rotating core of a tornado, walls of dark cloud spinning around a bright circular opening in the center, debris and dust caught in the rotation, dramatic light from the eye, overwhelming scale, cinematic --ar 16:9 --style raw
```

### 2. Жидкость
```
macro photograph of black and silver ink swirling into a perfect vortex in clear water, fine filaments spiraling toward the center, backlit, pure black background, liquid metal sheen, elegant, hypnotic, high detail --ar 16:9 --style raw
```
```
top-down macro of a whirlpool of iridescent paint, thin colorful bands spiraling into a dark center, oil and water interference colors, glossy, black edges, abstract, mesmerizing --ar 16:9 --style raw
```

### 3. Космос
```
accretion disk of a black hole, glowing ring of plasma spiraling into a perfect black center, light bending around the event horizon, orange and white heat against deep black space, cinematic scientific visualization, minimal and monumental --ar 16:9 --style raw
```
```
spiral galaxy seen face-on, billions of stars forming swirling arms around a bright core, pink nebula clouds along the arms, dust lanes, deep black space, astronomical photograph, majestic --ar 16:9 --style raw
```

### 4. Фрактал
```
infinite fractal spiral zoom, logarithmic spirals branching into smaller spirals, glowing thin lines on black, mathematical precision, silver and electric violet, depth and recursion, hypnotic generative art --ar 16:9 --style raw
```
```
golden ratio vortex made of thousands of tiny glowing seeds arranged in fibonacci spirals like a sunflower head, seen from the front, black background, pale gold light, organic and mathematical, macro --ar 16:9 --style raw
```

### 5. Символы
```
a vortex made of thousands of floating letters and glyphs, cyrillic and japanese katakana characters spiraling into a dark center, characters glowing white and fading into motion blur, black background, typographic art, dynamic and hypnotic --ar 16:9 --style raw
```
```
the word VORTEX dissolving into a spiral of small typographic fragments, letters stretched and twisted by rotation, monochrome, sharp black and white, swiss graphic design meets motion, minimal --ar 16:9 --style raw
```

### 6. Материя
```
a vortex of black feathers and white ash spiraling in the air against a black background, frozen in motion, some feathers sharp and some blurred, dramatic side light, elegant, dark, high-speed photography --ar 16:9 --style raw
```
```
long ribbons of liquid silk twisting into a spiral vortex, soft folds catching the light, pearl white and deep red, black background, fluid motion, luxury fashion film aesthetic --ar 16:9 --style raw
```
```
shards of broken glass caught in a tornado, each shard reflecting colored light, spiraling around a bright center, black background, frozen explosion, cinematic --ar 16:9 --style raw
```

### 7. Свет
```
long exposure light painting of a perfect spiral vortex, thin luminous trails converging into a bright center, laser-like precision, cyan and magenta on pure black, abstract, clean --ar 16:9 --style raw
```

### 8. Оп-арт
```
black and white op art hypnotic spiral, thin precise lines creating an illusion of rotation and depth, perfectly geometric, high contrast, minimal, optical illusion --ar 16:9 --style raw
```

### 9. Со спутника
```
satellite view of a giant hurricane over a dark night ocean, perfect cloud spiral with a clear eye in the center, lightning flashes inside the cloud bands, city lights on the coastline, cinematic, NASA-like photography --ar 16:9 --style raw
```

### Движение для видео
```
the vortex rotates slowly and continuously, spiral arms tightening toward the center, particles drawn inward, smooth hypnotic motion, seamless loop, no camera shake
```
```
slow camera push into the center of the vortex, the walls spinning faster around the lens, light growing brighter at the core
```
```
the vortex suddenly bursts outward, all particles flying away from the center in a shockwave, then slowly begin to spiral again
```

## Её личная деталь

Сделать знак Саши Вортекс: её имя или монограмма, которые затягивает в вихрь и выбрасывает обратно. Знак появляется в начале сета, на ключевых дропах и в финале. Это делает визуал её собственным, а не просто «красивые спирали».
