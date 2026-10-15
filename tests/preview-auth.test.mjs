import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../deploy/preview-worker.mjs';

const PASSWORD = 'CJ-preview-fixed-2026';
const SECRET = 'test-session-secret-that-is-at-least-32-chars';

function env() {
  return {
    PREVIEW_PASSWORD: PASSWORD,
    SESSION_SECRET: SECRET,
    ASSETS: {
      async fetch(request) {
        const url = new URL(request.url);
        return new Response(`<html><body>${url.pathname}</body></html>`, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      },
    },
  };
}

test('rejects an unauthenticated page request with the password screen', async () => {
  const response = await worker.fetch(new Request('https://preview.example/'), env());
  assert.equal(response.status, 200);
  assert.match(await response.text(), /访问密码/);
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
});

test('rejects an incorrect password without setting a session', async () => {
  const request = new Request('https://preview.example/__preview/login', {
    method: 'POST',
    headers: {
      Origin: 'https://preview.example',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ password: 'wrong-password' }),
  });
  const response = await worker.fetch(request, env());
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('Set-Cookie'), null);
});

test('accepts the fixed password and protects asset access with a session cookie', async () => {
  const request = new Request('https://preview.example/__preview/login', {
    method: 'POST',
    headers: {
      Origin: 'https://preview.example',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ password: PASSWORD, next: '/downloads/demo.zip' }),
  });
  const login = await worker.fetch(request, env());
  assert.equal(login.status, 303);
  assert.match(login.headers.get('Set-Cookie'), /__Host-cj_preview=/);
  assert.equal(login.headers.get('Location'), '/downloads/demo.zip');

  const asset = await worker.fetch(new Request('https://preview.example/downloads/demo.zip', {
    headers: { Cookie: login.headers.get('Set-Cookie').split(';', 1)[0] },
  }), env());
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), '<html><body>/downloads/demo.zip</body></html>');
});

