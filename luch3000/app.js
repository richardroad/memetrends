/*
 * ЛУЧ-3000 — приложение: звук, библиотека, ИИ-режиссёр, кузница стилей, пульт.
 */
(() => {
const $ = id => document.getElementById(id);
const clamp01 = v => Math.min(1, Math.max(0, +v || 0));
const POST_KEYS = [["trail", "Шлейф"], ["zoom", "Зум"], ["twist", "Вращение"], ["bloom", "Свечение"], ["chroma", "RGB-сдвиг"], ["scan", "Развёртка"]];
const DEFAULT_POST = { trail: .3, zoom: .5, twist: .5, bloom: .5, chroma: .2, scan: .25 };

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

/* ================= styles & presets ================= */
const styles = new Map();
LUCH_STYLES.forEach(s => styles.set(s.id, { ...s, builtin: true }));
let userPresets = [];

function hexToRGB(h) { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim()); if (!m) return [0, 0, 0]; const n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
function okHex(h, fb) { return /^#[0-9a-f]{6}$/i.test(String(h || "").trim()) ? String(h).trim().toLowerCase() : fb; }
function makePreset(style, o = {}) {
  const p = {
    name: o.name || style.name,
    style: style.id,
    params: Array.from({ length: 8 }, (_, i) => clamp01(o.params?.[i] ?? style.params[i]?.def ?? .5)),
    palette: Array.from({ length: 4 }, (_, i) => okHex(o.palette?.[i], style.palette?.[i] || "#000000")),
    post: Object.fromEntries(POST_KEYS.map(([k]) => [k, clamp01(o.post?.[k] ?? style.post?.[k] ?? DEFAULT_POST[k])])),
    note: o.note || "", prompt: o.prompt || "", seed: o.seed ?? Math.floor(Math.random() * 1000),
  };
  return withRGB(p);
}
function withRGB(p) { p.palRGB = new Float32Array(p.palette.flatMap(hexToRGB)); return p; }
const clonePreset = p => withRGB(JSON.parse(JSON.stringify({ ...p, palRGB: undefined })));

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
      userPresets = snap.docs.map(d => ({ ...d.data(), _id: d.id })).filter(p => p && p.style).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderLibrary();
    }, onErr);
  },
  loadLocal() {
    try { JSON.parse(localStorage.getItem("luch.styles") || "[]").forEach(s => { const v = sanitizeStyle(s); if (v) styles.set(v.id, v); }); } catch (e) {}
    try { userPresets = JSON.parse(localStorage.getItem("luch.presets") || "[]"); } catch (e) { userPresets = []; }
    renderLibrary();
  },
  saveLocal() {
    try {
      localStorage.setItem("luch.styles", JSON.stringify([...styles.values()].filter(s => !s.builtin)));
      localStorage.setItem("luch.presets", JSON.stringify(userPresets.slice(0, 200)));
    } catch (e) {}
  },
  async addStyle(s) {
    const doc = { name: s.name, description: s.description, tags: s.tags, params: s.params, palette: s.palette, post: s.post, glsl: s.glsl, prompt: s.prompt || "", createdAt: Date.now() };
    if (this.mode === "db") {
      try { const ref = await this.db.collection("styles").add(doc); return "u_" + ref.id; }
      catch (e) { log("Не сохранил стиль в базу (" + (e && e.code) + "), оставил в браузере.", "warn"); }
    }
    const id = "u_" + Date.now().toString(36); styles.set(id, { ...doc, id }); this.saveLocal(); renderLibrary(); return id;
  },
  async addPreset(p) {
    const doc = { name: p.name, style: p.style, params: p.params, palette: p.palette, post: p.post, note: p.note || "", prompt: p.prompt || "", seed: p.seed || 0, createdAt: Date.now() };
    if (this.mode === "db") {
      try { await this.db.collection("presets").add(doc); return true; }
      catch (e) { log("Не сохранил пресет в базу (" + (e && e.code) + "), оставил в браузере.", "warn"); }
    }
    userPresets.unshift(doc); this.saveLocal(); renderLibrary(); return true;
  },
};
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

