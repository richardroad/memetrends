# Промпты: иней, туман, трава

Промпты на английском: генераторы понимают его лучше. Пояснения на русском.

## Как работать

1. **Кадр.** Делаешь стартовый кадр в Midjourney или Flux. Генеришь 10–20 вариантов и выбираешь 1–2 сильных.
2. **Видео.** Загружаешь этот кадр в Kling, Veo или Runway (режим image-to-video) и добавляешь промпт движения из блоков ниже. Так результат контролируется в разы лучше, чем видео с нуля.
3. **TouchDesigner.** Клипы зацикливаешь, замедляешь, наслаиваешь друг на друга. Цвет, яркость и скорость привязываешь к треку.

## Правила под LED-экран

- **Фон чёрный.** На LED чёрный пиксель выключен, поэтому свет на чёрном выглядит дорого, а серый фон выглядит дёшево.
- **Медленно.** Движение камеры медленное, скорость роста лучше замедлить в 2–4 раза уже в TD. Быстрая генерация выглядит дёргано.
- **Без людей, текста и логотипов.**
- **Формат 16:9.** Если знаешь пропорции конкретного экрана (бывают 32:9, 3:1, вертикальные), генерируй сразу под них.
- **Лучше 5 секунд идеально, чем 10 средне.** Длину добираешь петлёй и наслоением.

## Как устроен промпт

`[объект] + [процесс] + [свет] + [оптика] + [палитра] + [настроение] + [техника]`

Самое важное здесь свет и оптика. Именно они отличают «вау» от «колхоза»: контровой свет, макро, малая глубина резкости, блики, тёмный фон.

---

## A. Иней: макро

**A1. Иглы на стебле**
```
extreme macro photograph of hoarfrost crystals growing on a thin dry grass stem, delicate feathery ice needles branching at sixty degrees, backlit by a single cold light source, crystals glowing at the edges, razor-thin depth of field, soft bokeh, pure black background, cold silver and pale cyan palette, silent, fragile, cinematic, high detail --ar 16:9 --style raw
```

**A2. Ветка в кристаллах на чёрном**
```
macro shot of a dark twig completely covered in long hoarfrost needles, ice crystals catching rim light, tiny prismatic sparkles on crystal tips, shallow depth of field, deep black void background, monochrome with faint blue tint, minimal composition, high contrast, fine art photography --ar 16:9 --style raw
```

**A3. Рост кристалла, лаборатория**
```
scientific microscope photograph of an ice crystal dendrite forming, hexagonal branching structure, light refracting through transparent ice, faint rainbow dispersion at edges, darkfield illumination, black background, glowing white structure, ultra detailed, abstract and precise --ar 16:9 --style raw
```

**A4. Иней на паутине**
```
frozen spider web covered in tiny ice crystals, each thread beaded with frost, backlit by low moonlight, glowing threads in darkness, extreme shallow depth of field, black background, silver light, ethereal and quiet --ar 16:9 --style raw
```

**A5. Тёплый вариант, рассвет**
```
macro hoarfrost on a dry plant stem at dawn, low golden-pink sunlight shining through ice needles, crystals glowing like fiber optics, soft haze, dark background, warm rose and amber light against cold ice, cinematic, delicate --ar 16:9 --style raw
```

**Движение для A** (вставлять в image-to-video):
```
ice crystals slowly grow and branch outward in real time, needles extending and splitting, light glints travel across the crystal tips, very slow camera push-in, macro, no camera shake, smooth and hypnotic
```
```
static macro camera, frost forming on the stem, crystals appearing and lengthening, focus slowly racks from the foreground needles to the background, sparkles flicker on the ice
```

---

## B. Высокая трава и туман

**B1. Поле в тумане, контровой свет**
```
tall wild grass silhouettes in dense ground fog at night, a single distant light behind the fog creating volumetric light rays through the grass, fog glowing softly, deep black foreground, cold blue-grey palette, quiet, vast, cinematic wide shot, film grain --ar 16:9 --style raw
```

