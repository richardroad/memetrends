/*
 * ЛУЧ-3000 — встроенная библиотека стилей.
 *
 * Контракт стиля (см. README.md):
 *   id, name, description, tags, params: [{name, def}], palette: [4 hex], post: {...}, glsl
 *   glsl объявляет `vec3 render(vec2 p)` и любые свои помощники выше неё.
 *   p — центрированные координаты, y в [-0.5, 0.5], x растянут на соотношение сторон.
 *   Доступно из движка: uTime, uRes, uBass, uMid, uHigh, uLevel, uBeat, P0..P7, uPal[4], vUv,
 *   hash, noise, fbm, rot, ramp, cyc, spec, wave, prev.
 */
window.LUCH_STYLES = [
{
  id: "tunnel",
  name: "Туннель",
  description: "Бесконечный тоннель-сетка, по стенам которого бегут столбики спектра; полёт вперёд, на бите вспыхивает ядро.",
  tags: ["тоннель", "глубина", "полёт", "сетка", "спектр"],
  params: [{ name: "Скорость", def: .45 }, { name: "Рёбра", def: .4 }, { name: "Закрутка", def: .55 }, { name: "Яркость", def: .6 }],
  palette: ["#05010f", "#3a0ca3", "#4cc9f0", "#f1faff"],
  post: { trail: .35, zoom: .55, twist: .5, bloom: .55, chroma: .2, scan: .25 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.3+P0*1.6);
  float r=length(p), a=atan(p.y,p.x)/6.28318+.5;
  float z=.32/(r+.015)+t;
  float N=floor(4.+P1*14.);
  vec2 g=vec2(a*N+z*(P2-.5)*1.2, z*1.4);
  vec2 gf=abs(fract(g)-.5);
  float line=1.-smoothstep(0.,1.4*fwidth(g.x)+.02,.5-gf.x);
  line=max(line,1.-smoothstep(0.,1.4*fwidth(g.y)+.02,.5-gf.y));
  float col=floor(g.x);
  float s=spec(abs(fract(col/N)*2.-1.)*.8+.04);
  float fill=step(fract(g.y),s)*s;
  vec3 c=cyc(col/N*.5+z*.04)*(line*.9+fill*.8);
  c*=smoothstep(0.,.22,r)*smoothstep(1.4,.3,r);
  c+=ramp(.85)*exp(-r*9.)*(.25+uBeat*.9);
  return c*(.5+P3*1.1);
}`
},
{
  id: "plasma",
  name: "Плазма",
  description: "Классическая плазма из наложенных синусов: мягкие перетекающие цветовые волны, бас пускает кольца от центра.",
  tags: ["плазма", "волны", "ретро", "мягко", "психоделия"],
  params: [{ name: "Скорость", def: .35 }, { name: "Масштаб", def: .4 }, { name: "Кольца баса", def: .5 }, { name: "Контуры", def: .2 }],
  palette: ["#120024", "#ff006e", "#ffbe0b", "#3a86ff"],
  post: { trail: .1, zoom: .5, twist: .5, bloom: .35, chroma: .1, scan: .3 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.15+P0*1.2);
  float k=2.+P1*9.;
  float v=sin(p.x*k+t)+sin(p.y*k*.8-t*1.3)+sin((p.x+p.y)*k*.6+t*.7)+sin(length(p*k*1.3)+t*1.7);
  v+=uBass*2.*P2*sin(length(p)*k*2.5-t*5.);
  float q=v*.2+.5;
  vec3 c=cyc(q+t*.04);
  c*=mix(1.,.45+.55*smoothstep(.0,.2,abs(sin(q*30.))),P3);
  return c*(.4+uLevel*.55);
}`
},
{
  id: "scope",
  name: "Осциллограф",
  description: "Луч осциллографа рисует форму звуковой волны: прямая линия или кольцо, фосфорное послесвечение и сетка экрана.",
  tags: ["осциллограф", "волна", "линия", "минимализм", "фосфор", "лабораторный"],
  params: [{ name: "Амплитуда", def: .5 }, { name: "Линия → кольцо", def: 0 }, { name: "Толщина луча", def: .35 }, { name: "Сетка", def: .5 }],
  palette: ["#000a04", "#0b5d1e", "#38ff7a", "#e9ffe9"],
  post: { trail: .7, zoom: .5, twist: .5, bloom: .6, chroma: .05, scan: .55 },
  glsl: `
vec3 render(vec2 p){
  float asp=uRes.x/uRes.y;
  float th=.0015+P2*.008;
  float x=p.x/asp+.5;
  float dl=abs(p.y-wave(x)*(.12+P0*.3));
  float a=atan(p.y,p.x)/6.28318+.5;
  float rr=.26+wave(a)*(.05+P0*.16);
  float dc=abs(length(p)-rr);
  float d=mix(dl,dc,P1);
  float beam=th/(d+th)*.8+exp(-d*500.)*.9;
  vec3 c=ramp(.75)*beam*(.6+uLevel);
  vec2 gp=p*10.;
  vec2 gf=abs(fract(gp)-.5);
  float grid=1.-smoothstep(0.,fwidth(gp.x)*1.2,.5-max(gf.x,gf.y));
  float axis=1.-smoothstep(0.,.0025,min(abs(p.x),abs(p.y)));
  c+=ramp(.45)*(grid*.12+axis*.18)*P3;
  return c;
}`
},
{
  id: "ring",
  name: "Спектр-кольцо",
  description: "Радиальные столбики спектра вокруг пульсирующего центра, зеркальная симметрия, пиковые точки над каждым столбиком.",
  tags: ["спектр", "кольцо", "эквалайзер", "радиальный", "классика"],
  params: [{ name: "Длина", def: .55 }, { name: "Столбиков", def: .35 }, { name: "Дыхание центра", def: .5 }, { name: "Вращение", def: .55 }],
  palette: ["#02040a", "#ff2e63", "#ff9f1c", "#fdfffc"],
  post: { trail: .25, zoom: .5, twist: .5, bloom: .5, chroma: .25, scan: .2 },
  glsl: `
vec3 render(vec2 p){
  p=rot(uTime*(P3-.5)*.6)*p;
  float a=atan(p.y,p.x), r=length(p);
  float N=floor(32.+P1*96.);
  float fa=a/6.28318+.5;
  float id=floor(fa*N);
  float x=abs(id/N*2.-1.);
  float s=spec(x*.85+.03);
  float r0=.16+uBass*.06*P2;
  float len=s*(.12+P0*.3);
  float cell=step(abs(fract(fa*N)-.5),.36);
  float bar=step(r0,r)*step(r,r0+len)*cell;
  vec3 c=ramp(.35+.65*clamp((r-r0)/max(len,.001),0.,1.))*bar*1.15;
  c+=ramp(1.)*smoothstep(.005,0.,abs(r-(r0+len+.014)))*cell*.9;
  c+=ramp(.6)*smoothstep(.004,0.,abs(r-r0+.012))*.8;
  c+=cyc(uTime*.05)*smoothstep(r0-.01,0.,r)*(.08+uBeat*.35);
  return c;
}`
},
{
  id: "warp",
  name: "Звёздный поток",
  description: "Звёзды летят на зрителя растянутыми штрихами, как прыжок в гиперпространство; бас разгоняет, высокие зажигают искры.",
  tags: ["звёзды", "космос", "скорость", "гиперпрыжок", "полёт"],
  params: [{ name: "Скорость", def: .4 }, { name: "Плотность", def: .5 }, { name: "Разгон от баса", def: .6 }, { name: "Свечение центра", def: .4 }],
  palette: ["#000006", "#1b3a6b", "#9bd1ff", "#ffffff"],
  post: { trail: .4, zoom: .58, twist: .5, bloom: .5, chroma: .3, scan: .15 },
  glsl: `
vec3 render(vec2 p){
  float r=length(p), a=atan(p.y,p.x)/6.28318+.5;
  float sp=.3+P0*2.5+uBass*2.*P2;
  vec3 c=vec3(0.);
  for(int i=0;i<2;i++){
    float fi=float(i);
    float N=floor(90.+P1*220.)+fi*37.;
    float v=log(r+.001)*(5.+fi*2.)-uTime*sp*(1.+fi*.4);
    vec2 q=vec2(a*N,v);
    vec2 id=floor(q), f=fract(q);
    float h=hash(id+fi*13.);
    float on=step(.5,h);
    float wx=abs(f.x-.5-(hash(id+1.7)-.5)*.6);
    float st=smoothstep(.1,0.,wx)*smoothstep(0.,.35,f.y)*smoothstep(1.,.55,f.y);
    c+=ramp(.4+h*.6)*on*st*(1.+uHigh*2.);
  }
  c*=smoothstep(.02,.3,r);
  c+=ramp(.8)*exp(-r*7.)*(.15+P3*.6+uBeat*.3);
  return c;
}`
},
{
  id: "mirror",
  name: "Жидкое зеркало",
  description: "Калейдоскоп из текучего шума с отражённой симметрией; формы перетекают, бас раскачивает узор, хорошо со шлейфом.",
  tags: ["калейдоскоп", "жидкость", "симметрия", "психоделия", "текучий"],
  params: [{ name: "Скорость", def: .35 }, { name: "Сегменты", def: .4 }, { name: "Раскачка", def: .5 }, { name: "Плотность", def: .5 }],
  palette: ["#030008", "#5f0f40", "#0f4c5c", "#fb8b24"],
  post: { trail: .6, zoom: .54, twist: .53, bloom: .45, chroma: .2, scan: .2 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.15+P0*.9);
  float n=floor(3.+P1*9.);
  float a=atan(p.y,p.x), r=length(p);
  a=mod(a,6.28318/n); a=abs(a-3.14159/n);
  vec2 q=vec2(cos(a),sin(a))*r;
  q+=.08*vec2(sin(t+q.y*5.+uBass*P2*3.),cos(t*1.3+q.x*5.));
  float f=fbm(q*(2.+P3*4.)+vec2(t*.2,-t*.13));
  vec3 c=cyc(f*1.4+t*.05+r*.8);
  c*=smoothstep(.35,.8,f)*1.5;
  return c*(.6+uLevel*.6);
}`
},
{
  id: "vortex",
  name: "Вихрь",
  description: "Спиральные рукава затягиваются в глаз бури; закрутка и число рукавов настраиваются, бит освещает центр.",
  tags: ["вихрь", "спираль", "торнадо", "воронка", "гипноз", "вортекс"],
  params: [{ name: "Скорость", def: .4 }, { name: "Закрутка", def: .45 }, { name: "Рукава", def: .3 }, { name: "Рваность", def: .5 }],
  palette: ["#010203", "#1d3557", "#a8dadc", "#f1faee"],
  post: { trail: .45, zoom: .56, twist: .56, bloom: .5, chroma: .25, scan: .15 },
  glsl: `
