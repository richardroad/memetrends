/*
 * ЛУЧ-3000 — скины.
 * Скин = набор CSS-токенов (vars) + необязательный CSS поверх (css).
 * Любой новый скин, в том числе сгенерированный, достаточно описать в этом формате.
 */
window.LUCH_SKINS = [
{
  id: "bort07",
  name: "Борт-07",
  note: "Ночная консоль корабля: дымчатое стекло, фосфорный голубой, янтарные действия.",
  vars: {},
  css: ""
},
{
  id: "aqua2001",
  name: "Аква-2001",
  note: "Глянцевый пластик и полупрозрачная аква нулевых, скруглённые капсулы, светлый металл.",
  vars: {
    "--hull": "rgba(16, 52, 86, 0.58)",
    "--hull-deep": "rgba(8, 30, 52, 0.92)",
    "--edge": "rgba(200, 240, 255, 0.32)",
    "--edge-hot": "rgba(220, 248, 255, 0.85)",
    "--ink": "#f2fbff",
    "--ink-dim": "#a9cbe0",
    "--ink-faint": "#6d93ad",
    "--phos": "#5fe1ff",
    "--amber": "#c6ff4a",
    "--cut": "0px",
    "--radius": "20px",
    "--f-display": "\"Exo 2\", \"IBM Plex Sans\", system-ui, sans-serif",
    "--btn-top": "#5cc8ff", "--btn-bot": "#0b5fa8", "--btn-ink": "#ffffff",
    "--act-top": "#e6ff9a", "--act-bot": "#5fae0a", "--act-ink": "#0f2600",
    "--knob-hi": "#ffffff", "--knob-mid": "#cfe3f2", "--knob-lo": "#4f7894", "--knob-ind": "#0b3a5c"
  },
  css: `
.panel::before, .panel::after { display: none; }
.bar { background: linear-gradient(180deg, #e9f1f7, #a9b9c6 48%, #8fa1b0 52%, #d0dbe4) padding-box, linear-gradient(180deg, #fff, #6d8395) border-box; }
.bar .logo b, .bar .ticker { color: #0b2a42; }
.bar .logo small { color: #3b5a72; }
.ph span, .mh, .tabs button, .modeswitch button { font-style: italic; }
.aqua { border-radius: 999px; }
.module { border-radius: 18px; }
`
},
{
  id: "phosphor",
  name: "Фосфор",
  note: "Монохромный янтарный терминал: квадратные рамки, свечение люминофора, никакого глянца.",
  vars: {
    "--hull": "rgba(12, 7, 0, 0.86)",
    "--hull-deep": "rgba(8, 5, 0, 0.95)",
    "--edge": "rgba(255, 176, 0, 0.22)",
    "--edge-hot": "rgba(255, 176, 0, 0.6)",
    "--ink": "#ffcf73",
    "--ink-dim": "#c98f2a",
    "--ink-faint": "#7a5512",
    "--phos": "#ffb000",
    "--amber": "#ffe29a",
    "--ok": "#ffd24d",
    "--alert": "#ff6a3d",
    "--cut": "0px",
    "--radius": "0px",
    "--f-display": "\"IBM Plex Mono\", ui-monospace, monospace",
    "--f-body": "\"IBM Plex Mono\", ui-monospace, monospace",
    "--knob-hi": "#3a2600", "--knob-mid": "#1a1000", "--knob-lo": "#000000", "--knob-ind": "#ffb000"
  },
  css: `
.panel::before, .panel::after { display: none; }
.bar, .readouts, .term, .modeswitch, .module, .card, .vcard, .tabs button { border-radius: 0 !important; }
.aqua, .aqua.primary, .modeswitch button[aria-selected="true"] { background: transparent !important; color: var(--phos) !important; border: 1px solid var(--phos) !important; box-shadow: 0 0 10px rgba(255,176,0,.25) !important; border-radius: 0 !important; text-shadow: 0 0 6px rgba(255,176,0,.7); }
.aqua.primary, .modeswitch button[aria-selected="true"] { background: rgba(255,176,0,.16) !important; }
.pad[aria-pressed="true"] { background: var(--phos) !important; color: #120a00 !important; }
body { text-shadow: 0 0 4px rgba(255,176,0,.35); }
.card img, .vcard img { filter: sepia(1) saturate(2.2) hue-rotate(-12deg) brightness(.95); }
.scan-glass { background: repeating-linear-gradient(0deg, rgba(255,176,0,.05) 0 1px, transparent 1px 3px); }
`
}
];
