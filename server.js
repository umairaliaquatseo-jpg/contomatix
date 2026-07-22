require('dotenv').config();

const fs = require('fs');
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const services = require('./data/services');
const blogPosts = require('./data/blog');
const team = require('./data/team');
const reviews = require('./data/reviews');
const site = require('./data/site');
const { sendContactEmail, smtpConfigured } = require('./lib/mailer');

// Only render a member's <img> if the photo file actually exists, so a
// missing upload falls back to the initials avatar instead of a broken image.
function withPhotoCheck(member) {
  return {
    ...member,
    hasPhoto: Boolean(member.photo && fs.existsSync(path.join(__dirname, 'public', member.photo)))
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');

// Static assets
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    // Some hosting/CDN layers drop the charset param from static responses,
    // which can make browsers mis-decode non-ASCII bytes (e.g. em-dashes in
    // CSS comments) and silently break CSS parsing. Force it explicitly.
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
    if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    // Without this, browsers can cache CSS/JS aggressively and keep showing an
    // old version after a deploy until the user manually hard-refreshes.
    // no-cache forces a fast revalidation check on every load instead.
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) res.setHeader('Cache-Control', 'no-cache');
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper: pass common data to every view
app.use((req, res, next) => {
  res.locals.services = services;
  res.locals.currentPath = req.path;
  res.locals.siteName = 'Contomatix';
  res.locals.site = site;
  // Fallbacks so views that don't pass these (e.g. 404) still render.
  res.locals.description = 'Contomatix — link building and SEO services.';
  next();
});

// ---------- Routes ----------

app.get('/sitemap.xml', (req, res) => {
  const staticPaths = ['/', '/about', '/team', '/contact', '/blog', '/privacy-policy', '/terms'];
  const servicePaths = services.map(s => `/services/${s.slug}`);
  const blogPaths = blogPosts.map(p => `/blog/${p.slug}`);
  const urls = [...staticPaths, ...servicePaths, ...blogPaths];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.baseUrl}${u}</loc></url>`).join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: ${site.baseUrl}/sitemap.xml`);
});

app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Contomatix — Link Building & SEO Services',
    description: 'Contomatix helps brands grow organic traffic through link building, guest posting, on-page & off-page SEO, and keyword research.',
    pageClass: 'page-home',
    reviews
  });
});

app.get('/services/:slug', (req, res) => {
  const service = services.find(s => s.slug === req.params.slug);
  if (!service) return res.status(404).render('pages/404', { title: 'Page not found', pageClass: 'page-404' });
  res.render('pages/service', {
    title: `${service.title} — Contomatix`,
    description: service.summary,
    pageClass: 'page-service',
    service
  });
});

app.get('/blog', (req, res) => {
  const category = req.query.category || 'All';
  const categories = ['All', ...new Set(blogPosts.map(p => p.category))];
  const filtered = category === 'All' ? blogPosts : blogPosts.filter(p => p.category === category);
  res.render('pages/blog', {
    title: 'Blog — Contomatix',
    description: 'SEO strategy, link building tactics, and content marketing insights from Contomatix.',
    pageClass: 'page-blog',
    posts: filtered,
    categories,
    activeCategory: category
  });
});

app.get('/blog/:slug', (req, res) => {
  const post = blogPosts.find(p => p.slug === req.params.slug);
  if (!post) return res.status(404).render('pages/404', { title: 'Page not found', pageClass: 'page-404' });
  const author = post.author ? team.find(m => m.name === post.author) : null;
  const wordCount = post.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));
  res.render('pages/blog-post', {
    title: `${post.title} — Contomatix Blog`,
    description: post.excerpt,
    pageClass: 'page-blog-post',
    post,
    author: author ? withPhotoCheck(author) : null,
    readMinutes
  });
});

app.get('/team', (req, res) => {
  res.render('pages/team', {
    title: 'Our Team — Contomatix',
    description: 'Meet the team behind Contomatix.',
    pageClass: 'page-team',
    team: team.map(withPhotoCheck)
  });
});

app.get('/about', (req, res) => {
  res.render('pages/about', {
    title: 'About Us — Contomatix',
    description: 'Learn what Contomatix does and how we help brands rank higher.',
    pageClass: 'page-about'
  });
});

app.get('/privacy-policy', (req, res) => {
  res.render('pages/privacy', {
    title: 'Privacy Policy — Contomatix',
    description: 'How Contomatix collects, uses, and protects your information.',
    pageClass: 'page-legal'
  });
});

app.get('/terms', (req, res) => {
  res.render('pages/terms', {
    title: 'Terms of Service — Contomatix',
    description: 'The terms governing use of contomatix.com and Contomatix services.',
    pageClass: 'page-legal'
  });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us — Contomatix',
    description: 'Get in touch with Contomatix for link building and SEO services.',
    pageClass: 'page-contact',
    submitted: false,
    error: null,
    form: {}
  });
});

app.post('/contact', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const message = (req.body.message || '').trim();

  const renderContact = (state) => res.render('pages/contact', {
    title: 'Contact Us — Contomatix',
    description: 'Get in touch with Contomatix for link building and SEO services.',
    pageClass: 'page-contact',
    submitted: false,
    error: null,
    form: { name, email, message },
    ...state
  });

  if (!name || !email || !message) {
    return renderContact({ error: 'Please fill in your name, email, and message.' });
  }

  try {
    const result = await sendContactEmail({ name, email, message });
    if (!result.sent) {
      // SMTP not configured — keep the lead in the server log rather than losing it.
      console.warn('[contact] SMTP not configured — submission logged only:', { name, email, message });
    }
    return renderContact({ submitted: true, form: {} });
  } catch (err) {
    console.error('[contact] Failed to send email:', err);
    return renderContact({ error: 'Sorry — something went wrong sending your message. Please try again, or reach us on WhatsApp or email instead.' });
  }
});

// 404
app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Page not found', pageClass: 'page-404' });
});

app.listen(PORT, () => {
  console.log(`Contomatix site running at http://localhost:${PORT}`);
});
