const auth = require('./_auth');

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!auth.sameOrigin(req)) return res.status(403).json({ error: 'Request blocked.' });
  auth.setSessionCookie(res, '', 0);
  return res.status(200).json({ ok: true });
};
