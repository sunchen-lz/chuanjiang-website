const COOKIE = '__Host-cj_preview';
const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();
const attempts = new Map();

function protectedHeaders(extra = {}) {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    ...extra,
  };
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decode64(value) {
  if (!/^[\w-]+$/.test(value)) throw new Error('Invalid token');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
}

async function sessionKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function passwordMatches(input, expected) {
  const [left, right] = await Promise.all([input, expected].map(s => crypto.subtle.digest('SHA-256', encoder.encode(s))));
  const a = new Uint8Array(left), b = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function makeSession(env) {
  const now = Math.floor(Date.now() / 1000);
  const passwordVersion = base64url(await crypto.subtle.sign('HMAC', await sessionKey(env.SESSION_SECRET), encoder.encode(env.PREVIEW_PASSWORD)));
  const payload = base64url(encoder.encode(JSON.stringify({ iat: now, exp: now + SESSION_SECONDS, v: passwordVersion })));
  const signature = base64url(await crypto.subtle.sign('HMAC', await sessionKey(env.SESSION_SECRET), encoder.encode(payload)));
  return `${payload}.${signature}`;
}

async function validSession(request, env) {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const token = cookie.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
    if (!token || token.length > 1024) return false;
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return false;
    const key = await sessionKey(env.SESSION_SECRET);
    if (!await crypto.subtle.verify('HMAC', key, decode64(signature), encoder.encode(payload))) return false;
    const data = JSON.parse(new TextDecoder().decode(decode64(payload)));
    const now = Math.floor(Date.now() / 1000);
    const version = base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(env.PREVIEW_PASSWORD)));
    return Number.isInteger(data.exp) && Number.isInteger(data.iat) && data.iat <= now + 30 && data.exp > now && data.exp - data.iat <= SESSION_SECONDS && data.v === version;
  } catch { return false; }
}

function loginPage(error = '') {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>客户预览 · 四川川江科技研究院</title><style>
  *{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 70% 80%,#21584b55,transparent 60%),#0a1719;color:#eee7d5;font:14px/1.8 "Microsoft YaHei",sans-serif}main{width:min(100%,440px);padding:42px 36px;border:1px solid #9bc8b42e;border-radius:12px;background:linear-gradient(145deg,#1c3d34a0,#102b2b85);box-shadow:inset 0 1px #d4ead312,0 24px 80px #0003}.brand{color:#a9c5b4;font-size:12px;letter-spacing:.08em}.eyebrow{color:#d8b777;font:10px Consolas,monospace;letter-spacing:.14em;margin:36px 0 10px}h1{font-size:30px;font-weight:500;line-height:1.4;margin:0 0 16px}p{color:#aac4b7;font-size:13px}label{display:block;color:#c7d6cd;font-size:12px;margin:28px 0 8px}input{width:100%;border:1px solid #83baa452;border-radius:5px;background:#081b1a66;color:#eee7d5;padding:13px 14px;font:16px inherit;outline-offset:3px}input:focus-visible{outline:2px solid #a1ddd0}button{width:100%;margin-top:18px;padding:13px;border:1px solid #d8b777;border-radius:5px;background:#d8b777;color:#102b2b;font:14px inherit;cursor:pointer}button:hover{background:#e5ce9d}.error{color:#f1c396;min-height:24px;margin:12px 0 0;font-size:12px}.foot{border-top:1px solid #9bc8b423;margin-top:26px;padding-top:18px;color:#8aaa9f;font-size:11px}@media(max-width:440px){main{padding:32px 24px}h1{font-size:26px}}
  </style></head><body><main><div class="brand">四川川江科技研究院</div><div class="eyebrow">CHUANJIANG / CLIENT PREVIEW / V7</div><h1>懂场景，更懂下一步。</h1><p>欢迎查看川江网站设计演示。</p><form method="post" action="/__preview/login"><label for="password">访问密码</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256" autofocus><input id="next" name="next" type="hidden" value="/"><button type="submit">进入客户预览 ↗</button><p class="error" role="status">${error}</p></form><div class="foot">请使用项目联系人提供的访问密码。</div></main><script>document.getElementById('next').value=location.pathname.startsWith('/__preview/')?'/':location.pathname+location.search+location.hash;</script></body></html>`;
}

function loginResponse(request, status = 200, error = '') {
  return new Response(request.method === 'HEAD' ? null : loginPage(error), {
    status,
    headers: protectedHeaders({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    }),
  });
}

async function readForm(request) {
  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/x-www-form-urlencoded') return null;
  if (Number(request.headers.get('Content-Length')) > 4096) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return new URLSearchParams(new TextDecoder().decode(body));
}

export default {
  async fetch(request, env) {
    if (!env.PREVIEW_PASSWORD || env.PREVIEW_PASSWORD.length < 12 || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
      return new Response('客户预览尚未开放。', { status: 503, headers: protectedHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }) });
    }
    const url = new URL(request.url);
    const sameOrigin = request.headers.get('Origin') === url.origin;
    if (url.pathname === '/__preview/logout' && request.method === 'POST') {
      if (!sameOrigin) return new Response(null, { status: 403, headers: protectedHeaders() });
      return new Response(null, { status: 303, headers: protectedHeaders({ Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` }) });
    }
    if (url.pathname === '/__preview/login' && request.method === 'POST') {
      if (!sameOrigin) return new Response(null, { status: 403, headers: protectedHeaders() });
      const form = await readForm(request);
      if (!form) return new Response(null, { status: 413, headers: protectedHeaders() });
      const input = form.get('password') || '';
      const ip = request.headers.get('CF-Connecting-IP') || 'local';
      const now = Date.now();
      if (attempts.size > 2000) for (const [key, entry] of attempts) if (entry.until < now) attempts.delete(key);
      const record = attempts.get(ip);
      if (record && record.until > now && record.count >= 10) {
        const response = loginResponse(request, 429, '尝试次数较多，请十五分钟后重试。');
        response.headers.set('Retry-After', String(Math.ceil((record.until - now) / 1000)));
        return response;
      }
      if (input.length > 256 || !await passwordMatches(input, env.PREVIEW_PASSWORD)) {
        attempts.set(ip, record && record.until > now ? { ...record, count: record.count + 1 } : { count: 1, until: now + 15 * 60 * 1000 });
        return loginResponse(request, 401, '密码不正确，请重新输入。');
      }
      attempts.delete(ip);
      const next = form.get('next') || '/';
      let target;
      try { target = new URL(next, url.origin); } catch { target = new URL('/', url.origin); }
      if (!next.startsWith('/') || target.origin !== url.origin || target.pathname.startsWith('/__preview/')) target = new URL('/', url.origin);
      const token = await makeSession(env);
      return new Response(null, { status: 303, headers: protectedHeaders({ Location: target.pathname + target.search + target.hash, 'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}` }) });
    }
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: protectedHeaders({ Allow: 'GET, HEAD' }) });
    if (!await validSession(request, env)) {
      if (request.headers.get('Accept')?.includes('text/html') || url.pathname === '/' || url.pathname === '/__preview/login') return loginResponse(request);
      return new Response(request.method === 'HEAD' ? null : '请先输入访问密码。', { status: 401, headers: protectedHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }) });
    }
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    for (const [key, value] of Object.entries(protectedHeaders())) headers.set(key, value);
    return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
  },
};
