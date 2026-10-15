import { initLandscape, signals } from './landscape';
import { initIntelligenceMap } from './intelligence-map';
import { industries, products } from '../data/products';

initLandscape();
initIntelligenceMap();
const routes = new Set(['home', 'products', 'solutions', 'about', 'downloads', 'support', 'admin', 'assist', 'resources', 'operations']);
const pageTitles: Record<string, string> = { home: '川江奔涌，向新而行', products: '产品与平台', solutions: '行业解决方案', about: '关于川江', downloads: '下载中心', support: '服务与支持', admin: '反馈处理台 DEMO', assist:'智能服务', resources:'服务与资料', operations:'运营工作台 DEMO' };
const menu = document.getElementById('menuToggle') as HTMLButtonElement;
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false'); menu.textContent = '菜单 +';
  document.querySelector('.site-header')?.classList.remove('menu-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open)); menu.textContent = open ? '收起 ×' : '菜单 +';
  document.querySelector('.site-header')?.classList.toggle('menu-open', open);
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const setText = (id: string, value: string) => { const element = document.getElementById(id); if (element) element.textContent = value; };
const setLink = (id: string, value: string) => { const element = document.getElementById(id) as HTMLAnchorElement | null; if (element) element.href = value; };

function showProduct(id = 'gongge') {
  const product = products.find(item => item.id === id) ?? products[0];
  document.querySelectorAll<HTMLButtonElement>('[data-product]').forEach(button => {
    const active = button.dataset.product === product.id;
    button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
  });
  document.querySelector('.product-detail')?.setAttribute('aria-labelledby', `product-tab-${product.id}`);
  setText('detailTag', `${product.tag} / AI AGENT`); setText('detailName', product.name);
  setText('detailLine', product.line); setText('detailDescription', product.description);
  setText('workbenchTitle', product.name); setText('workbenchHeading', product.line);
  const sourceMark = document.querySelector<HTMLImageElement>(`.product-filter [data-product="${product.id}"] img`);
  if (sourceMark) {
    for (const id of ['detailLogo', 'workbenchLogo']) {
      const mark = document.getElementById(id) as HTMLImageElement | null;
      if (mark) { mark.src = sourceMark.src; mark.alt = `${product.name}标识`; }
    }
  }
  const tags = document.getElementById('detailPrompts');
  tags?.replaceChildren(...product.prompts.map(text => { const span = document.createElement('span'); span.textContent = text; return span; }));
  const suggestions = document.getElementById('workbenchSuggestions');
  suggestions?.replaceChildren(...product.prompts.map(text => { const button = document.createElement('button'); button.type = 'button'; button.textContent = `${text} ↗`; button.addEventListener('click', () => { const input = document.getElementById('demoQuestion') as HTMLInputElement; input.value = text; conceptAnswer(); }); return button; }));
  setLink('detailDownload', `#/downloads?product=${product.id}`); setLink('detailContact', `#/support?product=${product.id}`);
  const input = document.getElementById('demoQuestion') as HTMLInputElement;
  input.value = ''; input.placeholder = `例如：${product.prompts[0]}`;
  document.getElementById('demoAnswer')!.hidden = true;
}

document.querySelectorAll<HTMLButtonElement>('[data-product]').forEach(button => button.addEventListener('click', () => { history.replaceState(null, '', `#/products?product=${button.dataset.product}`); showProduct(button.dataset.product); }));

function conceptAnswer() {
  const input = document.getElementById('demoQuestion') as HTMLInputElement;
  const answer = document.getElementById('demoAnswer')!;
  answer.hidden = false;
  answer.textContent = input.value.trim()
    ? '界面演示：已收到你的问题。这里将呈现场景理解、相关资料与建议行动。当前未接入真实 AI，正式能力与产品版本以发布说明为准。'
    : '先写下一个问题，或选择一个场景入口，即可查看概念回应。';
  if (!input.value.trim()) input.focus();
}
document.getElementById('demoAsk')!.addEventListener('click', conceptAnswer);
document.getElementById('demoQuestion')!.addEventListener('keydown', event => { if (event.key === 'Enter') conceptAnswer(); });

function route() {
  const hash = location.hash;
  if (hash && !hash.startsWith('#/')) return;
  const path = hash.slice(2).split('?')[0] || 'home';
  const name = routes.has(path) ? path : 'home';
  const params = new URLSearchParams(hash.split('?')[1]);
  document.querySelectorAll<HTMLElement>('[data-page]').forEach(page => { page.hidden = page.dataset.page !== name; });
  document.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach(link => {
    const active = link.dataset.route === name || (name === 'downloads' && link.dataset.route === 'products') || (['admin','operations'].includes(name) && link.dataset.route === 'support');
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  document.title = `四川川江科技研究院 · ${pageTitles[name]}`;
  if (name === 'products') showProduct(params.get('product') ?? 'gongge');
  document.querySelectorAll<HTMLElement>('[data-download-product]').forEach(row => row.classList.toggle('highlight', row.dataset.downloadProduct === params.get('product')));
  document.querySelectorAll<HTMLElement>('[data-solution]').forEach(row => row.classList.toggle('highlight', row.dataset.solution === params.get('industry')));
  closeMenu();
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (name !== 'home') stopMic();
}
window.addEventListener('hashchange', route);
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));

const greetings = ['从一件具体的工作开始。', '从一份真实的服务需要开始。', '从每一种成长的可能开始。', '从城市中的一个场景开始。'];
document.querySelectorAll<HTMLButtonElement>('[data-industry]').forEach(button => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.industry);
    const industry = industries[index];
    document.querySelectorAll<HTMLButtonElement>('[data-industry]').forEach(tab => { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    document.getElementById('industryPanel')!.setAttribute('aria-labelledby', button.id);
    setText('industryEnglish', industry.english); setText('industryTitle', industry.title); setText('industryDescription', industry.description);
    setText('sceneProduct', industry.product); setText('sceneGreeting', greetings[index]);
    setLink('industryLink', `#/solutions?industry=${industry.id}`);
    document.getElementById('industryList')!.replaceChildren(...industry.list.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
    signals.fusion = index / 3;
    window.dispatchEvent(new Event('chuanjiang:understood'));
  });
});

