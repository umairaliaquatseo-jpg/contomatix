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
  camera.position.z = 26;

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

  var mouseX = 0, mouseY = 0;
  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / width) - 0.5;
    mouseY = ((e.clientY - rect.top) / height) - 0.5;
  });

  function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += 0.0018;
    group.rotation.x += (mouseY * 0.3 - group.rotation.x) * 0.02;
    group.rotation.y += (mouseX * 0.2) * 0.01;
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

// ---------- Scroll-reveal: fade cards & sections in as they enter the viewport ----------
function initScrollReveal() {
  var selectors = '.service-card, .process-step, .post-card, .team-card, .story-card, ' +
    '.story-featured, .cta-band, .section-head, .contact-info-card, .contact-form, ' +
    '.newsletter-block, .feature-copy, .feature-art';
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

document.addEventListener('DOMContentLoaded', function () {
  initHeroScene('hero-canvas');
  initAmbientScene('ambient-canvas');
  initScrollReveal();
  initCounters();
});
