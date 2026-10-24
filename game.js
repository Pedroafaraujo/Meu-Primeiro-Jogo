'use strict';
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const overlay = document.querySelector('#overlay');
const start = document.querySelector('#start');
const pause = document.querySelector('#pause');
const W = 900, H = 540;
let best = 0;
try { best = Number(localStorage.getItem('orbita-best')) || 0; } catch {}
bestEl.textContent = best;
let state = 'ready', score = 0, elapsed = 0, spawn = 0, objects = [], last = 0;
const ship = { x: W / 2, y: H - 58, r: 16 };
const keys = new Set();
const stars = Array.from({length: 95}, () => ({x: Math.random()*W,y: Math.random()*H,r:Math.random()*1.4+.3,s:Math.random()*18+8}));
function show(tag, title, message, button) {
  document.querySelector('#tag').textContent = tag;
  document.querySelector('#title').textContent = title;
  document.querySelector('#message').textContent = message;
  start.textContent = button;
  overlay.hidden = false;
}
function begin() {
  score = 0; elapsed = 0; spawn = .5; objects = []; ship.x = W / 2;
  scoreEl.textContent = 0; keys.clear(); state = 'playing'; overlay.hidden = true;
  pause.disabled = false; pause.textContent = 'Pausar';
}
function togglePause() {
  if (state === 'playing') {
    state = 'paused'; keys.clear(); pause.textContent = 'Continuar';
    show('UMA PEQUENA ESCALA', 'Respire. O espaço espera.', 'Sua aventura continua de onde parou.', 'Continuar');
  } else if (state === 'paused') {
    state = 'playing'; overlay.hidden = true; pause.textContent = 'Pausar';
  }
}
function end() {
  state = 'over'; pause.disabled = true;
  const record = score > best;
  best = Math.max(best, score); bestEl.textContent = best;
  try { localStorage.setItem('orbita-best', String(best)); } catch {}
  show(record ? 'NOVO RECORDE!' : 'FIM DE VOO', 'Mais uma viagem?', `Você fez ${score} pontos. Cada tentativa leva você mais longe.`, 'Jogar novamente');
  document.querySelector('#announcement').textContent = `Fim de jogo. ${score} pontos. Recorde: ${best}.`;
  start.focus();
}
start.addEventListener('click', () => state === 'paused' ? togglePause() : begin());
pause.addEventListener('click', togglePause);
window.addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight',' ','a','A','d','D'].includes(e.key)) {
    if (e.target instanceof HTMLButtonElement && e.key === ' ') return;
    e.preventDefault(); keys.add(e.key.toLowerCase());
    if (e.key === ' ' && !e.repeat) togglePause();
  }
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); if(state === 'playing') togglePause(); });
document.addEventListener('visibilitychange', () => { if(document.hidden && state === 'playing') togglePause(); });
let dragging = false;
function movePointer(e) {
  if(state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  ship.x = Math.max(22,Math.min(W-22,(e.clientX-rect.left)*W/rect.width));
}
canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); movePointer(e); });
canvas.addEventListener('pointermove', e => { if(dragging) movePointer(e); });
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });
function update(dt) {
  elapsed += dt;
  if(keys.has('arrowleft') || keys.has('a')) ship.x -= 420 * dt;
  if(keys.has('arrowright') || keys.has('d')) ship.x += 420 * dt;
  ship.x = Math.max(22, Math.min(W-22,ship.x));
  spawn -= dt;
  if(spawn <= 0) {
    const collectible = Math.random() < .28;
    objects.push({x:24+Math.random()*(W-48),y:-35,r:collectible?12:18+Math.random()*15,star:collectible,speed:125+Math.min(elapsed*4,240)+Math.random()*65,angle:Math.random()*6});
    spawn = Math.max(.19,.65-elapsed*.006);
  }
  for(const o of objects) {
    o.y += o.speed*dt; o.angle += dt;
    if(Math.hypot(o.x-ship.x,o.y-ship.y) < o.r+ship.r-4) {
      if(!o.star) { end(); return; }
      score += 50; o.y = H+80;
    }
  }
  objects = objects.filter(o => o.y < H+50);
  score += Math.floor(elapsed*10)-Math.floor((elapsed-dt)*10);
  scoreEl.textContent = score;
}
function draw() {
  ctx.fillStyle = '#0b1024'; ctx.fillRect(0,0,W,H);
  const glow = ctx.createRadialGradient(W*.5,H*.4,0,W*.5,H*.4,430);
  glow.addColorStop(0,'#202b4b88'); glow.addColorStop(1,'#0b102400');
  ctx.fillStyle = glow; ctx.fillRect(0,0,W,H);
  for(const s of stars) { ctx.fillStyle = '#b4c8e0'; ctx.globalAlpha = .3+s.r/2; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }
  ctx.globalAlpha = 1;
  for(const o of objects) {
    ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.angle);
    if(o.star) {
      ctx.fillStyle = '#a0f5d9'; ctx.shadowColor = '#8cf5d2'; ctx.shadowBlur = 18;
      ctx.beginPath(); for(let i=0;i<8;i++){const a=i*Math.PI/4, r=i%2?5:14;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();
    } else {
      ctx.fillStyle = '#736986'; ctx.strokeStyle = '#a391a9'; ctx.lineWidth = 2;
      ctx.beginPath();for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=o.r*(i%2?.8:1);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#4d4562';ctx.beginPath();ctx.arc(-o.r*.2,-o.r*.15,o.r*.26,0,7);ctx.fill();
    } ctx.restore();
  }
  ctx.save();ctx.translate(ship.x,ship.y);
  ctx.shadowColor = '#7ff4d5';ctx.shadowBlur=18;
  ctx.fillStyle='#8bf0d1';ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(21,19);ctx.lineTo(0,11);ctx.lineTo(-21,19);ctx.closePath();ctx.fill();
  ctx.fillStyle='#183c50';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(6,8);ctx.lineTo(-6,8);ctx.closePath();ctx.fill();
  if(state==='playing'){ctx.fillStyle='#b6a2ff';ctx.beginPath();ctx.moveTo(-6,19);ctx.lineTo(0,29+Math.random()*14);ctx.lineTo(6,19);ctx.fill();}ctx.restore();
}
function frame(time) {
  const dt = Math.min((time-last)/1000 || 0,.04); last=time;
  if(state === 'playing') { for(const s of stars) s.y = (s.y+s.s*dt)%H; update(dt); }
  draw(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
