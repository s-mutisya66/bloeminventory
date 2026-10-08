const auth = require('./_auth');
const db = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!auth.getSession(req)) return res.status(401).json({ error: 'You are signed out. Sign in again.' });

  try {
    const today = db.cleanToday(req.query && req.query.today);
    await db.ensureSchema();
    await db.ensureSeeded(today);
    return res.status(200).json(await db.readState());
  } catch (e) {
    if (e instanceof db.HttpError) return res.status(e.status).json({ error: e.message });
    console.error('state failed:', e);
    return res.status(500).json({ error: 'Could not reach the database. Try again in a moment.' });
  }
};
