# Contomatix.com

SEO services website — link building, link insertion, guest posting, on-page SEO, off-page SEO, and keyword research — plus a blog. Built with Node.js (Express + EJS).

## Run locally

```bash
npm install
npm start
```

Site runs at http://localhost:3000

For auto-reload during development:

```bash
npm run dev
```

## Project structure

```
server.js            — Express app & routes
data/                 — services, blog posts, team (edit these to change content)
views/partials/       — layout, header, footer
views/pages/          — one file per page/route
public/css/style.css  — all styling (design tokens at the top)
public/js/main.js     — nav interactions + Three.js 3D scenes
```

## Editing content

- **Services:** edit `data/services.js`
- **Blog posts:** edit `data/blog.js` (add a new object per post — real posts + SEO strategy to be added later)
- **Team:** edit `data/team.js`
- **Colors/fonts:** edit the `:root` variables at the top of `public/css/style.css`
- **WhatsApp number / contact email / site URL:** set in `data/site.js` or via the `WHATSAPP_NUMBER`, `CONTACT_EMAIL`, and `SITE_URL` environment variables
- **Logo:** shared SVG mark in `views/partials/logo.ejs` (used by header + footer); favicon at `public/images/favicon.svg`

## Environment variables & contact form email

The contact form (`POST /contact`) sends submissions by email via SMTP (Nodemailer). Copy `.env.example` to `.env` locally, or set the same variables in Hostinger's Node.js environment-variables panel:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — SMTP credentials (Gmail app password, Hostinger mailbox, or any transactional provider)
- `CONTACT_TO` — where form submissions are delivered (defaults to `SMTP_USER`)
- `WHATSAPP_NUMBER`, `CONTACT_EMAIL`, `SITE_URL` — public contact details

If SMTP is not configured, submissions are logged to the server console (visible in `npm start` output / Hostinger logs) instead of being emailed — configure SMTP before going live so leads aren't missed.

## Deploying (GitHub → Hostinger)

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial Contomatix site"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. In Hostinger's hPanel, open the **Node.js** section and create a new Node.js app.
3. Connect it to this GitHub repository (Hostinger's Git integration) and set the deploy branch to `main`.
4. Set the **startup file** to `server.js` and the **entry command** to `npm start`.
5. Set the `PORT` environment variable if Hostinger requires a specific port (the app already reads `process.env.PORT`).
6. Every future `git push` to `main` will redeploy the site automatically once Hostinger's Git auto-deploy is enabled.
