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

  /* ---------- live background: a fleet map ----------
     Waypoints linked into a navigation graph, with small robots driving
     from waypoint to waypoint, leaving a fading trail and a ping on arrival.
     The graph leans gently toward the cursor. */
  var cv = document.getElementById('bg');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
  var INK = '19,28,46', ORANGE = '200,100,27', TEAL = '15,119,103';
  var nodes = [], edges = [], bots = [], pings = [];
  var mouse = { x: -9999, y: -9999 };

  function build() {
    nodes = []; edges = []; bots = []; pings = [];
    var gap = W < 700 ? 120 : 165;
    var cols = Math.ceil(W / gap) + 2, rows = Math.ceil(H / gap) + 2;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      if (Math.random() < 0.22) continue;                       // leave holes so it reads as a map, not a grid
      nodes.push({
        bx: (c - 0.5) * gap + (Math.random() - 0.5) * gap * 0.7,
        by: (r - 0.5) * gap + (Math.random() - 0.5) * gap * 0.7,
        x: 0, y: 0, ph: Math.random() * 6.28, sp: 0.25 + Math.random() * 0.35, nb: []
      });
    }
    // link each waypoint to its nearest neighbours
    for (var i = 0; i < nodes.length; i++) {
      var d = [];
      for (var j = 0; j < nodes.length; j++) if (j !== i) {
        var dx = nodes[i].bx - nodes[j].bx, dy = nodes[i].by - nodes[j].by, q = dx * dx + dy * dy;
        if (q < gap * gap * 2.6) d.push([q, j]);
      }
      d.sort(function (a, b) { return a[0] - b[0]; });
      for (var k = 0; k < Math.min(3, d.length); k++) {
        var j2 = d[k][1];
        if (nodes[i].nb.indexOf(j2) < 0) { nodes[i].nb.push(j2); nodes[j2].nb.push(i); edges.push([i, j2]); }
      }
    }
    var n = Math.max(4, Math.min(13, Math.round(W * H / 105000)));
    for (var b = 0; b < n; b++) spawn(b);
    place(0);
  }
  function spawn(b) {
    var a, tries = 0;
    do { a = Math.floor(Math.random() * nodes.length); } while (nodes[a].nb.length === 0 && ++tries < 50);
    bots[b] = { a: a, b: next(a, -1), prev: a, t: Math.random(), speed: 55 + Math.random() * 45,
                color: b % 3 === 1 ? TEAL : ORANGE, trail: [], wait: 0 };
  }
  function next(a, prev) {
    var nb = nodes[a].nb;
    if (!nb.length) return a;
    var opts = nb.filter(function (i) { return i !== prev; });
    if (!opts.length) opts = nb;
    return opts[Math.floor(Math.random() * opts.length)];
  }
  function place(t) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var x = n.bx + Math.cos(t * n.sp + n.ph) * 9, y = n.by + Math.sin(t * n.sp * 0.8 + n.ph) * 9;
      var dx = mouse.x - x, dy = mouse.y - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 220) { var f = (1 - d / 220) * 16; x += dx / (d || 1) * f; y += dy / (d || 1) * f; }
      n.x = x; n.y = y;
    }
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function frame(t, dt) {
    place(t);
    ctx.clearRect(0, 0, W, H);

    // navigation graph
    ctx.lineWidth = 1;
    for (var e = 0; e < edges.length; e++) {
      var A = nodes[edges[e][0]], B = nodes[edges[e][1]];
      var mx = (A.x + B.x) / 2 - mouse.x, my = (A.y + B.y) / 2 - mouse.y;
      var near = Math.max(0, 1 - Math.sqrt(mx * mx + my * my) / 240);
      ctx.strokeStyle = 'rgba(' + INK + ',' + (0.13 + near * 0.24) + ')';
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    // waypoints
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      ctx.beginPath(); ctx.arc(n.x, n.y, 3.2, 0, 6.2832);
      ctx.fillStyle = 'rgba(245,242,234,1)'; ctx.fill();
      ctx.strokeStyle = 'rgba(' + INK + ',0.36)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    // arrival pings
    for (var p = pings.length - 1; p >= 0; p--) {
      var pg = pings[p]; pg.age += dt;
      var k = pg.age / 1.1;
      if (k >= 1) { pings.splice(p, 1); continue; }
      var pn = nodes[pg.n];
      ctx.beginPath(); ctx.arc(pn.x, pn.y, 4 + k * 22, 0, 6.2832);
      ctx.strokeStyle = 'rgba(' + pg.color + ',' + (0.5 * (1 - k)) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // robots
    for (var b = 0; b < bots.length; b++) {
      var bot = bots[b], A2 = nodes[bot.a], B2 = nodes[bot.b];
      if (bot.wait > 0) bot.wait -= dt;
      else {
        var len = Math.max(1, Math.hypot(B2.x - A2.x, B2.y - A2.y));
        bot.t += bot.speed * dt / len;
        if (bot.t >= 1) {
          pings.push({ n: bot.b, age: 0, color: bot.color });
          var nx = next(bot.b, bot.a);
          bot.prev = bot.a; bot.a = bot.b; bot.b = nx; bot.t = 0;
          bot.wait = 0.25 + Math.random() * 0.7;                // a short stop at the waypoint
          A2 = nodes[bot.a]; B2 = nodes[bot.b];
        }
      }
      var s = bot.t * bot.t * (3 - 2 * bot.t);                  // ease in and out of each leg
      var x = A2.x + (B2.x - A2.x) * s, y = A2.y + (B2.y - A2.y) * s;
      bot.trail.push(x, y);
      if (bot.trail.length > 90) bot.trail.splice(0, 2);
      for (var q = 0; q < bot.trail.length; q += 6) {           // dotted, fading trail
        var a = q / bot.trail.length;
        ctx.beginPath(); ctx.arc(bot.trail[q], bot.trail[q + 1], 1.6, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + bot.color + ',' + (a * 0.5) + ')'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, 11, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + bot.color + ',0.14)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 4.6, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + bot.color + ',0.9)'; ctx.fill();
    }
  }

  var raf = null, last = null, clock = 0;
  function loop(ts) {
    if (last === null) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts; clock += dt;
    frame(clock, dt);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !reduce) { last = null; raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  var rt, lastW = 0;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - H) < 140) return;   // ignore mobile address-bar resizes
    clearTimeout(rt); rt = setTimeout(function () { lastW = window.innerWidth; resize(); if (reduce) frame(0, 0); }, 150);
  });
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  lastW = window.innerWidth;
  resize();
  if (reduce) frame(0, 0); else start();
})();
