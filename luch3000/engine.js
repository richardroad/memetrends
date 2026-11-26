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
uniform float uX, uTrail, uZoom, uTwist, uBloom, uChroma, uBeat, uPunch;
vec3 pick(vec2 uv){ uv=(uv-.5)/(1.+uPunch*.18)+.5; return mix(texture(uA,uv).rgb, texture(uB,uv).rgb, uX); }
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

const LENS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex, uGlyph; uniform vec2 uRes;
uniform float uTime, uLens, uLensAmt, uLensP, uSym, uSymAmt, uSymSize, uSymDen, uSymN, uKal, uPix, uBeatN, uBeat, uBass, uHigh;
uniform vec3 uPal[4];
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y); }
float L(vec3 c){ return dot(c,vec3(.299,.587,.114)); }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
vec3 src(vec2 uv){ return texture(uTex,uv).rgb; }
float atlas(float g, vec2 lu){ if(lu.x<0.||lu.y<0.||lu.x>1.||lu.y>1.) return 0.; vec2 cell=vec2(mod(g,8.),floor(g/8.)); return texture(uGlyph,(cell+vec2(lu.x,1.-lu.y))/8.).a; }
float glyph(float h, vec2 lu){ return atlas(floor(mod(h*uSymN,uSymN)), lu); }
float bayer(vec2 p){ int m[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return float(m[int(p.y)*4+int(p.x)])/16.; }
vec3 iron(float t){ t=clamp(t,0.,1.);
  if(t<.2) return mix(vec3(0.),vec3(.13,0.,.38),t/.2); if(t<.45) return mix(vec3(.13,0.,.38),vec3(.62,.03,.45),(t-.2)/.25);
  if(t<.7) return mix(vec3(.62,.03,.45),vec3(.96,.36,.05),(t-.45)/.25); if(t<.88) return mix(vec3(.96,.36,.05),vec3(1.,.82,.2),(t-.7)/.18);
  return mix(vec3(1.,.82,.2),vec3(1.),(t-.88)/.12); }
vec3 sat(vec3 c, float k){ return max(mix(vec3(L(c)),c,k),0.); }
float symbols(vec2 uv){
  vec2 P=uv*uRes; float asp=uRes.x/uRes.y; float t=uTime;
  float cs=mix(14.,72.,uSymSize)*uRes.y/900.;
  int m=int(uSym+.5);
  if(m==1){
    float col=floor(P.x/cs);
    if(hash(vec2(col,7.))>uSymDen) return 0.;
    float sp=(.35+hash(vec2(col,1.)))*(1.+uBass*1.2);
    float N=uRes.y/cs;
    float head=(1.-fract(t*sp*.12+hash(vec2(col,3.))))*(N+24.)-6.;
    float r=floor(P.y/cs); float dist=r-head;
    if(dist<0.||dist>22.) return 0.;
    float g=hash(vec2(col*1.7+r, floor(t*sp*3.+hash(vec2(col,r))*9.)));
    return glyph(g,fract(P/cs))*(exp(-dist/7.)+step(dist,1.)*.6);
  }
  if(m==2){
    vec2 p=(uv-.5)*vec2(asp,1.); float a=atan(p.y,p.x); float tot=0.;
    for(int k=0;k<2;k++){
      float fk=float(k); float R=(.3+fk*.13)*(1.+uBass*.06);
      float N=floor(10.+uSymDen*26.)+fk*8.; float rv=t*(.15-.32*fk);
      float st=6.28318/N; float idx=floor((a-rv)/st); float ac=(idx+.5)*st+rv;
      vec2 d=rot(ac-1.5708)*(p-vec2(cos(ac),sin(ac))*R);
      float sz=cs/uRes.y*(1.-fk*.3);
      tot+=glyph(hash(vec2(idx,fk+floor(uBeatN/4.))),d/sz+.5)*(.6+.4*uHigh);
    }
    return tot;
  }
  if(m==3){
    vec2 id=floor(P/cs);
    if(hash(id*1.31)>uSymDen*.8) return 0.;
    float bn=floor(uBeatN);
    return glyph(hash(id+bn*.37),fract(P/cs))*(.25+.75*max(uBeat*step(.6,hash(id+bn)),.2*uHigh));
  }
  vec2 p=(uv-.5)*vec2(asp,1.); float sz=mix(.28,.8,uSymSize);
  return glyph(hash(vec2(floor(uBeatN/4.),5.)),p/sz+.5)*(.2+.8*uBeat);
}
void main(){
  vec2 uv=vUv; vec2 px=1./uRes; float asp=uRes.x/uRes.y;
  if(uKal>.5){ vec2 p=(uv-.5)*vec2(asp,1.); float a=atan(p.y,p.x), r=length(p); float n=6.; a=mod(a,6.28318/n); a=abs(a-3.14159/n); p=vec2(cos(a),sin(a))*r; uv=p/vec2(asp,1.)+.5; }
  if(uPix>.5){ vec2 g=vec2(48.*asp,48.); uv=(floor(uv*g)+.5)/g; }
  vec3 base=src(uv); vec3 c=base;
  int Lz=int(uLens+.5); float cs=mix(6.,28.,uLensP);
  if(Lz==1){
    vec2 cell=vec2(cs*.62,cs)*px; vec2 id=floor(uv/cell); vec3 cc=src((id+.5)*cell);
    c=sat(cc,1.3)*1.5*atlas(48.+floor(clamp(L(cc)*1.3,0.,.999)*16.),fract(uv/cell));
  } else if(Lz==2){
    vec2 g=uRes/(cs*.5+2.); vec2 cell=floor(uv*g); vec3 cc=src((cell+.5)/g);
    float lv=clamp(L(cc)*3.+bayer(mod(cell,4.))-.5,0.,3.);
    int i=int(floor(lv)); c=uPal[i];
  } else if(Lz==3){
    float s=cs*.9; mat2 R=rot(.785); vec2 q=R*(uv*uRes)/s; vec2 id=floor(q)+.5;
    vec3 cc=src((transpose(R)*(id*s))/uRes); float r=sqrt(L(cc))*.62;
    float d=length(fract(q)-.5); c=sat(cc,1.6)*1.3*smoothstep(r+.06,r-.06,d);
  } else if(Lz==4){
    float sc=mix(44.,7.,uLensP); vec2 p=uv*vec2(asp,1.)*sc; vec2 i=floor(p), f=fract(p);
    float d1=8., d2=8.; vec2 best=vec2(0.);
    for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o2=hash2(i+g); vec2 r=g+o2-f; float d=dot(r,r);
      if(d<d1){ d2=d1; d1=d; best=i+g+o2; } else if(d<d2) d2=d; }
    float edge=sqrt(d2)-sqrt(d1);
    vec3 cc=sat(src(best/sc/vec2(asp,1.)),1.7)*1.25;
    c=cc*(.8+.35*noise(p*7.))*smoothstep(.035,.08,edge)+cc*.15;
  } else if(Lz==5){
    vec2 g=uRes/(cs*.8+3.); vec2 q=uv*g; q.x+=.5*mod(floor(q.y),2.); vec2 id=floor(q), f=fract(q);
    vec2 cuv=(id+.5-vec2(.5*mod(id.y,2.),0.))/g; vec3 cc=src(cuv);
    float grout=smoothstep(.0,.09,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
    float h=hash(id); vec3 gold=vec3(1.,.78,.32)*(.5+L(cc)*1.2);
    cc=mix(sat(cc,1.3),gold,step(.88,h))*(.82+.36*h);
    c=cc*grout+vec3(1.,.9,.6)*step(.985,hash(id+floor(uBeatN)))*uHigh*grout;
  } else if(Lz==6){
    float l=L(base); float fq=mix(260.,70.,uLensP); vec2 p=uv*vec2(asp,1.);
    float w=noise(p*9.)*2.;
    float a1=.5+.5*sin((p.x+p.y)*fq+w), a2=.5+.5*sin((p.x-p.y)*fq+w);
    float ln=smoothstep(1.-l-.12,1.-l+.12,a1), cr=smoothstep(1.-l+.25-.12,1.-l+.25+.12,a2)*step(.45,l);
    c=mix(uPal[0]*.4,uPal[3],max(ln,cr));
  } else if(Lz==7){
    float t=uTime; float line=floor(uv.y*240.);
    float band=exp(-pow((fract(uv.y+t*.06)-.85)*28.,2.));
    float jit=(hash(vec2(line,floor(t*30.)))-.5)*.003+band*.04*(hash(vec2(line,floor(t*60.)))-.5);
    vec2 u2=uv+vec2(jit,0.);
    float Y=L(src(u2)); vec3 ch=src(u2+vec2(.007,0.));
    c=mix(vec3(Y),ch,.75)*(.92+.08*sin(uv.y*uRes.y*1.6));
    c+=band*.35*noise(vec2(uv.x*500.,t*60.));
  } else if(Lz==8){
    float t=uTime; vec2 wv=vec2((noise(vec2(t*6.,3.))-.5)*.004,(noise(vec2(t*8.,0.))-.5)*.008);
    float l=L(src(uv+wv)); l=pow(l,1.15)*(.82+.18*noise(vec2(t*20.,1.)));
    float scratch=step(.996,hash(vec2(floor(uv.x*uRes.x/2.),floor(t*10.))))*.5;
    float dust=step(.9985,hash(floor(uv*uRes/3.)+floor(t*24.)));
    vec2 d=uv-.5;
    c=(vec3(1.,.87,.68)*l+scratch*vec3(.9,.85,.7)-dust*.5)*(1.-dot(d,d)*1.6);
  } else if(Lz==9){
    float s=cs*1.1; vec2 q=uv*uRes/s; vec3 acc=vec3(0.);
    for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 id=floor(q)+vec2(float(x),float(y)); vec2 ctr=id+hash2(id);
      vec3 cc=sat(src(ctr*s/uRes),1.9); float r=.3+.45*L(cc); acc=max(acc,cc*1.25*smoothstep(r,r-.18,length(q-ctr))); }
    c=acc;
  } else if(Lz==10){
    c=iron(L(base)*1.15);
  } else if(Lz==11){
    vec2 e=px*1.5;
    float dx=L(src(uv+vec2(e.x,0.)))-L(src(uv-vec2(e.x,0.))), dy=L(src(uv+vec2(0.,e.y)))-L(src(uv-vec2(0.,e.y)));
    float g=length(vec2(dx,dy));
    c=mix(uPal[2],uPal[3],.5)*smoothstep(.03,.22,g)*2.2+base*.06;
  }
  if(Lz>0) c=mix(base,c,uLensAmt);
  if(uSym>.5) c+=mix(uPal[2],uPal[3],.65)*1.3*symbols(vUv)*uSymAmt;
  o=vec4(c,1.);
}`;

const SCREEN = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uScan, uTime, uMaster, uInvert, uMirror, uStrobe;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  vec2 uv=vUv; if(uMirror>.5) uv.x=uv.x<.5?uv.x:1.-uv.x;
  vec3 c=texture(uTex,uv).rgb;
  c=mix(c,vec3(1.)-clamp(c,0.,1.),uInvert);
  float sl=.5+.5*sin(gl_FragCoord.y*3.14159*.5);
  c*=mix(1.,.62+.38*sl,uScan);
  c*=1.+uScan*.04*sin(uTime*50.);
  vec2 d=vUv-.5; c*=1.-dot(d,d)*.6;
  c+=(hash(vUv*uRes+fract(uTime)*37.)-.5)*.014;
  o=vec4(c*uMaster*uStrobe,1.);
}`;

