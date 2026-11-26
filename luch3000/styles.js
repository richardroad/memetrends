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
},
{
  id: "opart",
  name: "Оп-арт",
  description: "Чёрно-белые гипнотические полосы 1960-х, линза-вздутие в центре дышит от баса, середина гнёт линии, наложение кругов даёт интерференцию.",
  tags: ["оп-арт", "60-е", "гипноз", "полосы", "чёрно-белый", "иллюзия"],
  params: [{ name: "Скорость", def: .35 }, { name: "Частота", def: .4 }, { name: "Вздутие", def: .5 }, { name: "Наложение", def: .4 }],
  palette: ["#000000", "#141414", "#d9d9d9", "#ffffff"],
  post: { trail: .05, zoom: .5, twist: .5, bloom: .2, chroma: .15, scan: .1 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.2+P0*1.2);
  float r=length(p);
  float bulge=(.15+P2*.7)*(1.+uBass*.8);
  vec2 q=p*(1.-bulge*exp(-r*r*9.));
  q=rot(sin(t*.25)*.4)*q;
  float f=18.+P1*70.;
  float w1=q.x*f+sin(q.y*5.+t)*2.5+uMid*2.*sin(q.y*14.-t*2.);
  float w2=length(q)*f*.75-t*3.;
  float a=smoothstep(-fwidth(w1),fwidth(w1),sin(w1));
  float b=smoothstep(-fwidth(w2),fwidth(w2),sin(w2));
  float x=mix(a,abs(a-b),P3);
  return ramp(x*(.85+.15*uBeat));
}`
},
{
  id: "constructivism",
  name: "Конструктив",
  description: "Авангард 1920-х: большой круг, диагональный брус, тонкие линии и треугольник собираются в плакатную композицию, элементы двигаются в ритм.",
  tags: ["конструктивизм", "авангард", "20-е", "геометрия", "плакат", "баухаус"],
  params: [{ name: "Скорость", def: .3 }, { name: "Наклон", def: .4 }, { name: "Дыхание", def: .6 }, { name: "Ритм-точки", def: .6 }],
  palette: ["#0b0907", "#a3121b", "#d8cdb3", "#fffaf0"],
  post: { trail: .05, zoom: .5, twist: .5, bloom: .25, chroma: .1, scan: .2 },
  glsl: `
