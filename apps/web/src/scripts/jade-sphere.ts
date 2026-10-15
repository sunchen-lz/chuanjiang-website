import { signals } from './landscape';

const textureSize = 768;
const streams = [
  { phase: .12, speed: .36, amp: .15, tilt: -.05, width: 13, alpha: .14 },
  { phase: .49, speed: -.24, amp: .19, tilt: .08, width: 9, alpha: .095 },
  { phase: .76, speed: .17, amp: .12, tilt: .18, width: 18, alpha: .075 },
  { phase: .31, speed: .29, amp: .10, tilt: -.19, width: 6, alpha: .06 },
];
type Stream = typeof streams[number];

// The approved jade texture stays still; only the light suspended inside it moves.
export function initJadeSphere(core: HTMLElement, reduced: MediaQueryList) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'jade-flow';
  canvas.setAttribute('aria-hidden', 'true');
  core.prepend(canvas);
  let frame = 0, last = 0, time = 0, scale = 1, visible = false;

  function point(stream: Stream, progress: number, layer: number) {
    const wave = Math.sin(progress * Math.PI * 2.2 + stream.phase * 7 + time * stream.speed) * stream.amp;
    const ripple = Math.sin(progress * Math.PI * 5.5 - time * stream.speed * 1.6 + layer) * .028;
    return [progress * 1.96 + .02, 1 + stream.tilt + wave + ripple + (progress - .5) * .13]
      .map(coordinate => coordinate * textureSize / 2);
  }

  function drawPath(stream: Stream, layer: number, blur: number, alpha: number, width: number, dash?: number[]) {
    if (!ctx) return;
    ctx.beginPath();
    for (let step = 0; step <= 92; step++) {
      const [x, y] = point(stream, step / 92, layer);
      if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.filter = `blur(${blur * scale}px)`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(172,232,207,${alpha})`;
    ctx.setLineDash(dash ?? []);
    ctx.lineDashOffset = -time * 74;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, textureSize, textureSize);
    ctx.save();
    ctx.beginPath();
    ctx.arc(textureSize / 2, textureSize / 2, textureSize / 2 - 7, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    // Voice adds a little energy; the autonomous flow is always present.
    const energy = 1 + signals.audio * .25;
    streams.forEach((stream, index) => {
      drawPath(stream, index * .7, 13, stream.alpha * .58 * energy, stream.width * 1.9);
      drawPath(stream, index * .7, 4, stream.alpha * energy, stream.width, [34 + index * 7, 122 - index * 8]);
      const phase = time * stream.speed * .075 + stream.phase;
      for (let particle = 0; particle < 3; particle++) {
        const progress = ((phase + particle * .31) % 1 + 1) % 1;
        const [x, y] = point(stream, progress, index);
        const radius = 14 + 8 * Math.sin(time * 1.5 + particle);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, `rgba(215,244,220,${stream.alpha * .72 * energy})`);
        glow.addColorStop(1, 'rgba(140,214,188,0)');
        ctx.filter = 'none';
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      }
    });
    // Soft refraction at the lower edge places the currents beneath the shell.
    const angle = time * .065 * Math.PI * 2;
    const x = (1.44 + .46 * Math.cos(angle)) * textureSize / 2;
    const y = (1.34 + .46 * Math.sin(angle)) * textureSize / 2;
    const edge = ctx.createRadialGradient(x, y, 0, x, y, 42);
    edge.addColorStop(0, 'rgba(190,238,208,.16)');
    edge.addColorStop(1, 'rgba(126,205,178,0)');
    ctx.filter = `blur(${3 * scale}px)`;
    ctx.fillStyle = edge;
    ctx.beginPath(); ctx.arc(x, y, 42, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function render(stamp: number) {
    frame = 0;
    if (reduced.matches || document.hidden || !visible) { last = 0; return; }
    if (last && stamp - last < 32) { frame = requestAnimationFrame(render); return; }
    if (last) time += Math.min((stamp - last) / 1000, .1);
    last = stamp;
    draw();
    frame = requestAnimationFrame(render);
  }

  function syncPlayback() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; last = 0;
    if (reduced.matches) ctx?.clearRect(0, 0, textureSize, textureSize);
    else if (!document.hidden && visible) frame = requestAnimationFrame(render);
  }

  function resize() {
    const size = core.clientWidth;
    if (!size) return;
    const pixels = Math.round(size * Math.min(devicePixelRatio || 1, 2));
    if (canvas.width === pixels && canvas.height === pixels) return;
    canvas.width = canvas.height = pixels;
    scale = pixels / textureSize;
    ctx?.setTransform(scale, 0, 0, scale, 0, 0);
    if (!reduced.matches) draw();
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }).observe(core);
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', syncPlayback);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; last = 0; });
  window.addEventListener('pageshow', syncPlayback);
  resize();
  return { resize };
}
