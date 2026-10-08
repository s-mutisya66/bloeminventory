# Bloem & Co Inventory: deploy to Vercel

This is a static site. There is no build step and no server. The folder contains:

- `index.html` the page
- `styles.css` all colours, fonts and layout
- `app.js` all the inventory logic
- `vercel.json` optional Vercel settings

Inventory changes are saved in the visitor's own browser (localStorage). This is a demo, so nothing is shared between devices.

## Option A: Vercel CLI (fastest)

1. Install Node.js (version 18 or newer) from https://nodejs.org if you do not have it.
2. Open a terminal in the `bloem-co` folder.
3. Install the Vercel CLI:
   `npm install -g vercel`
4. Log in:
   `vercel login`
   Follow the prompt (email link or GitHub).
5. Create a preview deployment:
   `vercel`
   Answer the prompts:
   - Set up and deploy? `Y`
   - Which scope? choose your account
   - Link to existing project? `N`
   - Project name? `bloem-co` (or any name)
   - In which directory is your code located? press Enter (`./`)
   - If it offers to override settings, answer `N`
6. Vercel prints a preview URL. Open it and check the site.
7. Publish to production:
   `vercel --prod`
   Vercel prints your live address, for example `https://bloem-co.vercel.app`.

To update later, edit the files and run `vercel --prod` again.

## Option B: GitHub + Vercel dashboard (auto-deploys on every change)

1. Create a new empty repository on https://github.com (for example `bloem-co`).
2. In a terminal inside the `bloem-co` folder, run:
   ```
   git init
   git add .
   git commit -m "Bloem & Co inventory demo"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/bloem-co.git
   git push -u origin main
   ```
3. Go to https://vercel.com/new and sign in.
4. Click **Import** next to the `bloem-co` repository (connect GitHub first if asked).
5. On the configure screen set:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: leave empty
   - Output Directory: leave empty
   - Install Command: leave empty
6. Click **Deploy**. After about a minute Vercel shows your live URL.
7. Every `git push` to `main` now redeploys the site automatically.

## Add your own domain (optional)

1. In the Vercel dashboard open the project, then **Settings**, then **Domains**.
2. Enter your domain and click **Add**.
3. Add the DNS records Vercel shows at your domain registrar. Vercel issues the HTTPS certificate for you.

## Troubleshooting

- Page shows unstyled text: check that `styles.css` and `app.js` sit in the same folder as `index.html`.
- 404 on the live site: the Root Directory must be the folder that contains `index.html`.
- Data looks reset: browser data is per device and per browser. Clearing site data or using a private window starts from the demo data again.
