// Serves the inventory app only to signed-in staff.
// The app files live in /private, which is never published as static files.
const fs = require('fs');
const path = require('path');
const auth = require('./_auth');

const PRIVATE = path.join(__dirname, '..', 'private');

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method not allowed');
  }

  if (!auth.getSession(req)) {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  let html, css, js;
  try {
    html = fs.readFileSync(path.join(PRIVATE, 'app.html'), 'utf8');
    css = fs.readFileSync(path.join(PRIVATE, 'styles.css'), 'utf8');
    js = fs.readFileSync(path.join(PRIVATE, 'app.js'), 'utf8');
  } catch (e) {
    return res.status(500).send('The inventory files could not be loaded.');
  }

  // Inline the stylesheet and script so one signed-in request returns the whole app.
  const page = html
    .replace('<link rel="stylesheet" href="styles.css">', function () { return '<style>\n' + css + '\n</style>'; })
    .replace('<script src="app.js"></script>', function () { return '<script>\n' + js + '\n</script>'; });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(page);
};