/* ================= live deck: A, B and crossfade ================= */
const live = { a: null, b: null, x: 0, xDur: 1.5, master: 1, blackout: false, masterTarget: 1 };
function compile(preset) {
  const st = styles.get(preset.style); if (!st) { log("Стиль «" + preset.style + "» не найден.", "err"); return null; }
  const prog = E.program(st);
  if (prog.error) { log("Стиль «" + st.name + "» не компилируется: " + String(prog.error).split("\n")[0], "err"); return null; }
  return { preset, prog, style: st };
}
function apply(preset, { instant = false } = {}) {
  const slot = compile(preset); if (!slot) return false;
  if (!live.a || instant || live.xDur < .05) { live.a = slot; live.b = null; live.x = 0; }
  else { if (live.b) live.a = live.b; live.b = slot; live.x = 0.0001; }
  bindDeck(); markLive(); setTicker();
  return true;
}
const active = () => (live.b || live.a);
function setTicker() { const s = active(); if (s) $("nowPlaying").textContent = `${s.style.name} · ${s.preset.name}`; }

/* ================= knobs ================= */
function knob(host, { label, value, def = value, fmt, onInput }) {
  const el = document.createElement("div"); el.className = "knob"; el.tabIndex = 0; el.setAttribute("role", "slider");
  el.setAttribute("aria-valuemin", "0"); el.setAttribute("aria-valuemax", "100");
  el.innerHTML = `<svg viewBox="-25 -25 50 50" aria-hidden="true">
    <defs><radialGradient id="kc${host.id}${host.children.length}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#a9b4c0"/><stop offset="1" stop-color="#2c333c"/></radialGradient></defs>
    <path class="trk" fill="none" stroke="rgba(143,244,255,.14)" stroke-width="3" stroke-linecap="round"/>
    <path class="val" fill="none" stroke="#8ff4ff" stroke-width="3" stroke-linecap="round" style="filter:drop-shadow(0 0 3px rgba(143,244,255,.8))"/>
    <circle r="14" fill="url(#kc${host.id}${host.children.length})" stroke="rgba(0,0,0,.6)"/>
    <circle r="10.5" fill="none" stroke="rgba(255,255,255,.25)"/>
    <line class="ind" x1="0" y1="-5" x2="0" y2="-12.5" stroke="#05121c" stroke-width="2.2" stroke-linecap="round"/>
  </svg><span class="kv"></span><span class="kl"></span>`;
  host.appendChild(el);
  const R = 20;
  const pt = a => { const r = (a - 90) * Math.PI / 180; return [Math.cos(r) * R, Math.sin(r) * R]; };
  const arc = (from, to) => { const [x1, y1] = pt(from), [x2, y2] = pt(to); return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };
  el.querySelector(".trk").setAttribute("d", arc(-135, 135));
  let v = clamp01(value), d = def;
  const api = {
    get value() { return v; },
    set(nv, lab, ndef) { v = clamp01(nv); if (lab !== undefined) el.querySelector(".kl").textContent = lab; if (ndef !== undefined) d = ndef; paint(); },
    el,
  };
  function paint() {
    const a = -135 + v * 270;
    el.querySelector(".val").setAttribute("d", v > .002 ? arc(-135, a) : "");
    el.querySelector(".ind").setAttribute("transform", `rotate(${a})`);
    el.querySelector(".kv").textContent = fmt ? fmt(v) : Math.round(v * 100);
    el.setAttribute("aria-valuenow", Math.round(v * 100)); el.setAttribute("aria-valuetext", el.querySelector(".kv").textContent);
    el.setAttribute("aria-label", el.querySelector(".kl").textContent);
  }
  const change = nv => { v = clamp01(nv); paint(); onInput(v); };
  let drag = null;
  el.addEventListener("pointerdown", e => { drag = { y: e.clientY, v }; el.setPointerCapture(e.pointerId); el.focus(); });
  el.addEventListener("pointermove", e => { if (!drag) return; change(drag.v + (drag.y - e.clientY) / (e.shiftKey ? 600 : 160)); });
  el.addEventListener("pointerup", () => drag = null);
  el.addEventListener("pointercancel", () => drag = null);
  el.addEventListener("dblclick", () => change(d));
  el.addEventListener("wheel", e => { e.preventDefault(); change(v - Math.sign(e.deltaY) * .02); }, { passive: false });
  el.addEventListener("keydown", e => {
    const step = e.shiftKey ? .05 : .01;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); change(v + step); }
    if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); change(v - step); }
  });
  api.set(v, label); return api;
}
const styleKnobs = [], postKnobs = {};
for (let i = 0; i < 8; i++) styleKnobs.push(knob($("styleKnobs"), { label: "", value: .5, onInput: v => { const s = active(); if (s) s.preset.params[i] = v; } }));
POST_KEYS.forEach(([k, l]) => postKnobs[k] = knob($("postKnobs"), { label: l, value: DEFAULT_POST[k], onInput: v => { const s = active(); if (s) s.preset.post[k] = v; } }));
const xKnob = knob($("masterKnobs"), { label: "Переход", value: .375, fmt: v => (v * 4).toFixed(1) + "с", onInput: v => live.xDur = v * 4 });
const mKnob = knob($("masterKnobs"), { label: "Яркость", value: 1, onInput: v => live.masterTarget = v });
live.xDur = 1.5;

