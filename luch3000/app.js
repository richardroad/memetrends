/*
 * ЛУЧ-3000 — приложение.
 * Модули: журнал · стили и пресеты · хранилище · деки A/B · крутилки · модуляция · звук · такт · эффекты ·
 *         библиотека · ИИ (режиссёр и кузница) · MIDI · скины · выход · клавиатура · цикл кадра.
 */
(() => {
const $ = id => document.getElementById(id);
const clamp01 = v => Math.min(1, Math.max(0, +v || 0));
const POST_KEYS = [["trail", "Шлейф"], ["zoom", "Зум"], ["twist", "Вращение"], ["bloom", "Свечение"], ["chroma", "RGB-сдвиг"], ["scan", "Развёртка"]];
const DEFAULT_POST = { trail: .3, zoom: .5, twist: .5, bloom: .5, chroma: .2, scan: .25 };
const SOURCES = [["bass", "Бас"], ["mid", "Середина"], ["high", "Верх"], ["level", "Уровень"], ["beat", "Бит"], ["bar", "Фаза такта"], ["lfo1", "LFO 1"], ["lfo2", "LFO 2"], ["rand", "Случай"], ["onset", "Атака"]];
const SRC_NAME = Object.fromEntries(SOURCES);
const LENSES = [
  ["none", "Без линзы", "чистый стиль"], ["ascii", "ASCII", "терминалы 1970-х"], ["pixel", "8 бит", "приставки 1980-х"], ["halftone", "Растр", "поп-арт 1960-х"],
  ["stained", "Витраж", "готика XIII века"], ["mosaic", "Смальта", "Византия VI века"], ["engraving", "Гравюра", "XVI век"], ["vhs", "VHS", "1990-е"],
  ["film", "Кинохроника", "1920-е"], ["pointil", "Пуантилизм", "1880-е"], ["thermal", "Тепловизор", "научная съёмка"], ["neon", "Неон-контур", "1980-е"],
];
const LENS_IDX = Object.fromEntries(LENSES.map((l, i) => [l[0], i]));
const SYMBOL_SETS = [
  ["runes", "Руны", "эпоха викингов", "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ"],
  ["alchemy", "Алхимия", "Средневековье", "☉☽☿♀♁♂♃♄♅♆♇△▽⊕⊗☊☋✶"],
  ["zodiac", "Зодиак", "античность", "♈︎♉︎♊︎♋︎♌︎♍︎♎︎♏︎♐︎♑︎♒︎♓︎"],
  ["geometry", "Геометрия", "сакральные знаки", "◯△▽◇□☆✶✷✸✹❂⊙⊚✡✦✧⌘❖✺✵"],
  ["katakana", "Катакана", "Токио 1980-х", "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン"],
  ["slavonic", "Азбука", "старославянская", "АБВГДЕЖЅЗИІКЛМНОПРСТУФХѠЦЧШЩЪЫЬѢЮꙖѦѪѮѰѲѴ"],
  ["binary", "Машинный код", "1970-е", "01ABCDEF▓▒░█▄▀■□▪▫◘◙⌂"],
  ["luch", "Борт-3000", "знаки систем", "⏚⌁⌖⌗⌘⌬⍟⎈⎉⎊⏣⏥⟁⟐⧫◬◭◮⊛⊜"],
];
const SYM_MODES = [["0", "выкл"], ["1", "дождь"], ["2", "орбита"], ["3", "сетка"], ["4", "знак"]];
const ERA_PALETTES = [
  ["Конструктивизм 1920", ["#0b0907", "#a3121b", "#d8cdb3", "#fffaf0"]], ["Византийское золото", ["#05060f", "#1d2b6b", "#c9932e", "#fff1c2"]],
  ["Укиё-э индиго", ["#03070d", "#1b3a5c", "#7fa7c4", "#f2ead8"]], ["Поп-арт 1960", ["#050505", "#ff1f5a", "#00b4d8", "#ffe600"]],
  ["Психоделия 1967", ["#120018", "#ff5e00", "#c724b1", "#f9f871"]], ["Неон 1984", ["#04000a", "#ff2a9d", "#00e5ff", "#fefefe"]],
  ["Оп-арт", ["#000000", "#1a1a1a", "#d8d8d8", "#ffffff"]], ["Тушь и бумага", ["#020202", "#2b2b2b", "#9a948a", "#f0e9dc"]],
  ["Советская мозаика", ["#06070a", "#b3261e", "#e0a43a", "#e9e4d6"]], ["Готический витраж", ["#020208", "#7a0a1f", "#1f4fd1", "#ffd86b"]],
  ["Аврора", ["#000308", "#00553a", "#3dffb0", "#e6d0ff"]], ["Вапорвейв", ["#0b0221", "#7b2cbf", "#ff71ce", "#01cdfe"]],
  ["Ледяной", ["#020409", "#1c2c44", "#9fc4e8", "#f4f9ff"]], ["Огонь", ["#0a0200", "#7a1300", "#ff6a00", "#ffe2a8"]],
];
const LOOK_KEYS = [["lensAmt", "Сила линзы", 1], ["lensP", "Масштаб", .5], ["symAmt", "Яркость знаков", .8], ["symSize", "Размер знаков", .35], ["symDen", "Плотность", .5]];
const DEFAULT_LOOK = { lens: "none", sym: "runes", symMode: 0, lensAmt: 1, lensP: .5, symAmt: .8, symSize: .35, symDen: .5 };

/* ================= engine ================= */
let E;
try { E = new LuchEngine($("stage")); }
catch (e) { document.body.insertAdjacentHTML("beforeend", '<div class="fail">Нужен WebGL2. Открой ЛУЧ-3000 в свежем Chrome, Safari или Firefox на компьютере.</div>'); return; }

/* ================= log / toast ================= */
const pad = n => String(n).padStart(2, "0");
const stamp = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
function log(msg, kind = "") {
  const li = document.createElement("li");
  const t = document.createElement("time"); t.textContent = stamp();
  const s = document.createElement("span"); s.className = kind; s.textContent = msg;
  li.append(t, s); const ol = $("log"); ol.prepend(li);
  while (ol.children.length > 60) ol.lastChild.remove();
  return s;
}
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 2400); }
const setLed = st => { $("ledAI").className = "led " + st; };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ================= styles & presets ================= */
const styles = new Map();
LUCH_STYLES.forEach(s => styles.set(s.id, { ...s, builtin: true }));
let userPresets = [];
function hexToRGB(h) { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim()); if (!m) return [0, 0, 0]; const n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
function okHex(h, fb) { return /^#[0-9a-f]{6}$/i.test(String(h || "").trim()) ? String(h).trim().toLowerCase() : fb; }
const TARGETS = [...Array.from({ length: 8 }, (_, i) => "p" + i), ...POST_KEYS.map(k => k[0]), ...LOOK_KEYS.map(k => k[0])];
function cleanLook(o = {}, d = {}) {
  const L = { ...DEFAULT_LOOK, ...d, ...o };
  return { lens: LENS_IDX[L.lens] !== undefined ? L.lens : "none", sym: SYMBOL_SETS.some(x => x[0] === L.sym) ? L.sym : "runes", symMode: Math.max(0, Math.min(4, Math.round(+L.symMode || 0))),
    lensAmt: clamp01(L.lensAmt), lensP: clamp01(L.lensP), symAmt: clamp01(L.symAmt), symSize: clamp01(L.symSize), symDen: clamp01(L.symDen) };
}
function cleanMods(mods, style) {
  return (Array.isArray(mods) ? mods : []).map(m => ({ src: String(m?.src ?? m?.source ?? ""), dst: String(m?.dst ?? m?.target ?? ""), amt: Math.max(-1, Math.min(1, +(m?.amt ?? m?.amount ?? 0) || 0)) }))
    .filter(m => SRC_NAME[m.src] && TARGETS.includes(m.dst) && (m.dst[0] !== "p" || m.dst.length !== 2 || +m.dst[1] < style.params.length) && m.amt !== 0).slice(0, 12);
}
function makePreset(style, o = {}) {
  const p = {
    name: o.name || style.name, style: style.id,
    params: Array.from({ length: 8 }, (_, i) => clamp01(o.params?.[i] ?? style.params[i]?.def ?? .5)),
    palette: Array.from({ length: 4 }, (_, i) => okHex(o.palette?.[i], style.palette?.[i] || "#000000")),
    post: Object.fromEntries(POST_KEYS.map(([k]) => [k, clamp01(o.post?.[k] ?? style.post?.[k] ?? DEFAULT_POST[k])])),
    mods: cleanMods(o.mods ?? style.mods, style),
    look: cleanLook(o.look, style.look),
    note: o.note || "", prompt: o.prompt || "", seed: o.seed ?? Math.floor(Math.random() * 1000),
  };
  return withRGB(p);
}
function withRGB(p) { p.palRGB = new Float32Array(p.palette.flatMap(hexToRGB)); return p; }
const clonePreset = p => withRGB(JSON.parse(JSON.stringify({ ...p, palRGB: undefined })));
function sanitizeStyle(s) {
  if (!s || typeof s.glsl !== "string" || !s.glsl.includes("render")) return null;
  const params = (Array.isArray(s.params) ? s.params : []).slice(0, 8).map((p, i) => ({ name: String(p?.name || "Параметр " + (i + 1)).slice(0, 24), def: clamp01(p?.def ?? .5) }));
  return {
    id: String(s.id), name: String(s.name || "Без имени").slice(0, 40), description: String(s.description || "").slice(0, 300),
    tags: (Array.isArray(s.tags) ? s.tags : []).map(String).slice(0, 8), params: params.length ? params : [{ name: "Скорость", def: .5 }],
    palette: Array.from({ length: 4 }, (_, i) => okHex(s.palette?.[i], ["#000000", "#333333", "#999999", "#ffffff"][i])),
    post: Object.fromEntries(POST_KEYS.map(([k]) => [k, clamp01(s.post?.[k] ?? DEFAULT_POST[k])])),
    glsl: s.glsl.slice(0, 20000), prompt: s.prompt || "", builtin: false,
  };
}

/* ================= store: shared db, else this browser ================= */
const Store = {
  db: null, mode: "local",
  async init() {
    try { this.db = window.claude?.use ? await window.claude.use("db") : null; } catch (e) { this.db = null; }
    if (!this.db) { this.mode = "local"; this.loadLocal(); log("Библиотека хранится в этом браузере.", "warn"); return; }
    this.mode = "db";
    const timer = setTimeout(() => { log("База не ответила за 10 с, работаю с локальной копией.", "warn"); this.loadLocal(); }, 10000);
    const onErr = e => { clearTimeout(timer); log("База недоступна (" + (e && e.code) + "), работаю локально.", "warn"); this.mode = "local"; this.loadLocal(); };
    this.db.collection("styles").onSnapshot(snap => {
      clearTimeout(timer);
      snap.docs.forEach(d => { const s = sanitizeStyle({ ...d.data(), id: "u_" + d.id }); if (s) styles.set(s.id, s); });
      renderLibrary();
    }, onErr);
    this.db.collection("presets").onSnapshot(snap => {
      clearTimeout(timer);
      userPresets = snap.docs.map(d => ({ ...d.data(), _id: d.id })).filter(p => p && p.style).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderLibrary();
    }, onErr);
  },
  loadLocal() {
    lsGet("luch.styles", []).forEach(s => { const v = sanitizeStyle(s); if (v) styles.set(v.id, v); });
    userPresets = lsGet("luch.presets", []);
    renderLibrary();
  },
  saveLocal() { lsSet("luch.styles", [...styles.values()].filter(s => !s.builtin)); lsSet("luch.presets", userPresets.slice(0, 200)); },
  async addStyle(s) {
    const doc = { name: s.name, description: s.description, tags: s.tags, params: s.params, palette: s.palette, post: s.post, glsl: s.glsl, prompt: s.prompt || "", createdAt: Date.now() };
    if (this.mode === "db") {
      try { const ref = await this.db.collection("styles").add(doc); return "u_" + ref.id; }
      catch (e) { log("Не сохранил стиль в базу (" + (e && e.code) + "), оставил в браузере.", "warn"); }
    }
    const id = "u_" + Date.now().toString(36); styles.set(id, { ...doc, id }); this.saveLocal(); renderLibrary(); return id;
  },
  async addPreset(p) {
    const doc = { name: p.name, style: p.style, params: p.params, palette: p.palette, post: p.post, mods: p.mods || [], look: p.look || DEFAULT_LOOK, note: p.note || "", prompt: p.prompt || "", seed: p.seed || 0, createdAt: Date.now() };
    if (this.mode === "db") {
      try { await this.db.collection("presets").add(doc); return true; }
      catch (e) { log("Не сохранил пресет в базу (" + (e && e.code) + "), оставил в браузере.", "warn"); }
    }
    userPresets.unshift(doc); this.saveLocal(); renderLibrary(); return true;
  },
};

/* ================= decks A / B ================= */
const live = { a: null, b: null, x: 0, xDur: 1.5, xMode: "auto", master: 1, blackout: false, masterTarget: 1, quant: 4, pending: null, liveKey: "", cueKey: "" };
function compile(preset) {
  const st = styles.get(preset.style); if (!st) { log("Стиль «" + preset.style + "» не найден.", "err"); return null; }
  const prog = E.program(st);
  if (prog.error) { log("Стиль «" + st.name + "» не компилируется: " + String(prog.error).split("\n")[0], "err"); return null; }
  return { preset, prog, style: st, eff: { params: preset.params.slice(), post: { ...preset.post }, look: { ...preset.look }, palRGB: preset.palRGB, seed: preset.seed } };
}
function commit(slot) {
  if (!live.a || live.xDur < .05) { live.a = slot; live.b = null; live.x = 0; }
  else if (live.xMode === "manual") { live.b = slot; live.x = +$("xfader").value; $("cueLabel").textContent = "B: " + slot.preset.name.toUpperCase() + " · ВЕДИ ФЕЙДЕР"; }
  else { if (live.b) live.a = live.b; live.b = slot; live.x = .0001; }
  bindDeck(); setTicker(); markLive();
}
/** Load a preset: right away, or on the next beat or bar depending on quantise. */
function apply(preset, { instant = false, key = "" } = {}) {
  const slot = compile(preset); if (!slot) return false;
  if (instant || live.quant === 0 || !live.a || live.xMode === "manual") { if (key) live.liveKey = key; commit(slot); return true; }
  live.pending = { slot, key, at: Math.floor(Clock.pos / live.quant + 1) * live.quant };
  live.cueKey = key; markLive();
  $("cueLabel").textContent = `ДАЛЬШЕ: ${preset.name.toUpperCase()} · ${live.quant === 1 ? "НА БИТ" : "НА ТАКТ"}`;
  return true;
}
const active = () => (live.xMode === "manual" ? (live.x > .5 && live.b ? live.b : live.a) : (live.b || live.a));
function setTicker() { const s = active(); if (s) $("nowPlaying").textContent = `${s.style.name} · ${s.preset.name}`; }

/* ================= knobs ================= */
const knobs = {};
let knobSeq = 0;
function knob(host, { id, label, value, def = value, fmt, onInput }) {
  const el = document.createElement("div"); el.className = "knob"; el.tabIndex = 0; el.setAttribute("role", "slider"); el.dataset.target = id;
  el.setAttribute("aria-valuemin", "0"); el.setAttribute("aria-valuemax", "100");
  const gid = "kg" + (knobSeq++);
  el.innerHTML = `<svg viewBox="-25 -25 50 50" aria-hidden="true">
    <defs><radialGradient id="${gid}" cx="35%" cy="30%" r="80%"><stop class="s0" offset="0"/><stop class="s1" offset=".45"/><stop class="s2" offset="1"/></radialGradient></defs>
    <path class="trk" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path class="val" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path class="mod" fill="none" stroke-width="2" stroke-linecap="round"/>
    <circle r="14" fill="url(#${gid})" stroke="rgba(0,0,0,.6)"/>
    <circle r="10.5" fill="none" stroke="rgba(255,255,255,.25)"/>
    <line class="ind" x1="0" y1="-5" x2="0" y2="-12.5" stroke-width="2.2" stroke-linecap="round"/>
  </svg><span class="kv"></span><span class="kl"></span><span class="midi"></span>`;
  host.appendChild(el);
  const arc = (R, from, to) => { const pt = a => { const r = (a - 90) * Math.PI / 180; return [Math.cos(r) * R, Math.sin(r) * R]; }; const [x1, y1] = pt(from), [x2, y2] = pt(to); return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };
  el.querySelector(".trk").setAttribute("d", arc(20, -135, 135));
  let v = clamp01(value), d = def, modShown = -1;
  const api = {
    id, el, get value() { return v; },
    set(nv, lab, ndef) { v = clamp01(nv); if (lab !== undefined) el.querySelector(".kl").textContent = lab; if (ndef !== undefined) d = ndef; paint(); },
    setMod(eff) {
      const q = eff == null ? -1 : Math.round(eff * 200) / 200; if (q === modShown) return; modShown = q;
      const m = el.querySelector(".mod");
      if (q < 0 || Math.abs(q - v) < .004) { m.setAttribute("d", ""); return; }
      const a1 = -135 + Math.min(v, q) * 270, a2 = -135 + Math.max(v, q) * 270;
      m.setAttribute("d", arc(23.5, a1, a2));
    },
    input(nv) { change(nv); },
  };
  function paint() {
    const a = -135 + v * 270;
    el.querySelector(".val").setAttribute("d", v > .002 ? arc(20, -135, a) : "");
    el.querySelector(".ind").setAttribute("transform", `rotate(${a})`);
    el.querySelector(".kv").textContent = fmt ? fmt(v) : Math.round(v * 100);
    el.setAttribute("aria-valuenow", Math.round(v * 100)); el.setAttribute("aria-valuetext", el.querySelector(".kv").textContent);
    el.setAttribute("aria-label", el.querySelector(".kl").textContent);
  }
  const change = nv => { v = clamp01(nv); paint(); onInput(v); };
  let drag = null;
  el.addEventListener("pointerdown", e => {
    if (Mod.armed) { e.preventDefault(); Mod.connect(id); return; }
    if (Midi.learning) { Midi.target(el, { kind: "knob", id }); return; }
    drag = { y: e.clientY, v }; el.setPointerCapture(e.pointerId); el.focus();
  });
  el.addEventListener("pointermove", e => { if (drag) change(drag.v + (drag.y - e.clientY) / (e.shiftKey ? 600 : 160)); });
  el.addEventListener("pointerup", () => drag = null);
  el.addEventListener("pointercancel", () => drag = null);
  el.addEventListener("dblclick", () => change(d));
  el.addEventListener("wheel", e => { e.preventDefault(); change(v - Math.sign(e.deltaY) * .02); }, { passive: false });
  el.addEventListener("keydown", e => {
    const step = e.shiftKey ? .05 : .01;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); change(v + step); }
    if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); change(v - step); }
  });
  api.set(v, label); knobs[id] = api; return api;
}
const styleKnobs = [];
for (let i = 0; i < 8; i++) styleKnobs.push(knob($("styleKnobs"), { id: "p" + i, label: "", value: .5, onInput: v => { const s = active(); if (s) s.preset.params[i] = v; } }));
POST_KEYS.forEach(([k, l]) => knob($("postKnobs"), { id: k, label: l, value: DEFAULT_POST[k], onInput: v => { const s = active(); if (s) s.preset.post[k] = v; } }));
knob($("masterKnobs"), { id: "xtime", label: "Переход", value: .375, fmt: v => (v * 4).toFixed(1) + "с", onInput: v => live.xDur = v * 4 });
knob($("masterKnobs"), { id: "master", label: "Яркость", value: 1, onInput: v => live.masterTarget = v });