class Engine {
  constructor(canvas) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error("webgl2");
    this.gl = gl; this.canvas = canvas;
    this.floatOK = !!gl.getExtension("EXT_color_buffer_float");
    this.cache = new Map();
    this.vs = this._shader(gl.VERTEX_SHADER, VERT).sh;
    this.post = this._program(POST); this.screen = this._program(SCREEN); this.lens = this._program(LENS);
    if (this.lens.error) console.error(this.lens.error);
    this.glyphTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.glyphTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); this._params(gl.TEXTURE_2D);
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
    this.W = w; this.H = h; this.canvas.width = w; this.canvas.height = h; this.last = null;
    if (this.T) Object.values(this.T).forEach(t => this._free(t));
    this.T = { a: this._target(w, h), b: this._target(w, h), f0: this._target(w, h), f1: this._target(w, h), l: this._target(w, h) };
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
  frame(s, a, b, x, post, scan, master, fx = {}, look = {}) {
    const gl = this.gl, T = this.T;
    if (fx.freeze && this.last) { this._screen(this.last, s, scan, master, fx); return; }
    const fPrev = this.cur ? T.f1 : T.f0, fNext = this.cur ? T.f0 : T.f1;
    this._style(a.prog, T.a, s, a.preset, fPrev.tex);
    if (b && x > 0) this._style(b.prog, T.b, s, b.preset, fPrev.tex);
    let u = this.post.u; gl.bindFramebuffer(gl.FRAMEBUFFER, fNext.fb); gl.viewport(0, 0, this.W, this.H); gl.useProgram(this.post.p);
    this._bind(0, T.a.tex, u.uA); this._bind(1, (b && x > 0 ? T.b : T.a).tex, u.uB); this._bind(2, fPrev.tex, u.uFb);
    gl.uniform2f(u.uRes, this.W, this.H); gl.uniform1f(u.uX, b ? x : 0);
    gl.uniform1f(u.uTrail, post.trail); gl.uniform1f(u.uZoom, post.zoom); gl.uniform1f(u.uTwist, post.twist);
    gl.uniform1f(u.uBloom, post.bloom); gl.uniform1f(u.uChroma, post.chroma); gl.uniform1f(u.uBeat, s.beat); gl.uniform1f(u.uPunch, fx.punch || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this._lens(fNext.tex, s, look, fx);
    this.last = T.l.tex;
    this._screen(T.l.tex, s, scan, master, fx);
    this.cur ^= 1;
  }
  setGlyphs(canvas) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.glyphTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); }
  _lens(tex, s, k, fx) {
    const gl = this.gl, u = this.lens.u, T = this.T;
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.l.fb); gl.viewport(0, 0, this.W, this.H); gl.useProgram(this.lens.p);
    this._bind(0, tex, u.uTex); this._bind(1, this.glyphTex, u.uGlyph);
    gl.uniform2f(u.uRes, this.W, this.H); gl.uniform1f(u.uTime, s.realTime);
    gl.uniform1f(u.uLens, k.lens || 0); gl.uniform1f(u.uLensAmt, k.lensAmt ?? 1); gl.uniform1f(u.uLensP, k.lensP ?? .5);
    gl.uniform1f(u.uSym, k.sym || 0); gl.uniform1f(u.uSymAmt, k.symAmt ?? .8); gl.uniform1f(u.uSymSize, k.symSize ?? .4); gl.uniform1f(u.uSymDen, k.symDen ?? .5); gl.uniform1f(u.uSymN, k.symN || 1);
    gl.uniform1f(u.uKal, fx.kaleido ? 1 : 0); gl.uniform1f(u.uPix, fx.pixel ? 1 : 0);
    gl.uniform1f(u.uBeatN, s.beatN || 0); gl.uniform1f(u.uBeat, s.beat); gl.uniform1f(u.uBass, s.bass); gl.uniform1f(u.uHigh, s.high);
    if (k.palRGB) gl.uniform3fv(u.uPal, k.palRGB);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  _screen(tex, s, scan, master, fx) {
    const gl = this.gl, u = this.screen.u;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.W, this.H); gl.useProgram(this.screen.p);
    this._bind(0, tex, u.uTex); gl.uniform2f(u.uRes, this.W, this.H);
    gl.uniform1f(u.uScan, scan); gl.uniform1f(u.uTime, s.realTime); gl.uniform1f(u.uMaster, master);
    gl.uniform1f(u.uInvert, fx.invert ? 1 : 0); gl.uniform1f(u.uMirror, fx.mirror ? 1 : 0); gl.uniform1f(u.uStrobe, fx.strobe ?? 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