const swatchInputs = [];
for (let i = 0; i < 4; i++) {
  const w = document.createElement("label"); w.className = "swatch"; w.title = ["Фон", "Тень", "Свет", "Блик"][i];
  const inp = document.createElement("input"); inp.type = "color"; inp.id = "pal" + i; inp.setAttribute("aria-label", "Цвет палитры: " + w.title);
  inp.addEventListener("input", () => { const s = active(); if (!s) return; s.preset.palette[i] = inp.value; withRGB(s.preset); });
  w.appendChild(inp); $("swatches").appendChild(w); swatchInputs.push(inp);
}
function bindDeck() {
  const s = active(); if (!s) return;
  $("styleName").textContent = s.style.name;
  styleKnobs.forEach((k, i) => {
    const p = s.style.params[i];
    k.el.hidden = !p;
    if (p) k.set(s.preset.params[i], p.name, p.def);
  });
  POST_KEYS.forEach(([k]) => postKnobs[k].set(s.preset.post[k], undefined, s.style.post?.[k] ?? DEFAULT_POST[k]));
  swatchInputs.forEach((inp, i) => inp.value = s.preset.palette[i]);
}

/* ================= audio ================= */
const A = {
  ctx: null, an: null, el: null, fbuf: null, tbuf: null, live: false,
  spec: new Uint8Array(512), wave: new Uint8Array(512),
  bass: 0, mid: 0, high: 0, level: 0, beat: 0, avgBass: .3, lastBeat: 0, intervals: [], bpm: 0,
  demoT: 0,
};
$("audioFile").addEventListener("change", () => {
  const f = $("audioFile").files && $("audioFile").files[0]; if (!f) return;
  if (!A.ctx) {
    A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.an = A.ctx.createAnalyser(); A.an.fftSize = 2048; A.an.smoothingTimeConstant = .72;
    A.fbuf = new Uint8Array(A.an.frequencyBinCount); A.tbuf = new Uint8Array(A.an.fftSize);
    A.el = new Audio(); A.el.loop = true;
    A.ctx.createMediaElementSource(A.el).connect(A.an); A.an.connect(A.ctx.destination);
    A.el.addEventListener("play", () => $("playBtn").textContent = "Пауза");
    A.el.addEventListener("pause", () => $("playBtn").textContent = "Пуск");
  }
  if (A.el.src) URL.revokeObjectURL(A.el.src);
  A.el.src = URL.createObjectURL(f); $("trackName").textContent = f.name; $("playBtn").disabled = false;
  A.ctx.resume(); A.el.play().catch(() => {}); A.intervals = []; log("Сигнал: " + f.name, "ok");
});
const togglePlay = () => { if (!A.el || !A.el.src) return; A.ctx.resume(); A.el.paused ? A.el.play() : A.el.pause(); };
$("playBtn").addEventListener("click", togglePlay);
$("demoBtn").addEventListener("click", () => { if (A.el) A.el.pause(); $("trackName").textContent = "демо-сигнал · 124 BPM · без звука"; A.intervals = []; log("Сигнал: демо 124 BPM", "ok"); });

