import { initJadeSphere } from './jade-sphere';

export function initIntelligenceMap() {
  const map = document.querySelector<HTMLElement>('.intelligence-map');
  const core = map?.querySelector<HTMLElement>('.map-center');
  const svg = map?.querySelector<SVGSVGElement>('.map-flow');
  if (!map || !core || !svg) return;
  const nodes = [...map.querySelectorAll<HTMLAnchorElement>('[data-map-product]')];
  const caption = map.querySelector<HTMLElement>('.map-context');
  const defaultCaption = caption?.textContent ?? '';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const jade = initJadeSphere(core, reduced);

  function positionConnections() {
    if (!map || !core || !svg) return;
    const bounds = map.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    jade?.resize();
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const center = core.getBoundingClientRect();
    const cx = center.left - bounds.left + center.width / 2;
    const cy = center.top - bounds.top + center.height / 2;
    const radius = center.width / 2;
    map.querySelector('.map-orbits')?.setAttribute('transform', `translate(${cx} ${cy}) scale(${radius / 81})`);
    nodes.forEach((node, index) => {
      const box = node.getBoundingClientRect();
      const left = index % 2 === 0;
      const top = index < 2;
      const sx = (left ? box.right - 18 : box.left + 18) - bounds.left;
      const sy = (top ? box.bottom : box.top) - bounds.top;
      const ex = cx + (left ? -1 : 1) * radius * .75;
      const ey = cy + (top ? -1 : 1) * radius * .66;
      const bend = Math.max(14, Math.abs(ey - sy) * .56);
      const curve = `M${sx} ${sy}C${sx} ${sy + (top ? bend : -bend)} ${ex + (left ? -bend : bend)} ${ey} ${ex} ${ey}`;
      const id = node.dataset.mapProduct;
      map.querySelectorAll(`[data-link-path="${id}"]`).forEach(path => path.setAttribute('d', curve));
      map.querySelector(`[data-link-port="${id}"]`)?.setAttribute('transform', `translate(${sx} ${sy})`);
    });
  }

  function highlight(id?: string) {
    map?.querySelectorAll<SVGGElement>('[data-connection]').forEach(connection => {
      connection.classList.toggle('is-active', connection.dataset.connection === id);
    });
    const node = nodes.find(node => node.dataset.mapProduct === id);
    if (caption) caption.textContent = node ? `${node.querySelector('strong')?.textContent} · ${node.querySelector('small')?.textContent}` : defaultCaption;
  }

  nodes.forEach(node => {
    node.addEventListener('pointerenter', () => highlight(node.dataset.mapProduct));
    node.addEventListener('pointerleave', () => {
      const focused = nodes.find(item => item === document.activeElement);
      highlight(focused?.dataset.mapProduct);
    });
    node.addEventListener('focus', () => highlight(node.dataset.mapProduct));
    node.addEventListener('blur', () => highlight());
  });
  map.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const box = map.getBoundingClientRect();
    map.style.setProperty('--map-glint-x', `${28 + (event.clientX - box.left) / box.width * 22}%`);
    map.style.setProperty('--map-glint-y', `${18 + (event.clientY - box.top) / box.height * 18}%`);
  });
  map.addEventListener('pointerleave', () => {
    map.style.removeProperty('--map-glint-x');
    map.style.removeProperty('--map-glint-y');
  });
  const resize = new ResizeObserver(positionConnections);
  resize.observe(map);
  resize.observe(core);
  nodes.forEach(node => resize.observe(node));
  window.addEventListener('hashchange', () => requestAnimationFrame(positionConnections));
  document.fonts.ready.then(positionConnections);
  positionConnections();
}
