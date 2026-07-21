// ---------- Cookie consent banner ----------
(function () {
  var KEY = 'contomatix-cookie-consent';
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (!localStorage.getItem(KEY)) {
    banner.hidden = false;
  }
  function dismiss(value) {
    localStorage.setItem(KEY, value);
    banner.hidden = true;
  }
  var acceptBtn = document.getElementById('cookie-accept');
  var declineBtn = document.getElementById('cookie-decline');
  if (acceptBtn) acceptBtn.addEventListener('click', function () { dismiss('accepted'); });
  if (declineBtn) declineBtn.addEventListener('click', function () { dismiss('declined'); });
})();

// ---------- Blog post: auto-generated table of contents ----------
function initTableOfContents() {
  const article = document.querySelector('.post-content');
  if (!article) return;
  const headings = article.querySelectorAll('h2');
  if (headings.length < 3) return; // not worth a TOC for a short post

  const used = new Set();
  const items = [...headings].map(function (h) {
    let slug = h.textContent.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    let unique = slug;
    let i = 2;
    while (used.has(unique)) { unique = slug + '-' + i++; }
    used.add(unique);
    h.id = unique;
    return { id: unique, text: h.textContent };
  });

  const toc = document.createElement('nav');
  toc.className = 'post-toc';
  toc.setAttribute('aria-label', 'Table of contents');
  toc.innerHTML =
    '<button class="post-toc-toggle" type="button" aria-expanded="true">' +
      '<span>On this page</span>' +
      '<svg width="12" height="7" viewBox="0 0 12 7" aria-hidden="true"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>' +
    '</button>' +
    '<ol class="post-toc-list">' +
      items.map(function (it) { return '<li><a href="#' + it.id + '">' + it.text + '</a></li>'; }).join('') +
    '</ol>';

  article.parentElement.insertBefore(toc, article);

  const toggle = toc.querySelector('.post-toc-toggle');
  toggle.addEventListener('click', function () {
    const open = toc.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(!open ? false : true));
    toc.classList.toggle('collapsed');
  });

  toc.querySelectorAll('.post-toc-list a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Highlight the active section while scrolling
  if ('IntersectionObserver' in window) {
    const links = toc.querySelectorAll('.post-toc-list a');
    const map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach(function (h) { obs.observe(h); });
  }
}

// ---------- Mobile nav ----------
(function () {
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  var dropdownToggle = document.querySelector('.nav-dropdown-toggle');
  var dropdown = document.querySelector('.nav-dropdown');
  if (dropdownToggle && dropdown) {
    dropdownToggle.addEventListener('click', function (e) {
      if (window.innerWidth <= 640) {
        e.preventDefault();
        dropdown.classList.toggle('open');
      }
    });
  }
})();

