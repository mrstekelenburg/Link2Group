/* Beweging op link2group.nl, in dezelfde stijl als link2leads.nl:
   blokken verschijnen bij scrollen, cijfers tellen op en de inbox in de combinatie-sectie loopt live. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var en = (document.documentElement.getAttribute('lang') || 'nl').indexOf('en') === 0;

  /* 1. Verschijnen bij scrollen. Klasse wordt pas met JS gezet, zodat alles zichtbaar blijft als het script niet laadt. */
  var sel = [
    '.section .kicker', '.section h2', '.section .intro', '.router .card', '.combo-top .live',
    '.combo-cta', '.step', '.case', '.review', '.proof-links', '.about figure', '.about > div',
    '.faq details', '.closing h2', '.closing p', '.closing .btn', '.panel', '.marquee'
  ].join(',');
  var els = Array.prototype.slice.call(document.querySelectorAll(sel));
  if (!reduce && 'IntersectionObserver' in window) {
    els.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function () { el.classList.add('in'); }, 70 * n++);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* 2. Cijfers die optellen (data-count="1500000" data-suffix="+"). */
  function fmt(v, dec) {
    var s = v.toFixed(dec);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : '.');
    return parts.join(en ? '.' : ',');
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function run(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = pre + fmt(target, dec) + suf; return; }
    var st = el.closest('.stat'); if (st) st.style.minWidth = Math.ceil(st.getBoundingClientRect().width) + 'px';
    el.style.display = 'inline-block'; el.style.minWidth = Math.ceil(el.getBoundingClientRect().width) + 'px';
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(target * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* 3. Live inbox: echte reacties uit onze campagnes (geanonimiseerd), daarna setter en afspraak. */
  var list = document.getElementById('liveList');
  if (list) {
    var POOL = en ? [
      ['AE', 'E-learning company', 'Happy to have a quick call, next week works, just let me know when.'],
      ['RS', 'Creative agency', 'Sounds interesting. How would that work?'],
      ['ME', 'Importer', 'Interesting, I would like to see what you can do for us. When do you have time for a short call?'],
      ['FS', 'IT company', 'I am happy to have a call about this next week.'],
      ['MP', 'Technology company', 'Definitely interesting to look at the options.'],
      ['PV', 'Consultancy', 'Curious whether you can save me money.']
    ] : [
      ['AE', 'E-learningbedrijf', 'Prima om even te bellen, komende week is prima, roep maar wanneer.'],
      ['RS', 'Creatief bureau', 'Klinkt interessant. Hoe zou dat werken dan?'],
      ['ME', 'Importeur', 'Interessant, ik wil graag bekijken of jullie iets voor ons kunnen betekenen. Wanneer heb je tijd voor een korte call?'],
      ['FS', 'ICT-bedrijf', 'Ik wil daar volgende week wel even over bellen.'],
      ['MP', 'Technologiebedrijf', 'Zeker interessant om naar de mogelijkheden te kijken.'],
      ['PV', 'Adviesbureau', 'Ben benieuwd of je kunt besparen voor me.']
    ];
    var STAGES = en
      ? [['Positive reply', 'st-warm'], ['Setter calls back', 'st-call'], ['Meeting booked', 'st-done']]
      : [['Positieve reactie', 'st-warm'], ['Setter belt na', 'st-call'], ['Afspraak ingepland', 'st-done']];
    var DAYS = en ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['ma', 'di', 'wo', 'do', 'vr'];
    var idx = 0;
    function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function slot() { return DAYS[Math.floor(Math.random() * DAYS.length)] + ' ' + (9 + Math.floor(Math.random() * 8)) + ':00'; }
    function build(r, stage, anim) {
      var row = document.createElement('div');
      row.className = 'lrow' + (anim ? ' drop' : '');
      var label = stage === 2 ? STAGES[2][0] + ' · ' + slot() : STAGES[stage][0];
      row.innerHTML = '<span class="av">' + r[0] + '</span><div class="lbody"><b>' + esc(r[1]) + '</b><p>' + esc(r[2]) +
        '</p></div><span class="badge ' + STAGES[stage][1] + '">' + label + '</span>';
      return row;
    }
    function setStage(badge, n) {
      badge.className = 'badge ' + STAGES[n][1];
      badge.textContent = n === 2 ? STAGES[2][0] + ' · ' + slot() : STAGES[n][0];
    }
    /* Direct gevuld, zodat de kaart nooit leeg of half staat. */
    [[2, 2], [1, 1], [0, 0]].forEach(function (s) { list.appendChild(build(POOL[s[0]], s[1], false)); });
    idx = 3;
    function addRow() {
      if (document.hidden) return;
      var row = build(POOL[idx++ % POOL.length], 0, true);
      list.insertBefore(row, list.firstChild);
      var badge = row.querySelector('.badge');
      setTimeout(function () { setStage(badge, 1); }, 2200);
      setTimeout(function () { setStage(badge, 2); }, 4400);
      var last = list.lastElementChild;
      if (list.children.length > 3 && last) {
        last.classList.add('leave');
        setTimeout(function () { if (last.parentNode) last.parentNode.removeChild(last); }, 320);
      }
    }
    var started = false;
    function start() {
      if (started) return; started = true;
      if (!reduce) setInterval(addRow, 5200);
    }
    if ('IntersectionObserver' in window) {
      var lo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { start(); lo.disconnect(); } });
      }, { threshold: 0.25 });
      lo.observe(list);
    } else { start(); }
  }

  /* 4. Sterren achter de afsluiter, zoals op link2leads.nl. */
  var stars = document.getElementById('stars');
  if (stars && !reduce) {
    for (var i = 0; i < 50; i++) {
      var s = document.createElement('i');
      s.style.cssText = 'left:' + (Math.random() * 100) + '%;top:' + (Math.random() * 100) + '%;--d:' +
        (2 + Math.random() * 4) + 's;--dl:' + (Math.random() * 3) + 's';
      stars.appendChild(s);
    }
  }

  /* 5. Menubalk en taalkeuze, zelfde gedrag als op link2leads.nl. */
  var nav = document.querySelector('nav.l2n'), b = document.getElementById('l2nBurger'), m = document.getElementById('l2nMenu');
  function setMenu(o) { if (!b || !m) return; b.classList.toggle('open', o); m.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); }
  window.l2nClose = function () { setMenu(false); };
  if (b) b.addEventListener('click', function () { setMenu(!m.classList.contains('open')); });
  function sc() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 60); }
  window.addEventListener('scroll', sc, { passive: true }); sc();

  var lw = document.querySelector('.l2l-lang'), lt = lw && lw.querySelector('.l2l-lang-toggle');
  if (lt) {
    lt.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var o = lw.classList.toggle('open');
      lt.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!lw.contains(e.target)) { lw.classList.remove('open'); lt.setAttribute('aria-expanded', 'false'); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    setMenu(false);
    if (lw) { lw.classList.remove('open'); lt.setAttribute('aria-expanded', 'false'); }
  });
})();
