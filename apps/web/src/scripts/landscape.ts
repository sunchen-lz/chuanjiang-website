export const signals = { audio: 0, scroll: 0, fusion: 0, pointer: [-10, -10] as [number, number] };

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function ridge(x: number, layer: number, time: number) {
  return .66 + layer * .048
    - .36 * Math.exp(-Math.pow((x - .59 + layer * .018) / .14, 2))
    - .28 * Math.exp(-Math.pow((x - .88 - layer * .011) / .13, 2))
    - .16 * Math.exp(-Math.pow((x - 1.07) / .12, 2))
    + Math.sin(x * 16 + layer * 1.8 + time * .14) * .01;
}

const waterLines = 43;
function waterField(x: number, line: number, time: number) {
  const depth = line / (waterLines - 1);
  const px = signals.pointer[0];
  const distance = Math.abs(x - px);
  const interaction = px > -1 ? Math.sin(distance * 26 - time * 2) * Math.exp(-distance * 6) * .013 : 0;
  return .59 + depth * .46
    + Math.sin(x * 6.1 - time * .54 + line * .073) * (.024 + depth * .021)
    + Math.sin(x * 11.4 + time * .36 + line * .12) * .011
    + interaction + Math.sin(x * 18 + time * 2) * signals.audio * .018;
}

// Broad ink washes and continuous streamlines share the same composition.
// Time drives motion; pointer, scrolling and optional audio add energy.
export function initLandscape() {
  const canvas = document.getElementById('mountainCanvas') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!canvas || !ctx || !hero) return;
  let width = 0, height = 0, frame = 0, last = 0, visible = true;
  const resize = () => {
    width = canvas.clientWidth; height = canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wake();
  };
  function mountain(layer: number, time: number) {
    ctx!.beginPath();
    ctx!.moveTo(width * .26, height);
    for (let i = 0; i <= 120; i++) {
      const x = .26 + i / 120 * .9;
      const y = ridge(x, layer, time) - signals.scroll * .022 * (4 - layer);
      ctx!.lineTo(x * width, y * height);
    }
    ctx!.lineTo(width * 1.16, height); ctx!.closePath();
  }
  function render(stamp: number) {
    frame = 0;
    if (document.hidden || !visible) return;
    if (stamp - last < 32 && !reduced.matches) { frame = requestAnimationFrame(render); return; }
    last = stamp;
    const time = reduced.matches ? 0 : stamp / 1000;
    ctx!.clearRect(0, 0, width, height);
    for (let layer = 0; layer < 5; layer++) {
      ctx!.save();
      const wash = ctx!.createLinearGradient(0, height * .16, 0, height * .84);
      const distant = layer < 3;
      wash.addColorStop(0, distant ? 'rgba(126, 180, 161, .36)' : 'rgba(16, 56, 50, .52)');
      wash.addColorStop(.35, distant ? 'rgba(68, 133, 117, .26)' : 'rgba(15, 49, 44, .35)');
      wash.addColorStop(.76, 'rgba(17, 54, 50, .035)');
      wash.addColorStop(1, 'rgba(10, 23, 25, 0)');
      ctx!.filter = `blur(${layer === 0 ? 20 : 7 + layer * 1.5}px)`;
      ctx!.fillStyle = wash; mountain(layer, time); ctx!.fill();
      ctx!.filter = 'none';
      // No mountain stroke: the volume emerges from layered, diffused ink.
      ctx!.restore();
    }
    // A broad reflection washes through the river before its fine lines.
    const waterGlow = ctx!.createRadialGradient(width * .76, height * .8, 0, width * .76, height * .8, width * .46);
    waterGlow.addColorStop(0, 'rgba(94, 170, 161, .075)');
    waterGlow.addColorStop(1, 'rgba(94, 170, 161, 0)');
    ctx!.fillStyle = waterGlow; ctx!.fillRect(0, height * .53, width, height * .47);
    for (let line = 0; line < waterLines; line++) {
      ctx!.beginPath();
      for (let i = 0; i <= 140; i++) {
        const x = -.08 + i / 140 * 1.24;
        const y = waterField(x, line, time);
        if (i === 0) ctx!.moveTo(x * width, y * height); else ctx!.lineTo(x * width, y * height);
      }
      const shine = .26 + .1 * Math.sin(time * .7 + line * .3);
      const depth = line / waterLines;
      ctx!.strokeStyle = line % 11 === 0 ? `rgba(216, 183, 119, ${shine * .6})` : `rgba(94, 170, 161, ${shine * (.42 + depth * .48)})`;
      ctx!.lineWidth = line % 11 === 0 ? 1.25 : .65 + depth * .35;
      ctx!.stroke();
      // A bright segment travels along each selected water line.
      if (line % 9 === 0) {
        ctx!.setLineDash([width * .04, width * 1.23]);
        ctx!.lineDashOffset = -((time * 62 + line * 37) % (width * 1.27));
        ctx!.strokeStyle = 'rgba(161, 221, 208, .42)'; ctx!.lineWidth = 1.4; ctx!.stroke();
        ctx!.setLineDash([]);
      }
    }
    // Water particles follow the same sine field as the streamlines. They
    // gather into wave crests and disperse in the troughs, so they read as
    // spray and reflected light instead of a star field.
    // Keep the spray tied to the water field while adding enough reflected
    // points for the surface to read as a continuous, living rhythm.
    const particleCount = Math.min(1800, Math.max(560, Math.round(width / .9)));
    for (let particle = 0; particle < particleCount; particle++) {
      const seed = particle * 17.371;
      const x = ((seed * .071 + time * (.008 + (particle % 5) * .0008)) % 1.24) - .08;
      const line = (particle * 7) % waterLines;
      const ripple = Math.sin(seed + time * 1.3) * .0035;
      const y = waterField(x, line, time) + ripple;
      const size = .45 + (particle % 4) * .2;
      const alpha = .16 + .3 * (0.5 + 0.5 * Math.sin(seed + time * 1.1));
      ctx!.beginPath(); ctx!.ellipse(x * width, y * height, size * 1.65, size * .62, 0, 0, Math.PI * 2);
      ctx!.fillStyle = particle % 17 === 0 ? `rgba(216, 183, 119, ${alpha * .85})` : `rgba(143, 212, 200, ${alpha})`;
      ctx!.fill();
    }
    if (!reduced.matches) frame = requestAnimationFrame(render);
  }
  function wake() { if (!frame && !document.hidden && visible) frame = requestAnimationFrame(render); }
  resize(); new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }).observe(canvas);
  document.addEventListener('visibilitychange', wake);
  reduced.addEventListener('change', wake);
  window.addEventListener('chuanjiang:understood', wake);
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    signals.pointer = [(event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height];
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { signals.pointer = [-10, -10]; });
  window.addEventListener('scroll', () => { signals.scroll = Math.min(1, scrollY / hero.clientHeight); }, { passive: true });
}
