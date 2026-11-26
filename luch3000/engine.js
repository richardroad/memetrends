/*
 * ЛУЧ-3000 — движок.
 * Собирает GLSL стиля в полный шейдер, держит кадровые буферы и рисует:
 *   стиль A (+ стиль B при переходе) → пост-обработка с обратной связью → экран.
 */
(function () {
const VERT = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv=aPos*.5+.5; gl_Position=vec4(aPos,0.,1.); }`;

const STYLE_HEAD = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime, uBass, uMid, uHigh, uLevel, uBeat, uSeed;
uniform float uP[8];
uniform vec3 uPal[4];
uniform sampler2D uAudio, uPrev;
in vec2 vUv;
out vec4 fragColor;
#define P0 uP[0]
#define P1 uP[1]
#define P2 uP[2]
#define P3 uP[3]
#define P4 uP[4]
#define P5 uP[5]
#define P6 uP[6]
#define P7 uP[7]
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)+uSeed*.001); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
vec3 ramp(float t){ t=clamp(t,0.,1.)*3.;
  if(t<1.) return mix(uPal[0],uPal[1],t); if(t<2.) return mix(uPal[1],uPal[2],t-1.); return mix(uPal[2],uPal[3],t-2.); }
vec3 cyc(float t){ t=fract(t)*4.;
  if(t<1.) return mix(uPal[0],uPal[1],t); if(t<2.) return mix(uPal[1],uPal[2],t-1.); if(t<3.) return mix(uPal[2],uPal[3],t-2.); return mix(uPal[3],uPal[0],t-3.); }
float spec(float x){ return texture(uAudio,vec2(clamp(x,0.,1.),.25)).r; }
float wave(float x){ return texture(uAudio,vec2(fract(x),.75)).r*2.-1.; }
vec3 prev(vec2 uv){ return texture(uPrev,uv).rgb; }
`;
const STYLE_TAIL = `
void main(){ vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y; vec3 c=render(p); fragColor=vec4(clamp(c,0.,4.),1.); }`;

const POST = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uA, uB, uFb; uniform vec2 uRes;
uniform float uX, uTrail, uZoom, uTwist, uBloom, uChroma, uBeat;
vec3 pick(vec2 uv){ return mix(texture(uA,uv).rgb, texture(uB,uv).rgb, uX); }
void main(){
  vec2 uv=vUv; vec2 d=(uv-.5)*uChroma*.022*(1.+uBeat*.8);
  vec3 c=vec3(pick(uv+d).r, pick(uv).g, pick(uv-d).b);
  vec3 b=vec3(0.); vec2 asp=vec2(uRes.y/uRes.x,1.);
  for(int i=0;i<12;i++){ float a=float(i)*2.39996; float r=sqrt(float(i)+.5)/3.6;
    b+=max(pick(uv+vec2(cos(a),sin(a))*r*.04*asp)-.45,0.); }
  c+=b/12.*uBloom*2.2;
  float ang=(uTwist-.5)*.06; float z=1.-(uZoom-.5)*.05;
  vec2 q=(vUv-.5)*vec2(uRes.x/uRes.y,1.);
  q=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*q*z;
  vec2 fu=q/vec2(uRes.x/uRes.y,1.)+.5;
  vec3 pv=texture(uFb,fu).rgb;
  c=max(c,pv*uTrail*.965);
  o=vec4(c,1.);
}`;

const SCREEN = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uScan, uTime, uMaster;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  vec3 c=texture(uTex,vUv).rgb;
  float sl=.5+.5*sin(gl_FragCoord.y*3.14159*.5);
  c*=mix(1.,.62+.38*sl,uScan);
  c*=1.+uScan*.04*sin(uTime*50.);
  vec2 d=vUv-.5; c*=1.-dot(d,d)*.6;
  c+=(hash(vUv*uRes+fract(uTime)*37.)-.5)*.014;
  o=vec4(c*uMaster,1.);
}`;

class Engine {
  constructor(canvas) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error("webgl2");
    this.gl = gl; this.canvas = canvas;
    this.floatOK = !!gl.getExtension("EXT_color_buffer_float");
    this.cache = new Map();
    this.vs = this._shader(gl.VERTEX_SHADER, VERT).sh;
    this.post = this._program(POST); this.screen = this._program(SCREEN);
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.audioTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.audioTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 512, 2, 0, gl.RED, gl.UNSIGNED_BYTE, null);
    this._params(gl.TEXTURE_2D);
    this.audioBuf = new Uint8Array(1024);
    this.W = 0; this.H = 0; this.T = null; this.cur = 0;
    this.thumbT = null;
  }
  _params(target) { const gl = this.gl;
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
  _shader(type, src) {
    const gl = this.gl, sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(sh); gl.deleteShader(sh); return { error: log }; }
    return { sh };
  }
  _program(fs) {
    const gl = this.gl, f = this._shader(gl.FRAGMENT_SHADER, fs);
    if (f.error) return { error: f.error };
    const p = gl.createProgram(); gl.attachShader(p, this.vs); gl.attachShader(p, f.sh);
    gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return { error: gl.getProgramInfoLog(p) };
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const inf = gl.getActiveUniform(p, i); u[inf.name.replace("[0]", "")] = gl.getUniformLocation(p, inf.name); }
    return { p, u };
  }
  static assemble(glsl) { return STYLE_HEAD + "\n" + glsl + "\n" + STYLE_TAIL; }
  static headLines() { return STYLE_HEAD.split("\n").length + 1; }
  /** Compile a style body; returns {ok} or {ok:false, log} with line numbers relative to the style code. */
  check(glsl) {
    const r = this._program(Engine.assemble(glsl));
    if (r.error) {
      const off = Engine.headLines();
      const log = String(r.error).replace(/ERROR: 0:(\d+)/g, (_, n) => "ERROR: line " + Math.max(1, +n - off + 1));
      return { ok: false, log: log.slice(0, 1500) };
    }
    this.gl.deleteProgram(r.p);
    return { ok: true };
  }
  program(style) {
    const key = style.id + ":" + style.glsl.length + ":" + style.glsl.slice(-40);
    if (this.cache.has(key)) return this.cache.get(key);
    const r = this._program(Engine.assemble(style.glsl));
    this.cache.set(key, r);
    return r;
  }
  _target(w, h) {
    const gl = this.gl, tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    if (this.floatOK) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this._params(gl.TEXTURE_2D);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb, w, h };
  }
  _free(t) { if (!t) return; this.gl.deleteTexture(t.tex); this.gl.deleteFramebuffer(t.fb); }
  resize(w, h) {
    if (w === this.W && h === this.H) return;
    this.W = w; this.H = h; this.canvas.width = w; this.canvas.height = h;
    if (this.T) Object.values(this.T).forEach(t => this._free(t));
    this.T = { a: this._target(w, h), b: this._target(w, h), f0: this._target(w, h), f1: this._target(w, h) };
  }
  setAudio(spec512, wave512) {
    this.audioBuf.set(spec512, 0); this.audioBuf.set(wave512, 512);
    const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.audioTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 2, gl.RED, gl.UNSIGNED_BYTE, this.audioBuf);
  }
  _bind(unit, tex, loc) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); }
  _style(prog, target, s, preset, prevTex) {
    const gl = this.gl, u = prog.u;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0, 0, target.w, target.h); gl.useProgram(prog.p);
    gl.uniform2f(u.uRes, target.w, target.h);
    gl.uniform1f(u.uTime, s.time); gl.uniform1f(u.uBass, s.bass); gl.uniform1f(u.uMid, s.mid); gl.uniform1f(u.uHigh, s.high);
    gl.uniform1f(u.uLevel, s.level); gl.uniform1f(u.uBeat, s.beat); gl.uniform1f(u.uSeed, preset.seed || 0);
    if (u.uP) gl.uniform1fv(u.uP, Float32Array.from({ length: 8 }, (_, i) => preset.params[i] ?? .5));
    if (u.uPal) gl.uniform3fv(u.uPal, preset.palRGB);
    if (u.uAudio) this._bind(0, this.audioTex, u.uAudio);
    if (u.uPrev) this._bind(1, prevTex, u.uPrev);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  /** Draw one frame. a/b: {preset, prog}; x: crossfade 0..1; post: settings of the leading preset. */
  frame(s, a, b, x, post, scan, master) {
    const gl = this.gl, T = this.T;
    const fPrev = this.cur ? T.f1 : T.f0, fNext = this.cur ? T.f0 : T.f1;
    this._style(a.prog, T.a, s, a.preset, fPrev.tex);
    if (b && x > 0) this._style(b.prog, T.b, s, b.preset, fPrev.tex);
    let u = this.post.u; gl.bindFramebuffer(gl.FRAMEBUFFER, fNext.fb); gl.viewport(0, 0, this.W, this.H); gl.useProgram(this.post.p);
    this._bind(0, T.a.tex, u.uA); this._bind(1, (b && x > 0 ? T.b : T.a).tex, u.uB); this._bind(2, fPrev.tex, u.uFb);
    gl.uniform2f(u.uRes, this.W, this.H); gl.uniform1f(u.uX, b ? x : 0);
    gl.uniform1f(u.uTrail, post.trail); gl.uniform1f(u.uZoom, post.zoom); gl.uniform1f(u.uTwist, post.twist);
    gl.uniform1f(u.uBloom, post.bloom); gl.uniform1f(u.uChroma, post.chroma); gl.uniform1f(u.uBeat, s.beat);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    u = this.screen.u; gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.W, this.H); gl.useProgram(this.screen.p);
    this._bind(0, fNext.tex, u.uTex); gl.uniform2f(u.uRes, this.W, this.H);
    gl.uniform1f(u.uScan, scan); gl.uniform1f(u.uTime, s.realTime); gl.uniform1f(u.uMaster, master);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.cur ^= 1;
  }
  clearFeedback() { const gl = this.gl; if (!this.T) return; for (const t of [this.T.f0, this.T.f1]) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); } }
  /** Render a still of a style into a 2D canvas (library thumbnails). */
  thumb(style, preset, s, w = 192, h = 108) {
    const prog = this.program(style); if (prog.error) return null;
    if (!this.thumbT) this.thumbT = this._target(w, h);
    this._style(prog, this.thumbT, s, preset, this.thumbT.tex);
    const gl = this.gl, px = new Uint8Array(w * h * 4);
    const t8 = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t8);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t8, 0);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.thumbT.fb); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fb);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.deleteFramebuffer(fb); gl.deleteTexture(t8);
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const cx = cv.getContext("2d"), img = cx.createImageData(w, h);
    for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    cx.putImageData(img, 0, 0);
    return cv.toDataURL("image/jpeg", .82);
  }
}
window.LuchEngine = Engine;
})();
