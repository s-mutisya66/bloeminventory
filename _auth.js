// Shared helpers for sign-in. Files that start with an underscore are not exposed as URLs by Vercel.
const crypto = require('crypto');

const COOKIE = 'bloem_session';
const SESSION_SECONDS = 8 * 60 * 60; // staff stay signed in for 8 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET is missing or shorter than 16 characters');
  return s;
}

function isConfigured() {
  return Boolean(process.env.SHOP_USER && process.env.SHOP_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16);
}

// Compare two strings without leaking where they differ.
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + sig;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach(function (part) {
    const i = part.indexOf('=');
    if (i < 0) return;
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}

function getSession(req) {
  if (!isConfigured()) return null;
  return verify(parseCookies(req.headers.cookie)[COOKIE]);
}

function setSessionCookie(res, value, maxAge) {
  const parts = [COOKIE + '=' + value, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=' + maxAge];
  if (process.env.VERCEL) parts.push('Secure'); // Vercel always serves HTTPS
  res.setHeader('Set-Cookie', parts.join('; '));
}

// Reject requests that come from another website.
// With strict = true the Origin header must be present (browsers always send it on POST).
function sameOrigin(req, strict) {
  const origin = req.headers.origin;
  if (!origin) return !strict;
  try { return new URL(origin).host === req.headers.host; } catch (e) { return false; }
}

module.exports = { SESSION_SECONDS, isConfigured, safeEqual, sign, getSession, setSessionCookie, sameOrigin };
