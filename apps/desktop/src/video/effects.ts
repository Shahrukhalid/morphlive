import type { Persona } from '../presets';
export type Point = { x: number; y: number; z?: number };
export function renderEffect(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, persona: Persona, points: Point[], intensity: number, debug: boolean, original: boolean, disclosure: boolean) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.save(); ctx.clearRect(0,0,w,h);
  if (original || (persona.mode !== 'privacy' && persona.mode !== 'avatar')) {
    ctx.filter = !original && persona.mode === 'studio' ? `contrast(${1 + intensity * .08}) saturate(${1 + intensity * .15}) brightness(${1 + intensity * .07})` : 'none';
    ctx.drawImage(video,0,0,w,h); ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#10141f'; ctx.fillRect(0,0,w,h);
    const gradient = ctx.createRadialGradient(w*.5,h*.5,5,w*.5,h*.5,w*.6); gradient.addColorStop(0, persona.color + '22'); gradient.addColorStop(1,'#10141f'); ctx.fillStyle = gradient; ctx.fillRect(0,0,w,h);
  }
  if (!original && (persona.mode === 'avatar' || persona.mode === 'privacy')) {
    // Entire frame replaced, including when no face is detected. Never fail open.
    const center = points[1]; const x = center ? center.x*w : w*.5, y = center ? center.y*h : h*.5;
    const scale = points[234] && points[454] ? Math.max(w*.12, Math.abs(points[454].x-points[234].x)*w*.68) : w*.16;
    const mouth = points[13] && points[14] ? Math.abs(points[14].y-points[13].y)*h : 3;
    const angle = points[33] && points[263] ? Math.atan2((points[263].y-points[33].y)*h,(points[263].x-points[33].x)*w) : 0;
    ctx.translate(x,y); ctx.rotate(angle);
    ctx.fillStyle = persona.color; ctx.beginPath(); ctx.ellipse(0,0,scale*.85,scale,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#121727';
    for (const [eye, lower, upper, dx] of [[33,145,159,-.32],[263,374,386,.32]]) {
      const openness = points[lower] && points[upper] ? Math.min(.18, Math.max(.025,Math.abs(points[lower].y-points[upper].y)*h/scale)) : .12;
      ctx.beginPath(); ctx.ellipse(dx*scale,-scale*.12,scale*.09,scale*openness,0,0,Math.PI*2); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(0,scale*.36,scale*.20,Math.min(scale*.25,Math.max(3,mouth)),0,0,Math.PI*2); ctx.fill();
    if (!points.length) { ctx.font = `${Math.round(scale*.12)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('TRACKING LOST',0,scale*1.3); }
  } else if (!original && persona.mode === 'mask' && points.length) {
    const left = points[33], right = points[263];
    const x = (left.x+right.x)/2*w, y = (left.y+right.y)/2*h;
    const width = Math.hypot((right.x-left.x)*w,(right.y-left.y)*h)*1.65;
    ctx.translate(x,y); ctx.rotate(Math.atan2((right.y-left.y)*h,(right.x-left.x)*w));
    ctx.fillStyle = persona.color + Math.round((.35 + intensity*.6)*255).toString(16).padStart(2,'0');
    ctx.strokeStyle = persona.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-width/2,-width*.16,width,width*.34,[width*.09]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0c1728';
    for (const dx of [-.26,.26]) { ctx.beginPath(); ctx.ellipse(dx*width,0,width*.13,width*.065,0,0,Math.PI*2); ctx.fill(); }
  }
  ctx.restore();
  if (debug && !original) { ctx.fillStyle = '#6df5d2'; for (const p of points) ctx.fillRect(p.x*w-1,p.y*h-1,2,2); }
  if (disclosure && !original) { ctx.font = `${Math.max(12,w/75)}px sans-serif`; ctx.fillStyle='#0009'; ctx.fillRect(14,h-38,190,25); ctx.fillStyle='#fff'; ctx.fillText('MORPHLIVE · SYNTHETIC',23,h-20); }
}