function analyse(dt, now) {
  A.live = !!(A.el && !A.el.paused && A.el.src);
  if (A.live) {
    A.an.getByteFrequencyData(A.fbuf); A.an.getByteTimeDomainData(A.tbuf);
    const binHz = A.ctx.sampleRate / A.an.fftSize, n = A.fbuf.length;
    for (let i = 0; i < 512; i++) {
      const x0 = i / 512, x1 = (i + 1) / 512;
      const b0 = Math.max(1, Math.floor(30 * Math.pow(533, x0) / binHz)), b1 = Math.min(n - 1, Math.max(b0 + 1, Math.floor(30 * Math.pow(533, x1) / binHz)));
      let m = 0; for (let b = b0; b < b1; b++) m = Math.max(m, A.fbuf[b]);
      A.spec[i] = Math.min(255, m * (1 + x0 * .5));
    }
    for (let i = 0; i < 512; i++) A.wave[i] = A.tbuf[i * 4];
  } else {
    A.demoT += dt;
    const bps = 124 / 60, ph = (A.demoT * bps) % 1, bar = Math.floor(A.demoT * bps) % 4;
    const kick = Math.exp(-ph * 9), hat = Math.exp(-((ph + .5) % 1) * 28), snare = (bar % 2 ? Math.exp(-ph * 12) : 0);
    const pad = .35 + .2 * Math.sin(A.demoT * .7), bassN = .5 + .3 * Math.sin(A.demoT * bps * Math.PI * .5);
    for (let i = 0; i < 512; i++) {
      const x = i / 512;
      let v = kick * Math.exp(-x * 18) * 1.1 + bassN * Math.exp(-Math.pow((x - .12) * 9, 2)) * .7
        + pad * Math.exp(-Math.pow((x - .42) * 3, 2)) * (.55 + .45 * Math.sin(x * 40 + A.demoT * 2)) * .7
        + snare * Math.exp(-Math.pow((x - .5) * 3, 2)) * .6 + hat * Math.exp(-Math.pow((x - .82) * 5, 2)) * .8;
      v *= .85 + .15 * Math.random();
      A.spec[i] = Math.min(255, v * 230);
      const tt = A.demoT + i / 512 * .02;
      A.wave[i] = 128 + 127 * Math.max(-1, Math.min(1, kick * Math.sin(tt * 2 * Math.PI * 55) * .8 + .3 * Math.sin(tt * 2 * Math.PI * 220 + Math.sin(tt * 9)) * pad + (Math.random() - .5) * hat * .5));
    }
  }
  E.setAudio(A.spec, A.wave);
  const band = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += A.spec[i]; return s / ((b - a) * 255); };
  const k = 1 - Math.exp(-dt * 14);
  A.bass += (band(0, 70) * 1.4 - A.bass) * k; A.mid += (band(70, 290) * 1.6 - A.mid) * k; A.high += (band(290, 512) * 2 - A.high) * k;
  A.level += (((A.bass + A.mid + A.high) / 3) - A.level) * (1 - Math.exp(-dt * 3));
  A.avgBass += (A.bass - A.avgBass) * (1 - Math.exp(-dt * 1.2));
  A.beat *= Math.exp(-dt * 6);
  const t = now / 1000;
  if (A.bass > A.avgBass * 1.3 && A.bass > .22 && t - A.lastBeat > .28) {
    if (A.lastBeat) { A.intervals.push(t - A.lastBeat); if (A.intervals.length > 12) A.intervals.shift(); }
    A.lastBeat = t; A.beat = 1;
    if (A.intervals.length >= 4) {
      const s = [...A.intervals].sort((a, b) => a - b); let bpm = 60 / s[Math.floor(s.length / 2)];
      while (bpm < 75) bpm *= 2; while (bpm > 185) bpm /= 2; A.bpm = Math.round(bpm);
    }
  }
}
const scope = $("scope"), sx = scope.getContext("2d");
function drawScope() {
  const w = scope.width, h = scope.height; sx.clearRect(0, 0, w, h);
  sx.fillStyle = "rgba(125,255,168,.55)";
  for (let i = 0; i < 64; i++) { const v = A.spec[i * 8] / 255; sx.fillRect(i * (w / 64) + 1, h - v * h * .9, w / 64 - 2, v * h * .9); }
  sx.strokeStyle = "rgba(143,244,255,.95)"; sx.lineWidth = 2; sx.beginPath();
  for (let i = 0; i < 128; i++) { const x = i / 127 * w, y = h / 2 + (A.wave[i * 4] - 128) / 128 * h * .42; i ? sx.lineTo(x, y) : sx.moveTo(x, y); }
  sx.stroke();
  if (A.beat > .5) { sx.fillStyle = "rgba(255,179,92,.9)"; sx.beginPath(); sx.arc(w - 10, 10, 5, 0, 7); sx.fill(); }
}

