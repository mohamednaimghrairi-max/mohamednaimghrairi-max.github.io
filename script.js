/* Naim Ghrairi — portfolio. Live background + scroll reveals. No dependencies. */
(function () {
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  var els = document.querySelectorAll('.sec-head,.about > *,.feature > .eyebrow,.feature > .lead,.challenge,.part-title,.step,.fig,.results,.note,.card,.tl-item,.box,.contact .wrap > *');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el, i) {
      el.classList.add('rv');
      el.style.transitionDelay = (i % 3) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- live background: scrolling telemetry traces ---------- */
  var cv = document.getElementById('bg');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;

  // Each trace is a signal you would see on this page's subject matter:
  // HPPC-style current pulses with voltage relaxation, plus slow drift.
  var COLORS = ['200,100,27', '15,119,103', '19,28,46'];
  var traces = [];
  function makeTraces() {
    traces = [];
    var n = Math.max(4, Math.round(H / 170));
    for (var i = 0; i < n; i++) {
      traces.push({
        y: (i + 0.6) / n * H,
        amp: 16 + Math.random() * 20,
        speed: 22 + Math.random() * 30,          // px per second
        period: 260 + Math.random() * 280,        // px between pulses
        duty: 0.18 + Math.random() * 0.16,
        tau: 26 + Math.random() * 30,
        wob: 0.004 + Math.random() * 0.005,
        phase: Math.random() * 1000,
        color: COLORS[i % COLORS.length],
        alpha: 0.22 + Math.random() * 0.12,
        dir: i % 2 ? 1 : -1
      });
    }
  }
  function signal(tr, x) {
    var u = ((x % tr.period) + tr.period) % tr.period;
    var on = tr.period * tr.duty, v;
    if (u < on) v = -1 + 0.35 * (1 - Math.exp(-u / tr.tau)) * -1 + 0.35;   // pulse: sharp drop then sag
    else v = -0.45 * Math.exp(-(u - on) / tr.tau);                          // relaxation back to rest
    return v * tr.amp + Math.sin(x * tr.wob + tr.phase) * tr.amp * 0.35;
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeTraces();
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < traces.length; i++) {
      var tr = traces[i], off = t * tr.speed * tr.dir + tr.phase;
      ctx.beginPath();
      for (var x = 0; x <= W; x += 3) {
        var y = tr.y + signal(tr, x + off);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(' + tr.color + ',' + tr.alpha + ')';
      ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
      ctx.stroke();
      // a moving sample point riding the trace
      var px = ((t * 60 * (0.6 + i * 0.13)) % (W + 80)) - 40;
      if (tr.dir < 0) px = W - px;
      var py = tr.y + signal(tr, px + off);
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + tr.color + ',' + Math.min(1, tr.alpha * 2.6) + ')';
      ctx.fill();
    }
  }
  var raf = null, t0 = null;
  function loop(ts) {
    if (t0 === null) t0 = ts;
    draw((ts - t0) / 1000);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !reduce) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (reduce) draw(0); }, 150); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  resize();
  if (reduce) draw(0); else start();
})();
