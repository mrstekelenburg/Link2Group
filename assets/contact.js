/* Contactformulier van link2group.nl.
   Gaat naar hetzelfde endpoint als het formulier op link2leads.nl, zodat de vraag
   in dezelfde inbox landt en de afzender dezelfde bevestigingsmail krijgt. */
(function () {
  var f = document.getElementById('contactForm');
  if (!f) return;
  var en = (document.documentElement.getAttribute('lang') || 'nl').indexOf('en') === 0;
  var T = en ? {
    name: 'Please enter your name.',
    mail: 'Please enter a valid email address, for example name@company.com.',
    busy: 'Sending...',
    ok: 'Thanks. Your question is in and a confirmation is on its way to your inbox. You will hear from us within one working day.',
    done: 'Sent',
    fail: 'Sending failed. Please email us directly at info@link2leads.nl.'
  } : {
    name: 'Vul je naam in.',
    mail: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.',
    busy: 'Versturen...',
    ok: 'Dank je. Je vraag is binnen en je hebt een bevestiging in je mailbox. Je krijgt binnen een werkdag antwoord.',
    done: 'Verstuurd',
    fail: 'Versturen is niet gelukt. Mail ons direct op info@link2leads.nl.'
  };
  var btn = document.getElementById('cfSubmit');
  var msg = document.getElementById('cfMsg');
  function show(kind, text) { msg.className = 'cf-msg ' + kind; msg.textContent = text; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = f.name.value.trim();
    var email = f.email.value.trim();
    if (!name) { show('err', T.name); f.name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { show('err', T.mail); f.email.focus(); return; }
    btn.disabled = true;
    var label = btn.textContent;
    btn.textContent = T.busy;
    msg.className = 'cf-msg';
    var q = f.question.value.trim();
    fetch('https://www.link2leads.nl/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        question: '[via link2group.nl] ' + (q || '(geen vraag ingevuld)'),
        website: f.website.value
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) {
        if (r.ok && r.d.ok) {
          f.reset();
          show('ok', T.ok);
          btn.textContent = T.done;
        } else {
          show('err', (r.d && r.d.error) || T.fail);
          btn.disabled = false;
          btn.textContent = label;
        }
      })
      .catch(function () {
        show('err', T.fail);
        btn.disabled = false;
        btn.textContent = label;
      });
  });
})();