const swatchInputs = [];
for (let i = 0; i < 4; i++) {
  const w = document.createElement("label"); w.className = "swatch"; w.title = ["Фон", "Тень", "Свет", "Блик"][i];
  const inp = document.createElement("input"); inp.type = "color"; inp.id = "pal" + i; inp.setAttribute("aria-label", "Цвет палитры: " + w.title);
  inp.addEventListener("input", () => { const s = active(); if (!s) return; s.preset.palette[i] = inp.value; withRGB(s.preset); s.eff.palRGB = s.preset.palRGB; });
  w.appendChild(inp); $("swatches").appendChild(w); swatchInputs.push(inp);
}
function bindDeck() {
  const s = active(); if (!s) return;
  $("styleName").textContent = s.style.name;
  styleKnobs.forEach((k, i) => { const p = s.style.params[i]; k.el.hidden = !p; if (p) k.set(s.preset.params[i], p.name, p.def); });
  POST_KEYS.forEach(([k]) => knobs[k].set(s.preset.post[k], undefined, s.style.post?.[k] ?? DEFAULT_POST[k]));
  swatchInputs.forEach((inp, i) => inp.value = s.preset.palette[i]);
  Epoch.bind(s.preset.look);
  Mod.renderRoutes();
}

/* ================= audio analysis ================= */
const A = {
  ctx: null, an: null, el: null, fbuf: null, tbuf: null, live: false,
  spec: new Uint8Array(512), wave: new Uint8Array(512),
  raw: { bass: 0, mid: 0, high: 0 }, env: { bass: 0, mid: 0, high: 0 }, peak: { bass: .3, mid: .3, high: .3 },
  bass: 0, mid: 0, high: 0, level: 0, onset: 0, flux: 0, avgFlux: .02, lastOnset: 0, lastBassBeat: 0, avgBass: .3, intervals: [], bpm: 0, demoT: 0,
  gain: 1, attack: .02, release: .25, agc: true,
};
$("audioFile").addEventListener("change", () => {
  const f = $("audioFile").files && $("audioFile").files[0]; if (!f) return;
  ensureCtx(); stopMic();
  if (A.el.src) URL.revokeObjectURL(A.el.src);
  A.el.src = URL.createObjectURL(f); $("trackName").textContent = f.name; $("playBtn").disabled = false;
  A.ctx.resume(); A.el.play().catch(() => {}); A.intervals = []; Clock.source = "auto"; log("Сигнал: " + f.name, "ok");
});
const togglePlay = () => { if (!A.el || !A.el.src) return; A.ctx.resume(); A.el.paused ? A.el.play() : A.el.pause(); };
function ensureCtx() {
  if (A.ctx) return;
  A.ctx = new (window.AudioContext || window.webkitAudioContext)();
  A.an = A.ctx.createAnalyser(); A.an.fftSize = 2048; A.an.smoothingTimeConstant = .55;
  A.fbuf = new Uint8Array(A.an.frequencyBinCount); A.tbuf = new Uint8Array(A.an.fftSize);
  A.el = new Audio(); A.el.loop = true;
  A.ctx.createMediaElementSource(A.el).connect(A.an); A.an.connect(A.ctx.destination);
  A.el.addEventListener("play", () => $("playBtn").textContent = "Пауза");
  A.el.addEventListener("pause", () => $("playBtn").textContent = "Пуск");
}
function stopMic() { if (!A.mic) return; A.mic.getTracks().forEach(t => t.stop()); A.mic = null; A.micNode?.disconnect(); A.micNode = null; try { A.an.connect(A.ctx.destination); } catch (e) {} $("micBtn").classList.remove("on"); }
$("micBtn").addEventListener("click", async () => {
  if (A.mic) { stopMic(); $("trackName").textContent = "вход выключен · демо-сигнал"; return; }
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("none");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    ensureCtx(); A.ctx.resume(); if (A.el) A.el.pause();
    A.mic = stream; A.micNode = A.ctx.createMediaStreamSource(stream);
    try { A.an.disconnect(); } catch (e) {}
    A.micNode.connect(A.an);
    $("micBtn").classList.add("on"); $("trackName").textContent = "вход: " + (stream.getAudioTracks()[0]?.label || "микрофон"); Clock.source = "auto"; A.intervals = [];
    log("Живой вход подключён: " + (stream.getAudioTracks()[0]?.label || "микрофон"), "ok");
  } catch (e) {
    toast("Микрофон в этом окне закрыт");
    log("Живой вход недоступен: окно claude.ai не даёт микрофон. Открой ЛУЧ-3000 отдельным файлом в Chrome (см. README).", "warn");
  }
});
$("playBtn").addEventListener("click", togglePlay);
$("demoBtn").addEventListener("click", () => { if (A.el) A.el.pause(); $("trackName").textContent = "демо-сигнал · 124 BPM · без звука"; A.intervals = []; log("Сигнал: демо 124 BPM", "ok"); });
const prevSpec = new Uint8Array(512);
function analyse(dt, now) {
  A.live = !!(A.mic || (A.el && !A.el.paused && A.el.src));
  if (A.live) {
    A.an.getByteFrequencyData(A.fbuf); A.an.getByteTimeDomainData(A.tbuf);
    const binHz = A.ctx.sampleRate / A.an.fftSize, n = A.fbuf.length;
    for (let i = 0; i < 512; i++) {
      const x0 = i / 512, x1 = (i + 1) / 512;
      const b0 = Math.max(1, Math.floor(30 * Math.pow(533, x0) / binHz)), b1 = Math.min(n - 1, Math.max(b0 + 1, Math.floor(30 * Math.pow(533, x1) / binHz)));
      let m = 0; for (let b = b0; b < b1; b++) m = Math.max(m, A.fbuf[b]);
      A.spec[i] = Math.min(255, m * (1 + x0 * .5) * A.gain);
    }
    for (let i = 0; i < 512; i++) A.wave[i] = A.tbuf[i * 4];
  } else {
    A.demoT += dt;
    const bps = 124 / 60, ph = (A.demoT * bps) % 1, bar = Math.floor(A.demoT * bps) % 4;
    const kick = Math.exp(-ph * 9), hat = Math.exp(-((ph + .5) % 1) * 28), snare = (bar % 2 ? Math.exp(-ph * 12) : 0);
    const padv = .35 + .2 * Math.sin(A.demoT * .7), bassN = .5 + .3 * Math.sin(A.demoT * bps * Math.PI * .5);
    for (let i = 0; i < 512; i++) {
      const x = i / 512;
      let v = kick * Math.exp(-x * 18) * 1.1 + bassN * Math.exp(-Math.pow((x - .12) * 9, 2)) * .7
        + padv * Math.exp(-Math.pow((x - .42) * 3, 2)) * (.55 + .45 * Math.sin(x * 40 + A.demoT * 2)) * .7
        + snare * Math.exp(-Math.pow((x - .5) * 3, 2)) * .6 + hat * Math.exp(-Math.pow((x - .82) * 5, 2)) * .8;
      v *= .85 + .15 * Math.random();
      A.spec[i] = Math.min(255, v * 230 * A.gain);
      const tt = A.demoT + i / 512 * .02;
      A.wave[i] = 128 + 127 * Math.max(-1, Math.min(1, kick * Math.sin(tt * 2 * Math.PI * 55) * .8 + .3 * Math.sin(tt * 2 * Math.PI * 220 + Math.sin(tt * 9)) * padv + (Math.random() - .5) * hat * .5));
    }
  }
  E.setAudio(A.spec, A.wave);
  // spectral flux → onsets ("Атака")
  let flux = 0; for (let i = 0; i < 512; i++) { const d = A.spec[i] - prevSpec[i]; if (d > 0) flux += d; prevSpec[i] = A.spec[i]; }
  flux /= 512 * 255; A.avgFlux += (flux - A.avgFlux) * (1 - Math.exp(-dt * 2));
  A.onset *= Math.exp(-dt * 9);
  const t = now / 1000;
  if (flux > A.avgFlux * 1.6 + .004 && t - A.lastOnset > .09) { A.onset = 1; A.lastOnset = t; }
  // bands → envelope followers (attack / release) → auto gain
  const band = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += A.spec[i]; return s / ((b - a) * 255); };
  A.raw.bass = band(0, 70) * 1.4; A.raw.mid = band(70, 290) * 1.6; A.raw.high = band(290, 512) * 2;
  for (const k of ["bass", "mid", "high"]) {
    const r = A.raw[k], e = A.env[k];
    A.env[k] = e + (r - e) * (1 - Math.exp(-dt / (r > e ? Math.max(A.attack, .004) : Math.max(A.release, .01))));
    A.peak[k] = Math.max(A.env[k], A.peak[k] * Math.exp(-dt / 8), .05);
    A[k] = A.agc ? Math.min(1, A.env[k] / A.peak[k]) : Math.min(1, A.env[k]);
  }
  A.level += (((A.bass + A.mid + A.high) / 3) - A.level) * (1 - Math.exp(-dt * 3));
  // kick detection drives tempo estimate
  A.avgBass += (A.raw.bass - A.avgBass) * (1 - Math.exp(-dt * 1.2));
  if (A.raw.bass > A.avgBass * 1.3 && A.raw.bass > .2 && t - A.lastBassBeat > .28) {
    if (A.lastBassBeat) { A.intervals.push(t - A.lastBassBeat); if (A.intervals.length > 16) A.intervals.shift(); }
    A.lastBassBeat = t; Clock.kick();
    if (A.intervals.length >= 6) {
      const s = [...A.intervals].sort((a, b) => a - b); let bpm = 60 / s[Math.floor(s.length / 2)];
      while (bpm < 75) bpm *= 2; while (bpm > 185) bpm /= 2; A.bpm = Math.round(bpm);
    }
  }
}

