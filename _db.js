// Database helpers (Neon Postgres). Files that start with an underscore are not public URLs.
const { neon } = require('@neondatabase/serverless');

const CATS = ['Cut flowers', 'Foliage', 'Potted', 'Supplies'];

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

let client = null;
let schemaPromise = null;

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new HttpError(500, 'The database is not connected yet. Add DATABASE_URL in your Vercel project settings, then redeploy.');
  if (!client) client = neon(url);
  return client;
}

async function createSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS items (
    id serial PRIMARY KEY,
    name text NOT NULL,
    cat text NOT NULL,
    unit text NOT NULL,
    stock integer NOT NULL CHECK (stock >= 0),
    reorder integer NOT NULL CHECK (reorder >= 0),
    cost integer NOT NULL CHECK (cost >= 0),
    price integer NOT NULL CHECK (price >= 0),
    shelf integer CHECK (shelf IS NULL OR (shelf >= 1 AND shelf <= 90)),
    received date NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS activity (
    id serial PRIMARY KEY,
    logged_at timestamptz NOT NULL DEFAULT now(),
    message text NOT NULL,
    kind text NOT NULL,
    amount bigint NOT NULL DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS meta (
    key text PRIMARY KEY,
    value text NOT NULL
  )`;
}

// Creates the tables once per server instance. Safe to run again.
function ensureSchema() {
  const sql = getSql();
  if (!schemaPromise) {
    schemaPromise = createSchema(sql).catch(async function () {
      await new Promise(function (r) { setTimeout(r, 250); });
      await createSchema(sql); // two cold starts can collide on first run; one retry is enough
    }).catch(function (e) { schemaPromise = null; throw e; });
  }
  return schemaPromise;
}

/* ---------- validation ---------- */
function isDateString(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const p = s.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
}
function dayNumber(s) { const p = s.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]) / 864e5; }

// The browser sends its local date. Accept it only if it is within two days of the server date.
function cleanToday(s) {
  if (!isDateString(s)) throw new HttpError(400, 'Your device date could not be read. Refresh the page.');
  const server = Math.floor(Date.now() / 864e5);
  if (Math.abs(dayNumber(s) - server) > 2) throw new HttpError(400, 'Your device date looks wrong. Check the date and time on this device.');
  return s;
}
function cleanInt(v, min, max, label) {
  const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, label + ' must be a whole number from ' + min + ' to ' + max + '.');
  return n;
}
function cleanText(v, max, label) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) throw new HttpError(400, label + ' is required.');
  if (s.length > max) throw new HttpError(400, label + ' must be ' + max + ' characters or fewer.');
  return s;
}
function cleanItem(o, today) {
  if (!o || typeof o !== 'object') throw new HttpError(400, 'Item details are missing.');
  if (CATS.indexOf(o.cat) === -1) throw new HttpError(400, 'Choose a category.');
  const shelf = o.shelf === null || o.shelf === '' || o.shelf === undefined ? null : cleanInt(o.shelf, 1, 90, 'Fresh for');
  if (!isDateString(o.received)) throw new HttpError(400, 'Received date is not valid.');
  if (dayNumber(o.received) > dayNumber(today)) throw new HttpError(400, 'Received date cannot be in the future.');
  return {
    name: cleanText(o.name, 60, 'Name'),
    cat: o.cat,
    unit: cleanText(o.unit, 12, 'Unit'),
    stock: cleanInt(o.stock, 0, 1000000, 'In stock'),
    reorder: cleanInt(o.reorder, 0, 1000000, 'Reorder at'),
    cost: cleanInt(o.cost, 0, 10000000, 'Cost'),
    price: cleanInt(o.price === '' || o.price === undefined || o.price === null ? 0 : o.price, 0, 10000000, 'Price'),
    shelf: shelf,
    received: o.received
  };
}

/* ---------- reading ---------- */
async function readState() {
  const sql = getSql();
  const [items, log] = await Promise.all([
    sql`SELECT id, name, cat, unit, stock, reorder, cost, price, shelf,
               to_char(received, 'YYYY-MM-DD') AS received
        FROM items ORDER BY id`,
    sql`SELECT floor(extract(epoch FROM logged_at) * 1000)::float8 AS t,
               message AS text, kind, amount
        FROM activity ORDER BY logged_at DESC, id DESC LIMIT 300`
  ]);
  return {
    items: items.map(function (r) {
      return { id: Number(r.id), name: r.name, cat: r.cat, unit: r.unit, stock: Number(r.stock), reorder: Number(r.reorder),
        cost: Number(r.cost), price: Number(r.price), shelf: r.shelf === null ? null : Number(r.shelf), received: String(r.received) };
    }),
    log: log.map(function (r) { return { t: Number(r.t), text: r.text, kind: r.kind, amount: Number(r.amount) }; })
  };
}

/* ---------- demo data (first run only) ---------- */
const SEED_ITEMS = [
  { name: 'Red Naomi roses', cat: 'Cut flowers', unit: 'stem', stock: 120, reorder: 60, cost: 60, price: 200, shelf: 8, age: 2 },
  { name: 'Spray roses, white', cat: 'Cut flowers', unit: 'bunch', stock: 14, reorder: 8, cost: 550, price: 1200, shelf: 7, age: 3 },
  { name: 'Peony Sarah Bernhardt', cat: 'Cut flowers', unit: 'stem', stock: 18, reorder: 24, cost: 250, price: 700, shelf: 6, age: 4 },
  { name: 'Ranunculus mix', cat: 'Cut flowers', unit: 'bunch', stock: 9, reorder: 6, cost: 650, price: 1500, shelf: 6, age: 1 },
  { name: 'Lisianthus lavender', cat: 'Cut flowers', unit: 'stem', stock: 64, reorder: 40, cost: 80, price: 250, shelf: 10, age: 5 },
  { name: 'Gerbera daisies', cat: 'Cut flowers', unit: 'stem', stock: 45, reorder: 30, cost: 45, price: 150, shelf: 7, age: 6 },
  { name: 'Tulips Strong Gold', cat: 'Cut flowers', unit: 'bunch', stock: 5, reorder: 8, cost: 450, price: 1000, shelf: 5, age: 2 },
  { name: 'Stargazer lilies', cat: 'Cut flowers', unit: 'stem', stock: 0, reorder: 20, cost: 120, price: 400, shelf: 8, age: 9 },
  { name: 'Sunflowers', cat: 'Cut flowers', unit: 'stem', stock: 30, reorder: 20, cost: 65, price: 200, shelf: 7, age: 8 },
  { name: 'Eucalyptus cinerea', cat: 'Foliage', unit: 'bunch', stock: 22, reorder: 10, cost: 400, price: 850, shelf: 14, age: 3 },
  { name: 'Ruscus', cat: 'Foliage', unit: 'bunch', stock: 12, reorder: 8, cost: 300, price: 700, shelf: 14, age: 3 },
  { name: 'Phalaenopsis orchid, white', cat: 'Potted', unit: 'pot', stock: 11, reorder: 6, cost: 1200, price: 3200, shelf: null, age: 0 },
  { name: 'Succulent trio', cat: 'Potted', unit: 'pot', stock: 17, reorder: 10, cost: 600, price: 1500, shelf: null, age: 0 },
  { name: 'Kraft wrap paper', cat: 'Supplies', unit: 'roll', stock: 6, reorder: 4, cost: 950, price: 0, shelf: null, age: 0 },
  { name: 'Floral foam bricks', cat: 'Supplies', unit: 'pack', stock: 3, reorder: 5, cost: 800, price: 0, shelf: null, age: 0 },
  { name: 'Satin ribbon 25 mm', cat: 'Supplies', unit: 'roll', stock: 9, reorder: 4, cost: 420, price: 0, shelf: null, age: 0 },
  { name: 'Glass cylinder vase 20 cm', cat: 'Supplies', unit: 'piece', stock: 24, reorder: 10, cost: 350, price: 1000, shelf: null, age: 0 }
];
const SEED_LOG = [
  { mins: 1560, msg: 'Received 120 × Red Naomi roses', kind: 'restock', amount: 0 },
  { mins: 1500, msg: 'Received 22 × Eucalyptus cinerea', kind: 'restock', amount: 0 },
  { mins: 180, msg: 'Sold 2 × Phalaenopsis orchid, white', kind: 'sale', amount: 6400 },
  { mins: 120, msg: 'Sold 12 × Red Naomi roses', kind: 'sale', amount: 2400 },
  { mins: 60, msg: 'Sold 1 × Ranunculus mix', kind: 'sale', amount: 1500 }
];

// Loads the demo stock the first time anyone opens the app. Only one request can win the claim.
async function ensureSeeded(today) {
  const sql = getSql();
  const claim = await sql`INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT (key) DO NOTHING RETURNING key`;
  if (!claim.length) return;
  try {
    await sql`INSERT INTO items (name, cat, unit, stock, reorder, cost, price, shelf, received)
      SELECT x.name, x.cat, x.unit, x.stock, x.reorder, x.cost, x.price, x.shelf, (${today}::date - x.age)
      FROM jsonb_to_recordset(${JSON.stringify(SEED_ITEMS)}::jsonb)
        AS x(name text, cat text, unit text, stock int, reorder int, cost int, price int, shelf int, age int)`;
    await sql`INSERT INTO activity (logged_at, message, kind, amount)
      SELECT now() - make_interval(mins => x.mins), x.msg, x.kind, x.amount
      FROM jsonb_to_recordset(${JSON.stringify(SEED_LOG)}::jsonb)
        AS x(mins int, msg text, kind text, amount int)`;
  } catch (e) {
    await sql`DELETE FROM meta WHERE key = 'seeded'`;
    throw e;
  }
}

async function resetToDemo(today) {
  const sql = getSql();
  await sql`TRUNCATE items, activity RESTART IDENTITY`;
  await sql`DELETE FROM meta WHERE key = 'seeded'`;
  await ensureSeeded(today);
}

module.exports = { HttpError, getSql, ensureSchema, ensureSeeded, resetToDemo, readState, cleanToday, cleanInt, cleanItem };
