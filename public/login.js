(function () {
  var form = document.getElementById('loginForm');
  var user = document.getElementById('username');
  var pass = document.getElementById('password');
  var err = document.getElementById('error');
  var btn = document.getElementById('submitBtn');
  var reveal = document.getElementById('reveal');

  reveal.addEventListener('click', function () {
    var show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    reveal.textContent = show ? 'Hide' : 'Show';
    reveal.setAttribute('aria-pressed', show ? 'true' : 'false');
  });

  function ready() { btn.disabled = false; btn.textContent = 'Sign in'; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    var u = user.value.trim();
    var p = pass.value;
    if (!u || !p) { err.textContent = 'Enter your username and password.'; (u ? pass : user).focus(); return; }

    btn.disabled = true;
    btn.textContent = 'Signing in…';

    fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; });
    }).then(function (res) {
      if (res.ok) { window.location.replace('/inventory'); return; }
      err.textContent = res.data.error || 'Could not sign in. Try again.';
      ready();
      pass.value = '';
      pass.focus();
    }).catch(function () {
      err.textContent = 'No connection. Check your internet and try again.';
      ready();
    });
  });
})();