/* ================= clock: tempo, beat, bar ================= */
const Clock = {
  bpm: 124, pos: 0, source: "demo", taps: [], pulse: 0,
  get beat() { return this.pos % 1; }, get barPhase() { return (this.pos % 4) / 4; },
  step(dt) {
    if (this.source === "demo" && !A.live) this.bpm = 124;
    if (this.source === "auto" && A.live && A.bpm) this.bpm += (A.bpm - this.bpm) * (1 - Math.exp(-dt * 2));
    const before = this.pos; this.pos += dt * this.bpm / 60;
    if (Math.floor(this.pos) !== Math.floor(before)) this.onBeat(Math.floor(this.pos));
    this.pulse = Math.exp(-this.beat * 7);
  },
  kick() { // soft phase lock to detected kicks
    if (this.source !== "auto" || !A.live) return;
    const f = this.pos % 1; this.pos += (f > .5 ? (1 - f) : -f) * .35;
  },
  tap() {
    const t = performance.now() / 1000;
    this.taps = this.taps.filter(x => t - x < 2.5); this.taps.push(t);
    if (this.taps.length >= 2) {
      const iv = []; for (let i = 1; i < this.taps.length; i++) iv.push(this.taps[i] - this.taps[i - 1]);
      this.bpm = Math.min(200, Math.max(60, 60 / (iv.reduce((a, b) => a + b, 0) / iv.length)));
      this.source = "tap";
    }
    this.pos = Math.round(this.pos);
  },
  onBeat(n) {
    if (live.pending && n >= live.pending.at) { const p = live.pending; live.pending = null; if (p.key) live.liveKey = p.key; live.cueKey = ""; $("cueLabel").textContent = ""; commit(p.slot); }
    const ap = +$("autopilot").value;
    if (ap && n % (ap * 4) === 0 && n > 0 && !live.pending) step(1, true);
  },
};
$("tapBtn").addEventListener("click", () => Clock.tap());
$("nudgeDown").addEventListener("click", () => { Clock.bpm = Math.max(60, Math.round(Clock.bpm) - 1); Clock.source = "manual"; });
$("nudgeUp").addEventListener("click", () => { Clock.bpm = Math.min(200, Math.round(Clock.bpm) + 1); Clock.source = "manual"; });
$("autoBpm").addEventListener("click", () => { Clock.source = A.live ? "auto" : "demo"; toast(A.live ? "Темп определяется по треку" : "Темп демо-сигнала"); });
document.querySelectorAll("#quant button").forEach(b => b.addEventListener("click", () => {
  live.quant = +b.dataset.q; document.querySelectorAll("#quant button").forEach(x => x.setAttribute("aria-pressed", x === b));
}));