/* ================= library ================= */
let libTab = "styles";
const thumbs = new Map();
const THUMB_S = { time: 6.4, bass: .55, mid: .45, high: .35, level: .6, beat: .35, realTime: 0 };
const thumbQueue = [];
function thumbFor(key, style, preset, img) {
  if (thumbs.has(key)) { img.src = thumbs.get(key); return; }
  thumbQueue.push({ key, style, preset, img }); pumpThumbs();
}
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
  if (libTab === "styles") return [...styles.values()].map(s => ({ kind: "style", style: s, preset: makePreset(s), key: "s:" + s.id, label: s.name, badge: s.builtin ? "" : "КУЗНИЦА" }));
  return userPresets.map((p, i) => { const s = styles.get(p.style); return s ? { kind: "preset", style: s, preset: makePreset(s, p), key: "p:" + (p._id || p.createdAt || i), label: p.name, badge: "" } : null; }).filter(Boolean);
}
function renderLibrary() {
  const g = $("libGrid"); g.innerHTML = "";
  const items = libItems();
  $("libCount").textContent = `${String(styles.size).padStart(2, "0")} СТ · ${String(userPresets.length).padStart(2, "0")} ПР`;
  if (!items.length) { const e = document.createElement("p"); e.className = "empty"; e.textContent = "Пресетов пока нет. Найди удачный вид и нажми «В пресеты» на пульте: он появится здесь и будет вызываться цифрами 1–9."; g.appendChild(e); return; }
  items.forEach((it, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "card"; b.dataset.key = it.key;
    b.setAttribute("aria-label", it.label);
    const img = document.createElement("img"); img.alt = ""; b.appendChild(img);
    const cap = document.createElement("span"); cap.className = "cap";
    if (i < 9) { const k = document.createElement("kbd"); k.textContent = i + 1; cap.appendChild(k); }
    cap.appendChild(document.createTextNode(it.label)); b.appendChild(cap);
    if (it.badge) { const bd = document.createElement("span"); bd.className = "badge"; bd.textContent = it.badge; b.appendChild(bd); }
    b.addEventListener("click", () => recall(it));
    g.appendChild(b);
    thumbFor(it.key, it.style, it.preset, img);
  });
  markLive();
}
function recall(it) { if (apply(clonePreset(it.preset))) { live.liveKey = it.key; markLive(); } }
function markLive() { document.querySelectorAll("#libGrid .card").forEach(c => c.classList.toggle("live", c.dataset.key === live.liveKey)); }
function selectTab(t) { libTab = t; $("tabStyles").setAttribute("aria-selected", t === "styles"); $("tabPresets").setAttribute("aria-selected", t === "presets"); renderLibrary(); }
$("tabStyles").addEventListener("click", () => selectTab("styles"));
$("tabPresets").addEventListener("click", () => selectTab("presets"));

