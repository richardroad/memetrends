# Персонаж для Платины: фэнтези-версия

Задача: сделать персонажа, который узнаётся как Платина, но живёт в фэнтези-мире в духе японских RPG вроде Final Fantasy. Потом с этим персонажем делаем концертные визуалы.

Важно: это его лицо на больших экранах, поэтому покажи ему наброски до того, как пойдёшь дальше.

## Что берём из его образа

Из фото считывается:
- **Волосы.** Длинные прямые светлые, пробор посередине. Это главный узнаваемый элемент, его держим всегда.
- **Лицо.** Бледное, светлые глаза, отстранённый взгляд вниз.
- **Одежда.** Длинное серое пальто с меховым воротником, чёрный худи с капюшоном, чёрная кожаная куртка, клетчатые штаны, чёрные очки.
- **Цветовой акцент.** Красная кепка. На фоне серо-чёрного это единственное яркое пятно.
- **Атмосфера.** Пасмурное небо, пар из люков Нью-Йорка, дым, туман. Это прямо совпадает с нашими образами тумана и инея.
- **Гитара.** Есть фото с гитарой, это его ироничный рок-н-ролл.

## Как перевести в фэнтези

| В жизни | В фэнтези |
|---|---|
| Имя «Платина» | Доспехи и детали из платины, холодный металлический блеск |
| Пальто с меховым воротником | Длинный плащ странника с тёмным меховым воротом |
| Чёрный капюшон | Капюшон мага или странника |
| Очки | Кристаллический визор или полоска тёмного стекла |
| Красная кепка | Один красный акцент: лента, камень, рукоять, подкладка плаща |
| Гитара | Огромное оружие-гитара, меч с грифом и струнами |
| Пар и туман | Магический туман, ледяные кристаллы вокруг персонажа |

**Центральный мотив — кристалл.** В JRPG кристаллы это сердце мира, а у нас уже есть образ инея. Это связывает всё в одну вселенную: Платина как хранитель ледяного кристалла.

## Три направления стиля

**1. Кинематографичный CG.** Как заставки из современных JRPG: полу-реалистичный 3D, дорогой свет, детализированная одежда. Самое эффектное для больших экранов.

**2. Ретро PS1 low-poly.** Угловатый 3D конца 90-х с пиксельными текстурами. Сейчас очень в тренде в рэп-визуалах, ироничный и сразу узнаваемый. Хорошо ложится на его самоиронию («Я тебя затроллил»).

**3. Акварельный концепт-арт.** Тонкие чернильные линии, акварель, воздушные длинные волосы, бледные цвета, золото. Так выглядели ранние концепты японских фэнтези-игр. Его длинные волосы идеально подходят.

## Пайплайн

1. **Лист персонажа.** Генерируешь персонажа в позе стоя на нейтральном фоне. Для сходства загружаешь его фото как референс: в Midjourney это omni/character reference, в Flux Kontext или Nano Banana просто прикладываешь фото и пишешь «turn this person into...».
2. **Разворот.** Вид спереди, сбоку, сзади, плюс крупный план лица. Это нужно, чтобы персонаж был одинаковым во всех следующих кадрах.
3. **Сцены.** Тот же персонаж в разных мирах: в тумане, среди кристаллов, на руинах.
4. **Видео.** Кадр со сценой отправляешь в image-to-video: медленный разворот плаща, туман, свет.
5. **TouchDesigner.** Персонаж как центральный слой, вокруг частицы, кристаллы, туман, реакция на трек.

## Промпты: персонаж

**P1. Кинематографичный CG, лист персонажа**
```
full body character design of a young man with very long straight platinum blond hair parted in the middle, pale skin, light grey eyes, calm detached gaze looking down, wearing a long dark grey wanderer's coat with a thick black fur collar, black hood resting on the shoulders, platinum metal armor plates on one shoulder and forearm, a single red ribbon tied on the wrist, slim dark crystal visor, standing on a plain dark grey background, Japanese fantasy RPG cinematic CG style, detailed fabric, soft studio rim light, high-end game character render --ar 2:3 --style raw
```