/* ================= modulation ================= */
const LFO_SHAPES = [["sine", "∿"], ["tri", "△"], ["saw", "⟋"], ["square", "⊓"]];
const LFO_DIV = [[.25, "1/16"], [.5, "1/8"], [1, "1/4"], [2, "1/2"], [4, "1 такт"], [8, "2 такта"], [16, "4 такта"]];
const Mod = {
  armed: null, values: {}, lfo: [{ shape: "sine", div: 4 }, { shape: "tri", div: 16 }], randV: .5, randT: .5, randBeat: -1,
  lfoVal(i) {
    const L = this.lfo[i], ph = (Clock.pos / L.div) % 1;
    return L.shape === "sine" ? .5 - .5 * Math.cos(ph * 2 * Math.PI) : L.shape === "tri" ? 1 - Math.abs(ph * 2 - 1) : L.shape === "saw" ? ph : (ph < .5 ? 1 : 0);
  },
  update(dt) {
    const b = Math.floor(Clock.pos); if (b !== this.randBeat) { this.randBeat = b; this.randT = Math.random(); }
    this.randV += (this.randT - this.randV) * (1 - Math.exp(-dt * 18));
    const v = this.values;
    v.bass = A.bass; v.mid = A.mid; v.high = A.high; v.level = A.level; v.beat = Clock.pulse; v.bar = Clock.barPhase;
    v.lfo1 = this.lfoVal(0); v.lfo2 = this.lfoVal(1); v.rand = this.randV; v.onset = A.onset;
  },
  effective(slot) {
    const p = slot.preset, e = slot.eff;
    for (let i = 0; i < 8; i++) e.params[i] = p.params[i];
    for (const [k] of POST_KEYS) e.post[k] = p.post[k];
    Object.assign(e.look, p.look);
    for (const m of p.mods || []) {
      const d = (this.values[m.src] || 0) * m.amt;
      if (m.dst[0] === "p" && m.dst.length === 2) { const i = +m.dst[1]; e.params[i] = clamp01(e.params[i] + d); }
      else if (m.dst in e.post) e.post[m.dst] = clamp01(e.post[m.dst] + d);
      else if (m.dst in e.look) e.look[m.dst] = clamp01(e.look[m.dst] + d);
    }
    e.palRGB = p.palRGB; e.seed = p.seed;
    return e;
  },
  arm(src) {
    this.armed = this.armed === src ? null : src;
    document.body.classList.toggle("arming", !!this.armed);
    document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.src === this.armed));
    if (this.armed) toast(`Источник «${SRC_NAME[src]}»: теперь нажми крутилку стиля или оптики`);
  },
  connect(dst) {
    const s = active(); const src = this.armed; this.arm(null);
    if (!s || !TARGETS.includes(dst)) { toast("Эту крутилку модулировать нельзя"); return; }
    const ex = s.preset.mods.find(m => m.src === src && m.dst === dst);
    if (ex) { toast("Такая связь уже есть: глубина в списке связей"); return; }
    s.preset.mods.push({ src, dst, amt: .35 }); this.renderRoutes(); showPane("mod");
    log(`Связь: ${SRC_NAME[src]} → ${targetName(dst)}`, "ok");
  },
  renderRoutes() {
    const s = active(); const box = $("routes"); box.innerHTML = "";
    const mods = s ? s.preset.mods : [];
    $("routeCount").textContent = mods.length;
    mods.forEach((m, i) => {
      const r = document.createElement("div"); r.className = "route";
      const lab = document.createElement("span"); lab.innerHTML = `<b></b> → `; lab.querySelector("b").textContent = SRC_NAME[m.src]; lab.append(targetName(m.dst));
      const wrap = document.createElement("div"); wrap.style.display = "grid"; wrap.style.gridTemplateColumns = "1fr 34px"; wrap.style.gap = "4px"; wrap.style.alignItems = "center";
      const sl = document.createElement("input"); sl.type = "range"; sl.className = "bip"; sl.min = -1; sl.max = 1; sl.step = .01; sl.value = m.amt; sl.setAttribute("aria-label", "Глубина связи " + SRC_NAME[m.src]);
      const out = document.createElement("output"); out.textContent = Math.round(m.amt * 100);
      sl.addEventListener("input", () => { m.amt = +sl.value; out.textContent = Math.round(m.amt * 100); });
      wrap.append(sl, out);
      const x = document.createElement("button"); x.type = "button"; x.className = "x"; x.textContent = "×"; x.setAttribute("aria-label", "Удалить связь");
      x.addEventListener("click", () => { mods.splice(i, 1); this.renderRoutes(); });
      r.append(lab, wrap, x); box.appendChild(r);
    });
    if (!mods.length) { const p = document.createElement("p"); p.className = "hint"; p.textContent = "Связей нет: визуал не реагирует на звук, кроме того, что заложено в сам стиль."; box.appendChild(p); }
  },
};
function targetName(dst) {
  if (dst[0] === "p" && dst.length === 2) { const s = active(); return s?.style.params[+dst[1]]?.name || "Параметр " + (+dst[1] + 1); }
  return (POST_KEYS.find(k => k[0] === dst) || LOOK_KEYS.find(k => k[0] === dst) || [0, dst])[1];
}
const chipEls = {};
SOURCES.forEach(([k, l]) => {
  const c = document.createElement("button"); c.type = "button"; c.className = "chip"; c.dataset.src = k; c.setAttribute("aria-pressed", "false");
  c.innerHTML = `<span></span><i></i><span class="bar-fill"></span>`; c.firstChild.textContent = l;
  c.addEventListener("click", () => Mod.arm(k)); $("chips").appendChild(c); chipEls[k] = c;
});
[0, 1].forEach(i => {
  const host = $("lfo" + (i + 1));
  host.innerHTML = `<b>LFO ${i + 1}</b><div class="row" style="gap:6px"></div>`;
  const row = host.querySelector(".row");
  const sw = document.createElement("div"); sw.className = "seg-switch tiny";
  LFO_SHAPES.forEach(([k, g]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = g; b.setAttribute("aria-label", k); b.setAttribute("aria-pressed", Mod.lfo[i].shape === k);
    b.addEventListener("click", () => { Mod.lfo[i].shape = k; sw.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); }); sw.appendChild(b); });
  const sel = document.createElement("select"); sel.className = "sel"; sel.setAttribute("aria-label", `Период LFO ${i + 1}`);
  LFO_DIV.forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; if (v === Mod.lfo[i].div) o.selected = true; sel.appendChild(o); });
  sel.addEventListener("change", () => Mod.lfo[i].div = +sel.value);
  row.append(sw, sel);
});
knob($("detKnobs"), { id: "gain", label: "Усиление", value: .5, fmt: v => "×" + (Math.pow(4, v * 2 - 1)).toFixed(1), onInput: v => A.gain = Math.pow(4, v * 2 - 1) });
knob($("detKnobs"), { id: "attack", label: "Атака", value: .2, fmt: v => Math.round((.002 + v * v * .3) * 1000) + "мс", onInput: v => A.attack = .002 + v * v * .3 });
knob($("detKnobs"), { id: "release", label: "Затухание", value: .45, fmt: v => Math.round((.02 + v * v * 1.2) * 1000) + "мс", onInput: v => A.release = .02 + v * v * 1.2 });
A.attack = .002 + .04 * .3; A.release = .02 + .2025 * 1.2;
$("agc").addEventListener("change", e => A.agc = e.target.checked);

