// Mock mínimo de Supabase Auth + REST para e2e del flujo invitación/recuperación (sin red, sin proyecto real).
import http from 'node:http';
const PORT = Number(process.argv[2] || 3399);
const USER = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'owner@example.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (aal = 'aal1') => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER.id, aud: 'authenticated', role: 'authenticated', email: USER.email, exp: Math.floor(Date.now() / 1000) + 3600, aal, amr: [{ method: aal === 'aal2' ? 'totp' : 'password', timestamp: Math.floor(Date.now() / 1000) }], session_id: 's1' })}.sig`;
const state = { password: 'Inicial123456', tokens: new Set(), recovers: [], factors: [] };
// MFA TOTP simulado: el código válido es siempre 123456.
const me = () => ({ ...USER, factors: state.factors });
const QR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM10 10h2v2h-2zM14 14h3v3h-3z" fill="#000"/></svg>';
const session = (aal) => { const t = jwt(aal); state.tokens.add(t); return { access_token: t, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r-' + Date.now(), user: me() }; };
const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
http.createServer((req, res) => {
  let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    const u = new URL(req.url, 'http://x'); const body = raw ? JSON.parse(raw) : {};
    const auth = (req.headers.authorization || '').replace(/^Bearer /, '');
    const authed = state.tokens.has(auth);
    if (u.pathname === '/__state') return send(res, 200, { password: state.password, recovers: state.recovers, factors: state.factors.map((f) => f.status) });
    if (u.pathname === '/__reset_mfa') { state.factors = []; return send(res, 200, {}); }
    const fm = u.pathname.match(/^\/auth\/v1\/factors(?:\/([^/]+)(?:\/(challenge|verify))?)?$/);
    if (fm) {
      if (!authed) return send(res, 401, { msg: 'invalid JWT' });
      const [, id, op] = fm;
      if (!id && req.method === 'POST') { const f = { id: 'f-' + Date.now(), friendly_name: body.friendly_name, factor_type: 'totp', status: 'unverified', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; state.factors.push(f); return send(res, 200, { id: f.id, type: 'totp', friendly_name: f.friendly_name, totp: { qr_code: QR, secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/South%20Software:owner@example.com?secret=JBSWY3DPEHPK3PXP' } }); }
      const f = state.factors.find((x) => x.id === id);
      if (!f) return send(res, 404, { msg: 'factor not found' });
      if (req.method === 'DELETE') { state.factors = state.factors.filter((x) => x.id !== id); return send(res, 200, { id }); }
      if (op === 'challenge') return send(res, 200, { id: 'c-' + Date.now(), type: 'totp', expires_at: Math.floor(Date.now() / 1000) + 300 });
      if (op === 'verify') { if (body.code !== '123456') return send(res, 422, { code: 422, error_code: 'mfa_verification_failed', msg: 'Invalid TOTP code entered' }); f.status = 'verified'; return send(res, 200, session('aal2')); }
    }
    if (u.pathname === '/auth/v1/verify' && req.method === 'POST') return body.token_hash === 'valido' ? send(res, 200, session()) : send(res, 403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' });
    if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'password') return body.email === USER.email && body.password === state.password ? send(res, 200, session()) : send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'refresh_token') return send(res, 200, session());
    if (u.pathname === '/auth/v1/user' && req.method === 'GET') return authed ? send(res, 200, me()) : send(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' });
    if (u.pathname === '/auth/v1/user' && req.method === 'PUT') { if (!authed) return send(res, 401, { msg: 'invalid JWT' }); state.password = body.password; return send(res, 200, USER); }
    if (u.pathname === '/auth/v1/recover') { state.recovers.push(body.email); return send(res, 200, {}); }
    if (u.pathname === '/auth/v1/logout') { state.tokens.delete(auth); return send(res, 204); }
    if (u.pathname === '/rest/v1/staff') return authed ? send(res, 200, [{ role: 'owner', display_name: 'Mathias Jara' }]) : send(res, 200, []);
    if (u.pathname.startsWith('/rest/v1/')) return send(res, 200, []);
    if (u.pathname === '/') return send(res, 200, { ok: true });
    send(res, 404, { msg: 'not found' });
  });
}).listen(PORT);
