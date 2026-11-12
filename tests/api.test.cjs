'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('../src/server');
const { ProviderError } = require('../src/generative');
const { createAnalyzer } = require('../src/generative');

async function running(t, options = {}) {
  const server = createServer(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return `http://127.0.0.1:${server.address().port}`;
}
function post(base, data) { return fetch(`${base}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }

test('POST tradicional devuelve el contrato y no ejecuta el proveedor', async t => {
  const base = await running(t, { generativeAnalyze: () => { throw new Error('No debe llamarse'); } });
  const response = await post(base, { message: 'No puedo iniciar sesión', mode: 'traditional' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.category, 'ACCESS');
  assert.equal(body.priority, 'MEDIUM');
  assert.equal(body.requiresHumanReview, false);
  assert.equal(body.mode, 'traditional');
  assert.equal(Object.keys(body).length, 5);
});

test('POST generativo enruta al motor seleccionado (doble exclusivo de prueba)', async t => {
  const expected = { category: 'FEATURE', priority: 'LOW', response: 'Propuesta recibida para evaluación.', requiresHumanReview: false, mode: 'generative' };
  const base = await running(t, { generativeAnalyze: async text => { assert.equal(text, 'Agregar botón'); return expected; } });
  const response = await post(base, { message: 'Agregar botón', mode: 'generative' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), expected);
});

test('Rechaza tipos, campos extra, modos y mensajes inválidos', async t => {
  const base = await running(t);
  for (const input of [null, [], 1, {}, { message: 'Error', mode: 'otro' }, { message: '', mode: 'traditional' }, { message: '!!!', mode: 'traditional' }, { message: {}, mode: 'traditional' }, { message: 'x'.repeat(5001), mode: 'traditional' }, { message: 'Error', mode: 'traditional', token: 'secret' }]) {
    const response = await post(base, input);
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error.code);
  }
});

test('Maneja JSON roto, tipo de contenido, tamaño y método', async t => {
  const base = await running(t);
  const broken = await fetch(`${base}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(broken.status, 400);
  assert.equal((await broken.json()).error.code, 'INVALID_JSON');
  assert.equal((await fetch(`${base}/api/analyze`, { method: 'POST', body: 'texto' })).status, 415);
  assert.equal((await post(base, { message: 'x'.repeat(33000), mode: 'traditional' })).status, 413);
  const method = await fetch(`${base}/api/analyze`);
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'POST');
});

test('Entrega interfaz, recursos y salud; no expone archivos privados', async t => {
  const base = await running(t);
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /AI Support Engine/);
  assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  for (const route of ['/app.js', '/styles.css', '/api/health']) assert.equal((await fetch(base + route)).status, 200);
  for (const route of ['/.env', '/package.json', '/src/server.js', '/unknown']) assert.equal((await fetch(base + route)).status, 404);
});

test('Propaga fallos controlados del proveedor y oculta errores internos', async t => {
  let failure = new ProviderError('PROVIDER_TIMEOUT', 'Tiempo agotado.', 504);
  const base = await running(t, { generativeAnalyze: async () => { throw failure; } });
  let response = await post(base, { message: 'Error', mode: 'generative' });
  assert.equal(response.status, 504);
  assert.equal((await response.json()).error.code, 'PROVIDER_TIMEOUT');
  failure = new Error('password=secret');
  response = await post(base, { message: 'Error', mode: 'generative' });
  assert.equal(response.status, 500);
  assert.ok(!(await response.text()).includes('secret'));
});

test('Rechaza contratos rotos devueltos por un motor', async t => {
  const base = await running(t, { generativeAnalyze: async () => ({ category: 'BUG' }) });
  const response = await post(base, { message: 'Error', mode: 'generative' });
  assert.equal(response.status, 502);
});

test('La API informa que falta la clave sin exponer configuración al navegador', async t => {
  const base = await running(t, { generativeAnalyze: createAnalyzer({ apiKey: '' }) });
  const response = await post(base, { message: 'Error al guardar', mode: 'generative' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'MISSING_API_KEY');
});

test('La API conserva el error de cuota de Gemini', async t => {
  const base = await running(t, { generativeAnalyze: createAnalyzer({ apiKey: 'clave-ficticia-solo-pruebas', fetchImpl: async () => ({ ok: false, status: 429 }) }) });
  const response = await post(base, { message: 'Error al guardar', mode: 'generative' });
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, 'PROVIDER_RATE_LIMIT');
});
