// Every change to stock goes through here: sell, restock, add, edit, delete, reset.
// Each change is one SQL statement, so stock and the activity log can never disagree,
// and two people selling at once cannot push stock below zero.
const auth = require('./_auth');
const db = require('./_db');

function body(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  if (typeof b === 'string') { try { return JSON.parse(b); } catch (e) { return {}; } }
  return {};
}

async function missingReason(sql, id) {
  const rows = await sql`SELECT stock, unit FROM items WHERE id = ${id}`;
  if (!rows.length) return new db.HttpError(404, 'That item no longer exists. Refresh the page.');
  return new db.HttpError(409, 'Only ' + rows[0].stock + ' ' + rows[0].unit + ' in stock.');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!auth.sameOrigin(req, true)) return res.status(403).json({ error: 'Request blocked.' });
  if (!auth.getSession(req)) return res.status(401).json({ error: 'You are signed out. Sign in again.' });

  try {
    const b = body(req);
    const op = b.op;
    const today = db.cleanToday(b.today);
    await db.ensureSchema();
    await db.ensureSeeded(today);
    const sql = db.getSql();

    if (op === 'sell') {
      const id = db.cleanInt(b.id, 1, 2147483647, 'Item');
      const qty = db.cleanInt(b.qty, 1, 100000, 'Quantity');
      const done = await sql`
        WITH u AS (
          UPDATE items SET stock = stock - ${qty}
          WHERE id = ${id} AND stock >= ${qty}
          RETURNING name, price
        )
        INSERT INTO activity (message, kind, amount)
        SELECT CASE WHEN price > 0 THEN 'Sold ' ELSE 'Used ' END || ${String(qty)} || ' × ' || name,
               CASE WHEN price > 0 THEN 'sale' ELSE 'use' END,
               price::bigint * ${qty}
        FROM u RETURNING id`;
      if (!done.length) throw await missingReason(sql, id);

    } else if (op === 'restock') {
      const id = db.cleanInt(b.id, 1, 2147483647, 'Item');
      const qty = db.cleanInt(b.qty, 1, 100000, 'Quantity');
      const done = await sql`
        WITH u AS (
          UPDATE items
          SET received = CASE WHEN stock <= 0 AND shelf IS NOT NULL THEN ${today}::date ELSE received END,
              stock = stock + ${qty}
          WHERE id = ${id}
          RETURNING name
        )
        INSERT INTO activity (message, kind, amount)
        SELECT 'Received ' || ${String(qty)} || ' × ' || name, 'restock', 0
        FROM u RETURNING id`;
      if (!done.length) throw new db.HttpError(404, 'That item no longer exists. Refresh the page.');

    } else if (op === 'add') {
      const it = db.cleanItem(b.item, today);
      await sql`
        WITH n AS (
          INSERT INTO items (name, cat, unit, stock, reorder, cost, price, shelf, received)
          VALUES (${it.name}, ${it.cat}, ${it.unit}, ${it.stock}, ${it.reorder}, ${it.cost}, ${it.price}, ${it.shelf}, ${it.received}::date)
          RETURNING name
        )
        INSERT INTO activity (message, kind, amount)
        SELECT 'Added new item ' || name, 'info', 0 FROM n RETURNING id`;

    } else if (op === 'edit') {
      const id = db.cleanInt(b.id, 1, 2147483647, 'Item');
      const it = db.cleanItem(b.item, today);
      const done = await sql`
        WITH u AS (
          UPDATE items
          SET name = ${it.name}, cat = ${it.cat}, unit = ${it.unit}, stock = ${it.stock}, reorder = ${it.reorder},
              cost = ${it.cost}, price = ${it.price}, shelf = ${it.shelf}, received = ${it.received}::date
          WHERE id = ${id}
          RETURNING name
        )
        INSERT INTO activity (message, kind, amount)
        SELECT 'Updated ' || name, 'info', 0 FROM u RETURNING id`;
      if (!done.length) throw new db.HttpError(404, 'That item no longer exists. Refresh the page.');

    } else if (op === 'delete') {
      const id = db.cleanInt(b.id, 1, 2147483647, 'Item');
      const done = await sql`
        WITH d AS (DELETE FROM items WHERE id = ${id} RETURNING name)
        INSERT INTO activity (message, kind, amount)
        SELECT 'Removed ' || name, 'info', 0 FROM d RETURNING id`;
      if (!done.length) throw new db.HttpError(404, 'That item no longer exists. Refresh the page.');

    } else if (op === 'reset') {
      await db.resetToDemo(today);

    } else {
      throw new db.HttpError(400, 'Unknown action.');
    }

    return res.status(200).json(await db.readState());
  } catch (e) {
    if (e instanceof db.HttpError) return res.status(e.status).json({ error: e.message });
    console.error('action failed:', e);
    return res.status(500).json({ error: 'Could not save to the database. Try again in a moment.' });
  }
};
