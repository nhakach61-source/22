(function(){
/* MUSIC: plays automatically on load. Browsers block sound until the visitor's first tap/click/key, so it also starts on that first touch. Change SRC to use another file. */
const SRC='audio/music.mp3',VOL=0.8;
const a=new Audio(SRC);a.loop=true;a.preload='auto';a.volume=0;
let started=false,fadeT=0,wasOn=false;
function ramp(to,ms,done){cancelAnimationFrame(fadeT);const from=a.volume,t0=performance.now();(function f(n){const p=Math.min(1,(n-t0)/ms),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;a.volume=from+(to-from)*e;if(p<1)fadeT=requestAnimationFrame(f);else if(done)done()})(t0)}
function fade(){ramp(VOL,2200)}
function play(){return a.play().then(()=>{started=true;fade();off()}).catch(()=>{})}
function start(e){if(started)return;play()}
const ev=['pointerdown','pointerup','touchend','click','keydown','mousedown'];
function off(){ev.forEach(e=>removeEventListener(e,start,true))}
ev.forEach(e=>addEventListener(e,start,true));
document.addEventListener('visibilitychange',()=>{if(document.hidden){wasOn=!a.paused;a.pause()}else if(wasOn){a.play().catch(()=>{})}});
play();
})();
const io=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('on');io.unobserve(x.target)}}),{threshold:.15});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));

/* PHOTO SLIDER: smooth cross-fade, delay is 4200 (ms). Next photos are preloaded so a slide never fades in blank. */
(function(){const s=[...document.querySelectorAll('.sl')];if(!s.length)return;let i=-1;
const ui=document.createElement('div');ui.className='sl-ui';ui.innerHTML='<span class="sl-count"></span><span class="sl-bar"><i></i></span>';document.querySelector('.sl-track').appendChild(ui);
const cnt=ui.firstChild,bar=ui.querySelector('i');
function pre(n){const im=s[(n+s.length)%s.length].querySelector('img');if(im){im.loading='eager';if(im.decode)im.decode().catch(()=>{})}}
function go(n){const old=s[i];i=(n+s.length)%s.length;
s.forEach(e=>{if(e!==old&&e!==s[i])e.className='sl'});
if(old&&old!==s[i])old.className='sl p';
s[i].className='sl c';
cnt.textContent=String(i+1).padStart(2,'0')+' / '+String(s.length).padStart(2,'0');bar.style.animation='none';void bar.offsetWidth;bar.style.animation='';
pre(i+1);pre(i+2);
if(old&&old!==s[i])setTimeout(()=>{if(old!==s[i])old.className='sl'},1300)}
go(0);setInterval(()=>go(i+1),4200);
})();

/* GOOGLE MAP BOX: edit address (shown on the map) and link (opened by the button; leave '' to use the address) */
(function(){const MAP={address:'',link:'https://maps.app.goo.gl/9dpF9BxSAyNDHojN9?g_st=ic'};
const q=encodeURIComponent(MAP.address);
document.getElementById('mapaddr').textContent=MAP.address;
document.getElementById('maplink').href=MAP.link||'https://www.google.com/maps/search/?api=1&query='+q;})();

/* ITINERARY: draws icons, fills the line while scrolling, highlights the current row */
(function(){const tl=document.querySelector('.tl');if(!tl)return;const rows=[...tl.querySelectorAll('.row')];
rows.forEach((r,k)=>r.style.transitionDelay=(k*.12)+'s');
tl.querySelectorAll('svg *').forEach(e=>e.setAttribute('pathLength','1'));
function upd(){const r=tl.getBoundingClientRect(),mid=innerHeight*.6;
const p=Math.max(0,Math.min(1,(mid-r.top)/r.height));
tl.style.setProperty('--p',p);tl.style.setProperty('--y',(p*(r.height+28))+'px');
let best=null,bd=1e9;
rows.map(w=>{const b=w.getBoundingClientRect();return[w,Math.abs(b.top+b.height/2-mid)]}).forEach(([w,d])=>{if(d<bd){bd=d;best=w}});
const cur=(best&&r.top<mid&&r.bottom>mid*.6)?best:null;
rows.forEach(w=>w.classList.toggle('cur',w===cur))}
let tick=false;function req(){if(tick)return;tick=true;requestAnimationFrame(()=>{tick=false;upd()})}
addEventListener('scroll',req,{passive:true});addEventListener('resize',req);upd();})();

(function(){
function parts(t,km){return t.split(/(\s+)/).filter(Boolean).map(x=>({t:x,w:!/^\s+$/.test(x)}))}
function split(el){const km=!!el.closest('[lang="km"]');let i=0;const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),L=[];
while(tw.nextNode())L.push(tw.currentNode);
L.forEach(nd=>{if(!nd.nodeValue.trim())return;const f=document.createDocumentFragment();
parts(nd.nodeValue,km).forEach(p=>{if(p.w){const s=document.createElement('span');s.className='w';s.style.setProperty('--i',i++);s.textContent=p.t;f.appendChild(s)}else f.appendChild(document.createTextNode(p.t))});
nd.replaceWith(f)});el.classList.add('wv')}
const io2=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('on');io2.unobserve(x.target)}}),{threshold:.2});
document.querySelectorAll('.story h2,.story .kh,.iti h2,.when b,.when span,.loc h2,.loc .kh,footer').forEach(el=>{split(el);io2.observe(el)});
[['.names',400],['.tag',3000]].forEach(([q,d])=>{const el=document.querySelector(q);if(el){split(el);setTimeout(()=>el.classList.add('on'),d)}});
})();

