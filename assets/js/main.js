/* Didi Zhu · homepage interactions. No dependencies; every feature degrades
   to plain, fully visible HTML when this file does not run, and all motion is
   skipped when the visitor prefers reduced motion. */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motionOK = !reduceMotion.matches;
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var raf = window.requestAnimationFrame.bind(window);

  /* ---------- Toast ---------- */
  var toast = $('[data-toast]');
  var toastTimer;
  function say(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-shown');
      setTimeout(function () { toast.textContent = ''; }, 250);
    }, 1800);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
      catch (err) { reject(err); }
      finally { document.body.removeChild(area); }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : darkQuery.matches;
  }

  /* ---------- Theme (circular reveal where View Transitions exist) ---------- */
  var themeBtn = $('[data-theme-toggle]');
  function syncThemeButton() {
    if (!themeBtn) return;
    var next = isDark() ? 'light' : 'dark';
    themeBtn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    themeBtn.setAttribute('title', 'Switch to ' + next + ' theme');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      var apply = function () {
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        syncThemeButton();
      };
      if (!motionOK || !document.startViewTransition) { apply(); return; }
      var r = themeBtn.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      var vt = document.startViewTransition(apply);
      vt.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
    });
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncThemeButton);
    syncThemeButton();
  }

  /* ---------- Header: hairline on scroll, mobile menu, scroll-spy ---------- */
  var header = $('[data-header]');
  var topAnchor = $('#top');
  if (header && topAnchor && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }, { rootMargin: '8px 0px 0px 0px' }).observe(topAnchor);
  }

  var menuBtn = $('[data-menu-toggle]');
  function setMenu(open) {
    if (!header || !menuBtn) return;
    header.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close section menu' : 'Open section menu');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!header.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
    });
    $$('.site-nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  var navLinks = $$('[data-nav]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('data-nav')] = a; });
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var active = null;
      $$('main > section[id]').some(function (s) {
        if (visible[s.id] && byId[s.id]) { active = s.id; return true; }
        return false;
      });
      navLinks.forEach(function (a) {
        if (a.getAttribute('data-nav') === active) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Hero: the name rises letter by letter ---------- */
  var nameEl = $('[data-split]');
  if (nameEl) {
    if (motionOK) {
      var text = nameEl.textContent.trim();
      var frag = document.createDocumentFragment();
      var index = 0;
      text.split(' ').forEach(function (word, wi) {
        if (wi > 0) { frag.appendChild(document.createTextNode(' ')); index += 1; }
        var w = document.createElement('span');
        w.className = 'split-word';
        w.setAttribute('aria-hidden', 'true');
        for (var c = 0; c < word.length; c++) {
          var mask = document.createElement('span');
          mask.className = 'split-char';
          var ch = document.createElement('span');
          ch.style.setProperty('--i', index++);
          ch.textContent = word[c];
          mask.appendChild(ch);
          w.appendChild(mask);
        }
        frag.appendChild(w);
      });
      nameEl.setAttribute('aria-label', text);
      nameEl.textContent = '';
      nameEl.appendChild(frag);
    }
    nameEl.classList.add('is-split');
  }

  /* ---------- Hero: a business card that tilts towards the pointer and turns over ---------- */
  var card = $('[data-bcard]');
  var cardState = { flipped: false, turning: false };
  (function () {
    if (!card) return;
    var body = $('.bcard__body', card);
    var front = $('.bcard__front', card);
    var back = $('.bcard__back', card);
    var cast = $('.bcard__shadow', card);
    if (!body || !front || !back) return;
    back.hidden = false;
    back.setAttribute('inert', '');
    $$('[data-bcard-flip]', card).forEach(function (b) { b.hidden = false; });
    card.classList.add('is-live');

    var TILT_X = 5, TILT_Y = 3.5;
    var rx = 0, ry = 0, trx = 0, tTy = 0, held = 0, tHeld = 0;
    var flip = 0, flipV = 0, flipT = 0;
    var gx = 50, gy = 40, tgx = 50, tgy = 40;
    var running = false, last = 0;

    var frame = function (now) {
      var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      var k = 1 - Math.exp(-dt * 8);
      rx += (trx - rx) * k;
      ry += (tTy - ry) * k;
      gx += (tgx - gx) * k;
      gy += (tgy - gy) * k;
      held += (tHeld - held) * (1 - Math.exp(-dt * 6));
      // A slightly underdamped spring, so the card lands with a little weight.
      flipV += (110 * (flipT - flip) - 17 * flipV) * dt;
      flip += flipV * dt;
      var turn = Math.abs(Math.sin(flip * Math.PI / 180));
      var turning = Math.abs(flipT - flip) > 0.3 || Math.abs(flipV) > 0.5;
      // The flip rotation only exists while turning; at rest the card is flat
      // and simply shows the face that is up.
      body.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' +
        (turning ? flip : 0).toFixed(2) + 'deg) scale(' + (1 + 0.008 * held + 0.035 * turn).toFixed(4) + ')';
      body.style.setProperty('--gx', gx.toFixed(1) + '%');
      body.style.setProperty('--gy', gy.toFixed(1) + '%');
      body.style.setProperty('--glare', Math.max(held, turn).toFixed(3));
      if (cast) {
        var lift = Math.max(held, turn);
        cast.style.opacity = Math.min(1, 0.55 * held + 0.9 * turn).toFixed(3);
        cast.style.transform = 'translate3d(' + (-ry * 2.4).toFixed(1) + 'px,' + (rx * 1.6 + 12 * lift).toFixed(1) + 'px,0)';
      }
      cardState.turning = turning;
      card.classList.toggle('is-turning', turning);
      var moving = turning || Math.abs(trx - rx) > 0.01 || Math.abs(tTy - ry) > 0.01 || Math.abs(tHeld - held) > 0.003;
      if (moving) { raf(frame); return; }
      running = false;
      flip = flipT;
      flipV = 0;
      if (!tHeld) {
        body.style.transform = '';
        body.style.setProperty('--glare', '0');
        if (cast) cast.style.opacity = '0';
      }
    };
    var kick = function () {
      if (running || !motionOK) return;
      running = true;
      last = performance.now();
      raf(frame);
    };

    var setFlipped = function (next) {
      cardState.flipped = next;
      card.classList.toggle('is-flipped', next);
      flipT = next ? 180 : 0;
      (next ? front : back).setAttribute('inert', '');
      (next ? back : front).removeAttribute('inert');
      if (motionOK) { cardState.turning = true; card.classList.add('is-turning'); kick(); }
    };
    card.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-bcard-flip]');
      if (!btn) return;
      var next = !cardState.flipped;
      setFlipped(next);
      var target = $('[data-bcard-flip]', next ? back : front);
      if (target) target.focus({ preventScroll: true });
    });

    if (motionOK && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      card.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = card.getBoundingClientRect();
        var px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        var py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        tTy = (px - 0.5) * 2 * TILT_Y;
        trx = (0.5 - py) * 2 * TILT_X;
        tgx = px * 100;
        tgy = py * 100;
        tHeld = 1;
        kick();
      });
      card.addEventListener('pointerleave', function () { trx = 0; tTy = 0; tHeld = 0; kick(); });
    }
  })();

  /* ---------- Hero: a flowing field of patches, drawn with code ---------- */
  $$('[data-field]').forEach(function (field) {
    if (!field.getContext) return;
    var fctx = field.getContext('2d');
    var light = field.getAttribute('data-field-tone') === 'light';
    var onBack = !!field.closest('.bcard__back');
    var FW = 0, FH = 0, GAP = 18, cols = 0, rows = 0, color = '#557a63', alphaScale = 1;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0, amp: 0, tamp: 0 };
    var running = false, onScreen = true, frameId = 0;

    // Only the face that is showing is drawn (both while the card turns).
    var shown = function () {
      if (!card || !card.classList.contains('is-live')) return true;
      if (cardState.turning) return true;
      return onBack ? cardState.flipped : !cardState.flipped;
    };
    var readColor = function () {
      if (light) {
        color = '#ffffff';
        alphaScale = isDark() ? 0.26 : 0.32;
      } else {
        color = getComputedStyle(root).getPropertyValue('--accent').trim() || color;
        alphaScale = isDark() ? 0.75 : 1;
      }
    };
    var size = function () {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      // Layout size, not the on-screen box, which shrinks while the card is turned.
      FW = field.offsetWidth;
      FH = field.offsetHeight;
      if (!FW || !FH) return;
      GAP = Math.max(11, Math.min(18, Math.round(FW / 30)));
      field.width = Math.round(FW * dpr);
      field.height = Math.round(FH * dpr);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(FW / GAP) + 1;
      rows = Math.ceil(FH / GAP) + 1;
    };
    var draw = function (ms) {
      var t = ms * 0.001;
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      pointer.amp += (pointer.tamp - pointer.amp) * 0.06;
      fctx.clearRect(0, 0, FW, FH);
      fctx.fillStyle = color;
      for (var j = 0; j < rows; j++) {
        var y = j * GAP;
        for (var i = 0; i < cols; i++) {
          var x = i * GAP;
          var n = Math.sin(x * 0.011 + t * 0.8) * 0.5 +
                  Math.sin(y * 0.017 - t * 0.6) * 0.35 +
                  Math.sin((x + y) * 0.007 + t * 0.45) * 0.45;
          var v = (n / 1.3 + 1) * 0.5;
          v = v * v * v;
          if (pointer.amp > 0.01) {
            var dx = x - pointer.x, dy = y - pointer.y;
            v += Math.exp(-(dx * dx + dy * dy) / 12800) * 0.85 * pointer.amp;
          }
          if (v < 0.05) continue;
          if (v > 1) v = 1;
          var s = 1.2 + v * 3.4;
          fctx.globalAlpha = (0.1 + v * 0.58) * alphaScale;
          fctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      fctx.globalAlpha = 1;
    };
    var loop = function (ms) { if (shown()) draw(ms); if (running) frameId = raf(loop); };
    var start = function () { if (running || !motionOK) return; running = true; frameId = raf(loop); };
    var stop = function () { running = false; cancelAnimationFrame(frameId); };
    var redraw = function () { size(); if (!running) draw(motionOK ? performance.now() : 0); };

    readColor();
    size();
    if (motionOK) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && !document.hidden) start(); else stop();
      }).observe(field.parentNode);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else if (onScreen) start();
      });
      window.addEventListener('pointermove', function (e) {
        var r = field.getBoundingClientRect();
        pointer.tx = e.clientX - r.left;
        pointer.ty = e.clientY - r.top;
        if (pointer.amp < 0.01) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
        pointer.tamp = e.pointerType === 'mouse' ? 1 : 0;
      }, { passive: true });
      document.documentElement.addEventListener('pointerleave', function () { pointer.tamp = 0; });
    } else {
      draw(0);
    }
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { redraw(); }).observe(field);
    } else {
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(redraw, 150);
      });
    }
    new MutationObserver(function () { readColor(); if (!running) draw(performance.now()); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', readColor);
    field.classList.add('is-live');
  });

  /* ---------- Research map: a loss landscape, walked by an optimiser ----------
     Each direction is a basin of one code-drawn loss surface, shown as contour
     lines. The optimiser never stops: it follows the gradient from one basin
     down into the next, and the detail panel changes as it passes each one.
     In the last basin it settles and fades, and the next lap begins.
     The contours stay faint until the optimiser gets there: it lights the
     landscape around itself, and each basin it reaches ripples into view. */
  (function () {
    var wrap = $('[data-rmap]');
    if (!wrap) return;
    var stage = $('.rmap__stage', wrap);
    var canvas = $('.rmap__canvas', wrap);
    var buttons = $$('.rmap__node', wrap);
    var panels = $$('[data-node-panel]', wrap);
    if (!stage || !canvas || !canvas.getContext || !buttons.length) return;
    var ctx = canvas.getContext('2d');
    var nodes = buttons.map(function (b) {
      return {
        id: b.getAttribute('data-node'),
        el: b,
        fx: parseFloat(b.style.getPropertyValue('--x')) / 100,
        fy: parseFloat(b.style.getPropertyValue('--y')) / 100,
        color: '#888888', w: 0, tw: 0, hover: 0, isHover: false
      };
    });
    var last = nodes.length - 1;
    // Later directions sit in deeper basins; each basin is a tilted ellipse.
    var DEPTH = [0.6, 0.72, 0.86, 1];
    var TILT = [-0.5, 0.35, -0.3, 0.45];
    var LEG = 2000, SETTLE = 1400, FADE = 350, RESUME = 1200, BLOOM = 1000, BASE = 0.1;
    var W = 0, H = 0, sage = '#557a63', neutral = '#9aa3ad', alphaScale = 1;
    var running = false, frameId = 0, onScreen = false, hiddenAt = 0;
    var detail = $('.arc', wrap);
    var current = -1, inside = false, manual = false, resumeTimer = 0;
    var C = [], SX = 60, SY = 40, SC = 1, levels = 15;
    var REF_W = 1120, REF_H = 232;
    var contours = [];   // { owner, level, path }
    var legs = [];       // legs[k]: polyline from basin k to k + 1, with cumulative length
    var walk = { k: 0, t0: 0 };
    // Off-screen layers: the contours, and a mask of what has been revealed.
    var layer = document.createElement('canvas'), lctx = layer.getContext('2d');
    var mask = document.createElement('canvas'), mctx = mask.getContext('2d');
    var blooms = [], lastMs = 0;

    var readColors = function () {
      sage = getComputedStyle(root).getPropertyValue('--accent').trim() || sage;
      neutral = getComputedStyle(root).getPropertyValue('--ink-3').trim() || neutral;
      alphaScale = isDark() ? 0.9 : 1;
      nodes.forEach(function (n) { n.color = getComputedStyle(n.el).getPropertyValue('--c').trim() || sage; });
    };

    var basin = function (k, x, y) {
      var dx = x - C[k][0], dy = y - C[k][1], c = Math.cos(TILT[k]), s = Math.sin(TILT[k]);
      var u = dx * c + dy * s, v = -dx * s + dy * c;
      return Math.exp(-(u * u) / (2 * SX * SX) - (v * v) / (2 * SY * SY));
    };
    var loss = function (x, y, skip) {
      var L = 0.3 * (1 - x / W) + 0.08 * Math.pow((y - H * 0.5) / (REF_H * SC), 2);
      for (var k = 0; k < C.length; k++) if (k !== skip) L -= DEPTH[k] * basin(k, x, y);
      return L;
    };
    var owner = function (x, y) {
      var best = 0, bi = -1;
      for (var k = 0; k < C.length; k++) { var g = basin(k, x, y); if (g > best) { best = g; bi = k; } }
      return best > 0.035 ? bi : -1;
    };

    // Contour lines by marching squares, grouped by basin and level so each
    // group can be coloured and lit on its own.
    var buildContours = function () {
      var cs = 5, nx = Math.ceil(W / cs) + 2, ny = Math.ceil(H / cs) + 2;
      var F = new Float32Array(nx * ny), lo = Infinity, hi = -Infinity;
      for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
        var v = loss(i * cs, j * cs);
        F[j * nx + i] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      var groups = {};
      contours = [];
      var add = function (lv, x1, y1, x2, y2) {
        var o = owner((x1 + x2) / 2, (y1 + y2) / 2), key = o + ':' + lv;
        if (!groups[key]) { groups[key] = { owner: o, level: lv, path: new Path2D() }; contours.push(groups[key]); }
        groups[key].path.moveTo(x1, y1);
        groups[key].path.lineTo(x2, y2);
      };
      for (var lv = 0; lv < levels; lv++) {
        // Levels crowd towards the minima, as on a loss plot.
        var t = lo + (hi - lo) * Math.pow((lv + 0.6) / levels, 1.7);
        for (var cj = 0; cj < ny - 1; cj++) for (var ci = 0; ci < nx - 1; ci++) {
          var a = F[cj * nx + ci], b = F[cj * nx + ci + 1], c = F[(cj + 1) * nx + ci + 1], d = F[(cj + 1) * nx + ci];
          var idx = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var x0 = ci * cs, y0 = cj * cs;
          var top = [x0 + cs * (t - a) / (b - a), y0], right = [x0 + cs, y0 + cs * (t - b) / (c - b)];
          var bottom = [x0 + cs * (t - d) / (c - d), y0 + cs], left = [x0, y0 + cs * (t - a) / (d - a)];
          var seg = function (p, q) { add(lv, p[0], p[1], q[0], q[1]); };
          var mid = (a + b + c + d) / 4;
          switch (idx) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(top, left); break;
            case 5: if (mid > t) { seg(top, left); seg(bottom, right); } else { seg(top, right); seg(left, bottom); } break;
            case 10: if (mid > t) { seg(top, right); seg(left, bottom); } else { seg(top, left); seg(bottom, right); } break;
          }
        }
      }
    };

    // Each leg is gradient flow: start just out of basin k (with that basin
    // switched off) and follow the steepest descent until basin k + 1.
    var buildLegs = function () {
      legs = [];
      for (var k = 0; k < last; k++) {
        var A = C[k], B = C[k + 1], pts = [[A[0], A[1]]];
        var x = A[0] + (B[0] - A[0]) * 0.02, y = A[1] + (B[1] - A[1]) * 0.02, h = 0.5, stepLen = 2.5;
        for (var n = 0; n < 4000; n++) {
          var gx = (loss(x + h, y, k) - loss(x - h, y, k)) / (2 * h);
          var gy = (loss(x, y + h, k) - loss(x, y - h, k)) / (2 * h);
          var g = Math.hypot(gx, gy);
          if (!g) break;
          x -= stepLen * gx / g;
          y -= stepLen * gy / g;
          pts.push([x, y]);
          if (Math.hypot(x - B[0], y - B[1]) < 4) break;
        }
        // If the flow missed (it should not), fall back to a gentle curve.
        if (Math.hypot(x - B[0], y - B[1]) > 12) {
          pts = [];
          for (var q = 0; q <= 60; q++) {
            var f = q / 60, mx = (A[0] + B[0]) / 2, my = Math.max(A[1], B[1]) + H * 0.12;
            pts.push([(1 - f) * (1 - f) * A[0] + 2 * f * (1 - f) * mx + f * f * B[0], (1 - f) * (1 - f) * A[1] + 2 * f * (1 - f) * my + f * f * B[1]]);
          }
        }
        pts.push([B[0], B[1]]);
        legs.push(measured(pts));
      }
    };
    var measured = function (pts) {
      var len = [0];
      for (var m = 1; m < pts.length; m++) len.push(len[m - 1] + Math.hypot(pts[m][0] - pts[m - 1][0], pts[m][1] - pts[m - 1][1]));
      return { pts: pts, len: len, total: Math.max(1e-6, len[len.length - 1]) };
    };
    var along = function (leg, dist) {
      var L = leg.len, i = 1;
      while (i < L.length - 1 && L[i] < dist) i++;
      var f = (dist - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
      f = Math.max(0, Math.min(1, f));
      return { i: i, x: leg.pts[i - 1][0] + (leg.pts[i][0] - leg.pts[i - 1][0]) * f, y: leg.pts[i - 1][1] + (leg.pts[i][1] - leg.pts[i - 1][1]) * f };
    };

    var size = function () {
      var r = stage.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = layer.width = mask.width = Math.round(W * dpr);
      canvas.height = layer.height = mask.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // The same landscape at every size: scaled from the desktop strip by
      // width, so a phone shows a smaller copy rather than a different map, and
      // a shorter strip crops it rather than squashing it.
      SC = Math.min(1, W / REF_W);
      var amp = Math.max(0.21 * REF_H * SC, 26);
      C = nodes.map(function (n) { return [n.fx * W, H / 2 + (n.fy - 0.5) / 0.21 * amp]; });
      nodes.forEach(function (n, k) { n.el.style.left = C[k][0] + 'px'; n.el.style.top = C[k][1] + 'px'; });
      SX = 84 * SC;
      SY = 61.6 * SC;
      levels = Math.round(6 + 9 * SC);
      buildContours();
      buildLegs();
      // A resize keeps what has already been revealed this lap.
      if (!motionOK) { mctx.fillStyle = '#000'; mctx.fillRect(0, 0, W, H); }
      else for (var k = 0; k <= Math.min(walk.k, last); k++) reveal(C[k][0], C[k][1], bloomR(), 1);
    };
    var bloomR = function () { return Math.max(60, SX * 2.9); };
    var reveal = function (x, y, r, a) {
      var g = mctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,' + a + ')');
      g.addColorStop(0.55, 'rgba(0,0,0,' + (a * 0.7) + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g;
      mctx.beginPath();
      mctx.arc(x, y, r, 0, Math.PI * 2);
      mctx.fill();
    };
    var bloom = function (k, ms) { blooms.push({ x: C[k][0], y: C[k][1], t0: ms }); };

    var select = function (index, byUser) {
      if (index === current) return;
      current = index;
      // Announce choices the visitor makes, not the automatic walk.
      if (detail) detail.setAttribute('aria-live', byUser ? 'polite' : 'off');
      nodes.forEach(function (n, k) {
        n.tw = k === index ? 1 : 0;
        if (!motionOK) n.w = n.tw;
        n.el.setAttribute('aria-pressed', String(k === index));
      });
      panels.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-node-panel') === nodes[index].id); });
      if (!running) draw(performance.now());
    };

    // Where the optimiser is: part-way along leg k, or (k = last) settled in
    // the last basin. It moves at an even pace and changes the panel as it arrives.
    var step = function (ms) {
      var dur = walk.k < last ? LEG : SETTLE;
      var t = ms - walk.t0;
      if (t >= dur) {
        walk.t0 += dur;
        t -= dur;
        walk.k = walk.k < last ? walk.k + 1 : 0;
        // A new lap starts from a faint landscape again.
        if (walk.k === 0) { mctx.clearRect(0, 0, W, H); blooms = []; }
        if (!manual) select(walk.k);
        bloom(walk.k, ms);
        dur = walk.k < last ? LEG : SETTLE;
      }
      if (walk.k === last) {
        var v = t / SETTLE;
        return { k: last, d: -1, settle: v, fade: Math.max(0, Math.min(1, (1 - v) / 0.5)) };
      }
      return { k: walk.k, d: Math.min(1, t / dur) * legs[walk.k].total, settle: 0, fade: walk.k === 0 ? Math.min(1, t / FADE) : 1 };
    };

    var strokeLeg = function (leg, upto) {
      ctx.beginPath();
      ctx.moveTo(leg.pts[0][0], leg.pts[0][1]);
      if (upto == null) {
        for (var i = 1; i < leg.pts.length; i++) ctx.lineTo(leg.pts[i][0], leg.pts[i][1]);
      } else {
        var e = along(leg, upto);
        for (var j = 1; j < e.i; j++) ctx.lineTo(leg.pts[j][0], leg.pts[j][1]);
        ctx.lineTo(e.x, e.y);
      }
      ctx.stroke();
    };

    var draw = function (ms) {
      var t = ms * 0.001;
      var pos = motionOK ? step(ms) : { k: last, d: -1, settle: 0, fade: 0 };
      nodes.forEach(function (n) {
        n.w += (n.tw - n.w) * 0.06;
        n.hover += ((n.isHover ? 1 : 0) - n.hover) * 0.12;
      });
      ctx.clearRect(0, 0, W, H);
      var head = C[pos.k];
      if (pos.d >= 0) { var e = along(legs[pos.k], pos.d); head = [e.x, e.y]; }

      // Reveal: a soft light around the optimiser, a ripple from each basin it
      // reaches, and a fade back to faint as the lap ends.
      var dt = Math.min(0.05, Math.max(0.001, (ms - lastMs) / 1000));
      lastMs = ms;
      if (motionOK) {
        if (pos.settle > 0.6) {
          mctx.globalCompositeOperation = 'destination-out';
          mctx.fillStyle = 'rgba(0,0,0,' + (1 - Math.exp(-dt * 3)).toFixed(4) + ')';
          mctx.fillRect(0, 0, W, H);
          mctx.globalCompositeOperation = 'source-over';
        } else {
          reveal(head[0], head[1], Math.max(30, SX * 1.3), 1 - Math.exp(-dt * 2.2));
        }
        blooms = blooms.filter(function (b) {
          var age = (ms - b.t0) / BLOOM;
          if (age >= 1) return false;
          var r = bloomR() * (1 - Math.pow(1 - age, 3));
          reveal(b.x, b.y, Math.max(8, r), 1 - Math.exp(-dt * 3.2));
          return true;
        });
      }

      // Contours: the basin in focus is drawn in its colour, the rest recede.
      lctx.clearRect(0, 0, W, H);
      lctx.lineWidth = 1;
      contours.forEach(function (c) {
        var depth = 1 - c.level / levels;
        var a;
        if (c.owner < 0) {
          lctx.strokeStyle = neutral;
          a = 0.1 + 0.1 * depth;
        } else {
          // Every basin keeps a hint of its colour; the one in focus deepens and
          // its rings shimmer gently from the inside out.
          var n = nodes[c.owner], act = Math.max(n.w, n.hover * 0.8);
          lctx.strokeStyle = n.color;
          a = (0.16 + 0.26 * depth) + act * depth * (0.32 + 0.12 * Math.sin(t * 1.6 - c.level * 0.7));
        }
        lctx.globalAlpha = Math.min(1, a) * alphaScale;
        lctx.stroke(c.path);
      });
      lctx.globalAlpha = 1;
      // Faint everywhere, clear where the optimiser has been. The layers are
      // composited in device pixels, then the drawing transform is restored.
      var dpr = canvas.width / Math.max(1, W);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = BASE;
      ctx.drawImage(layer, 0, 0);
      lctx.globalCompositeOperation = 'destination-in';
      lctx.drawImage(mask, 0, 0);
      lctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(layer, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // The route: faint ahead, solid where the optimiser has been this lap.
      ctx.strokeStyle = sage;
      ctx.lineCap = 'round';
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.35 * alphaScale;
      for (var f = 0; f < last; f++) strokeLeg(legs[f]);
      ctx.setLineDash([]);
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.85 * alphaScale * (pos.k === last ? Math.max(0.25, pos.fade) : 1);
      for (var k = 0; k < Math.min(pos.k, last); k++) strokeLeg(legs[k]);
      if (pos.k < last) strokeLeg(legs[pos.k], pos.d);

      // Minima.
      nodes.forEach(function (n, k) {
        var r = 3 + 2 * Math.max(n.w, n.hover);
        ctx.globalAlpha = alphaScale;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(C[k][0], C[k][1], r, 0, Math.PI * 2);
        ctx.fill();
      });

      // The optimiser: a bright point with a soft halo.
      if (motionOK) {
        var fade = pos.fade;
        var halo = 11 + 1.5 * Math.sin(t * 2.4);
        var g = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], halo);
        g.addColorStop(0, sage);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.35 * alphaScale * fade;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(head[0], head[1], halo, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alphaScale * fade;
        ctx.fillStyle = sage;
        ctx.beginPath();
        ctx.arc(head[0], head[1], 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(head[0], head[1], 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.lineCap = 'butt';
    };

    var loop = function (ms) { draw(ms); if (running) frameId = raf(loop); };
    var start = function () {
      if (running || !motionOK) return;
      running = true;
      // Time spent off screen does not count towards the current stop.
      if (hiddenAt) { walk.t0 += performance.now() - hiddenAt; hiddenAt = 0; }
      frameId = raf(loop);
    };
    var stop = function () {
      if (!running) return;
      running = false;
      hiddenAt = performance.now();
      cancelAnimationFrame(frameId);
    };

    // Hovering a direction shows it in the panel; the optimiser keeps walking,
    // and leaving the map hands the panel back to it.
    var pick = function (k) {
      manual = true;
      clearTimeout(resumeTimer);
      if (k !== current) bloom(k, performance.now());
      select(k, true);
    };
    var resume = function () {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        if (inside) return;
        manual = false;
        // Back to whichever basin the optimiser last passed.
        select(walk.k === last ? last : walk.k);
      }, RESUME);
    };
    wrap.addEventListener('pointerenter', function () { inside = true; });
    wrap.addEventListener('pointerleave', function () { inside = false; if (manual) resume(); });
    buttons.forEach(function (b, k) {
      b.addEventListener('click', function () { pick(k); });
      var on = function () { nodes[k].isHover = true; pick(k); };
      var off = function () { nodes[k].isHover = false; };
      b.addEventListener('pointerenter', on);
      b.addEventListener('pointerleave', off);
      b.addEventListener('focus', on);
      b.addEventListener('blur', function () { off(); if (!inside) resume(); });
    });

    wrap.classList.add('is-live');
    readColors();
    size();
    if (motionOK && 'IntersectionObserver' in window) {
      select(0);
      var begun = false;
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && !begun) { begun = true; walk.t0 = performance.now(); bloom(0, walk.t0); }
        if (onScreen && !document.hidden) start(); else stop();
      }, { threshold: 0.35 }).observe(stage);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else if (onScreen) start();
      });
    } else {
      select(last);
      draw(0);
    }
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { size(); if (!running) draw(performance.now()); }, 150);
    });
    new MutationObserver(function () { readColors(); if (!running) draw(performance.now()); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', function () { readColors(); if (!running) draw(performance.now()); });
  })();

  /* ---------- Experience: the path plays forward from the first stop to now ---------- */
  (function () {
    var path = $('[data-path]');
    if (!path) return;
    var scroller = $('[data-path-scroller]', path);
    var rail = $('.path__rail', path);
    var items = $$('.path__item', path);
    var dots = items.map(function (it) { return $('.path__dot', it); });
    if (!scroller || !rail || !items.length || dots.indexOf(null) !== -1) return;
    var stops = [], total = 1, railLeft = 0;
    var userTook = false;

    // Distance of every stop along the rail; the strip scrolls, so these stay fixed.
    var measure = function () {
      var r = rail.getBoundingClientRect();
      stops = dots.map(function (d) { var b = d.getBoundingClientRect(); return b.left + b.width / 2 - r.left; });
      total = Math.max(1, stops[stops.length - 1]);
      railLeft = rail.offsetLeft;
      path.style.setProperty('--now', total.toFixed(1) + 'px');
    };
    var maxScroll = function () { return Math.max(0, scroller.scrollWidth - scroller.clientWidth); };
    var updateEdges = function () {
      var x = scroller.scrollLeft, m = maxScroll();
      path.classList.toggle('can-prev', x > 4);
      path.classList.toggle('can-next', x < m - 4);
    };
    var reach = function (p) {
      items.forEach(function (it, k) {
        if (p >= stops[k] / total - 0.002) it.classList.add('is-reached');
      });
    };
    var setP = function (p) { path.style.setProperty('--p', p.toFixed(4)); };

    measure();
    scroller.addEventListener('scroll', updateEdges, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); updateEdges(); }).observe(path);
    else window.addEventListener('resize', function () { measure(); updateEdges(); });

    // A swipe, wheel, drag or key press hands the strip to the visitor.
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (type) {
      scroller.addEventListener(type, function () { userTook = true; }, { passive: true });
    });

    // Resting the mouse near either edge keeps the strip moving that way.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var EDGE = 120, SPEED = 560;
      var drift = 0, driftFrame = 0, driftLast = 0;
      var tick = function (now) {
        var dt = Math.min(0.05, (now - driftLast) / 1000 || 0.016);
        driftLast = now;
        if (!drift) { driftFrame = 0; return; }
        scroller.scrollLeft += drift * dt;
        driftFrame = raf(tick);
      };
      path.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || path.classList.contains('is-running')) { drift = 0; return; }
        var r = path.getBoundingClientRect();
        var x = e.clientX - r.left;
        var v = 0;
        if (x < EDGE && scroller.scrollLeft > 0) v = -SPEED * Math.pow(1 - x / EDGE, 1.6);
        else if (x > r.width - EDGE && scroller.scrollLeft < maxScroll()) v = SPEED * Math.pow(1 - (r.width - x) / EDGE, 1.6);
        drift = v;
        if (v && !driftFrame) { userTook = true; driftLast = performance.now(); driftFrame = raf(tick); }
      });
      path.addEventListener('pointerleave', function () { drift = 0; });
    }

    if (!motionOK || !('IntersectionObserver' in window)) {
      setP(1);
      reach(1);
      path.classList.add('is-done');
      scroller.scrollLeft = maxScroll();
      updateEdges();
      return;
    }
    path.classList.add('is-armed');
    setP(0);
    scroller.scrollLeft = maxScroll();
    updateEdges();

    // One continuous run at an even pace, easing only at the very start and end.
    var SPEED = 170;
    var run = function () {
      measure();
      // Stops scrolled out of view to the left are already behind us; start
      // from the last of them so the visible part of the line plays in.
      var from = 0;
      var left = scroller.scrollLeft - railLeft;
      for (var k = 0; k < stops.length; k++) { if (stops[k] < left) from = k; }
      var start = stops[from] / total;
      setP(start);
      reach(start);
      path.classList.add('is-running');
      var t0 = performance.now() + 250;
      var dur = Math.max(1800, (1 - start) * total / SPEED * 1000);
      var frame = function (now) {
        var u = Math.max(0, Math.min(1, (now - t0) / dur));
        // Gentle ease at both ends, steady in between.
        var e = u < 0.08 ? u * u / 0.16 : u > 0.92 ? 0.92 - (1 - u) * (1 - u) / 0.16 : u - 0.04;
        e = e / 0.92;
        var p = start + (1 - start) * Math.min(1, e);
        setP(p);
        reach(p);
        if (p < 1) { raf(frame); return; }
        path.classList.remove('is-running');
        path.classList.add('is-done');
        updateEdges();
      };
      raf(frame);
    };
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      run();
    }, { threshold: 0.35 });
    io.observe(path);
  })();

  /* ---------- Scroll reveals (only for content that starts below the fold) ---------- */
  if (motionOK && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      var shown = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      shown.sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      shown.forEach(function (el, k) {
        revealIO.unobserve(el);
        el.style.setProperty('--d', Math.min(k, 6) * 70 + 'ms');
        el.classList.add('is-in');
        // Hand the element back to its normal styles once it has settled.
        setTimeout(function () { el.classList.remove('reveal', 'is-in'); el.style.removeProperty('--d'); }, 1500);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    var fold = window.innerHeight * 0.92;
    $$('.section__head, .news__item, .rmap, .feat, .pubs__bar, .pub, .honors__item, .service, .site-footer__inner').forEach(function (el) {
      if (el.getBoundingClientRect().top < fold || el.offsetParent === null) return;
      el.classList.add('reveal');
      revealIO.observe(el);
    });
  }

  /* ---------- Cards: spotlight and a gentle tilt towards the pointer ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.feat').forEach(function (card) {
      var pending = 0, px = 0.5, py = 0.5;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width;
        py = (e.clientY - r.top) / r.height;
        if (pending) return;
        pending = raf(function () {
          pending = 0;
          card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
          if (motionOK) {
            card.style.transform = 'perspective(1100px) rotateX(' + ((0.5 - py) * 3).toFixed(2) + 'deg) rotateY(' +
              ((px - 0.5) * 4).toFixed(2) + 'deg) translateY(-2px)';
          }
        });
      });
      card.addEventListener('pointerenter', function () { card.classList.add('is-tilting'); });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  }

  /* ---------- Copy buttons ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy-text], [data-copy-from]');
    if (!btn) return;
    var text, label;
    if (btn.hasAttribute('data-copy-text')) {
      text = btn.getAttribute('data-copy-text');
      label = btn.getAttribute('data-copy-label') || 'Text';
    } else {
      var src = document.getElementById(btn.getAttribute('data-copy-from'));
      text = src ? $('code', src).textContent : '';
      label = 'BibTeX';
    }
    copyText(text).then(function () {
      say(label + ' copied');
      var span = $('span', btn);
      if (span) {
        var before = span.textContent;
        span.textContent = 'Copied';
        setTimeout(function () { span.textContent = before; }, 1600);
      }
    }, function () { say('Copy failed. Select the text and copy it manually.'); });
  });

  /* ---------- BibTeX toggles ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.bib-toggle');
    if (!btn) return;
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  });

  /* ---------- Entering animation for items revealed by a click ---------- */
  function enter(items) {
    if (!motionOK) return;
    items.forEach(function (el, k) {
      el.style.setProperty('--k', Math.min(k, 14));
      el.classList.remove('is-entering');
      void el.offsetWidth;
      el.classList.add('is-entering');
      setTimeout(function () { el.classList.remove('is-entering'); }, 1200);
    });
  }

  /* ---------- News: "new" badges and collapse ---------- */
  var news = $('[data-news]');
  if (news) {
    var now = Date.now();
    var windowMs = 90 * 24 * 3600 * 1000;
    $$('.news__item', news).forEach(function (item) {
      var t = Date.parse(item.getAttribute('data-date'));
      if (!isNaN(t) && now - t >= 0 && now - t < windowMs) {
        var badge = document.createElement('span');
        badge.className = 'news__new';
        badge.textContent = 'New';
        $('.news__text', item).appendChild(badge);
      }
    });
    var toggle = $('[data-news-toggle]');
    var extras = $$('.is-extra', news);
    if (toggle && extras.length) {
      var label = $('[data-news-toggle-label]', toggle);
      var closedText = label.textContent;
      toggle.hidden = false;
      toggle.addEventListener('click', function () {
        var open = !news.classList.contains('is-expanded');
        news.classList.toggle('is-expanded', open);
        toggle.setAttribute('aria-expanded', String(open));
        label.textContent = open ? 'Show fewer updates' : closedText;
        if (open) enter(extras);
        else news.closest('section').scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto', block: 'start' });
      });
    }
  }

  /* ---------- Publication filters (state lives in the URL) ---------- */
  var list = $('#all-publications');
  if (list) {
    var themeBtns = $$('[data-theme-filter]', list);
    var firstBox = $('[data-first-filter]', list);
    var status = $('[data-pub-status]', list);
    var empty = $('[data-pub-empty]', list);
    var rows = $$('.pub', list);
    var years = $$('[data-year]', list);
    var names = {};
    themeBtns.forEach(function (b) { names[b.getAttribute('data-theme-filter')] = b.textContent.replace(/\d+/g, '').trim(); });

    var state = { theme: 'all', first: false };

    var apply = function (updateUrl) {
      var shown = 0, appeared = [];
      rows.forEach(function (row) {
        var themes = (row.getAttribute('data-themes') || '').split(' ');
        var ok = (state.theme === 'all' || themes.indexOf(state.theme) !== -1) &&
                 (!state.first || row.getAttribute('data-first') === 'true');
        if (ok && row.hidden) appeared.push(row);
        row.hidden = !ok;
        if (ok) shown += 1;
      });
      years.forEach(function (y) { y.hidden = !$$('.pub', y).some(function (r) { return !r.hidden; }); });
      themeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-filter') === state.theme)); });
      if (firstBox) firstBox.checked = state.first;
      if (empty) empty.hidden = shown !== 0;
      if (status) {
        var filtered = state.theme !== 'all' || state.first;
        status.textContent = filtered
          ? 'Showing ' + shown + ' of ' + rows.length + ' papers' +
            (state.theme !== 'all' ? ' in ' + names[state.theme] : '') +
            (state.first ? ', first or co-first author' : '')
          : '';
      }
      if (updateUrl) {
        enter(appeared);
        if (window.history && history.replaceState) {
          var params = new URLSearchParams(window.location.search);
          if (state.theme === 'all') params.delete('theme'); else params.set('theme', state.theme);
          if (state.first) params.set('first', '1'); else params.delete('first');
          var qs = params.toString();
          history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
        }
      }
    };

    var fromUrl = function () {
      var params = new URLSearchParams(window.location.search);
      var t = params.get('theme');
      state.theme = t && names[t] ? t : 'all';
      state.first = params.get('first') === '1';
    };

    themeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.theme = b.getAttribute('data-theme-filter');
        apply(true);
      });
    });
    if (firstBox) firstBox.addEventListener('change', function () { state.first = firstBox.checked; apply(true); });
    var reset = $('[data-filter-reset]', list);
    if (reset) reset.addEventListener('click', function () { state.theme = 'all'; state.first = false; apply(true); });

    $$('[data-theme-link]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        state.theme = a.getAttribute('data-theme-link');
        apply(true);
        list.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto', block: 'start' });
        var pressed = $('[aria-pressed="true"]', list);
        if (pressed) pressed.focus({ preventScroll: true });
      });
    });

    // Links to a specific paper (e.g. from the research arc) must never land on a filtered-out row.
    var reveal = function (hash) {
      var target = hash && hash.indexOf('#pub-') === 0 ? document.getElementById(hash.slice(1)) : null;
      if (target && target.hidden) { state.theme = 'all'; state.first = false; apply(true); }
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#pub-"]');
      if (a) reveal(a.getAttribute('href'));
    });
    window.addEventListener('hashchange', function () { reveal(window.location.hash); });

    fromUrl();
    apply(false);
    reveal(window.location.hash);
  }
})();