float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
float sdTri(vec2 p, float r){ const float k=1.7320508; p.x=abs(p.x)-r; p.y=p.y+r/k; if(p.x+k*p.y>0.) p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.; p.x-=clamp(p.x,-2.*r,0.); return -length(p)*sign(p.y); }
vec3 render(vec2 p){
  float t=uTime*(.15+P0*.8);
  float aa=1.5/uRes.y;
  vec3 c=uPal[0]+.02*noise(p*300.);
  vec2 c1=vec2(-.25+.05*sin(t),.05);
  c=mix(c,uPal[1],smoothstep(aa,-aa,length(p-c1)-(.2+uBass*.05*P2)));
  vec2 q=rot(.6+.15*sin(t*.7)+P1*.8)*(p-vec2(.15,-.02));
  c=mix(c,uPal[3],smoothstep(aa,-aa,sdBox(q,vec2(.65,.03+uMid*.025))));
  for(int i=0;i<4;i++){ float fi=float(i); vec2 q2=rot(-.9+fi*.08)*(p-vec2(.32,.22-fi*.055)); c=mix(c,uPal[2],smoothstep(aa,-aa,sdBox(q2,vec2(.2+.08*sin(t+fi),.003)))); }
  vec2 q3=rot(t*.3)*(p-vec2(.4,-.24));
  c=mix(c,uPal[1]*.6+uPal[3]*.3,smoothstep(aa,-aa,sdTri(q3,.08+uBeat*.03)));
  for(int i=0;i<6;i++){ float fi=float(i); vec2 cc=vec2(-.62+fi*.1,-.33);
    float r=.012+spec(fi*.15+.05)*.03*P3; c=mix(c,uPal[3],smoothstep(aa,-aa,length(p-cc)-r)); }
  return c;
}`
},
{
  id: "girih",
  name: "Гирих",
  description: "Восточный звёздный орнамент из переплетённых восьмиконечных звёзд; линии светятся от верхов, звёзды наполняются спектром.",
  tags: ["орнамент", "восток", "звёзды", "мозаика", "средневековье", "геометрия"],
  params: [{ name: "Скорость", def: .3 }, { name: "Масштаб", def: .35 }, { name: "Вращение", def: .55 }, { name: "Толщина", def: .35 }],
  palette: ["#03050a", "#0d3b66", "#e0a526", "#fff4d6"],
  post: { trail: .2, zoom: .5, twist: .5, bloom: .5, chroma: .1, scan: .15 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.1+P0*.6);
  float sc=3.+P1*8.;
  vec2 q=rot(t*.3*(P2-.5)*2.)*p*sc;
  vec2 id=floor(q+.5); q-=id;
  float a=.29+.04*sin(t+length(id)*.7)+uBass*.03;
  float d=1e3;
  for(int k=0;k<4;k++){ float th=float(k)*.785398; vec2 n=vec2(cos(th),sin(th)); d=min(d,abs(abs(dot(q,n))-a)); }
  float s1=max(abs(q.x),abs(q.y));
  vec2 n1=vec2(.7071,.7071), n3=vec2(-.7071,.7071);
  float s2=max(abs(dot(q,n1)),abs(dot(q,n3)));
  float fill=smoothstep(a+.01,a-.01,min(s1,s2));
  float w=.015+P3*.04;
  float line=smoothstep(w+fwidth(d),w,d);
  float s=spec(fract(length(id)*.13));
  vec3 c=ramp(.3+s*.5)*fill*(.25+s*.6)+ramp(.92)*line*(.6+uHigh*.7);
  return c*(.75+.25*sin(length(id)*1.3-t*2.));
}`
},
{
  id: "mandala",
  name: "Мандала",
  description: "Сакральная геометрия: лепестки из пересекающихся окружностей в радиальной симметрии, кольца расходятся от центра, спектр раздувает лепестки.",
  tags: ["мандала", "сакральная геометрия", "цветок жизни", "симметрия", "медитация"],
  params: [{ name: "Скорость", def: .3 }, { name: "Лучи", def: .35 }, { name: "Дыхание", def: .6 }, { name: "Яркость", def: .55 }],
  palette: ["#040208", "#4b1d6b", "#e8a33d", "#fff6e0"],
  post: { trail: .35, zoom: .52, twist: .52, bloom: .55, chroma: .15, scan: .1 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.1+P0*.7);
  float n=floor(6.+P1*18.);
  float r=length(p), a=atan(p.y,p.x)+t*.2;
  float seg=6.28318/n; float am=mod(a,seg)-seg*.5; vec2 q=vec2(cos(am),sin(am))*r;
  float c=0.;
  for(int k=0;k<4;k++){ float fk=float(k); float R=.07+fk*.09+spec(fk*.2+.05)*.035*P2; float rr=R*.55;
    float d=abs(length(q-vec2(R,0.))-rr); c+=(1.-smoothstep(0.,fwidth(d)*1.5+.002,d))*(1.-fk*.15); }
  float rg=abs(fract(r*11.-t*.5)-.5); c+=(1.-smoothstep(0.,.05,rg))*.2*smoothstep(.5,.1,r);
  vec3 col=ramp(clamp(.35+c*.5,0.,1.))*c+cyc(r*2.-t*.1)*c*.15;
  col+=ramp(1.)*exp(-r*20.)*(.2+uBeat);
  return col*(.6+P3*.9)*smoothstep(.56,.36,r);
}`
},
{
  id: "demoscene",
  name: "Демосцена",
  description: "Компьютерное искусство 90-х: вращающаяся шахматная доска с зумом и переливающиеся раструбы-полосы, всё качается под бас.",
  tags: ["демосцена", "90-е", "шахматка", "ретро", "компьютер", "амига"],
  params: [{ name: "Скорость", def: .4 }, { name: "Клетка", def: .35 }, { name: "Зум от баса", def: .5 }, { name: "Полосы", def: .7 }],
  palette: ["#05010f", "#3a0ca3", "#f72585", "#ffe66d"],
  post: { trail: .1, zoom: .5, twist: .5, bloom: .4, chroma: .2, scan: .5 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.3+P0*1.5);
  float z=1.6+sin(t*.5)*.7+uBass*P2*1.2;
  vec2 q=rot(t*.4)*p*z*(3.+P1*6.);
  float chk=mod(floor(q.x)+floor(q.y),2.);
  vec3 c=mix(uPal[0],uPal[1]*.9,chk);
  for(int i=0;i<5;i++){ float fi=float(i); float y=sin(t*1.3+fi*.7)*.36; float d=abs(p.y-y);
    float bar=smoothstep(.05,.0,d); c=mix(c,ramp(.55+.45*(1.-d/.05))*(1.1+fi*.03),bar*P3); }
  return c*(.6+uLevel*.6);
}`
},
{
  id: "ink",
  name: "Тушь",
  description: "Японская тушь: пятна растекаются по бумаге, бас разгоняет кляксы, а поверх за каждый цикл рисуется рваный круг дзен-энсо.",
  tags: ["тушь", "япония", "энсо", "кисть", "минимализм", "дзен"],
  params: [{ name: "Скорость", def: .3 }, { name: "Растекание", def: .5 }, { name: "Темп кисти", def: .4 }, { name: "Энсо", def: .8 }],
  palette: ["#020202", "#262626", "#9a948a", "#f0e9dc"],
  post: { trail: .3, zoom: .5, twist: .5, bloom: .25, chroma: .05, scan: .05 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.08+P0*.5);
  vec2 q=p*1.6;
  float f=fbm(q*2.+vec2(t,-t*.6)+fbm(q*3.-t)*1.5);
  float ink=smoothstep(.5-P1*.15-uBass*.08,.62,f);
  float bleed=smoothstep(.35,.62,f)*.3;
  float r=length(p), a=atan(p.y,p.x);
  float prog=fract(uTime*.1*(.4+P2));
  float aa=(a+3.14159)/6.28318;
  float R=.3+.02*fbm(vec2(a*3.,t));
  float th=.028+.022*fbm(vec2(a*4.,1.))*(1.-aa*.7);
  float stroke=smoothstep(th,th*.5,abs(r-R))*step(aa,prog)*(.55+.45*fbm(vec2(a*30.,r*40.)));
  return ramp(max(ink*.85+bleed,stroke*P3));
}`
},
{
  id: "aurora",
  name: "Сияние",
  description: "Северное сияние над горами и водой: занавесы с лучами колышутся, бас усиливает свечение, отражение дрожит в озере.",
  tags: ["сияние", "аврора", "север", "ночь", "природа", "небо"],
  params: [{ name: "Скорость", def: .35 }, { name: "Сила", def: .6 }, { name: "Волны", def: .45 }, { name: "Звёзды", def: .5 }],
  palette: ["#000308", "#00553a", "#3dffb0", "#e6d0ff"],
  post: { trail: .25, zoom: .5, twist: .5, bloom: .55, chroma: .1, scan: .1 },
  glsl: `