/* ================= live effects (pads) ================= */
const PADS = [["strobe", "Строб", "Q"], ["freeze", "Стоп-кадр", "W"], ["invert", "Инверсия", "E"], ["mirror", "Зеркало", "R"], ["punch", "Удар зума", "A"], ["rgb", "RGB-взрыв", "D"], ["kaleido", "Калейдо", "Z"], ["pixel", "Пиксели", "X"], ["echo", "Эхо", "C"]];
const FX = { held: {}, latched: {} };
const padEls = {};
PADS.forEach(([k, l, key]) => {
  const b = document.createElement("button"); b.type = "button"; b.className = "pad"; b.dataset.pad = k; b.setAttribute("aria-pressed", "false");
  b.innerHTML = `<kbd>${key}</kbd><span></span>`; b.querySelector("span").textContent = l; b.title = `${l}: держи ${key}, Shift+${key} фиксирует`;
  b.addEventListener("pointerdown", e => { if (Midi.learning) { Midi.target(b, { kind: "pad", id: k }); return; } if (e.shiftKey) latch(k); else hold(k, true); });
  b.addEventListener("pointerup", () => hold(k, false)); b.addEventListener("pointerleave", () => hold(k, false));
  $("pads").appendChild(b); padEls[k] = b;
});
function fxOn(k) { return !!(FX.held[k] || FX.latched[k]); }
function paintPad(k) { padEls[k].setAttribute("aria-pressed", fxOn(k)); padEls[k].classList.toggle("latched", !!FX.latched[k]); }
function hold(k, on) { FX.held[k] = on; paintPad(k); }
function latch(k) { FX.latched[k] = !FX.latched[k]; paintPad(k); }
function fxState() {
  return {
    strobe: fxOn("strobe") ? ((Clock.pos * 4) % 1 < .5 ? 1 : 0) : 1,
    freeze: fxOn("freeze"), invert: fxOn("invert"), mirror: fxOn("mirror"),
    punch: fxOn("punch") ? Clock.pulse : 0,
    kaleido: fxOn("kaleido"), pixel: fxOn("pixel"),
  };
}

/* ================= library ================= */
let libTab = "styles";
const thumbs = new Map();
const THUMB_S = { time: 6.4, bass: .55, mid: .45, high: .35, level: .6, beat: .35, realTime: 0 };
const thumbQueue = [];
function thumbFor(key, style, preset, img) { if (thumbs.has(key)) { img.src = thumbs.get(key); return; } thumbQueue.push({ key, style, preset, img }); pumpThumbs(); }
function pumpThumbs() {
  if (pumpThumbs.busy || !thumbQueue.length) return; pumpThumbs.busy = true;
  setTimeout(() => {
    const j = thumbQueue.shift();
    if (!thumbs.has(j.key)) { const url = E.thumb(j.style, j.preset, THUMB_S); if (url) thumbs.set(j.key, url); }
    if (thumbs.has(j.key)) { j.img.src = thumbs.get(j.key); thumbQueue.filter(q => q.key === j.key).forEach(q => q.img.src = thumbs.get(j.key)); }
    pumpThumbs.busy = false; pumpThumbs();
  }, 30);
}
function libItems() {
  if (libTab === "styles") return [...styles.values()].map(s => ({ style: s, preset: makePreset(s), key: "s:" + s.id, label: s.name, badge: s.builtin ? "" : "КУЗНИЦА" }));
  return userPresets.map((p, i) => { const s = styles.get(p.style); return s ? { style: s, preset: makePreset(s, p), key: "p:" + (p._id || p.createdAt || i), label: p.name, badge: p.mods?.length ? "МОД " + p.mods.length : "" } : null; }).filter(Boolean);
}
function renderLibrary() {
  const g = $("libGrid"); g.innerHTML = "";
  const items = libItems();
  $("libCount").textContent = `${String(styles.size).padStart(2, "0")} СТ · ${String(userPresets.length).padStart(2, "0")} ПР`;
  if (!items.length) { const e = document.createElement("p"); e.className = "empty"; e.textContent = "Пресетов пока нет. Найди удачный вид, настрой связи и нажми «В пресеты» на пульте: пресет появится здесь и будет вызываться цифрами 1–9."; g.appendChild(e); return; }
  items.forEach((it, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "card"; b.dataset.key = it.key; b.setAttribute("aria-label", it.label);
    const img = document.createElement("img"); img.alt = ""; b.appendChild(img);
    const cap = document.createElement("span"); cap.className = "cap";
    if (i < 9) { const k = document.createElement("kbd"); k.textContent = i + 1; cap.appendChild(k); }
    cap.appendChild(document.createTextNode(it.label)); b.appendChild(cap);
    if (it.badge) { const bd = document.createElement("span"); bd.className = "badge"; bd.textContent = it.badge; b.appendChild(bd); }
    b.addEventListener("click", () => recall(it));
    g.appendChild(b); thumbFor(it.key, it.style, it.preset, img);
  });
  markLive();
}
function recall(it) { apply(clonePreset(it.preset), { key: it.key }); }
function markLive() { document.querySelectorAll("#libGrid .card").forEach(c => { c.classList.toggle("live", c.dataset.key === live.liveKey); c.classList.toggle("cued", c.dataset.key === live.cueKey); }); }
function selectTab(t) { libTab = t; $("tabStyles").setAttribute("aria-selected", t === "styles"); $("tabPresets").setAttribute("aria-selected", t === "presets"); renderLibrary(); }
$("tabStyles").addEventListener("click", () => selectTab("styles"));
$("tabPresets").addEventListener("click", () => selectTab("presets"));
function step(dir, auto) {
  const items = libItems(); if (!items.length) return;
  let i = items.findIndex(it => it.key === live.liveKey); i = (i + dir + items.length) % items.length;
  apply(clonePreset(items[i].preset), { key: items[i].key, instant: auto });
  if (auto) log("Автопилот: " + items[i].label, "ai");
}

/* ================= left panel tabs ================= */
function showPane(p) {
  $("paneQuery").hidden = p !== "query"; $("paneMod").hidden = p !== "mod"; $("paneEpoch").hidden = p !== "epoch";
  $("ptQuery").setAttribute("aria-selected", p === "query"); $("ptMod").setAttribute("aria-selected", p === "mod"); $("ptEpoch").setAttribute("aria-selected", p === "epoch");
}
$("ptQuery").addEventListener("click", () => showPane("query"));
$("ptMod").addEventListener("click", () => showPane("mod"));
$("ptEpoch").addEventListener("click", () => showPane("epoch"));

/* ================= epoch: lenses + symbols ================= */
const Epoch = {
  atlasSet: null, count: 1, atlases: {},
  ensureAtlas(set) {
    if (set === this.atlasSet) return; this.atlasSet = set;
    if (!this.atlases[set]) {
      const chars = Array.from((SYMBOL_SETS.find(x => x[0] === set) || SYMBOL_SETS[0])[3]).filter(ch => ch !== "\ufe0e");
      const glyphs = []; for (const ch of chars) { if (ch === "\ufe0e") continue; glyphs.push(ch); }
      const cv = document.createElement("canvas"); cv.width = cv.height = 512; const x = cv.getContext("2d");
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
      x.font = '600 44px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols", "Noto Sans Symbols 2", "Noto Sans Runic", "Hiragino Sans", "Noto Sans JP", "IBM Plex Sans", sans-serif';
      const list = glyphs.slice(0, 48);
      list.forEach((ch, i) => x.fillText(ch + "\ufe0e", (i % 8) * 64 + 32, Math.floor(i / 8) * 64 + 34));
      const RAMP = [" ", ".", "·", ":", "-", "~", "=", "+", "*", "o", "x", "%", "#", "&", "@", "█"];
      x.font = '500 48px "IBM Plex Mono", ui-monospace, monospace';
      RAMP.forEach((ch, i) => { const g = 48 + i; x.fillText(ch, (g % 8) * 64 + 32, Math.floor(g / 8) * 64 + 34); });
      this.atlases[set] = { cv, n: Math.max(1, list.length) };
    }
    E.setGlyphs(this.atlases[set].cv); this.count = this.atlases[set].n;
  },
  bind(look) {
    $("lensSel").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === look.lens));
    $("symSel").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === look.sym));
    $("symMode").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.m === look.symMode));
    LOOK_KEYS.forEach(([k]) => knobs[k].set(look[k]));
  },
};
function epochChips(host, list, onPick) {
  list.forEach(([id, name, era]) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip era"; b.dataset.id = id; b.setAttribute("aria-pressed", "false");
    b.innerHTML = "<span></span><small></small>"; b.firstChild.textContent = name; b.lastChild.textContent = era;
    b.addEventListener("click", () => { const s = active(); if (!s) return; onPick(s.preset.look, id); Epoch.bind(s.preset.look); }); host.appendChild(b);
  });
}
epochChips($("lensSel"), LENSES, (L, id) => { L.lens = id; });
epochChips($("symSel"), SYMBOL_SETS, (L, id) => { L.sym = id; if (!L.symMode) L.symMode = 2; });
SYM_MODES.forEach(([m, l]) => { const b = document.createElement("button"); b.type = "button"; b.dataset.m = m; b.textContent = l;
  b.addEventListener("click", () => { const s = active(); if (!s) return; s.preset.look.symMode = +m; Epoch.bind(s.preset.look); }); $("symMode").appendChild(b); });
LOOK_KEYS.slice(0, 2).forEach(([k, l, d]) => knob($("lensKnobs"), { id: k, label: l, value: d, onInput: v => { const s = active(); if (s) s.preset.look[k] = v; } }));
LOOK_KEYS.slice(2).forEach(([k, l, d]) => knob($("symKnobs"), { id: k, label: l, value: d, onInput: v => { const s = active(); if (s) s.preset.look[k] = v; } }));

/* ================= chance: random synthesis ================= */
const pick = a => a[Math.floor(Math.random() * a.length)];
function chance() {
  const st = pick([...styles.values()]);
  const [palName, palette] = pick(ERA_PALETTES);
  const lens = Math.random() < .45 ? "none" : pick(LENSES.slice(1))[0];
  const symOn = Math.random() < .4;
  const set = pick(SYMBOL_SETS);
  const srcs = ["bass", "mid", "high", "onset", "lfo1", "lfo2", "rand", "beat"];
  const mods = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({ src: pick(srcs), dst: Math.random() < .7 ? "p" + Math.floor(Math.random() * st.params.length) : pick(["bloom", "chroma", "zoom", "twist", "lensP", "symDen"]), amt: +(Math.random() * .8 - .2).toFixed(2) }));
  const lensName = (LENSES.find(l => l[0] === lens) || [])[1];
  const p = makePreset(st, {
    name: [st.name, lens !== "none" ? lensName : null, symOn ? set[1] : null].filter(Boolean).join(" · "),
    note: `${palName}${lens !== "none" ? ", линза «" + lensName + "»" : ""}${symOn ? ", знаки: " + set[1].toLowerCase() : ""}.`,
    params: st.params.map(() => Math.random()), palette,
    post: { trail: Math.random() * .6, zoom: .44 + Math.random() * .14, twist: .44 + Math.random() * .12, bloom: .2 + Math.random() * .5, chroma: Math.random() * .4, scan: Math.random() * .5 },
    look: { lens, lensAmt: .7 + Math.random() * .3, lensP: Math.random(), sym: set[0], symMode: symOn ? 1 + Math.floor(Math.random() * 4) : 0, symAmt: .5 + Math.random() * .5, symSize: Math.random(), symDen: .3 + Math.random() * .6 },
    mods,
  });
  $("variants").prepend(variantCard(p, st));
  while ($("variants").children.length > 6) $("variants").lastChild.remove();
  apply(clonePreset(p), { key: "" });
  log("Случай: " + p.name, "ai");
}
$("chanceBtn").addEventListener("click", chance);

