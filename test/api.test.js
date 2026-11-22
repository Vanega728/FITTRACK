const assert = require('node:assert/strict');
const test = require('node:test');
const handler = require('../api/[...path].js');
const { __test } = handler;

process.env[['SESSION', 'SECRET'].join('_')] = 'unit-test'.repeat(6);

test('signed sessions round-trip and reject tampering', () => {
  const session = { user: { id: 7 }, csrf: 'token', expiresAt: Date.now() + 10000 };
  const token = __test.encodeSession(session);
  assert.deepEqual(__test.decodeSession(token), session);
  assert.equal(__test.decodeSession(`${token.slice(0, -1)}x`), null);
});

test('record validation normalizes optional values and local datetimes', () => {
  const parsed = __test.parseRecord({
    fields: {
      tipo: ['text', true, 80],
      duracion_min: ['integer', true],
      distancia_km: ['decimal', false],
      realizada_en: ['datetime', true],
      intensidad: ['choice', true, ['Baja', 'Media', 'Alta']],
    },
  }, {
    tipo: ' Bicicleta ',
    duracion_min: '25',
    distancia_km: '',
    realizada_en: '2026-11-22T09:30',
    intensidad: 'Media',
  });
  assert.deepEqual(parsed, {
    tipo: 'Bicicleta',
    duracion_min: 25,
    distancia_km: 0,
    realizada_en: '2026-11-22 09:30:00',
    intensidad: 'Media',
  });
});

test('record validation rejects unsupported select values', () => {
  assert.throws(() => __test.parseRecord({
    fields: { intensidad: ['choice', true, ['Baja', 'Media', 'Alta']] },
  }, { intensidad: 'Máxima' }), { status: 400 });
});

test('CSV output quotes delimiters and neutralizes formula-like text', () => {
  const csv = __test.makeCsv([{ tipo: 'Correr; hoy', realizada_en: '=1+1' }]);
  assert.match(csv, /"Correr; hoy"/);
  assert.match(csv, /"'=1\+1"/);
  assert.ok(csv.startsWith('\uFEFF'));
});

test('session endpoint issues a signed session and CSRF token without a database call', async () => {
  const headers = {};
  const response = {
    statusCode: 0,
    setHeader(name, value) { headers[name] = value; },
    end(value) { this.body = value; },
  };
  await handler({ method: 'GET', url: '/api/session', headers: {} }, response);
  assert.equal(response.statusCode, 200);
  assert.ok(JSON.parse(response.body).csrfToken);
  assert.match(headers['Set-Cookie'], /HttpOnly/);
  assert.match(headers['Set-Cookie'], /SameSite=Lax/);
});
