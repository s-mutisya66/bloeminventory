(function () {
  var KEY = 'bloem-co-demo-v1';
  var CATS = ['Cut flowers', 'Foliage', 'Potted', 'Supplies'];
  var nf = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 });
  var money = { format: function (n) { return 'KSh ' + nf.format(n); } };

  function $(s) { return document.querySelector(s); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function daysAgoISO(n) { var d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parseISO(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function daysSince(s) { return Math.round((startOfDay(new Date()) - parseISO(s)) / 864e5); }
  function sameDay(a, b) { return startOfDay(a).getTime() === startOfDay(b).getTime(); }

  /* ---------- data ---------- */
  function seed() {
    var t = Date.now();
    var items = [
      { id: 1, name: 'Red Naomi roses', cat: 'Cut flowers', unit: 'stem', stock: 120, reorder: 60, cost: 60, price: 200, shelf: 8, received: daysAgoISO(2) },
      { id: 2, name: 'Spray roses, white', cat: 'Cut flowers', unit: 'bunch', stock: 14, reorder: 8, cost: 550, price: 1200, shelf: 7, received: daysAgoISO(3) },
      { id: 3, name: 'Peony Sarah Bernhardt', cat: 'Cut flowers', unit: 'stem', stock: 18, reorder: 24, cost: 250, price: 700, shelf: 6, received: daysAgoISO(4) },
      { id: 4, name: 'Ranunculus mix', cat: 'Cut flowers', unit: 'bunch', stock: 9, reorder: 6, cost: 650, price: 1500, shelf: 6, received: daysAgoISO(1) },
      { id: 5, name: 'Lisianthus lavender', cat: 'Cut flowers', unit: 'stem', stock: 64, reorder: 40, cost: 80, price: 250, shelf: 10, received: daysAgoISO(5) },
      { id: 6, name: 'Gerbera daisies', cat: 'Cut flowers', unit: 'stem', stock: 45, reorder: 30, cost: 45, price: 150, shelf: 7, received: daysAgoISO(6) },
      { id: 7, name: 'Tulips Strong Gold', cat: 'Cut flowers', unit: 'bunch', stock: 5, reorder: 8, cost: 450, price: 1000, shelf: 5, received: daysAgoISO(2) },
      { id: 8, name: 'Stargazer lilies', cat: 'Cut flowers', unit: 'stem', stock: 0, reorder: 20, cost: 120, price: 400, shelf: 8, received: daysAgoISO(9) },
      { id: 9, name: 'Sunflowers', cat: 'Cut flowers', unit: 'stem', stock: 30, reorder: 20, cost: 65, price: 200, shelf: 7, received: daysAgoISO(8) },
      { id: 10, name: 'Eucalyptus cinerea', cat: 'Foliage', unit: 'bunch', stock: 22, reorder: 10, cost: 400, price: 850, shelf: 14, received: daysAgoISO(3) },
      { id: 11, name: 'Ruscus', cat: 'Foliage', unit: 'bunch', stock: 12, reorder: 8, cost: 300, price: 700, shelf: 14, received: daysAgoISO(3) },
      { id: 12, name: 'Phalaenopsis orchid, white', cat: 'Potted', unit: 'pot', stock: 11, reorder: 6, cost: 1200, price: 3200, shelf: null, received: isoDate(new Date()) },
      { id: 13, name: 'Succulent trio', cat: 'Potted', unit: 'pot', stock: 17, reorder: 10, cost: 600, price: 1500, shelf: null, received: isoDate(new Date()) },
      { id: 14, name: 'Kraft wrap paper', cat: 'Supplies', unit: 'roll', stock: 6, reorder: 4, cost: 950, price: 0, shelf: null, received: isoDate(new Date()) },
      { id: 15, name: 'Floral foam bricks', cat: 'Supplies', unit: 'pack', stock: 3, reorder: 5, cost: 800, price: 0, shelf: null, received: isoDate(new Date()) },
      { id: 16, name: 'Satin ribbon 25 mm', cat: 'Supplies', unit: 'roll', stock: 9, reorder: 4, cost: 420, price: 0, shelf: null, received: isoDate(new Date()) },
      { id: 17, name: 'Glass cylinder vase 20 cm', cat: 'Supplies', unit: 'piece', stock: 24, reorder: 10, cost: 350, price: 1000, shelf: null, received: isoDate(new Date()) }
    ];
    var log = [
      { t: t - 26 * 3600e3, text: 'Received 120 × Red Naomi roses', kind: 'restock', amount: 0 },
      { t: t - 25 * 3600e3, text: 'Received 22 × Eucalyptus cinerea', kind: 'restock', amount: 0 },
      { t: t - 3 * 3600e3, text: 'Sold 2 × Phalaenopsis orchid, white', kind: 'sale', amount: 6400 },
      { t: t - 2 * 3600e3, text: 'Sold 12 × Red Naomi roses', kind: 'sale', amount: 2400 },
      { t: t - 1 * 3600e3, text: 'Sold 1 × Ranunculus mix', kind: 'sale', amount: 1500 }
    ];
    return { items: items, log: log, nextId: 18 };
  }

  function valid(s) {
    if (!s || !Array.isArray(s.items) || !Array.isArray(s.log) || typeof s.nextId !== 'number') return false;
    return s.items.every(function (i) {
      return i && typeof i.id === 'number' && typeof i.name === 'string' && CATS.indexOf(i.cat) > -1 &&
        typeof i.unit === 'string' && typeof i.stock === 'number' && typeof i.reorder === 'number' &&
        typeof i.cost === 'number' && typeof i.price === 'number' &&
        (i.shelf === null || typeof i.shelf === 'number') && typeof i.received === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(i.received);
    }) && s.log.every(function (l) { return l && typeof l.t === 'number' && typeof l.text === 'string'; });
  }

  var state;
  try {
    var raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : null;
  } catch (e) { state = null; }
  if (!valid(state)) state = seed();

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }

  var ui = { q: '', cat: 'all', view: 'all', sortKey: 'default', sortDir: 'asc' };

  /* ---------- derived values ---------- */
  function derive(it) {
    var left = it.shelf === null ? null : it.shelf - daysSince(it.received);
    var level = it.stock <= 0 ? 'out' : (it.stock <= it.reorder ? 'low' : 'ok');
    var fresh = 'na';
    if (left !== null && it.stock > 0) fresh = left < 0 ? 'past' : (left <= 2 ? 'soon' : 'ok');
    return { left: left, level: level, fresh: fresh };
  }
  function suggest(it) { return Math.max(it.reorder * 2 - it.stock, 1); }

  function addLog(text, kind, amount) {
    state.log.unshift({ t: Date.now(), text: text, kind: kind || 'info', amount: amount || 0 });
    if (state.log.length > 60) state.log.length = 60;
  }
  function when(ms) {
    var d = new Date(ms), now = new Date();
    var time = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (sameDay(d, now)) return 'Today ' + time;
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (sameDay(d, y)) return 'Yesterday ' + time;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + time;
  }

  /* ---------- rendering ---------- */
  function renderStats() {
    var value = 0, reorder = 0, out = 0, useFirst = 0;
    state.items.forEach(function (it) {
      var d = derive(it);
      value += it.stock * it.cost;
      if (d.level !== 'ok') reorder++;
      if (d.level === 'out') out++;
      if (d.fresh === 'past' || d.fresh === 'soon') useFirst++;
    });
    var now = new Date(), sales = 0, count = 0;
    state.log.forEach(function (l) {
      if (l.kind === 'sale' && sameDay(new Date(l.t), now)) { sales += l.amount; count++; }
    });
    $('#stats').innerHTML =
      statCell('Stock value at cost', money.format(value), state.items.length + ' items tracked', false) +
      statCell('Needs reorder', String(reorder), out + ' out of stock', reorder > 0) +
      statCell('Use first', String(useFirst), 'Fresh for 2 days or less', useFirst > 0) +
      statCell('Sales today', money.format(sales), count + (count === 1 ? ' sale' : ' sales') + ' recorded', false);
  }
  function statCell(label, value, sub, attn) {
    return '<div class="stat"><span class="stat-label">' + label + '</span><span class="stat-value' + (attn ? ' attn' : '') + '">' +
      value + '</span><span class="stat-sub">' + sub + '</span></div>';
  }

  function filtered() {
    var q = ui.q.trim().toLowerCase();
    var list = state.items.filter(function (it) {
      var d = derive(it);
      if (q && it.name.toLowerCase().indexOf(q) === -1) return false;
      if (ui.cat !== 'all' && it.cat !== ui.cat) return false;
      if (ui.view === 'reorder' && d.level === 'ok') return false;
      if (ui.view === 'usefirst' && !(d.fresh === 'past' || d.fresh === 'soon')) return false;
      return true;
    });
    var dir = ui.sortDir === 'asc' ? 1 : -1;
    list.sort(function (a, b) {
      var r;
      if (ui.sortKey === 'name') r = a.name.localeCompare(b.name) * dir;
      else if (ui.sortKey === 'stock') r = (a.stock - b.stock) * dir;
      else if (ui.sortKey === 'fresh') {
        var da = derive(a), db = derive(b);
        var fa = da.left === null || a.stock <= 0 ? Infinity : da.left;
        var fb = db.left === null || b.stock <= 0 ? Infinity : db.left;
        if (fa === fb) r = a.name.localeCompare(b.name);
        else r = (fa < fb ? -1 : 1) * dir;
      } else {
        r = CATS.indexOf(a.cat) - CATS.indexOf(b.cat) || a.name.localeCompare(b.name);
      }
      return r;
    });
    return list;
  }

  function rowHTML(it) {
    var d = derive(it);
    var pct = Math.max(0, Math.min(1, it.stock / Math.max(1, it.reorder * 2))) * 100;
    var status = d.level === 'out' ? '<span class="pill crit">Out of stock</span>'
      : d.level === 'low' ? '<span class="pill warn">Low</span>'
      : '<span class="pill good">In stock</span>';
    var fresh = '<span class="muted">—</span>';
    if (d.left !== null && it.stock > 0) {
      var age = daysSince(it.received);
      var recv = '<span class="sub">' + (age <= 0 ? 'Received today' : 'Received ' + age + ' d ago') + '</span>';
      if (d.fresh === 'past') fresh = '<span class="pill crit">Past sell-by</span><span class="sub">' + (-d.left) + ' d over</span>';
      else if (d.fresh === 'soon') fresh = '<span class="pill warn">' + (d.left === 0 ? 'Last day' : d.left + ' d left') + '</span>' + recv;
      else fresh = '<span class="num">' + d.left + ' d left</span>' + recv;
    }
    var price = it.price > 0 ? '<span class="num">' + money.format(it.price) + '</span>' : '<span class="muted">Not sold</span>';
    var act = it.price > 0 ? 'Sell' : 'Use';
    return '<tr data-id="' + it.id + '">' +
      '<td><span class="item-name">' + esc(it.name) + '</span><span class="sub">' + esc(it.cat) + '</span></td>' +
      '<td><span class="stock-num num">' + it.stock + '</span> <span class="unit">' + esc(it.unit) + '</span>' +
      '<div class="meter"><i class="lvl-' + d.level + '" style="width:' + pct + '%"></i></div>' +
      '<span class="sub">Reorder at ' + it.reorder + '</span></td>' +
      '<td>' + status + '</td>' +
      '<td>' + fresh + '</td>' +
      '<td>' + price + '<span class="sub num">cost ' + money.format(it.cost) + '</span></td>' +
      '<td><div class="actions">' +
      '<button type="button" class="btn btn-sm" data-act="sell"' + (it.stock <= 0 ? ' disabled' : '') + '>' + act + '</button>' +
      '<button type="button" class="btn btn-sm" data-act="restock">Restock</button>' +
      '<button type="button" class="btn btn-sm" data-act="edit">Edit</button>' +
      '</div></td></tr>';
  }

  function renderTable() {
    var list = filtered();
    $('#rows').innerHTML = list.map(rowHTML).join('');
    $('#emptyState').hidden = list.length > 0;
    $('#rowCount').textContent = list.length === state.items.length
      ? state.items.length + ' items'
      : list.length + ' of ' + state.items.length + ' items';
    document.querySelectorAll('th .sort').forEach(function (b) {
      b.setAttribute('data-dir', b.getAttribute('data-key') === ui.sortKey ? ui.sortDir : '');
      var th = b.parentNode;
      if (b.getAttribute('data-key') === ui.sortKey) th.setAttribute('aria-sort', ui.sortDir === 'asc' ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    });
  }

  function renderReorder() {
    var need = state.items.filter(function (it) { return derive(it).level !== 'ok'; });
    need.sort(function (a, b) {
      var oa = a.stock <= 0 ? 0 : 1, ob = b.stock <= 0 ? 0 : 1;
      return oa - ob || a.name.localeCompare(b.name);
    });
    $('#reorderCount').textContent = need.length ? need.length + (need.length === 1 ? ' item' : ' items') : '';
    if (!need.length) {
      $('#reorderBody').innerHTML = '<p class="list-empty">Everything is above its reorder level.</p>';
      return;
    }
    var total = 0;
    var li = need.map(function (it) {
      var q = suggest(it);
      total += q * it.cost;
      return '<li data-id="' + it.id + '"><div><span class="li-title">' + esc(it.name) + '</span>' +
        '<span class="sub num">Have ' + it.stock + ' · order ' + q + ' ' + esc(it.unit) + ' · ' + money.format(q * it.cost) + '</span></div>' +
        '<button type="button" class="btn btn-sm" data-act="receive">Receive</button></li>';
    }).join('');
    $('#reorderBody').innerHTML = '<ul class="list">' + li + '</ul>' +
      '<div class="list-foot"><span>Estimated order cost</span><strong class="num">' + money.format(total) + '</strong></div>';
  }

  function renderLog() {
    var items = state.log.slice(0, 8);
    $('#logList').innerHTML = items.length ? items.map(function (l) {
      return '<li><span class="what">' + esc(l.text) + (l.kind === 'sale' ? ' · ' + money.format(l.amount) : '') +
        '</span><span class="when">' + when(l.t) + '</span></li>';
    }).join('') : '<li class="muted">No activity yet.</li>';
  }

  function render() { renderStats(); renderTable(); renderReorder(); renderLog(); }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3200);
  }

  /* ---------- modal ---------- */
  var modal = null;
  function field(id, label, inner, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label>' + inner + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>';
  }
  function numInput(id, val, min, step, extra) {
    return '<input class="input num" id="' + id + '" type="number" inputmode="numeric" min="' + min + '" step="' + step + '" value="' + val + '"' + (extra || '') + '>';
  }
  function footer(primary, withDelete) {
    return '<p class="error" id="formError" role="alert"></p><div class="modal-foot">' +
      (withDelete ? '<button type="button" class="btn btn-danger spacer" id="deleteBtn">Delete item</button>' : '') +
      '<button type="button" class="btn" id="cancelBtn">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + primary + '</button></div>';
  }

  function openModal(mode, id) {
    var it = id != null ? state.items.find(function (x) { return x.id === id; }) : null;
    if (id != null && !it) return;
    modal = { mode: mode, id: id, opener: document.activeElement };
    var title = '', body = '';
    if (mode === 'sell') {
      var use = it.price <= 0;
      title = (use ? 'Use ' : 'Sell ') + it.name;
      body = '<p class="info num">In stock: ' + it.stock + ' ' + esc(it.unit) + (use ? '' : ' · ' + money.format(it.price) + ' each') + '</p>' +
        field('qty', 'Quantity (' + esc(it.unit) + ')', numInput('qty', 1, 1, 1, ' max="' + it.stock + '"')) +
        (use ? '' : '<p class="total num" id="totalLine"></p>') +
        footer(use ? 'Record use' : 'Record sale', false);
    } else if (mode === 'restock') {
      var s = suggest(it);
      title = 'Restock ' + it.name;
      body = '<p class="info num">In stock: ' + it.stock + ' ' + esc(it.unit) + ' · reorder at ' + it.reorder + '</p>' +
        field('qty', 'Quantity received (' + esc(it.unit) + ')', numInput('qty', s, 1, 1),
          it.shelf !== null ? 'Freshness follows your oldest stock, so the received date only resets when the shelf was empty.' : '') +
        '<p class="total num" id="totalLine"></p>' +
        footer('Add to stock', false);
    } else {
      var isNew = !it;
      var v = it || { name: '', cat: 'Cut flowers', unit: 'stem', stock: 24, reorder: 12, cost: '', price: '', shelf: 7, received: isoDate(new Date()) };
      title = isNew ? 'Add item' : 'Edit ' + it.name;
      var catOpts = CATS.map(function (c) { return '<option' + (c === v.cat ? ' selected' : '') + '>' + c + '</option>'; }).join('');
      body = field('f-name', 'Name', '<input class="input" id="f-name" type="text" maxlength="60" value="' + esc(v.name) + '" autocomplete="off">') +
        '<div class="grid2">' +
        field('f-cat', 'Category', '<select class="select" id="f-cat">' + catOpts + '</select>') +
        field('f-unit', 'Unit', '<input class="input" id="f-unit" type="text" maxlength="12" value="' + esc(v.unit) + '" autocomplete="off">', 'stem, bunch, pot, roll') +
        field('f-stock', 'In stock', numInput('f-stock', v.stock, 0, 1)) +
        field('f-reorder', 'Reorder at', numInput('f-reorder', v.reorder, 0, 1)) +
        field('f-cost', 'Cost each (KSh)', numInput('f-cost', v.cost, 0, 1)) +
        field('f-price', 'Price each (KSh)', numInput('f-price', v.price, 0, 1), 'Leave blank for supplies you do not sell') +
        field('f-shelf', 'Fresh for (days)', numInput('f-shelf', v.shelf === null ? '' : v.shelf, 1, 1, ' max="90" placeholder="Not perishable"')) +
        field('f-received', 'Received on', '<input class="input" id="f-received" type="date" value="' + v.received + '" max="' + isoDate(new Date()) + '">') +
        '</div>' + footer(isNew ? 'Add item' : 'Save changes', !isNew);
    }
    $('#modalTitle').textContent = title;
    $('#modalForm').innerHTML = body;
    $('#overlay').hidden = false;
    var first = $('#modalForm').querySelector('input, select');
    if (first) { first.focus(); if (first.select && first.type !== 'date') first.select(); }
    wireModal(it);
  }

  function wireModal(it) {
    var cancel = $('#cancelBtn');
    if (cancel) cancel.addEventListener('click', closeModal);
    var qty = $('#qty'), line = $('#totalLine');
    if (qty && line) {
      var upd = function () {
        var n = Number(qty.value);
        if (!Number.isFinite(n) || n < 0) { line.textContent = ''; return; }
        line.textContent = modal.mode === 'sell' ? 'Sale total: ' + money.format(n * it.price) : 'Cost of delivery: ' + money.format(n * it.cost);
      };
      qty.addEventListener('input', upd);
      upd();
    }
    var del = $('#deleteBtn');
    if (del) {
      del.addEventListener('click', function () {
        if (!del.classList.contains('armed')) {
          del.classList.add('armed');
          del.textContent = 'Confirm delete';
          return;
        }
        state.items = state.items.filter(function (x) { return x.id !== modal.id; });
        addLog('Removed ' + it.name, 'info', 0);
        save(); closeModal(); render();
        toast('Removed ' + it.name);
      });
    }
  }

  function closeModal() {
    $('#overlay').hidden = true;
    var op = modal && modal.opener;
    modal = null;
    if (op && document.body.contains(op) && op.focus) op.focus();
  }

  function setError(msg) { var e = $('#formError'); if (e) e.textContent = msg; }
  function intVal(id, min, max) {
    var raw = $('#' + id).value.trim();
    if (raw === '') return NaN;
    var n = Number(raw);
    return Number.isInteger(n) && n >= min && n <= max ? n : NaN;
  }
  function moneyVal(id, blankOk) {
    var raw = $('#' + id).value.trim();
    if (raw === '') return blankOk ? 0 : NaN;
    var n = Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 10000000 ? Math.round(n) : NaN;
  }

  function submitModal() {
    if (!modal) return;
    var it = modal.id != null ? state.items.find(function (x) { return x.id === modal.id; }) : null;
    if (modal.mode === 'sell') {
      var q = intVal('qty', 1, 100000);
      if (isNaN(q)) { setError('Enter a whole number of at least 1.'); return; }
      if (q > it.stock) { setError('Only ' + it.stock + ' ' + it.unit + ' in stock.'); return; }
      it.stock -= q;
      var amt = q * it.price;
      if (it.price > 0) addLog('Sold ' + q + ' × ' + it.name, 'sale', amt);
      else addLog('Used ' + q + ' × ' + it.name, 'use', 0);
      save(); closeModal(); render();
      toast(it.price > 0 ? 'Sale recorded: ' + money.format(amt) : 'Use recorded');
    } else if (modal.mode === 'restock') {
      var r = intVal('qty', 1, 100000);
      if (isNaN(r)) { setError('Enter a whole number of at least 1.'); return; }
      var wasEmpty = it.stock <= 0;
      it.stock += r;
      if (wasEmpty && it.shelf !== null) it.received = isoDate(new Date());
      addLog('Received ' + r + ' × ' + it.name, 'restock', 0);
      save(); closeModal(); render();
      toast('Added ' + r + ' ' + it.unit + ' to ' + it.name);
    } else {
      var name = $('#f-name').value.trim();
      var unit = $('#f-unit').value.trim();
      var cat = $('#f-cat').value;
      var stock = intVal('f-stock', 0, 1000000);
      var reorder = intVal('f-reorder', 0, 1000000);
      var cost = moneyVal('f-cost', false);
      var price = moneyVal('f-price', true);
      var shelfRaw = $('#f-shelf').value.trim();
      var shelf = shelfRaw === '' ? null : intVal('f-shelf', 1, 90);
      var recv = $('#f-received').value.trim() || isoDate(new Date());
      if (!name) { setError('Give the item a name.'); return; }
      if (!unit) { setError('Enter a unit such as stem, bunch or pot.'); return; }
      if (isNaN(stock)) { setError('In stock must be a whole number, 0 or more.'); return; }
      if (isNaN(reorder)) { setError('Reorder at must be a whole number, 0 or more.'); return; }
      if (isNaN(cost)) { setError('Enter a cost in whole shillings, for example 60.'); return; }
      if (isNaN(price)) { setError('Price must be a number, 0 or more.'); return; }
      if (shelf !== null && isNaN(shelf)) { setError('Fresh for must be a whole number of days from 1 to 90, or blank.'); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(recv) || parseISO(recv) > startOfDay(new Date())) { setError('Received date cannot be in the future.'); return; }
      if (it) {
        it.name = name; it.unit = unit; it.cat = cat; it.stock = stock; it.reorder = reorder;
        it.cost = cost; it.price = price; it.shelf = shelf; it.received = recv;
        addLog('Updated ' + name, 'info', 0);
        toast('Saved ' + name);
      } else {
        state.items.push({ id: state.nextId++, name: name, cat: cat, unit: unit, stock: stock, reorder: reorder, cost: cost, price: price, shelf: shelf, received: recv });
        addLog('Added new item ' + name, 'info', 0);
        toast('Added ' + name);
      }
      save(); closeModal(); render();
    }
  }

  /* ---------- events ---------- */
  $('#modalForm').addEventListener('submit', function (e) { e.preventDefault(); submitModal(); });
  $('#modalClose').addEventListener('click', closeModal);
  $('#overlay').addEventListener('mousedown', function (e) { if (e.target === $('#overlay')) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (!modal) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key === 'Tab') {
      var f = Array.prototype.filter.call($('#modal').querySelectorAll('button, input, select'), function (n) { return !n.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  $('#rows').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    var tr = b.closest('tr');
    openModal(b.getAttribute('data-act'), Number(tr.getAttribute('data-id')));
  });
  $('#reorderBody').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act="receive"]');
    if (!b) return;
    openModal('restock', Number(b.closest('li').getAttribute('data-id')));
  });
  $('#addBtn').addEventListener('click', function () { openModal('add', null); });

  $('#search').addEventListener('input', function (e) { ui.q = e.target.value; renderTable(); });
  $('#catFilter').addEventListener('change', function (e) { ui.cat = e.target.value; renderTable(); });
  $('#viewFilter').addEventListener('change', function (e) { ui.view = e.target.value; renderTable(); });
  $('#clearFilters').addEventListener('click', function () {
    ui.q = ''; ui.cat = 'all'; ui.view = 'all';
    $('#search').value = ''; $('#catFilter').value = 'all'; $('#viewFilter').value = 'all';
    renderTable();
  });
  document.querySelectorAll('th .sort').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-key');
      if (ui.sortKey === k) ui.sortDir = ui.sortDir === 'asc' ? 'desc' : 'asc';
      else { ui.sortKey = k; ui.sortDir = 'asc'; }
      renderTable();
    });
  });

  var resetTimer;
  $('#resetBtn').addEventListener('click', function () {
    var b = $('#resetBtn');
    if (b.getAttribute('data-armed') !== '1') {
      b.setAttribute('data-armed', '1');
      b.textContent = 'Click again to reset';
      resetTimer = setTimeout(function () { b.removeAttribute('data-armed'); b.textContent = 'Reset demo'; }, 4000);
      return;
    }
    clearTimeout(resetTimer);
    b.removeAttribute('data-armed');
    b.textContent = 'Reset demo';
    state = seed();
    save(); render();
    toast('Demo data restored');
  });

  /* ---------- start ---------- */
  $('#today').textContent = 'Inventory · ' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  render();
})();