**B2. Трава в инее, низкая камера**
```
low camera among frosted tall grass stems, each stem covered in white hoarfrost, mist drifting between them, backlight from a low moon, strong depth of field falloff, foreground stems out of focus, black sky, silver and teal tones, melancholic and beautiful --ar 16:9 --style raw
```

**B3. Туман как жидкость**
```
slow rolling fog flowing like liquid over a dark field of grass, fog lit from behind by a soft cold light, layers of mist with visible depth, grass tips piercing the fog surface, dark and minimal, long exposure feel --ar 16:9 --style raw
```

**B4. Один стебель**
```
a single tall grass stem in total darkness, covered in frost, lit by a thin beam of light through fog, the beam visible in the air, everything else black, minimal, monumental, cinematic --ar 16:9 --style raw
```

**Движение для B:**
```
fog slowly flows from left to right through the grass, light rays shift and breathe, grass gently sways, very slow lateral dolly camera movement, atmospheric, seamless
```
```
camera slowly rises from the ground through frosted grass into the fog, light source becomes visible behind the mist, volumetric rays intensify
```

---

## C. Абстракция изо льда

Здесь уже не изображение инея, а свет и структура.

**C1. Светящиеся нити**
```
abstract structure of glowing ice filaments branching in darkness, resembling frost, neurons and lightning at the same time, thin luminous lines, subtle chromatic dispersion, black void, minimal, elegant, high-end generative art --ar 16:9 --style raw
```

**C2. Преломление**
```
abstract close-up of light passing through clear ice, caustic patterns, refracted beams, prismatic edges, deep black background, cold white with thin spectral rainbow fringes, macro, minimal, hypnotic --ar 16:9 --style raw
```

**C3. Кристаллическая решётка**
```
infinite hexagonal ice crystal lattice in black space, glowing edges, depth of field, some areas sharp and some dissolving into bokeh, monochrome silver, precise and cold, architectural, minimal --ar 16:9 --style raw
```

**C4. Таяние**
```
ice crystal structure slowly melting into glowing liquid droplets and mist, transition from geometric frost to soft vapor, backlit, black background, silver to pale violet palette, macro, poetic --ar 16:9 --style raw
```

**Движение для C:**
```
luminous filaments slowly grow and branch, light pulses travel along the lines like signals, camera drifts forward through the structure, depth of field shifting, endless and meditative
```

---

## D. Луна, но не в лоб

**D1. Луна сквозь лёд**
```
the moon seen through a frosted glass surface covered in ice crystals, moonlight scattering through the frost, crystals glowing in silhouette against the lunar disc, black sky, silver and cold blue, macro foreground with blurred moon --ar 16:9 --style raw
```

**D2. Луна за травой в тумане**
```
full moon low on the horizon behind tall frosted grass, dense fog glowing with moonlight, grass silhouettes in the foreground, volumetric light, black and silver palette, cinematic, quiet --ar 16:9 --style raw
```

**D3. Отражение**
```
reflection of the moon on a thin sheet of ice with frost patterns, cracks and crystals catching the light, top-down view, black water beneath, silver light, minimal, abstract --ar 16:9 --style raw
```

---

## Чего избегать

Если результат выглядит дёшево, обычно в промпте:
- **«Fantasy», «magical», «beautiful landscape».** Получается обои с рабочего стола.
- **Много цветов.** Держись 1–2 цветов плюс чёрный.
- **Лишние объекты.** Каждый новый объект удешевляет кадр.
- **«4k, 8k, ultra realistic».** Почти ничего не даёт. Лучше описывать оптику: macro, shallow depth of field, backlit, rim light.

## Слова, которые реально меняют картинку

- **Свет:** backlit, rim light, single light source, volumetric light, darkfield illumination.
- **Оптика:** extreme macro, razor-thin depth of field, bokeh, focus rack.
- **Фон:** pure black background, black void.
- **Настроение:** silent, fragile, monumental, meditative.
