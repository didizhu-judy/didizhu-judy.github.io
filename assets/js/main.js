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

  /* ---------- Hero: a flowing field of patches, drawn with code ---------- */
  (function () {
    var field = $('[data-field]');
    if (!field || !field.getContext) return;
    var fctx = field.getContext('2d');
    var FW = 0, FH = 0, GAP = 18, cols = 0, rows = 0, color = '#1f7a4d', alphaScale = 1;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0, amp: 0, tamp: 0 };
    var running = false, onScreen = true, frameId = 0;

    var readColor = function () {
      color = getComputedStyle(root).getPropertyValue('--accent').trim() || color;
      alphaScale = isDark() ? 0.75 : 1;
    };
    var size = function () {
      var r = field.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      FW = r.width; FH = r.height;
      GAP = Math.max(16, Math.round(FW / 90));
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
          var s = 1 + v * 3;
          fctx.globalAlpha = (0.06 + v * 0.42) * alphaScale;
          fctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      fctx.globalAlpha = 1;
    };
    var loop = function (ms) { draw(ms); if (running) frameId = raf(loop); };
    var start = function () { if (running || !motionOK) return; running = true; frameId = raf(loop); };
    var stop = function () { running = false; cancelAnimationFrame(frameId); };

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
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { size(); if (!running) draw(performance.now()); }, 150);
    });
    new MutationObserver(function () { readColor(); if (!running) draw(performance.now()); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', readColor);
    field.classList.add('is-live');
  })();

  /* ---------- Scroll reveals (only for content that starts below the fold) ---------- */
  var arcEl = $('.arc');
  if (motionOK && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      var shown = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      shown.sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      shown.forEach(function (el, k) {
        revealIO.unobserve(el);
        if (el === arcEl) {
          el.classList.add('is-in');
          setTimeout(function () { el.classList.add('is-lit'); }, 1800);
          return;
        }
        el.style.setProperty('--d', Math.min(k, 6) * 70 + 'ms');
        el.classList.add('is-in');
        // Hand the element back to its normal styles once it has settled.
        setTimeout(function () { el.classList.remove('reveal', 'is-in'); el.style.removeProperty('--d'); }, 1500);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    var fold = window.innerHeight * 0.92;
    $$('.section__head, .news__item, .arc, .feat, .pubs__bar, .pub, .timeline__item, .honors__item, .service, .site-footer__inner').forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top < fold || el.offsetParent === null) {
        if (el === arcEl) el.classList.add('is-lit');
        return;
      }
      el.classList.add(el === arcEl ? 'is-armed' : 'reveal');
      revealIO.observe(el);
    });
  } else if (arcEl && motionOK) {
    arcEl.classList.add('is-lit');
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
