const auth = require('./_auth');

function readBody(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  if (typeof b === 'string') { try { return JSON.parse(b); } catch (e) { return {}; } }
  return {};
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!auth.sameOrigin(req)) return res.status(403).json({ error: 'Request blocked.' });
  if (!auth.isConfigured()) {
    return res.status(500).json({ error: 'Sign-in is not set up yet. Add SHOP_USER, SHOP_PASSWORD and SESSION_SECRET in your Vercel project settings, then redeploy.' });
  }

  const body = readBody(req);
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password || username.length > 200 || password.length > 200) {
    return res.status(400).json({ error: 'Enter your username and password.' });
  }

  // Check both values every time so the response time does not reveal which one was wrong.
  const userOk = auth.safeEqual(username.toLowerCase(), process.env.SHOP_USER.trim().toLowerCase());
  const passOk = auth.safeEqual(password, process.env.SHOP_PASSWORD);
  if (!(userOk && passOk)) {
    await new Promise(function (r) { setTimeout(r, 800); }); // slows down password guessing
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  const exp = Math.floor(Date.now() / 1000) + auth.SESSION_SECONDS;
  auth.setSessionCookie(res, auth.sign({ u: username.toLowerCase(), exp: exp }), auth.SESSION_SECONDS);
  return res.status(200).json({ ok: true });
};
