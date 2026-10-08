# Bloem & Co Inventory: deploy to Vercel with sign-in and a Neon database

## How the project is laid out

```
bloem-co/
  public/            what anyone on the internet can open
    index.html       sign-in page
    login.css
    login.js
  private/           never published; only served to signed-in staff
    app.html         the inventory page
    styles.css
    app.js
  api/               small server functions that run on Vercel
    login.js         checks the username and password
    logout.js        ends the session
    inventory.js     returns the inventory page only if you are signed in
    state.js         reads stock and activity from the database
    action.js        sell, restock, add, edit, delete and reset
    _auth.js         sign-in helpers (not a public URL)
    _db.js           database helpers (not a public URL)
  package.json       lists the Neon database driver
  vercel.json        tells Vercel to publish only /public
  .env.example       the four settings you must add in Vercel
  .gitignore
```

How it works: staff sign in with one shared shop login. The password is checked on the server and a signed, HttpOnly cookie keeps them signed in for 8 hours. The inventory page and the stock data are only returned to signed-in staff. Stock lives in a Neon Postgres database, so every phone and computer shows the same numbers, and two people selling at once cannot push stock below zero. The tables are created automatically the first time the app loads, and the demo stock is added once.

## Step 1: create the free Neon database and copy its connection string

1. Go to https://neon.com and sign up (the Free plan needs no payment).
2. Click **New project**. Name it `bloem-co`, keep the default Postgres version, and choose the region closest to you.
3. When the project opens, click **Connect** at the top of the dashboard.
4. Leave the database and role as the defaults, and copy the connection string. It looks like `postgresql://user:password@host/neondb?sslmode=require`. If the password is hidden, use the show or copy button so the copy includes the real password.
5. Keep that string private. Anyone who has it can read and change your data, so do not post it in a chat, an email or GitHub. You will paste it into Vercel in Step 2.

Free plan limits to know: 1 GB of storage per project, 100 compute hours a month, and the database sleeps after 5 minutes without use (the first request after a quiet spell is a little slower). Plans change, so see https://neon.com/pricing.

## Step 2: choose your settings

Open `.env.example`. You need four settings in Vercel (Project, Settings, Environment Variables):

| Name | What to put |
| --- | --- |
| `SHOP_USER` | The username staff type, for example `owner` |
| `SHOP_PASSWORD` | A long, unique password |
| `SESSION_SECRET` | A random string of 32 or more characters |
| `DATABASE_URL` | The Neon connection string you copied in Step 1 |

To make the `SESSION_SECRET`, run either of these and copy the result:

```
openssl rand -hex 32
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never put these values in a file you commit to GitHub.

## Step 3: deploy

### Option A: Vercel CLI

1. Install Node.js 22 or newer from https://nodejs.org.
2. Unzip the project and open a terminal in the `bloem-co` folder.
3. Install the CLI: `npm install -g vercel`
4. Log in: `vercel login`
5. Create the project:
   `vercel`
   - Set up and deploy? `Y`
   - Which scope? choose your account
   - Link to existing project? `N`
   - Project name? `bloem-co`
   - In which directory is your code located? press Enter
   - Override settings? `N`
6. Add the settings to production. Each command asks you to type the value:
   ```
   vercel env add SHOP_USER production
   vercel env add SHOP_PASSWORD production
   vercel env add SESSION_SECRET production
   vercel env add DATABASE_URL production
   ```
   Paste the Neon connection string when it asks for the `DATABASE_URL` value.
7. Publish with the settings applied:
   `vercel --prod`
8. Open the address it prints, sign in, and the inventory loads from your database.

### Option B: GitHub and the Vercel dashboard

1. Create an empty repository on https://github.com named `bloem-co`.
2. In a terminal inside the `bloem-co` folder run:
   ```
   git init
   git add .
   git commit -m "Bloem & Co inventory"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/bloem-co.git
   git push -u origin main
   ```
3. Go to https://vercel.com/new and click **Import** next to `bloem-co`.
4. On the configure screen set Framework Preset to **Other**, leave the Build, Output and Install commands empty (`vercel.json` already sets the output folder), and keep the root as `./`.
5. Open **Environment Variables** on the same screen and add `SHOP_USER`, `SHOP_PASSWORD`, `SESSION_SECRET` and `DATABASE_URL`. Leave all environments ticked.
6. Click **Deploy**, then open the live address and sign in.

If you add or change settings after a deploy, open **Deployments**, use the three-dot menu on the latest one and choose **Redeploy**. Settings only apply to new deployments.

## Day to day

- Change the password: edit `SHOP_PASSWORD` in Environment Variables and redeploy. To sign everyone out at once, change `SESSION_SECRET` and redeploy.
- Staff sign out with the **Sign out** button.
- The page refreshes itself every minute and whenever the tab comes back into view. The chip at the top shows when it last synced, or "Offline" if it cannot reach the server.
- Start with your own stock: open each demo item with **Edit** and use **Delete item**, then add your real items. The **Reset to demo data** button erases everything and reloads the demo stock, so do not press it once you are using real numbers.
- Update the site: edit the files and run `vercel --prod`, or `git push` if you used Option B.

## Good to know

- This is one shared shop login, not individual accounts.
- To slow down automated password guessing, turn on Vercel's Attack Challenge Mode or add a rate-limit rule under the project's **Firewall** tab.
- Your data lives in your Neon project. Neon keeps a short restore window on the Free plan; export anything important from the Neon dashboard if you need a longer record.

## Troubleshooting

- "Sign-in is not set up yet": one of `SHOP_USER`, `SHOP_PASSWORD` or `SESSION_SECRET` is missing, or the secret is under 16 characters. Add it, then redeploy.
- "The database is not connected yet": `DATABASE_URL` is missing. Add it, then redeploy.
- "Could not reach the database": the Neon connection string is wrong or the project was deleted. Copy a fresh connection string from the Neon dashboard.
- The page says Offline: check your internet connection. The chip returns to Synced after the next successful refresh.
- 404 on the live site: the project root must be the folder that contains `public`, `api` and `vercel.json`.
- Signed in but sent straight back to the sign-in page: the browser is blocking cookies for the site, or `SESSION_SECRET` was changed after you signed in. Sign in again.