/* ================= AI: director + forge ================= */
let sample = null, aiMode = "pick", running = null;
const MODE_NOTES = {
  pick: "Опиши образ, настроение, темп. ИИ выберет стили, настроит их и свяжет параметры со звуком: три варианта на выбор.",
  forge: "Опиши то, чего нет в библиотеке. ИИ напишет новый стиль кодом, сам проверит компиляцию и добавит его в библиотеку.",
};
function setMode(m) {
  aiMode = m; $("modePick").setAttribute("aria-selected", m === "pick"); $("modeForge").setAttribute("aria-selected", m === "forge");
  $("modeNote").textContent = MODE_NOTES[m] + (m === "forge" && !sample ? " Сейчас недоступно: открой ЛУЧ-3000 в claude.ai." : "");
  $("synthBtn").textContent = running ? "Стоп" : (m === "pick" ? "Синтез" : "Выковать");
}
$("modePick").addEventListener("click", () => setMode("pick"));
$("modeForge").addEventListener("click", () => setMode("forge"));
(async () => {
  await null;
  try { sample = window.claude?.use ? await window.claude.use("sample") : null; } catch (e) { sample = null; }
  if (sample) { setLed("on"); log("Связь с ИИ установлена.", "ai"); }
  else { setLed(""); log("ИИ недоступен в этом окне: подбор работает автономно по словам, кузница выключена.", "warn"); }
  setMode(aiMode);
})();
const ERR_COPY = {
  not_granted: "ИИ не разрешён для этой страницы.", sampling_disabled: "ИИ недоступен для этого аккаунта.", rate_limited: "Слишком много запросов или исчерпан лимит. Попробуй чуть позже.",
  session_expired: "Нужно заново войти в claude.ai.", refused: "ИИ отказался от такого запроса. Переформулируй.", invalid_json: "Ответ пришёл в неверном формате. Нажми ещё раз.",
  empty_completion: "ИИ ничего не ответил. Упрости запрос.", upstream_error: "Сбой связи. Попробуй ещё раз.", cancelled: "Остановлено.", prompt_too_large: "Запрос слишком длинный.",
};
const hideCodes = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"];
function aiError(e) {
  const code = e && e.code; log(ERR_COPY[code] || ("Ошибка: " + (code || e?.message || e)), code === "cancelled" ? "warn" : "err");
  if (hideCodes.includes(code)) sample = null;
  setLed(sample ? "on" : "err");
}
const catalog = () => [...styles.values()].map(s => `- ${s.id}: ${s.name}. ${s.description} Tags: ${s.tags.join(", ")}. Params p0..p${s.params.length - 1}: ${s.params.map(p => p.name).join(" | ")}`).join("\n");
const DIRECTOR = req => `You are the visual director of ЛУЧ-3000, a real-time music visualizer for concerts and DJ sets on big LED screens.
Turn the request into 3 presets using ONLY these styles:
${catalog()}

Rules:
- Variants must differ meaningfully: different styles, or the same style with clearly different settings, palette and audio behaviour.
- "params": numbers 0..1, one per listed param, in order.
- "palette": 4 hex colours from darkest to brightest. The first is the background tone, near black (LED: black is light off). The last is the brightest highlight.
- "post": trail, zoom (0.5 still), twist (0.5 none), bloom, chroma (RGB split), scan (CRT scanlines), all 0..1. Keep zoom and twist within 0.35..0.65 unless the request is wild.
- "mods": 2 to 5 modulation routes that make the picture play with the music like a skilled VJ: sources bass, mid, high, level, beat (pulse on each beat), bar (ramp over a 4-beat bar), lfo1 (slow, 1 bar), lfo2 (very slow, 4 bars), rand (new random value each beat), onset (transient hits); targets p0..pN (style params) or trail, zoom, twist, bloom, chroma, scan; amount -1..1 added to the base value. Prefer structure over flashing: e.g. bass → a size or density param, onset → chroma small, lfo2 → a colour or rotation param, high → bloom small.
- "look": an era lens that re-renders the whole picture in another medium, and an optional symbol layer. lens: ${LENSES.map(l => `${l[0]} (${l[1]}, ${l[2]})`).join("; ")}. lensAmt and lensP (cell/line scale) 0..1. sym: ${SYMBOL_SETS.map(x => `${x[0]} (${x[1]}, ${x[2]})`).join("; ")}. symMode: 0 off, 1 falling rain, 2 orbit rings, 3 grid flicker on beats, 4 one large sign per bar. symAmt, symSize, symDen 0..1. Mix eras boldly when it serves the idea (e.g. gothic rose window seen through VHS, runes orbiting a 1960s cosmos), but keep it readable on a giant screen. Mod targets may also be lensAmt, lensP, symAmt, symSize, symDen.
- Era palettes you may borrow: ${ERA_PALETTES.map(p => p[0] + " " + p[1].join(" ")).join("; ")}.
- "name": 1-3 evocative words in Russian. "note": one short sentence in Russian about the idea and how it moves with the music.
Reply with only JSON: {"variants":[{"style":"id","name":"...","note":"...","params":[...],"palette":["#...","#...","#...","#..."],"post":{"trail":0,"zoom":0.5,"twist":0.5,"bloom":0,"chroma":0,"scan":0},"look":{"lens":"none","lensAmt":1,"lensP":0.5,"sym":"runes","symMode":0,"symAmt":0.8,"symSize":0.35,"symDen":0.5},"mods":[{"src":"bass","dst":"p1","amt":0.4}]}]}

Request: ${req}`;
const FORGE = req => `You write a new visual style for ЛУЧ-3000, a real-time music visualizer for concerts on big LED screens.
Write GLSL ES 3.00 code: helper functions if needed, then exactly one function \`vec3 render(vec2 p)\`.
- p: centered coordinates, y in [-0.5, 0.5], x scaled by aspect ratio. Return RGB, roughly 0..1.5.
- Already provided, do NOT redeclare: uniforms uTime (seconds), uRes (pixels), uBass, uMid, uHigh, uLevel (0..1, smoothed), uBeat (1 on a beat, decays to 0), P0..P7 (params 0..1), uPal[4] (palette, dark to bright); varying vUv (0..1); functions float hash(vec2), float noise(vec2), float fbm(vec2), mat2 rot(float), vec3 ramp(float t) (palette gradient dark→bright), vec3 cyc(float t) (cyclic palette), float spec(float x) (log spectrum 0..1, x=0 bass, x=1 treble), float wave(float x) (waveform -1..1), vec3 prev(vec2 uv) (previous frame).
- Colour only through ramp/cyc/uPal so palettes work. Keep black dominant. React to music musically: structure, motion and light respond to different bands, not a global pulse. Params should be meaningful handles a VJ would ride live (density, scale, speed, distortion), since the app can route audio to them.
- Fast: loops with constant bounds and at most 64 iterations total per pixel. Must hold 60 fps at 1080p.
- Use the tool compile_glsl to compile your code. If it reports errors, fix them and compile again until it returns ok.
Finally reply with only JSON: {"name":"1-3 words in Russian","description":"one sentence in Russian: what it looks like and how it reacts to music","tags":["4-6 Russian words"],"params":[{"name":"short Russian label","def":0.5}],"palette":["#hex","#hex","#hex","#hex"],"post":{"trail":0.3,"zoom":0.5,"twist":0.5,"bloom":0.5,"chroma":0.2,"scan":0.2},"glsl":"final code"}
Use 3 to 6 params. Example of a good style:
${LUCH_STYLES[6].glsl}

Request: ${req}`;
function variantCard(preset, style) {
  const b = document.createElement("button"); b.type = "button"; b.className = "vcard";
  const img = document.createElement("img"); img.alt = "";
  const t = document.createElement("span");
  const n = document.createElement("b"); n.textContent = preset.name;
  const em = document.createElement("em"); em.textContent = style.name.toUpperCase() + (preset.mods.length ? ` · ${preset.mods.length} СВЯЗИ` : "");
  const s = document.createElement("small"); s.textContent = preset.note;
  t.append(n, em, s); b.append(img, t);
  b.addEventListener("click", () => apply(clonePreset(preset), { key: "" }));
  thumbFor("v:" + Math.random(), style, preset, img);
  return b;
}
function localPick(req) {
  const words = req.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter(w => w.length > 2);
  const scored = [...styles.values()].map(s => {
    const hay = (s.name + " " + s.description + " " + s.tags.join(" ")).toLowerCase();
    return { s, score: words.reduce((a, w) => a + (hay.includes(w.slice(0, Math.max(4, w.length - 2))) ? 1 : 0), 0) + Math.random() * .5 };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
  const PAL = [
    [/лун|лёд|лед|иней|холод|зим|снег|серебр/, ["#020409", "#1c2c44", "#9fc4e8", "#f4f9ff"]],
    [/огон|пламя|закат|солн|жар|лава/, ["#0a0200", "#7a1300", "#ff6a00", "#ffe2a8"]],
    [/неон|клуб|кислот|рейв|техно/, ["#04000a", "#ff00a8", "#00f0ff", "#f6ff00"]],
    [/кров|красн|тревог/, ["#060000", "#5a0008", "#e0102c", "#ffd6dc"]],
    [/золот|роскош|янтар/, ["#060402", "#4a3000", "#e0a526", "#fff4d0"]],
    [/лес|трав|зелен|природ/, ["#010603", "#0d3b1e", "#5fd38d", "#eaffef"]],
    [/фиолет|космос|галакт|туманн/, ["#03010a", "#3c0f6e", "#c04dff", "#ffe6ff"]],
    [/черно|чёрно|монохр|графит/, ["#000000", "#303030", "#a0a0a0", "#ffffff"]],
  ];
  const pal = (PAL.find(([re]) => re.test(req.toLowerCase())) || [])[1];
  return scored.map(({ s }) => makePreset(s, { name: s.name, note: "Автономный подбор по словам запроса.", palette: pal, params: s.params.map(p => clamp01(p.def + (Math.random() - .5) * .3)), prompt: req,
    mods: [{ src: "bass", dst: "p1", amt: .3 }, { src: "onset", dst: "chroma", amt: .25 }, { src: "lfo2", dst: "p" + Math.min(2, s.params.length - 1), amt: .2 }] }));
}
async function synth() {
  if (running) { running.abort(); return; }
  const req = $("prompt").value.trim();
  if (!req) { $("prompt").focus(); toast("Опиши визуал словами"); return; }
  if (aiMode === "forge") return forge(req);
  const box = $("variants"); box.innerHTML = "";
  if (!sample) { log("Подбор без ИИ: " + req, "warn"); localPick(req).forEach(p => box.appendChild(variantCard(p, styles.get(p.style)))); return; }
  running = new AbortController(); setMode(aiMode); setLed("busy"); log("Синтез: " + req, "ai");
  try {
    const out = await sample.json(DIRECTOR(req), { modelTier: "default", signal: running.signal });
    const list = (out && Array.isArray(out.variants) ? out.variants : []).slice(0, 4);
    let n = 0;
    list.forEach(v => { const st = styles.get(v && v.style); if (!st) return; const p = makePreset(st, { ...v, prompt: req }); box.appendChild(variantCard(p, st)); if (++n === 1) apply(clonePreset(p), { key: "" }); });
    log(n ? `Готово: ${n} варианта. Первый выходит в эфир.` : "ИИ не предложил подходящих вариантов.", n ? "ok" : "warn");
    setLed("on");
  } catch (e) { aiError(e); }
  finally { running = null; setMode(aiMode); }
}
async function forge(req, fix) {
  if (!sample) { toast("Кузница работает только с ИИ в claude.ai"); return; }
  running = new AbortController(); setMode(aiMode); setLed("busy");
  const line = log(fix ? "Кузница чинит код…" : "Кузница: " + req, "ai");
  let compiles = 0;
  const tools = [{
    name: "compile_glsl",
    description: "Compile a ЛУЧ-3000 style (helpers + vec3 render(vec2 p)) with the real engine. Returns {ok:true} or {ok:false, log} with line numbers of your code.",
    inputSchema: { type: "object", properties: { glsl: { type: "string", description: "The full style code." } }, required: ["glsl"] },
    execute: input => { compiles++; const r = E.check(String(input.glsl || "")); log(r.ok ? `Компиляция #${compiles}: успешно` : `Компиляция #${compiles}: ошибка, ИИ исправляет`, r.ok ? "ok" : "warn"); return r; },
  }];
  const input = fix ? FORGE(req) + `\n\nA previous attempt failed to compile. Code:\n${fix.glsl}\nErrors:\n${fix.log}\nFix it.` : FORGE(req);
  try {
    let out;
    try { out = await sample.json(input, { modelTier: "complex", tools, signal: running.signal, onText: ({ text }) => { line.textContent = `Кузница пишет… ${text.length} симв.`; } }); }
    catch (e) { if (e && e.code === "tools_unavailable") { log("Проверка кода недоступна, кую без неё.", "warn"); out = await sample.json(input, { modelTier: "complex", signal: running.signal }); } else throw e; }
    const st = sanitizeStyle({ ...out, id: "tmp" });
    if (!st) { log("ИИ не прислал код стиля.", "err"); setLed("on"); return; }
    st.prompt = req;
    const chk = E.check(st.glsl);
    if (!chk.ok) {
      log("Стиль не компилируется: " + chk.log.split("\n")[0], "err");
      const b = document.createElement("button"); b.className = "aqua small"; b.type = "button"; b.textContent = "Исправить";
      b.addEventListener("click", () => { b.remove(); forge(req, { glsl: st.glsl, log: chk.log }); });
      $("variants").prepend(b); setLed("on"); return;
    }
    const id = await Store.addStyle(st);
    styles.set(id, { ...st, id }); renderLibrary();
    const p = makePreset(styles.get(id), { prompt: req, mods: [{ src: "bass", dst: "p0", amt: .25 }] });
    $("variants").prepend(variantCard(p, styles.get(id)));
    apply(p, { key: "s:" + id }); log(`Новый стиль «${st.name}» в библиотеке и в эфире.`, "ok"); setLed("on");
  } catch (e) { aiError(e); }
  finally { running = null; setMode(aiMode); }
}
$("synthBtn").addEventListener("click", synth);
$("prompt").addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); synth(); } });

