(function () {
  'use strict';
  var d = document.documentElement, body = document.body;
  var WA = '201122254106';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mobile = window.matchMedia('(max-width: 959px)');

  /* header states */
  var hdr = $('#hdr'), hero = $('.hero');
  function onTop() {
    var y = window.scrollY;
    hdr.classList.toggle('solid', !body.classList.contains('home') || y > 40);
  }
  onTop();
  window.addEventListener('scroll', onTop, { passive: true });
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { hdr.classList.toggle('past', !en.isIntersecting); });
    }, { rootMargin: '-35% 0px 0px 0px' }).observe(hero);
  } else { hdr.classList.add('past'); }

  /* drawer */
  var drawer = $('#drawer'), burger = $('.burger'), lastFocus = null;
  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { drawer.removeAttribute('inert'); } else { drawer.setAttribute('inert', ''); }
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    body.style.overflow = open ? 'hidden' : '';
    if (open) { lastFocus = document.activeElement; setTimeout(function () { $('.drawer-x').focus(); }, 30); }
    else if (lastFocus) { lastFocus.focus({ preventScroll: true }); }
  }
  burger.addEventListener('click', function () { setDrawer(true); });
  $('.drawer-x').addEventListener('click', function () { setDrawer(false); });
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && drawer.classList.contains('open')) setDrawer(false); });

  /* AR note */
  var note = $('#ar-note');
  $$('.ar').forEach(function (b) {
    b.addEventListener('click', function () { if (note.showModal) note.showModal(); else note.setAttribute('open', ''); });
  });
  $('[data-close]', note).addEventListener('click', function () { if (note.close) note.close(); else note.removeAttribute('open'); });
  note.addEventListener('click', function (ev) { if (ev.target === note && note.close) note.close(); });

  /* morning to night: the day line follows the Cairo clock, the owner can flip it */
  var stops = $$('.dl-stop'), manual = false;
  function paint(state) {
    d.setAttribute('data-day', state);
    stops.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-day') === state ? 'true' : 'false'); });
  }
  function tick() {
    var now = window.luumaDay ? window.luumaDay() : { state: 'morning', time: '' };
    var t = $('.dl-time'); if (t) t.textContent = now.time;
    if (!manual) paint(now.state);
  }
  if (stops.length) {
    tick(); setInterval(tick, 30000);
    stops.forEach(function (b) {
      b.addEventListener('click', function () { manual = true; paint(b.getAttribute('data-day')); });
    });
  }

  /* phone bar: hidden over the hero, the booking form and the footer, and while scrolling down */
  var bar = $('#bar');
  if (bar) {
    var blocks = {}, lastY = window.scrollY, down = false;
    var watch = [hero, $('#book'), $('#foot')].filter(Boolean);
    function upd() { var hide = down || Object.keys(blocks).some(function (k) { return blocks[k]; }); bar.classList.toggle('show', !hide); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { blocks[en.target.id || en.target.className] = en.isIntersecting; }); upd();
      }, { rootMargin: '0px 0px -60px 0px' });
      watch.forEach(function (el) { io.observe(el); });
    }
    if (hero) blocks['hero'] = true;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (Math.abs(y - lastY) > 6) { down = y > lastY && y > 120; lastY = y; upd(); }
    }, { passive: true });
    upd();
  }

  /* shared booking helpers */
  function cairoToday() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }
  function niceDate(v) {
    var a = v.split('-'), dt = new Date(Date.UTC(+a[0], +a[1] - 1, +a[2], 12));
    return dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  function prepDate(input) { if (!input) return; var t = cairoToday(); input.min = t; if (!input.value) input.value = t; }
  function optText(sel) { return sel.options[sel.selectedIndex].text; }
  function need(input, errEl) {
    var ok = input.value.trim().length > 0;
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (errEl) errEl.hidden = ok;
    return ok;
  }
  function openWA(text) {
    var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
    window.lastWhatsApp = url;
    window.open(url, '_blank', 'noopener');
  }

  var bk = $('#book-form');
  if (bk) {
    prepDate($('#bk-date'));
    $('#bk-name').addEventListener('blur', function () { if (this.value) need(this, $('#bk-name-err')); });
    bk.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!need($('#bk-name'), $('#bk-name-err'))) { $('#bk-name').focus(); return; }
      var lines = ['Hello LUUMA Zamalek, I would like to book a table.',
        'Date: ' + niceDate($('#bk-date').value),
        'Time: ' + optText($('#bk-time')),
        'Guests: ' + optText($('#bk-guests')),
        'Name: ' + $('#bk-name').value.trim()];
      var n = $('#bk-note').value.trim(); if (n) lines.push('Note: ' + n);
      openWA(lines.join('\n'));
    });
  }

  /* menu page: tabs */
  var tabs = $$('.tab');
  function showTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
  }
  if (tabs.length) {
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        var id = t.getAttribute('aria-controls'); showTab(id);
        history.replaceState(null, '', id === 'romantic' ? '#romantic' : location.pathname);
      });
      t.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { var n = tabs[(i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; showTab(n.getAttribute('aria-controls'), true); }
      });
    });
    var routeHash = function () {
      if (location.hash === '#romantic') { showTab('romantic'); var r = $('#romantic'); setTimeout(function () { window.scrollTo(0, $('.tabs').offsetTop - parseInt(getComputedStyle(d).getPropertyValue('--hh')) - 8); }, 0); }
      else if (location.hash && $(location.hash) && $('#everyday').contains($(location.hash))) { showTab('everyday'); }
    };
    routeHash(); window.addEventListener('hashchange', routeHash);
  }

  /* menu page: chips jump and follow the reading position */
  var chips = $$('.chip'), chipBar = $('.chips-in');
  if (chips.length && 'IntersectionObserver' in window) {
    var secs = chips.map(function (c) { return $(c.getAttribute('href')); });
    var current = null;
    function setOn(id) {
      if (id === current) return; current = id;
      chips.forEach(function (c) {
        var on = c.getAttribute('href') === '#' + id; c.classList.toggle('on', on);
        if (on) { c.setAttribute('aria-current', 'true'); var l = c.offsetLeft - chipBar.clientWidth / 2 + c.clientWidth / 2; chipBar.scrollTo({ left: l, behavior: 'smooth' }); }
        else c.removeAttribute('aria-current');
      });
    }
    var vis = {};
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { vis[en.target.id] = en.isIntersecting; });
      for (var i = 0; i < secs.length; i++) { if (vis[secs[i].id]) { setOn(secs[i].id); return; } }
      if (secs[0].getBoundingClientRect().top > innerHeight * .3) setOn(secs[0].id);
    }, { rootMargin: '-30% 0px -60% 0px' });
    secs.forEach(function (s) { sio.observe(s); });
    chips.forEach(function (c) { c.addEventListener('click', function () { setOn(c.getAttribute('href').slice(1)); }); });
  }

  /* romantic dinner builder */
  var rd = $('#rd-form');
  if (rd) {
    var courses = $$('.course', rd);
    prepDate($('#rd-date'));
    function plan() { var p = $('input[name="plan"]:checked', rd); return p ? +p.value : 5; }
    function chosen(c) { var i = $('input[type="radio"]:checked', c); return i ? i.value : ''; }
    function refresh() {
      var n = plan(), picked = courses.filter(function (c) { return chosen(c); }).length;
      courses.forEach(function (c) {
        var has = !!chosen(c), off = n === 4 && !has && picked >= 4;
        $$('input', c).forEach(function (i) { i.disabled = off; });
        $('.course-off', c).hidden = !off;
        $('.clear', c).hidden = !has;
      });
      var planLabel = n === 4 ? '4 course meal, EGP 1800 per person' : '5 course meal, EGP 2000 per person';
      $('#rd-plan').textContent = planLabel;
      $('#rd-count').textContent = n === 4 ? 'Choose any four of the five courses: ' + Math.min(picked, 4) + ' of 4 chosen.' : 'Choose one dish from each course: ' + picked + ' of 5 chosen.';
      $('#rd-list').innerHTML = '';
      courses.forEach(function (c) {
        var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span');
        b.textContent = c.getAttribute('data-label'); s.textContent = chosen(c) || (n === 4 && picked >= 4 ? 'Not in your four' : 'Not chosen yet');
        if (!chosen(c)) s.className = 'todo';
        li.appendChild(b); li.appendChild(s); $('#rd-list').appendChild(li);
      });
    }
    rd.addEventListener('change', refresh);
    courses.forEach(function (c) {
      $('.clear', c).addEventListener('click', function () { $$('input', c).forEach(function (i) { i.checked = false; }); refresh(); });
    });
    $('#rd-name').addEventListener('blur', function () { if (this.value) need(this, $('#rd-name-err')); });
    rd.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = plan(), list = courses.filter(function (c) { return chosen(c); }), err = $('#rd-err');
      if (list.length < n) {
        err.textContent = 'Please choose ' + (n - list.length) + ' more ' + (n - list.length === 1 ? 'course' : 'courses') + ' for the ' + n + ' course meal.';
        err.hidden = false; var first = courses.filter(function (c) { return !chosen(c) && !$('input', c).disabled; })[0];
        if (first) first.scrollIntoView({ block: 'start' }); return;
      }
      err.hidden = true;
      if (!need($('#rd-name'), $('#rd-name-err'))) { $('#rd-name').focus(); return; }
      var lines = ['Hello LUUMA Zamalek, I would like to request the Romantic Dinner.',
        (n === 4 ? '4 course meal (EGP 1800 per person)' : '5 course meal (EGP 2000 per person)'),
        'Date: ' + niceDate($('#rd-date').value), 'Time: ' + optText($('#rd-time')), 'Guests: ' + optText($('#rd-guests'))];
      list.forEach(function (c) { lines.push(c.getAttribute('data-label') + ': ' + chosen(c)); });
      lines.push('Name: ' + $('#rd-name').value.trim());
      openWA(lines.join('\n'));
    });
    refresh();
  }
})();