/* STORY SLIDER: swipe / drag with finger or mouse, tap the dots, auto-plays every 2.5s, loops seamlessly */
(function(){const box=document.querySelector('.hs');if(!box)return;
const tr=box.querySelector('.hs-track'),n=tr.children.length,d=[...box.querySelectorAll('.hs-dots i')];
tr.appendChild(tr.children[0].cloneNode(true));
let i=0,x0=0,dx=0,drag=false,t;
function snap0(){tr.classList.add('snap');i=0;tr.style.transform='translateX(0%)';void tr.offsetWidth;tr.classList.remove('snap')}
function set(k){i=Math.max(0,Math.min(n,k));tr.style.transform='translateX(-'+i*100+'%)';d.forEach((e,j)=>e.className=j==(i%n)?'c':'');
if(i===n)setTimeout(()=>{if(i===n&&!drag)snap0()},950)}
function auto(){clearInterval(t);t=setInterval(()=>{if(i>=n)snap0();set(i+1)},2500)}
set(0);auto();
box.addEventListener('pointerdown',e=>{if(i===n)snap0();drag=true;x0=e.clientX;dx=0;box.classList.add('drag');try{box.setPointerCapture(e.pointerId)}catch(_){}clearInterval(t)});
box.addEventListener('pointermove',e=>{if(!drag)return;dx=e.clientX-x0;let o=dx;if((i==0&&dx>0)||(i==n&&dx<0))o=dx*.3;tr.style.transform='translateX(calc(-'+i*100+'% + '+o+'px))'});
function end(){if(!drag)return;drag=false;box.classList.remove('drag');set(Math.abs(dx)>box.clientWidth*.15?i+(dx<0?1:-1):i);auto()}
['pointerup','pointercancel'].forEach(ev=>box.addEventListener(ev,end));
d.forEach((e,j)=>e.addEventListener('click',ev=>{ev.stopPropagation();set(j);auto()}));
})();


/* MAP CARD: gentle 3D tilt + road parallax on hover */
(function(){const c=document.getElementById('mapcard');if(!c||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
c.style.setProperty('--ry',x*10+'deg');c.style.setProperty('--rx',-y*10+'deg');c.style.setProperty('--mx',-x*14+'px');c.style.setProperty('--my',-y*10+'px')});
c.addEventListener('pointerleave',()=>['--rx','--ry','--mx','--my'].forEach(k=>c.style.removeProperty(k)))})();

/* HERO DATE: count-up numbers + soft 3D tilt */
(function(){const d=document.querySelector('.date');if(!d||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
d.querySelectorAll('b').forEach((b,k)=>{const t=parseInt(b.textContent,10);b.textContent='00';
setTimeout(()=>{const s=performance.now();(function f(n){const p=Math.min(1,(n-s)/1500),e=1-Math.pow(1-p,3);
b.textContent=String(Math.round(t*e)).padStart(2,'0');if(p<1)requestAnimationFrame(f)})(s)},900+k*250)});
const h=document.querySelector('.hero');
h.addEventListener('pointermove',e=>{const r=h.getBoundingClientRect();d.style.setProperty('--ay',((e.clientX-r.left)/r.width-.5)*10+'deg');d.style.setProperty('--ax',-((e.clientY-r.top)/r.height-.5)*8+'deg')});
h.addEventListener('pointerleave',()=>{d.style.removeProperty('--ax');d.style.removeProperty('--ay')})})();

/* HERO NAMES: split into letters (for the entrance + light wave) and add sparkles */
(function(){const n=document.querySelector('.names');if(!n)return;let c=0;
n.querySelectorAll('.w').forEach(w=>{const t=w.textContent;w.textContent='';[...t].forEach(ch=>{const s=document.createElement('span');s.className='ch';s.style.setProperty('--c',c++);s.textContent=ch;w.appendChild(s)})});
n.setAttribute('aria-label',n.textContent);
[[6,20,10,2.6],[22,-8,7,3.4],[40,6,9,4.1],[58,-6,6,3],[76,14,10,3.8],[93,0,8,4.6],[14,92,7,3.2],[84,88,9,4.2]].forEach(([l,t,s,d])=>{const i=document.createElement('i');i.className='sp';i.style.cssText='left:'+l+'%;top:'+t+'%;--s:'+s+'px;--d:'+d+'s';n.appendChild(i)})})();

/* LAG FIX: pause looping animations of sections that are not on screen */
(function(){const t=document.querySelectorAll('header.hero,.slider,.story,.iti,.loc,footer');if(!t.length||!('IntersectionObserver' in window))return;
const o=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('idle',!e.isIntersecting)),{rootMargin:'80px 0px'});
t.forEach(el=>o.observe(el))})();