vec3 curtain(vec2 p, float t, float seed, float base, float amp){
  float w=fbm(vec2(p.x*(.4+P2*1.3)+seed,t*.06+seed));
  float dy=p.y-(base+(w-.5)*amp);
  float emis=smoothstep(-.004,.012,dy)*exp(-max(dy,0.)*5.5);
  float rays=noise(vec2(p.x*70.+w*20.,t*.8+seed));
  return ramp(.85-clamp(max(dy,0.)*1.6,0.,.55))*emis*(.35+.65*rays*rays)*(.7+.3*noise(vec2(p.x*8.,t*2.+seed)));
}
vec3 sky(vec2 p, float t){
  vec3 col=uPal[0];
  vec2 g=p*80.; col+=ramp(1.)*step(.985,hash(floor(g)))*smoothstep(.2,0.,length(fract(g)-.5))*P3;
  vec3 a=curtain(p,t,0.,.06,.36)+curtain(p*vec2(1.3,1.)+vec2(.7,0.),t*1.2,4.1,.15,.3)*.7+curtain(p*vec2(.8,1.)-vec2(.3,0.),t*.8,9.7,-.01,.26)*.5;
  col+=a*(.35+P1*1.6)*(1.+uBass*.9);
  float m=-.2+.09*fbm(vec2(p.x*1.8,2.))+.04*noise(vec2(p.x*9.,5.));
  return mix(col,uPal[0]*.5,smoothstep(m+.003,m-.003,p.y));
}
vec3 render(vec2 p){
  float t=uTime*(.3+P0*1.2);
  if(p.y>-.3) return sky(p,t);
  float d=-.3-p.y;
  vec2 m=vec2(p.x+sin(p.y*90.+t*2.)*.004*(1.+d*8.)+(noise(vec2(p.x*20.,p.y*120.+t))-.5)*.012,-.3+d);
  return sky(m,t)*.45;
}`
},
{
  id: "rosewindow",
  name: "Роза-витраж",
  description: "Готическое круглое окно-роза: каменный переплёт лепестками и кольцами, цветное стекло светится от музыки, по ячейкам бежит спектр.",
  tags: ["готика", "витраж", "собор", "роза", "средневековье", "свет"],
  params: [{ name: "Скорость", def: .2 }, { name: "Лепестки", def: .35 }, { name: "Яркость", def: .6 }],
  palette: ["#020208", "#7a0a1f", "#1f4fd1", "#ffd86b"],
  post: { trail: .1, zoom: .5, twist: .5, bloom: .6, chroma: .1, scan: .1 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.05+P0*.4);
  float r=length(p), a=atan(p.y,p.x)+t*.1;
  float n=floor(8.+P1*16.);
  float seg=6.28318/n; float am=abs(mod(a,seg)-seg*.5);
  vec2 q=vec2(cos(am),sin(am))*r;
  float d=min(min(abs(r-.42),abs(r-.2)),abs(r-.08));
  d=min(d,abs(length(q-vec2(.31,0.))-.1));
  d=min(d,abs(length(q-vec2(.14,0.))-.055));
  d=min(d,am*r);
  float lead=smoothstep(.005,.011,d);
  float cr=floor(r*14.), ca=floor(a/seg);
  float h=hash(vec2(cr,mod(ca,n)));
  vec3 glass=cyc(h+cr*.07+t*.02)*(.55+.7*spec(fract(h*3.)));
  vec3 c=glass*(.7+.6*uLevel)*(.6+.4*noise(p*30.))*lead*smoothstep(.47,.44,r);
  c+=ramp(1.)*exp(-r*12.)*uBeat*.5;
  return c*(.55+P2*.9);
}`
},
{
  id: "cosmos60",
  name: "Космос-60",
  description: "Эпоха первых полётов: звезда-солнце с лучами, планета с орбитами и спутниками, звёздное небо; бас раскрывает лучи, верх зажигает звёзды.",
  tags: ["космос", "60-е", "ретро-футуризм", "орбиты", "спутник", "мозаика"],
  params: [{ name: "Скорость", def: .35 }, { name: "Лучи", def: .4 }, { name: "Яркость", def: .6 }],
  palette: ["#06070a", "#b3261e", "#e0a43a", "#e9e4d6"],
  post: { trail: .2, zoom: .5, twist: .5, bloom: .45, chroma: .15, scan: .3 },
  glsl: `
vec3 render(vec2 p){
  float t=uTime*(.1+P0*.6);
  vec2 ps=p-vec2(-.35,.12); float rs=length(ps), as=atan(ps.y,ps.x);
  float rays=smoothstep(.0,.3,sin(as*(12.+floor(P1*24.))+t)*.5+.5)*exp(-rs*2.2)*.5;
  vec3 c=uPal[0]+ramp(.6)*rays*(.5+uBass*.9);
  float sd=rs-(.07+uBeat*.015)*(.55+.45*pow(abs(cos(as*2.5+t)),.5));
  c=mix(c,ramp(1.),smoothstep(.003,-.003,sd));
  vec2 pc=vec2(.3,-.05); vec2 pp=(p-pc)*vec2(1.,2.6);
  for(int i=0;i<4;i++){ float fi=float(i); float R=.1+fi*.07; c+=ramp(.8)*smoothstep(.006,0.,abs(length(pp)-R))*.45;
    float ang=t*(1.2-fi*.2)+fi*2.; vec2 sat=pc+vec2(cos(ang),sin(ang)/2.6)*R; c+=ramp(.95)*smoothstep(.006,.0,length(p-sat)-.004-spec(fi*.2)*.01); }
  float pd=length(p-pc)-.06;
  c=mix(c,ramp(.4)+ramp(.9)*clamp(-(p-pc).x*6.,0.,1.)*.6,smoothstep(.003,-.003,pd));
  vec2 g=p*60.; c+=ramp(1.)*step(.97,hash(floor(g)))*smoothstep(.2,0.,length(fract(g)-.5))*(.3+uHigh);
  return c*(.65+P2*.7);
}`
}

];