**P2. Разворот персонажа**
```
character turnaround sheet, same young man with very long straight platinum blond hair, long dark grey coat with black fur collar, platinum armor details, red ribbon accent, front view, side view, back view, plus close-up of the face, neutral pose, plain light grey background, consistent design, Japanese fantasy RPG CG style, clean presentation --ar 16:9 --style raw
```

**P3. Ретро PS1 low-poly**
```
low-poly 3D character from a 1997 PlayStation fantasy RPG, young man with long blond hair made of flat polygon strands, dark grey coat with fur collar, red ribbon accent, holding an oversized sword shaped like an electric guitar, pixelated low resolution textures, vertex lighting, slight polygon jitter, standing in a foggy pre-rendered background, nostalgic and ironic --ar 16:9
```

**P4. Акварельный концепт-арт**
```
delicate fantasy concept art, ink line and watercolor, ethereal young man with extremely long flowing platinum hair, pale face, long coat with a fur collar becoming wisps of mist, fragile ice crystals floating around him, muted silver, grey and pale gold palette, one red accent, lots of empty paper space, elegant, dreamlike, Japanese fantasy illustration style --ar 2:3
```

**P5. Оружие-гитара**
```
fantasy weapon design, a huge two-handed sword shaped like an electric guitar, platinum blade forming the guitar body, strings running along the blade, crystal inlays glowing pale cyan, red grip wrap, displayed on a dark background, Japanese fantasy RPG prop design, detailed, cinematic lighting --ar 16:9 --style raw
```

## Промпты: сцены для концерта

**S1. Силуэт в тумане**
```
lone figure with very long platinum hair and a long coat with fur collar standing in dense glowing fog, seen from behind, a massive ice crystal floating in the distance emitting cold light, volumetric light rays, black and silver palette with one red accent, Japanese fantasy RPG cinematic, epic scale, minimal --ar 16:9 --style raw
```

**S2. Хранитель кристалла**
```
the platinum-haired wanderer standing before a giant glowing ice crystal in a dark cathedral of frost, hoarfrost growing over ancient stone, crystal light reflecting on his armor, fog on the floor, cinematic low angle, Japanese fantasy RPG cutscene, cold blue and silver, black background --ar 16:9 --style raw
```

**S3. Призыв на дроп**
Момент для кульминации трека: огромное существо появляется за персонажем, как призыв в JRPG.
```
the platinum-haired wanderer raises his guitar-sword, behind him an enormous ice dragon made of frost crystals materializes out of the fog, magic circle of glowing runes on the ground, shards of ice in the air, dramatic backlight, Japanese fantasy RPG summon scene, cinematic, black and silver with pale cyan glow --ar 16:9 --style raw
```

**S4. Город в тумане**
Отсылка к фото в Нью-Йорке с паром из люков.
```
fantasy version of a night city street, steam rising from the ground in huge columns lit by orange and red lanterns, the platinum-haired wanderer in a long coat standing alone in the middle of an empty crossroads, fog everywhere, glowing crystal streetlights, Japanese fantasy RPG cinematic CG, moody --ar 16:9 --style raw
```

**S5. Ретро-сцена PS1**
```
pre-rendered background from a 1997 PlayStation fantasy RPG, foggy frozen forest with crystals, low-poly blond character with a guitar-sword walking toward a glowing save-point crystal, pixelated textures, dithering, nostalgic --ar 16:9
```

**Движение для сцен:**
```
slow cinematic camera orbit around the character, coat and long hair moving in the wind, fog drifting, crystal light slowly pulsing, ice particles floating upward, no sudden movement
```
```
the giant creature slowly emerges from the fog behind the character, light intensifies, ice shards spread outward, camera slowly pulls back to reveal the scale
```

## Как связать с концертом

- **Интро.** Туман, тишина, издалека проявляется силуэт.
- **Куплеты.** Персонаж почти статичен, вокруг растёт иней, медленно плывёт камера.
- **Дроп.** Призыв: существо из кристаллов вырастает за ним на весь экран.
- **Аутро.** Всё замерзает и рассыпается в туман.