/* ================= AI: director + forge ================= */
let sample = null, aiMode = "pick", running = null;
(async () => {
  await null;
  try { sample = window.claude?.use ? await window.claude.use("sample") : null; } catch (e) { sample = null; }
  if (sample) { setLed("on"); log("Связь с ИИ установлена.", "ai"); }
  else { setLed(""); log("ИИ недоступен в этом окне: подбор работает автономно по словам, кузница выключена.", "warn"); }
  setMode(aiMode);
})();
const MODE_NOTES = {
  pick: "Опиши образ, настроение, темп. ИИ выберет стили из библиотеки и настроит их: три варианта на выбор.",
  forge: "Опиши то, чего нет в библиотеке. ИИ напишет новый стиль кодом, сам проверит компиляцию и добавит его в библиотеку.",
};
function setMode(m) {
  aiMode = m; $("modePick").setAttribute("aria-selected", m === "pick"); $("modeForge").setAttribute("aria-selected", m === "forge");
  $("modeNote").textContent = MODE_NOTES[m] + (m === "forge" && !sample ? " Сейчас недоступно: открой ЛУЧ-3000 в claude.ai." : "");
  $("synthBtn").textContent = m === "pick" ? "Синтез" : "Выковать";
}
$("modePick").addEventListener("click", () => setMode("pick"));
$("modeForge").addEventListener("click", () => setMode("forge"));

const ERR_COPY = {
  not_granted: "ИИ не разрешён для этой страницы.", sampling_disabled: "ИИ недоступен для этого аккаунта.", rate_limited: "Слишком много запросов или исчерпан лимит. Попробуй чуть позже.",
  session_expired: "Нужно заново войти в claude.ai.", refused: "ИИ отказался от такого запроса. Переформулируй.", invalid_json: "Ответ пришёл в неверном формате. Нажми ещё раз.",
  empty_completion: "ИИ ничего не ответил. Упрости запрос.", upstream_error: "Сбой связи. Попробуй ещё раз.", cancelled: "Остановлено.", tools_unavailable: "Проверка кода недоступна в этом окне.",
  prompt_too_large: "Запрос слишком длинный.",
};
const hideCodes = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"];
function aiError(e) {
  const code = e && e.code; log(ERR_COPY[code] || ("Ошибка: " + (code || e?.message || e)), code === "cancelled" ? "warn" : "err");
  if (hideCodes.includes(code)) { sample = null; setMode(aiMode); }
  setLed(sample ? "on" : (code === "cancelled" ? "on" : "err"));
}
function catalog() {
  return [...styles.values()].map(s => `- ${s.id}: ${s.name}. ${s.description} Tags: ${s.tags.join(", ")}. Params (in order): ${s.params.map(p => p.name).join(" | ")}`).join("\n");
}
const DIRECTOR = req => `You are the visual director of ЛУЧ-3000, a real-time music visualizer for concerts and DJ sets on big LED screens.
Turn the request into 3 presets using ONLY these styles:
${catalog()}

Rules:
- Variants must differ meaningfully: different styles, or the same style with clearly different settings and palette.
- "params": numbers 0..1, one per listed param, in order.
- "palette": 4 hex colours from darkest to brightest. The first is the background tone and should be near black (LED screens: black is light off). The last is the brightest highlight. Avoid muddy greys unless asked.
- "post": trail (feedback trails), zoom (0.5 still, above zooms in, below zooms out), twist (0.5 none), bloom, chroma (RGB split), scan (CRT scanlines, nostalgic), all 0..1. Keep zoom and twist within 0.35..0.65 unless the request is wild.
- "name": 1-3 evocative words in Russian. "note": one short sentence in Russian about the idea and how it plays with the music.
Reply with only JSON: {"variants":[{"style":"id","name":"...","note":"...","params":[...],"palette":["#...","#...","#...","#..."],"post":{"trail":0,"zoom":0.5,"twist":0.5,"bloom":0,"chroma":0,"scan":0}}]}

Request: ${req}`;