/* ================= MIDI ================= */
const Midi = {
  access: null, learning: false, pendingEl: null, pending: null, map: lsGet("luch.midi", {}),
  async toggle() {
    if (!this.access) {
      if (!navigator.requestMIDIAccess) { toast("Этот браузер не поддерживает MIDI"); return; }
      try { this.access = await navigator.requestMIDIAccess(); }
      catch (e) { toast("MIDI недоступен в этом окне"); log("MIDI недоступен: браузер или окно не дали доступ.", "warn"); return; }
      this.access.inputs.forEach(i => i.onmidimessage = m => this.msg(m));
      this.access.onstatechange = () => this.access.inputs.forEach(i => i.onmidimessage = m => this.msg(m));
      const names = [...this.access.inputs.values()].map(i => i.name);
      log(names.length ? "MIDI: " + names.join(", ") : "MIDI включён, контроллеров не найдено.", names.length ? "ok" : "warn");
    }
    this.learning = !this.learning;
    document.body.classList.toggle("midilearn", this.learning);
    $("midiBtn").classList.toggle("learn", this.learning);
    $("midiBtn").textContent = this.learning ? "Готово" : "MIDI-назначение";
    if (this.learning) toast("Нажми крутилку или пэд, затем двигай ручку на контроллере");
    else { this.pendingEl?.classList.remove("learn-target"); this.pending = null; }
  },
  target(el, t) { this.pendingEl?.classList.remove("learn-target"); this.pendingEl = el; this.pending = t; el.classList.add("learn-target"); },
  msg(m) {
    const [st, d1, d2] = m.data; const type = st & 0xf0, ch = st & 0x0f;
    const key = (type === 0xb0 ? "cc" : "n") + ch + ":" + d1;
    if (type !== 0xb0 && type !== 0x90 && type !== 0x80) return;
    if (this.learning && this.pending && (type === 0xb0 || (type === 0x90 && d2 > 0))) {
      Object.keys(this.map).forEach(k => { if (this.map[k].id === this.pending.id) delete this.map[k]; });
      this.map[key] = this.pending; lsSet("luch.midi", this.map);
      this.pendingEl.classList.remove("learn-target");
      const lab = this.pendingEl.querySelector(".midi"); if (lab) lab.textContent = type === 0xb0 ? "CC" + d1 : "N" + d1;
      log(`MIDI: ${key} → ${this.pending.id}`, "ok"); this.pending = null; this.pendingEl = null; return;
    }
    const t = this.map[key]; if (!t) return;
    if (t.kind === "knob" && type === 0xb0 && knobs[t.id]) knobs[t.id].input(d2 / 127);
    if (t.kind === "pad") { const on = type === 0x90 ? d2 > 0 : (type === 0xb0 ? d2 > 63 : false); hold(t.id, on); }
  },
  paintLabels() { Object.entries(this.map).forEach(([k, t]) => { const el = t.kind === "knob" ? knobs[t.id]?.el : padEls[t.id]; const lab = el?.querySelector(".midi"); if (lab) lab.textContent = k.startsWith("cc") ? "CC" + k.split(":")[1] : "N" + k.split(":")[1]; }); },
};
$("midiBtn").addEventListener("click", () => Midi.toggle());
Midi.paintLabels();

/* ================= skins ================= */
const baseVars = {};
function applySkin(id) {
  const skin = LUCH_SKINS.find(s => s.id === id) || LUCH_SKINS[0];
  const root = document.documentElement.style;
  Object.keys(baseVars).forEach(k => root.removeProperty(k));
  Object.entries(skin.vars || {}).forEach(([k, v]) => { baseVars[k] = 1; root.setProperty(k, v); });
  $("skinCss").textContent = skin.css || "";
  $("skinBtn").textContent = "Скин: " + skin.name;
  document.querySelectorAll("#skinMenu button").forEach(b => b.setAttribute("aria-checked", b.dataset.id === skin.id));
  lsSet("luch.skin", skin.id);
}
LUCH_SKINS.forEach(s => {
  const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "menuitemradio"); b.dataset.id = s.id;
  b.innerHTML = "<b></b><small></small>"; b.querySelector("b").textContent = s.name; b.querySelector("small").textContent = s.note;
  b.addEventListener("click", () => { applySkin(s.id); toggleSkinMenu(false); }); $("skinMenu").appendChild(b);
});
function toggleSkinMenu(open) { const m = $("skinMenu"); open = open ?? m.hidden; m.hidden = !open; $("skinBtn").setAttribute("aria-expanded", open); }
$("skinBtn").addEventListener("click", e => { e.stopPropagation(); toggleSkinMenu(); });
document.addEventListener("click", e => { if (!e.target.closest(".skinwrap")) toggleSkinMenu(false); });
applySkin(lsGet("luch.skin", "bort07"));