// ---------- Hero 3D scene: rotating link/node network ----------
function initHeroScene(canvasId) {
  var container = document.getElementById(canvasId);
  if (!container || typeof THREE === 'undefined') return;

  var width = container.clientWidth;
  var height = container.clientHeight;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.z = 32;

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  var group = new THREE.Group();
  scene.add(group);

  var NODE_COUNT = 26;
  var nodes = [];
  var nodeGeo = new THREE.SphereGeometry(0.35, 12, 12);
  var tealMat = new THREE.MeshBasicMaterial({ color: 0x0ea5a0 });
  var amberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

  for (var i = 0; i < NODE_COUNT; i++) {
    var mat = i % 4 === 0 ? amberMat : tealMat;
    var mesh = new THREE.Mesh(nodeGeo, mat);
    var radius = 9 + Math.random() * 4;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos((Math.random() * 2) - 1);
    mesh.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
    group.add(mesh);
    nodes.push(mesh);
  }

  // connecting lines between nearby nodes
  var lineMat = new THREE.LineBasicMaterial({ color: 0xcdbfa9, transparent: true, opacity: 0.7 });
  for (var a = 0; a < nodes.length; a++) {
    for (var b = a + 1; b < nodes.length; b++) {
      if (nodes[a].position.distanceTo(nodes[b].position) < 9 && Math.random() > 0.75) {
        var geometry = new THREE.BufferGeometry().setFromPoints([nodes[a].position, nodes[b].position]);
        group.add(new THREE.Line(geometry, lineMat));
      }
    }
  }

  // 3D chain-link object: two interlocked tori (right side of the hero)
  var chain = new THREE.Group();
  var torusGeo = new THREE.TorusGeometry(2.6, 0.5, 20, 56);
  var chainTeal = new THREE.MeshBasicMaterial({ color: 0x0ea5a0, wireframe: true, transparent: true, opacity: 0.55 });
  var chainAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.5 });
  var ringA = new THREE.Mesh(torusGeo, chainTeal);
  var ringB = new THREE.Mesh(torusGeo, chainAmber);
  ringB.position.x = 3.4;
  ringB.rotation.y = Math.PI / 2;
  chain.add(ringA);
  chain.add(ringB);
  chain.position.set(13.5, 4.5, -2);
  chain.rotation.z = 0.4;
  scene.add(chain);

  // a lone slow ring on the left for balance
  var soloRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.34, 18, 48), chainTeal);
  soloRing.position.set(-14.5, -5.5, -3);
  scene.add(soloRing);

  var mouseX = 0, mouseY = 0;
  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / width) - 0.5;
    mouseY = ((e.clientY - rect.top) / height) - 0.5;
  });

  var t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.01;
    group.rotation.y += 0.0018;
    group.rotation.x += (mouseY * 0.3 - group.rotation.x) * 0.02;
    group.rotation.y += (mouseX * 0.2) * 0.01;
    chain.rotation.x += 0.005;
    chain.rotation.y += 0.003;
    chain.position.y = 4.5 + Math.sin(t) * 0.7;
    soloRing.rotation.x += 0.004;
    soloRing.rotation.y += 0.006;
    soloRing.position.y = -5.5 + Math.cos(t * 0.8) * 0.5;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function () {
    var w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// ---------- Ambient background scene for inner pages: sparse floating particles ----------
function initAmbientScene(canvasId) {
  var container = document.getElementById(canvasId);
  if (!container || typeof THREE === 'undefined') return;

  var width = container.clientWidth;
  var height = container.clientHeight;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.z = 20;

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  var particleCount = 60;
  var positions = new Float32Array(particleCount * 3);
  for (var i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var mat = new THREE.PointsMaterial({ color: 0x0ea5a0, size: 0.18, transparent: true, opacity: 0.6 });
  var points = new THREE.Points(geo, mat);
  scene.add(points);

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.0006;
    points.rotation.x += 0.0002;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function () {
    var w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// ---------- GSAP scroll animations (seomatrix-style) ----------
function initGsapScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return false;
  gsap.registerPlugin(ScrollTrigger);

  var ease = 'power3.out';

  // Section heads: fade up with a touch of scale for polish
  gsap.utils.toArray('.section-head').forEach(function (el) {
    gsap.from(el, {
      y: 34, scale: 0.975, opacity: 0, duration: 0.6, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // Cards: staggered rise (batched per grid)
  gsap.utils.toArray('.service-grid, .process-list, .post-grid, .team-grid, .faq-list').forEach(function (grid) {
    var items = grid.children;
    if (!items.length) return;
    gsap.from(items, {
      y: 46, opacity: 0, duration: 0.55, ease: 'power4.out', stagger: 0.09,
      scrollTrigger: { trigger: grid, start: 'top 86%' }
    });
  });

  // Hero floating stat chips: settle in after the headline
  if (gsap.utils.toArray('.hero-chip').length) {
    gsap.from('.hero-chip', {
      y: 26, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.12, delay: 0.55
    });
  }

  // Hero dashboard shot: gentle parallax drift as you scroll past it
  var heroShot = document.querySelector('.hero-shot');
  if (heroShot) {
    gsap.to(heroShot, {
      y: -34, ease: 'none',
      scrollTrigger: { trigger: heroShot, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    });
  }

  // Trust marquee: fade the whole strip in
  var trustStrip = document.querySelector('.trust-strip');
  if (trustStrip) {
    gsap.from(trustStrip, {
      opacity: 0, y: 20, duration: 0.6, ease: ease,
      scrollTrigger: { trigger: trustStrip, start: 'top 92%' }
    });
  }

  // Feature rows: media and copy slide in from opposite sides (left50To0 / right50To0)
  gsap.utils.toArray('.feature-row').forEach(function (row) {
    var media = row.querySelector('.feature-media');
    var copy = row.querySelector('div:not(.feature-media)');
    var flip = row.classList.contains('flip');
    if (media) gsap.from(media, {
      x: flip ? 70 : -70, opacity: 0, duration: 0.65, ease: ease,
      scrollTrigger: { trigger: row, start: 'top 82%' }
    });
    if (copy) gsap.from(copy, {
      x: flip ? -70 : 70, opacity: 0, duration: 0.65, ease: ease, delay: 0.08,
      scrollTrigger: { trigger: row, start: 'top 82%' }
    });
  });

  // Service rows: copy and media slide in from opposite sides, alternating
  gsap.utils.toArray('.service-row').forEach(function (row) {
    var flip = row.classList.contains('flip');
    gsap.from(row.querySelector('.sr-copy'), {
      x: flip ? 70 : -70, opacity: 0, duration: 0.6, ease: ease,
      scrollTrigger: { trigger: row, start: 'top 82%' }
    });
    gsap.from(row.querySelector('.sr-media'), {
      x: flip ? -70 : 70, opacity: 0, duration: 0.6, ease: ease, delay: 0.08,
      scrollTrigger: { trigger: row, start: 'top 82%' }
    });
  });

  // Big panels: subtle scale-in
  gsap.utils.toArray('.stats-band .stats-grid, .cta-band, .compare, .video-panel, .newsletter-block').forEach(function (el) {
    gsap.from(el, {
      y: 40, scale: 0.965, opacity: 0, duration: 0.6, ease: ease,
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  return true;
}

// ---------- Scroll-reveal fallback (no GSAP): fade cards in as they enter the viewport ----------
function initScrollReveal() {
  var selectors = '.service-card, .process-step, .post-card, .team-card, .story-card, ' +
    '.story-featured, .cta-band, .section-head, .contact-info-card, .contact-form, ' +
    '.newsletter-block, .feature-row, .faq-list details, .stats-band .stats-grid';
  var items = document.querySelectorAll(selectors);
  if (!items.length) return;

  // Applied via JS so content stays visible if JS never runs.
  items.forEach(function (el) { el.classList.add('reveal'); });

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      // Stagger siblings that reveal together
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.classList.contains('reveal');
      });
      var idx = siblings.indexOf(el);
      el.style.transitionDelay = (idx > 0 ? Math.min(idx * 0.08, 0.4) : 0) + 's';
      el.classList.add('in-view');
      observer.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(function (el) { observer.observe(el); });
}

// ---------- Hero stats: count-up ----------
function initCounters() {
  document.querySelectorAll('.hero-stat .num').forEach(function (el) {
    var match = el.textContent.match(/^(\d+)(.*)$/);
    if (!match) return;
    var target = parseInt(match[1], 10);
    var suffix = match[2];
    if (target <= 1) return;
    var start = null;
    var duration = 1100;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ---------- Video panel: 30s synced progress + time ----------
function initVideoPanels() {
  document.querySelectorAll('.video-panel').forEach(function (panel) {
    var fill = panel.querySelector('.vc-progress-fill');
    var time = panel.querySelector('.vc-time');
    var img = panel.querySelector('.video-body img');
    if (!fill || !time) return;
    var DURATION = 30;
    var elapsed = 0;
    var lastTs = null;
    var paused = false;
    function fmt(s) { return '0:' + String(Math.floor(s)).padStart(2, '0'); }
    function render() {
      var t = elapsed % DURATION;
      fill.style.width = (2 + (t / DURATION) * 96).toFixed(1) + '%';
      time.textContent = fmt(t) + ' / ' + fmt(DURATION);
    }
    function tick(now) {
      if (lastTs === null) lastTs = now;
      if (!paused) elapsed += (now - lastTs) / 1000;
      lastTs = now;
      render();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function setPaused(next) {
      paused = next;
      panel.classList.toggle('is-paused', paused);
      if (img) img.style.animationPlayState = paused ? 'paused' : 'running';
      var icons = panel.querySelectorAll('.vc-play, .vpt-icon');
      icons.forEach(function (el) { el.textContent = paused ? '▶' : '❚❚'; });
    }
    setPaused(false);

    var playBtn = panel.querySelector('.vc-play');
    var toggleBtn = panel.querySelector('.video-play-toggle');
    if (playBtn) playBtn.addEventListener('click', function () { setPaused(!paused); });
    if (toggleBtn) toggleBtn.addEventListener('click', function () { setPaused(!paused); });
  });
}

// ---------- Big stat counters (count up when scrolled into view) ----------
function initBigCounters() {
  var nums = document.querySelectorAll('[data-count]');
  if (!nums.length) return;
  function run(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var start = null;
    var duration = 1400;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });
  nums.forEach(function (el) { obs.observe(el); });
}

// ---------- Cursor-follow glow on cards (theme hover animation) ----------
function initHoverGlow() {
  var cards = document.querySelectorAll(
    '.service-card, .testimonial-card, .team-card, .post-card, .process-step, .contact-info-card, .story-card'
  );
  cards.forEach(function (el) {
    el.classList.add('hover-glow');
    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });
}

// ---------- Subtle 3D tilt on media panels ----------
function initTilt() {
  document.querySelectorAll('.feature-media, [data-tilt], .hero-shot-frame').forEach(function (el) {
    el.style.transition = 'transform 0.18s ease';
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
      var ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
      el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  });
}

// ---------- Before/after comparison slider ----------
function initCompare() {
  document.querySelectorAll('[data-compare]').forEach(function (el) {
    function setCut(clientX) {
      var r = el.getBoundingClientRect();
      var pct = Math.min(Math.max((clientX - r.left) / r.width, 0.06), 0.94) * 100;
      el.style.setProperty('--cut', pct.toFixed(2) + '%');
    }
    var dragging = false;
    el.addEventListener('pointerdown', function (e) {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      setCut(e.clientX);
    });
    el.addEventListener('pointermove', function (e) {
      if (dragging) setCut(e.clientX);
    });
    ['pointerup', 'pointercancel'].forEach(function (evt) {
      el.addEventListener(evt, function () { dragging = false; });
    });
    // gentle auto-sweep on first view so users notice it's interactive
    if ('IntersectionObserver' in window) {
      var swept = false;
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !swept) {
            swept = true;
            el.style.transition = '--cut 0s';
            var start = null;
            function sweep(ts) {
              if (!start) start = ts;
              var p = Math.min((ts - start) / 1600, 1);
              var eased = 0.5 + Math.sin(p * Math.PI * 2) * 0.18 * (1 - p);
              el.style.setProperty('--cut', (eased * 100).toFixed(2) + '%');
              if (p < 1) requestAnimationFrame(sweep);
            }
            requestAnimationFrame(sweep);
            obs.disconnect();
          }
        });
      }, { threshold: 0.4 }).observe(el);
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initHeroScene('hero-canvas');
  initAmbientScene('ambient-canvas');
  if (!initGsapScroll()) initScrollReveal();
  initCounters();
  initHoverGlow();
  initTilt();
  initCompare();
  initVideoPanels();
  initBigCounters();
  initTableOfContents();
});