const FORGE = req => `You write a new visual style for ЛУЧ-3000, a real-time music visualizer for concerts on big LED screens.
Write GLSL ES 3.00 code: helper functions if needed, then exactly one function \`vec3 render(vec2 p)\`.
- p: centered coordinates, y in [-0.5, 0.5], x scaled by aspect ratio. Return RGB, roughly 0..1.5.
- Already provided, do NOT redeclare: uniforms uTime (seconds), uRes (pixels), uBass, uMid, uHigh, uLevel (0..1, smoothed), uBeat (1 on a beat, decays to 0), P0..P7 (params 0..1), uPal[4] (palette, dark to bright); varying vUv (0..1); functions float hash(vec2), float noise(vec2), float fbm(vec2), mat2 rot(float), vec3 ramp(float t) (palette gradient dark→bright), vec3 cyc(float t) (cyclic palette), float spec(float x) (log spectrum 0..1, x=0 bass, x=1 treble), float wave(float x) (waveform -1..1), vec3 prev(vec2 uv) (previous frame, for feedback).
- Colour only through ramp/cyc/uPal so palettes work. Keep black dominant. React to music musically: structure, motion and light respond to different bands, not a global pulse.
- Fast: loops with constant bounds and at most 64 iterations total per pixel, no texture lookups except the provided functions. Must hold 60 fps at 1080p.
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
  const em = document.createElement("em"); em.textContent = style.name.toUpperCase();
  const s = document.createElement("small"); s.textContent = preset.note;
  t.append(n, em, s); b.append(img, t);
  b.addEventListener("click", () => { apply(clonePreset(preset)); live.liveKey = null; markLive(); });
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
  return scored.map(({ s }) => makePreset(s, { name: s.name, note: "Автономный подбор по словам запроса.", palette: pal, params: s.params.map(p => clamp01(p.def + (Math.random() - .5) * .3)), prompt: req }));
}
async function synth() {
  const req = $("prompt").value.trim();
  if (!req) { $("prompt").focus(); toast("Опиши визуал словами"); return; }
  if (running) { running.abort(); return; }
  if (aiMode === "forge") return forge(req);
  const box = $("variants"); box.innerHTML = "";
  if (!sample) {
    log("Подбор без ИИ: " + req, "warn");
    localPick(req).forEach(p => box.appendChild(variantCard(p, styles.get(p.style))));
    return;
  }
  running = new AbortController(); $("synthBtn").textContent = "Стоп"; setLed("busy");
  log("Синтез: " + req, "ai");
  try {
    const out = await sample.json(DIRECTOR(req), { modelTier: "default", signal: running.signal });
    const list = (out && Array.isArray(out.variants) ? out.variants : []).slice(0, 4);
    let n = 0;
    list.forEach(v => {
      const st = styles.get(v && v.style); if (!st) return;
      const p = makePreset(st, { ...v, prompt: req }); box.appendChild(variantCard(p, st)); n++;
      if (n === 1) { apply(clonePreset(p)); live.liveKey = null; markLive(); }
    });
    log(n ? `Готово: ${n} варианта. Первый уже в эфире.` : "ИИ не предложил подходящих вариантов.", n ? "ok" : "warn");
    setLed("on");
  } catch (e) { aiError(e); }
  finally { running = null; setMode(aiMode); }
}
async function forge(req, fix) {
  if (!sample) { toast("Кузница работает только с ИИ в claude.ai"); return; }
  running = new AbortController(); $("synthBtn").textContent = "Стоп"; setLed("busy");
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
    catch (e) {
      if (e && e.code === "tools_unavailable") { log("Проверка кода недоступна, кую без неё.", "warn"); out = await sample.json(input, { modelTier: "complex", signal: running.signal }); }
      else throw e;
    }
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
    styles.set(id, { ...st, id });
    renderLibrary();
    const p = makePreset(styles.get(id), { prompt: req });
    $("variants").prepend(variantCard(p, styles.get(id)));
    apply(p); log(`Новый стиль «${st.name}» в библиотеке и в эфире.`, "ok"); setLed("on");
  } catch (e) { aiError(e); }
  finally { running = null; setMode(aiMode); }
}
$("synthBtn").addEventListener("click", synth);
$("prompt").addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); synth(); } });

/* ================= output: scene, save, record ================= */
const toggleScene = () => { document.body.classList.toggle("scene"); if (document.body.classList.contains("scene")) toast("Сцена: S вернуть пульт"); };
$("sceneBtn").addEventListener("click", toggleScene);
$("saveBtn").addEventListener("click", async () => {
  const s = active(); if (!s) return;
  const p = { ...s.preset, name: s.preset.name };
  await Store.addPreset(p); log(`Пресет «${p.name}» сохранён.`, "ok"); toast("Сохранено в пресеты");
  if (libTab !== "presets") selectTab("presets");
});
let downloads = null;
(async () => { try { downloads = window.claude?.use ? await window.claude.use("downloads") : null; } catch (e) { downloads = null; }
  if (!downloads) { $("shotBtn").disabled = true; $("recBtn").disabled = true; } })();
async function offer(blob, name) {
  try { await downloads.save({ filename: name, data: blob }); toast("Сохранено: " + name); }
  catch (e) { if (e?.code !== "declined") toast("Не получилось сохранить файл"); }
}
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

/* ================= keyboard & panes ================= */
async function toggleFS() { try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); } catch (e) { toast("Полный экран здесь недоступен"); } }
function step(dir) {
  const items = libItems(); if (!items.length) return;
  let i = items.findIndex(it => it.key === live.liveKey); i = (i + dir + items.length) % items.length; recall(items[i]);
}
addEventListener("keydown", e => {
  if (e.target.closest && e.target.closest("textarea, input:not([type=color])")) return;
  if (e.target.classList && e.target.classList.contains("knob") && e.key.startsWith("Arrow")) return;
  const k = e.key.toLowerCase();
  if (k >= "1" && k <= "9") { const it = libItems()[+k - 1]; if (it) recall(it); }
  else if (k === "arrowright") step(1);
  else if (k === "arrowleft") step(-1);
  else if (k === "s" || k === "ы") toggleScene();
  else if (k === "f" || k === "а") toggleFS();
  else if (k === "b" || k === "и") { live.blackout = !live.blackout; toast(live.blackout ? "Затемнение" : "Выход открыт"); }
  else if (e.code === "Space" && e.target === document.body) { e.preventDefault(); togglePlay(); }
});
document.querySelectorAll(".mobtabs button").forEach(b => b.addEventListener("click", () => {
  document.body.dataset.pane = document.body.dataset.pane === b.dataset.pane ? "none" : b.dataset.pane;
  document.querySelectorAll(".mobtabs button").forEach(x => x.setAttribute("aria-pressed", x.dataset.pane === document.body.dataset.pane));
}));
document.body.dataset.pane = "none";

/* ================= loop ================= */
function size() {
  const s = Math.min(devicePixelRatio || 1, 1.5);
  let w = Math.round(innerWidth * s), h = Math.round(innerHeight * s);
  const k = Math.min(1, 1920 / Math.max(w, h)); E.resize(Math.max(64, Math.round(w * k)), Math.max(64, Math.round(h * k)));
}
let last = performance.now(), t = 0, frames = 0, fpsT = 0, sec = -1;
function frame(now) {
  const dt = Math.min((now - last) / 1000, .1); last = now; t += dt;
  size(); analyse(dt, now);
  if (live.b) { live.x += dt / Math.max(live.xDur, .05); if (live.x >= 1) { live.a = live.b; live.b = null; live.x = 0; } }
  live.master += ((live.blackout ? 0 : live.masterTarget) - live.master) * (1 - Math.exp(-dt * 6));
  if (live.a) {
    const lead = active();
    const s = { time: t, bass: A.bass, mid: A.mid, high: A.high, level: A.level, beat: A.beat, realTime: now / 1000 };
    E.frame(s, live.a, live.b, live.x, lead.preset.post, lead.preset.post.scan, live.master);
    if (wantShot) { wantShot = false; $("stage").toBlob(b => b && offer(b, `luch3000-${Date.now()}.png`), "image/png"); }
  }
  frames++; fpsT += dt;
  if (fpsT >= .5) { $("fps").textContent = Math.round(frames / fpsT); frames = 0; fpsT = 0; }
  if (frames % 2 === 0) drawScope();
  const sNow = Math.floor(now / 1000); if (sNow !== sec) { sec = sNow; $("clock").textContent = stamp(); $("bpm").textContent = A.bpm ? String(A.bpm) : (A.live ? "---" : "124"); }
  requestAnimationFrame(frame);
}

/* ================= boot ================= */
log("ЛУЧ-3000 на связи. Движок: WebGL2" + (E.floatOK ? ", 16-бит буферы." : "."), "ok");
size();
apply(makePreset(styles.get("tunnel")), { instant: true });
live.liveKey = "s:tunnel";
renderLibrary();
Store.init();
setMode("pick");
requestAnimationFrame(frame);
})();