/* ================= output ================= */
const toggleScene = () => { document.body.classList.toggle("scene"); if (document.body.classList.contains("scene")) toast("Сцена: S вернуть пульт"); };
$("sceneBtn").addEventListener("click", toggleScene);
$("saveBtn").addEventListener("click", async () => {
  const s = active(); if (!s) return;
  await Store.addPreset(s.preset); log(`Пресет «${s.preset.name}» сохранён${s.preset.mods.length ? " со связями: " + s.preset.mods.length : ""}.`, "ok"); toast("Сохранено в пресеты");
  if (libTab !== "presets") selectTab("presets");
});
document.querySelectorAll("#xmode button").forEach(b => b.addEventListener("click", () => {
  live.xMode = b.dataset.m; document.querySelectorAll("#xmode button").forEach(x => x.setAttribute("aria-pressed", x === b));
  $("xfader").disabled = live.xMode !== "manual"; $("xfader").value = 0;
  if (live.b) { live.a = live.b; live.b = null; } live.x = 0; $("cueLabel").textContent = live.xMode === "manual" ? "РУЧНОЙ: ВЫБЕРИ СЛЕДУЮЩИЙ, ЗАТЕМ ФЕЙДЕР" : "";
}));
$("xfader").addEventListener("input", () => {
  live.x = +$("xfader").value;
  if (live.b && live.x >= .999) { live.a = live.b; live.b = null; live.x = 0; $("xfader").value = 0; $("cueLabel").textContent = ""; bindDeck(); setTicker(); }
  else if (live.b) { bindDeck(); setTicker(); }
});
let downloads = null;
(async () => { await null; try { downloads = window.claude?.use ? await window.claude.use("downloads") : null; } catch (e) { downloads = null; }
  if (!downloads) { $("shotBtn").disabled = true; $("recBtn").disabled = true; } })();
async function offer(blob, name) { try { await downloads.save({ filename: name, data: blob }); toast("Сохранено: " + name); } catch (e) { if (e?.code !== "declined") toast("Не получилось сохранить файл"); } }
let wantShot = false; $("shotBtn").addEventListener("click", () => wantShot = true);
const recMime = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
if (!recMime) $("recBtn").hidden = true;
let rec = null;
$("recBtn").addEventListener("click", () => {
  if (rec) { rec.stop(); return; }
  const chunks = []; rec = new MediaRecorder($("stage").captureStream(30), { mimeType: recMime, videoBitsPerSecond: 20e6 });
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = () => { const ext = recMime.includes("mp4") ? "mp4" : "webm"; $("recBtn").classList.remove("on"); $("recBtn").textContent = "● Запись"; rec = null; offer(new Blob(chunks, { type: recMime }), `luch3000-${Date.now()}.${ext}`); };
  rec.start(500); $("recBtn").classList.add("on"); $("recBtn").textContent = "■ Стоп"; toast("Запись идёт, до 60 секунд");
  setTimeout(() => rec && rec.stop(), 60000);
});

/* ================= keyboard ================= */
async function toggleFS() { try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); } catch (e) { toast("Полный экран здесь недоступен"); } }
const PAD_KEYS = { q: "strobe", й: "strobe", w: "freeze", ц: "freeze", e: "invert", у: "invert", r: "mirror", к: "mirror", a: "punch", ф: "punch", d: "rgb", в: "rgb", z: "kaleido", я: "kaleido", x: "pixel", ч: "pixel", c: "echo", с: "echo" };
addEventListener("keydown", e => {
  if (e.target.closest && e.target.closest("textarea, input:not([type=color]):not([type=checkbox]), select")) return;
  if (e.target.classList?.contains("knob") && e.key.startsWith("Arrow")) return;
  const k = e.key.toLowerCase();
  if (PAD_KEYS[k]) { e.preventDefault(); if (e.repeat) return; if (e.shiftKey) latch(PAD_KEYS[k]); else hold(PAD_KEYS[k], true); return; }
  if (e.key === "Escape") { if (Mod.armed) Mod.arm(null); if (Midi.learning) Midi.toggle(); return; }
  if (k >= "1" && k <= "9") { const it = libItems()[+k - 1]; if (it) recall(it); }
  else if (k === "arrowright") step(1);
  else if (k === "arrowleft") step(-1);
  else if (k === "s" || k === "ы") toggleScene();
  else if (k === "f" || k === "а") toggleFS();
  else if (k === "t" || k === "е") Clock.tap();
  else if (k === "b" || k === "и") { live.blackout = !live.blackout; toast(live.blackout ? "Затемнение" : "Выход открыт"); }
  else if (e.code === "Space" && e.target === document.body) { e.preventDefault(); togglePlay(); }
});
addEventListener("keyup", e => { const k = e.key.toLowerCase(); if (PAD_KEYS[k]) hold(PAD_KEYS[k], false); });
addEventListener("blur", () => Object.keys(FX.held).forEach(k => hold(k, false)));
document.querySelectorAll(".mobtabs button").forEach(b => b.addEventListener("click", () => {
  document.body.dataset.pane = document.body.dataset.pane === b.dataset.pane ? "none" : b.dataset.pane;
  document.querySelectorAll(".mobtabs button").forEach(x => x.setAttribute("aria-pressed", x.dataset.pane === document.body.dataset.pane));
}));
document.body.dataset.pane = "none";

/* ================= loop ================= */
function size() {
  const s = Math.min(devicePixelRatio || 1, 1.5);
  const w = Math.round(innerWidth * s), h = Math.round(innerHeight * s);
  const k = Math.min(1, 1920 / Math.max(w, h)); E.resize(Math.max(64, Math.round(w * k)), Math.max(64, Math.round(h * k)));
}
const beatEls = [...$("beats").children];
let last = performance.now(), t = 0, frames = 0, fpsT = 0, sec = -1, uiTick = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, .1); last = now; t += dt;
  size(); analyse(dt, now); Clock.step(dt); Mod.update(dt);
  if (live.b && live.xMode === "auto") { live.x += dt / Math.max(live.xDur, .05); if (live.x >= 1) { live.a = live.b; live.b = null; live.x = 0; bindDeck(); } }
  live.master += ((live.blackout ? 0 : live.masterTarget) - live.master) * (1 - Math.exp(-dt * 6));
  if (live.a) {
    const lead = active();
    const ea = { prog: live.a.prog, preset: Mod.effective(live.a) };
    const eb = live.b ? { prog: live.b.prog, preset: Mod.effective(live.b) } : null;
    const post = { ...lead.eff.post }; if (fxOn("rgb")) post.chroma = Math.min(1, post.chroma + .5 + Clock.pulse * .5);
    if (fxOn("echo")) post.trail = .97;
    const lk = lead.eff.look; Epoch.ensureAtlas(lk.sym);
    const look = { lens: LENS_IDX[lk.lens] || 0, lensAmt: lk.lensAmt, lensP: lk.lensP, sym: lk.symMode, symAmt: lk.symAmt, symSize: lk.symSize, symDen: lk.symDen, symN: Epoch.count, palRGB: lead.eff.palRGB };
    const s = { time: t, bass: A.bass, mid: A.mid, high: A.high, level: A.level, beat: Math.max(Clock.pulse * (A.live || !A.el ? 1 : 0), A.onset * .6), realTime: now / 1000, beatN: Math.floor(Clock.pos) };
    E.frame(s, ea, eb, live.b ? live.x : 0, post, post.scan, live.master, fxState(), look);
    if (wantShot) { wantShot = false; $("stage").toBlob(b => b && offer(b, `luch3000-${Date.now()}.png`), "image/png"); }
    if (++uiTick % 3 === 0) {
      styleKnobs.forEach((k, i) => k.setMod(lead.preset.mods.some(m => m.dst === "p" + i) ? lead.eff.params[i] : null));
      POST_KEYS.forEach(([k]) => knobs[k].setMod(lead.preset.mods.some(m => m.dst === k) ? lead.eff.post[k] : null));
      LOOK_KEYS.forEach(([k]) => knobs[k].setMod(lead.preset.mods.some(m => m.dst === k) ? lead.eff.look[k] : null));
      SOURCES.forEach(([k]) => { chipEls[k].style.setProperty("--v", (Mod.values[k] || 0).toFixed(3)); chipEls[k].querySelector("i").textContent = Math.round((Mod.values[k] || 0) * 99); });
    }
  }
  frames++; fpsT += dt;
  if (fpsT >= .5) { $("fps").textContent = Math.round(frames / fpsT); frames = 0; fpsT = 0; }
  if (frames % 2 === 0) drawScope();
  const bi = Math.floor(Clock.pos) % 4; beatEls.forEach((el, i) => el.classList.toggle("on", i === bi && Clock.beat < .5));
  const sNow = Math.floor(now / 1000);
  if (sNow !== sec) { sec = sNow; $("clock").textContent = stamp(); $("bpm").textContent = Math.round(Clock.bpm); $("bpmSrc").textContent = { demo: "ДЕМО", auto: A.live ? (A.bpm ? "ПО ТРЕКУ" : "СЛУШАЮ…") : "АВТО", tap: "ТАП", manual: "ВРУЧНУЮ" }[Clock.source]; }
  requestAnimationFrame(frame);
}
const scope = $("scope"), sx = scope.getContext("2d");
function drawScope() {
  const w = scope.width, h = scope.height; sx.clearRect(0, 0, w, h);
  sx.fillStyle = "rgba(125,255,168,.55)";
  for (let i = 0; i < 64; i++) { const v = A.spec[i * 8] / 255; sx.fillRect(i * (w / 64) + 1, h - v * h * .9, w / 64 - 2, v * h * .9); }
  sx.strokeStyle = "rgba(143,244,255,.95)"; sx.lineWidth = 2; sx.beginPath();
  for (let i = 0; i < 128; i++) { const x = i / 127 * w, y = h / 2 + (A.wave[i * 4] - 128) / 128 * h * .42; i ? sx.lineTo(x, y) : sx.moveTo(x, y); }
  sx.stroke();
  if (A.onset > .5) { sx.fillStyle = "rgba(255,179,92,.9)"; sx.beginPath(); sx.arc(w - 10, 10, 5, 0, 7); sx.fill(); }
}

/* ================= boot ================= */
log("ЛУЧ-3000 на связи. Движок: WebGL2" + (E.floatOK ? ", 16-бит буферы." : "."), "ok");
size();
const boot = makePreset(styles.get("tunnel"), { mods: [{ src: "bass", dst: "p3", amt: .35 }, { src: "lfo2", dst: "p2", amt: .3 }, { src: "onset", dst: "chroma", amt: .3 }] });
live.liveKey = "s:tunnel"; apply(boot, { instant: true, key: "s:tunnel" });
renderLibrary();
Store.init();
setMode("pick");
showPane("query");
window.LUCH = { engine: E, styles };
requestAnimationFrame(frame);
})();
