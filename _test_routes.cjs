const app = require('./app.js');
const http = require('http');
const querystring = require('querystring');

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log('Server started on port', port);

  const makeReq = (path, method, headers, body) => new Promise((res) => {
    const opts = { host: '127.0.0.1', port, path, method, headers: headers || {} };
    const r = http.request(opts, (response) => {
      let data = '';
      response.on('data', (c) => data += c);
      response.on('end', () => res({ status: response.statusCode, headers: response.headers, body: data.slice(0, 800) }));
    });
    r.on('error', (e) => res({ status: 0, error: e.message }));
    if (body) r.write(body);
    r.end();
  });

  // Step 1: Get CSRF token from login page
  let res = await makeReq('/login', 'GET', {});
  const csrfCookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('ss_csrf='));
  const csrfToken = csrfCookie ? csrfCookie.split(';')[0].split('=')[1] : '';
  console.log('CSRF token:', csrfToken);

  // Step 2: Create a test user and log in
  const testEmail = 'testuser' + Date.now() + '@example.com';
  const testPassword = 'TestPass123';
  
  // We need to use the models to create a user
  const models = require('./models');
  const tokenService = require('./services/tokenService');
  
  const hashedPassword = await tokenService.hashPassword(testPassword);
  const user = await models.User.create({ 
    fullName: 'Test User', 
    email: testEmail, 
    password: hashedPassword, 
    role: 'INVENTORY_MANAGER', 
    isActive: true 
  });
  console.log('Created test user:', user.id);

  // Step 3: Log in
  const loginBody = querystring.stringify({ email: testEmail, password: testPassword, _csrf: csrfToken });
  res = await makeReq('/login', 'POST', { 
    'Content-Type': 'application/x-www-form-urlencoded', 
    'Content-Length': Buffer.byteLength(loginBody),
    Cookie: 'ss_csrf=' + csrfToken 
  }, loginBody);
  
  const authCookies = (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
  console.log('Login status:', res.status, 'location:', res.headers.location);

  if (res.status !== 302 || !res.headers.location?.includes('/dashboard')) {
    console.log('LOGIN FAILED');
    await models.User.destroy({ where: { id: user.id } });
    process.exit(1);
  }

  // Step 4: Test authenticated routes
  const jar = authCookies + '; ss_csrf=' + csrfToken;
  const routes = [
    '/dashboard',
    '/products',
    '/warehouses',
    '/inventory',
    '/move-history',
    '/operations/receipts',
    '/operations/deliveries',
    '/operations/transfers',
    '/operations/adjustments',
    '/settings',
  ];

  for (const p of routes) {
    const r = await makeReq(p, 'GET', { Cookie: jar });
    const label = r.status === 200 ? 'OK' : 'FAIL (' + r.status + ')';
    console.log(label + ' ' + p);
    if (r.status !== 200) {
      if (r.body) {
        const preview = r.body.slice(0, 500).replace(/\n/g, ' ').replace(/\s+/g, ' ');
        console.log('  body:', preview);
      }
      if (r.error) {
        console.log('  error:', r.error);
      }
    }
  }

  // Cleanup
  await models.User.destroy({ where: { id: user.id } });
  console.log('Cleaned up test user');

  server.close();
  console.log('Test complete');
  process.exit(0);
});