vec3 render(vec2 p){
  float r=length(p), a=atan(p.y,p.x);
  float t=uTime*(.2+P0*1.4);
  float tw=2.+P1*10.;
  float arms=floor(2.+P2*6.);
  float lr=log(r+.001);
  float fl=fbm(vec2(cos(a),sin(a))*2.+vec2(lr*2.-t*.6,t*.1));
  float s=sin(a*arms+lr*tw-t*3.+(fl-.5)*P3*6.);
  float band=smoothstep(.1,.95,s*.5+.5);
  vec3 c=ramp(clamp(1.1-r*1.7,0.,1.))*band;
  c*=smoothstep(.0,.07,r)*smoothstep(1.2,.2,r);
  c+=cyc(t*.08)*exp(-r*14.)*(.25+uBeat);
  return c*(.45+uLevel*1.1);
}`
},
{
  id: "horizon",
  name: "Горизонт",
  description: "Ретро-горизонт: полосатое солнце, горы из спектра и бесконечная сетка земли, летящая навстречу.",
  tags: ["ретро", "сетка", "солнце", "горизонт", "синтвейв", "нулевые"],
  params: [{ name: "Скорость", def: .4 }, { name: "Горы", def: .55 }, { name: "Солнце", def: .6 }, { name: "Яркость сетки", def: .6 }],
  palette: ["#0b0221", "#7b2cbf", "#ff4d6d", "#ffd166"],
  post: { trail: .15, zoom: .5, twist: .5, bloom: .55, chroma: .3, scan: .45 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.3+P0*1.6);
  float hz=-.04;
  vec3 c=mix(uPal[0]*.6,uPal[1]*.45,smoothstep(hz,.55,p.y));
  vec2 sg=p*90.;
  float st=step(.975,hash(floor(sg)))*smoothstep(.12,0.,length(fract(sg)-.5))*smoothstep(hz,.3,p.y);
  c+=vec3(st)*.6*(1.+uHigh);
  vec2 sp=p-vec2(0.,.1);
  float sr=length(sp);
  float rad=.11+.09*P2+uBass*.012;
  float sun=smoothstep(rad,rad-.004,sr);
  float cut=step(.0,sin((p.y-.1)*120.-t*3.))+step(.06,p.y);
  sun*=clamp(cut,0.,1.);
  c=mix(c,ramp(.55+(p.y-.1)*3.),sun*step(hz,p.y));
  c+=ramp(.7)*exp(-sr*5.)*.2*(1.+uBeat);
  float h=spec(clamp(abs(p.x)*.7,0.,1.))*.16*P1+.01*noise(vec2(p.x*20.,1.));
  if(p.y>hz && p.y<hz+h){ c=uPal[0]*.5; }
  c+=ramp(.9)*smoothstep(.003,0.,abs(p.y-(hz+h)))*step(.002,h)*.8;
  if(p.y<hz){
    float d=hz-p.y;
    float z=.25/d;
    vec2 g=vec2(p.x*z*1.6,z*1.5+t*2.);
    vec2 gf=abs(fract(g)-.5);
    float lx=1.-smoothstep(0.,fwidth(g.x)*1.3,.5-gf.x);
    float ly=1.-smoothstep(0.,fwidth(g.y)*1.3,.5-gf.y);
    float grid=max(lx,ly);
    c=uPal[0]*.35+ramp(.85)*grid*exp(-z*.06)*(.4+P3*1.2)*(1.+uBeat*.6);
  }
  return c;
}`
}
];
