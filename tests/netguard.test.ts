import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';
import { OutboundRequestError, guardedRequest, isPrivateAddress, resolveTarget } from '../server/netguard.ts';

test('isPrivateAddress rozpoznaje sieci prywatne, lokalne i specjalne', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.10', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255', '::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1']) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '192.167.1.1', '100.63.255.255', '57.128.252.130', '2606:4700:4700::1111', '::ffff:8.8.8.8']) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
  assert.equal(isPrivateAddress('not-an-ip'), true);
});

test('resolveTarget odrzuca nieprawidłowe adresy', async () => {
  await assert.rejects(resolveTarget('ftp://example.com/x'), /HTTP i HTTPS/);
  await assert.rejects(resolveTarget('file:///etc/passwd'), /HTTP i HTTPS/);
  await assert.rejects(resolveTarget('nie-url'), /Nieprawidłowy adres/);
  await assert.rejects(resolveTarget('https://user:pass@example.com/'), /nazwy użytkownika/);
});

test('resolveTarget blokuje adresy prywatne podane wprost i przez DNS', async () => {
  await assert.rejects(resolveTarget('http://127.0.0.1:8080/'), (e: unknown) => e instanceof OutboundRequestError && e.status === 403);
  await assert.rejects(resolveTarget('http://[::1]/'), /sieć prywatną/);
  await assert.rejects(resolveTarget('http://169.254.169.254/latest/meta-data/'), /sieć prywatną/);
  // Nazwa, która rozwiązuje się na adres wewnętrzny
  const internal = async () => [{ address: '10.0.0.5', family: 4 }];
  await assert.rejects(resolveTarget('https://ankiety.example.com/', { lookup: internal }), /sieć prywatną/);
  // Jeden rekord publiczny i jeden prywatny — nadal odmowa
  const mixed = async () => [{ address: '93.184.216.34', family: 4 }, { address: '192.168.0.2', family: 4 }];
  await assert.rejects(resolveTarget('https://ankiety.example.com/', { lookup: mixed }), /sieć prywatną/);
});

test('resolveTarget przepuszcza adresy publiczne i prywatne po jawnym zezwoleniu', async () => {
  const pub = async () => [{ address: '93.184.216.34', family: 4 }];
  const target = await resolveTarget('https://ankiety.example.com/index.php/admin/remotecontrol', { lookup: pub });
  assert.equal(target.address, '93.184.216.34');
  assert.equal(target.family, 4);
  const local = await resolveTarget('http://127.0.0.1:9/', { allowPrivate: true });
  assert.equal(local.address, '127.0.0.1');
});

test('guardedRequest łączy się z przypiętym adresem i nie śledzi przekierowań', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/redirect') {
      res.writeHead(302, { Location: 'http://169.254.169.254/' });
      res.end();
      return;
    }
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ method: req.method, host: req.headers.host, echo: body }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  try {
    await assert.rejects(guardedRequest(`http://127.0.0.1:${port}/`, { method: 'POST', body: '{}' }), /sieć prywatną/);
    const ok = await guardedRequest(`http://127.0.0.1:${port}/x`, { method: 'POST', body: '{"a":1}', headers: { 'Content-Type': 'application/json' } }, { allowPrivate: true });
    assert.equal(ok.status, 200);
    assert.deepEqual(JSON.parse(ok.body), { method: 'POST', host: `127.0.0.1:${port}`, echo: '{"a":1}' });
    const redirect = await guardedRequest(`http://127.0.0.1:${port}/redirect`, { method: 'GET' }, { allowPrivate: true });
    assert.equal(redirect.status, 302, 'przekierowanie wraca do wywołującego, nie jest wykonywane');
    await assert.rejects(guardedRequest(`http://127.0.0.1:${port}/x`, { method: 'POST', body: 'x'.repeat(50), maxBytes: 10 }, { allowPrivate: true }), /zbyt duża/);
  } finally {
    server.close();
  }
});