function installTabKeys(selector: string, panelSelector: string, prefix: string) {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>(selector)];
  const panel = document.querySelector<HTMLElement>(panelSelector);
  if (!panel) return;
  panel.id ||= `${prefix}-panel`; panel.setAttribute('role', 'tabpanel');
  tabs.forEach((tab, index) => {
    tab.id = `${prefix}-tab-${tab.dataset.product ?? index}`;
    tab.setAttribute('aria-controls', panel.id);
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
    if (tab.tabIndex === 0) panel.setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); tabs[next].focus(); tabs[next].click();
    });
  });
}
installTabKeys('[data-product]', '.product-detail', 'product');
installTabKeys('[data-industry]', '#industryPanel', 'industry');

const intents = [
  { response: '从工格办公出发，探索 AI 与组织协作的融合。', product: 'gongge' },
  { response: '从康小和出发，探索医康养场景中的智慧服务连接。', product: 'kang' },
  { response: '从智小达出发，探索课堂、校园与成长场景中的数智创新。', product: 'zhi' },
];
document.querySelectorAll<HTMLButtonElement>('[data-intent]').forEach(button => button.addEventListener('click', () => {
  const item = intents[Number(button.dataset.intent)];
  document.querySelectorAll<HTMLButtonElement>('[data-intent]').forEach(pill => { const active = pill === button; pill.classList.toggle('active', active); pill.setAttribute('aria-pressed', String(active)); });
  setText('intentResponse', item.response); setLink('intentLink', `#/products?product=${item.product}`);
}));

const film = document.getElementById('filmDialog') as HTMLDialogElement;
const brandFilm = document.getElementById('brandFilm') as HTMLVideoElement;
let filmPrevious: HTMLElement | null = null;
let filmStart: number | null = null;
function filmNotice(message = '') {
  const status = document.getElementById('filmStatus')!;
  status.textContent = message; status.hidden = !message;
}
function playFilm() {
  filmNotice();
  void brandFilm.play().catch(() => {
    if (film.open && !document.hidden) filmNotice('点击播放器中的播放按钮继续观看；也可单独打开视频。');
  });
}
document.querySelectorAll<HTMLButtonElement>('[data-open-film]').forEach(button => button.addEventListener('click', event => {
  filmPrevious = event.currentTarget as HTMLElement;
  stopMic(); film.showModal(); document.body.classList.add('film-open'); playFilm();
}));
document.querySelectorAll<HTMLButtonElement>('[data-film-time]').forEach(button => button.addEventListener('click', () => {
  filmStart = Number(button.dataset.filmTime);
  if (brandFilm.readyState >= 1) { brandFilm.currentTime = filmStart; filmStart = null; }
  playFilm();
}));
brandFilm.addEventListener('loadedmetadata', () => {
  if (filmStart !== null) { brandFilm.currentTime = filmStart; filmStart = null; }
});
brandFilm.addEventListener('error', () => filmNotice('暂时无法播放，请确认已完整解压试看包，并保留“品牌素材”文件夹。'));
document.getElementById('closeFilm')!.addEventListener('click', () => film.close());
document.getElementById('filmMore')!.addEventListener('click', () => film.close());
film.addEventListener('close', () => {
  brandFilm.pause(); filmStart = null; document.body.classList.remove('film-open');
  if (filmPrevious?.getClientRects().length) filmPrevious.focus({ preventScroll: true });
});
film.addEventListener('click', event => { if (event.target === film) { const rect = film.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) film.close(); } });
window.addEventListener('hashchange', () => { if (film.open) film.close(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) brandFilm.pause(); });
window.addEventListener('pagehide', () => brandFilm.pause());
document.getElementById('downloadDemo')!.addEventListener('click', () => setText('downloadStatus', '下载已触发。请在浏览器下载列表中查看“川江产品界面体验包.html”。'));

// Microphone amplitude is an optional enhancement. The self-driven flow remains
// active before, during and after permission denial or microphone shutdown.
const micButton = document.getElementById('micToggle') as HTMLButtonElement;
let stream: MediaStream | undefined;
let audio: AudioContext | undefined;
let micFrame = 0, request = 0;
function stopMic() {
  request++; cancelAnimationFrame(micFrame);
  stream?.getTracks().forEach(track => track.stop()); stream = undefined;
  if (audio) void audio.close(); audio = undefined;
  signals.audio = 0; micButton.disabled = false;
  micButton.setAttribute('aria-pressed', 'false'); micButton.textContent = '声音增强 +';
  setText('motionState', '自驱流动'); setText('micStatus', '无需声音，流线也会持续流动。');
}
micButton.addEventListener('click', async () => {
  if (stream) { stopMic(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { setText('motionState', '自驱流动 · 无麦克风'); setText('micStatus', '浏览器不支持麦克风，流线继续自动流动。'); return; }
  const current = ++request; micButton.disabled = true; setText('motionState', '等待麦克风授权');
  try {
    const input = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    if (current !== request || document.hidden) { input.getTracks().forEach(track => track.stop()); return; }
    stream = input; audio = new AudioContext();
    const analyser = audio.createAnalyser(); analyser.fftSize = 256;
    const silent = audio.createGain(); silent.gain.value = 0;
    audio.createMediaStreamSource(input).connect(analyser); analyser.connect(silent); silent.connect(audio.destination); await audio.resume();
    const data = new Uint8Array(analyser.frequencyBinCount);
    micButton.disabled = false; micButton.setAttribute('aria-pressed', 'true'); micButton.textContent = '停止增强 ■';
    setText('motionState', '自驱 + 声音增强'); setText('micStatus', '仅在本地分析音量，不录音、不上传。');
    const analyse = () => { if (!stream) return; analyser.getByteFrequencyData(data); signals.audio = Math.min(1, data.slice(0,48).reduce((sum, value) => sum + value, 0) / 4800); micFrame = requestAnimationFrame(analyse); };
    analyse();
  } catch {
    if (current !== request) return;
    stopMic(); setText('motionState', '自驱流动 · 声音未启用'); setText('micStatus', '麦克风未启用，流线继续自动流动。');
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopMic(); });
window.addEventListener('pagehide', stopMic);
route();
