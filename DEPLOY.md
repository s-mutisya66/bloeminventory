# Bloem & Co: deploy to Vercel (Windows PowerShell)

Follow the steps in order. Each step says what you should see, so you know it worked before moving on.

What you are deploying: a sign-in page, the inventory page (only for signed-in staff), and a free Neon Postgres database that keeps stock shared across devices.

## Part 1: one-time setup on your computer

1. **Install Node.js.** Download the LTS version from https://nodejs.org and run the installer with the default options. Close PowerShell and open it again.
   Check: `node -v` prints `v22` or higher.
2. **Let PowerShell run the Vercel tool.** Run:
   `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
   Answer `Y` if asked. This prevents the error "vercel.ps1 cannot be loaded because running scripts is disabled".
3. **Install the Vercel tool.** Run:
   `npm install -g vercel`
   Check: `vercel --version` prints a version number.

## Part 2: create the free database at Neon

4. Go to https://neon.com and sign up (the Free plan needs no payment).
5. Click **New project**. Name it `bloem-co`. For the region choose **AWS US East (N. Virginia)**. Vercel runs your site's server code there by default, so keeping the database next to it is fastest.
6. When the project opens, click **Connect**. Leave the defaults and copy the connection string. It starts with `postgresql://`.
   Copy only the string: no quotes and no `psql` in front. If the password is hidden, click the show or copy button so the copy contains the real password.
   Keep it private. Anyone with it can read and change your data.

## Part 3: make your three secrets

7. **SHOP_USER**: choose a username, for example `owner`.
8. **SHOP_PASSWORD**: choose a long, unique password, for example four or more random words joined with dashes. Type it carefully with no space at the start or end.
9. **SESSION_SECRET**: in PowerShell run these three lines, then copy the 64-character result:
   ```
   $bytes = New-Object byte[] 32
   [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
   ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
   ```
   Run it once and keep that exact result.

Save all four values (the three above plus the Neon string) in a password manager. Vercel hides them after you save.

## Part 4: deploy

10. **Unzip the project.** Right-click `bloem-co.zip`, choose Extract All. Open the extracted folder until you are inside the one that directly contains `vercel.json`, `package.json` and the folders `api`, `private` and `public`. Windows sometimes makes a folder inside a folder, so check.
11. **Open PowerShell in that folder.** In File Explorer click the address bar, type `powershell`, and press Enter.
    Check: `dir` lists `api`, `private`, `public`, `package.json` and `vercel.json`.
12. **Log in to Vercel.** Run `vercel login`, choose how to sign in, and finish in the browser. Check: PowerShell says you are logged in.
13. **Create the project (this does not deploy yet).** Run:
    `vercel link`
    Answer the questions:
    - Set up the project? `Y`
    - Which scope? choose your account
    - Link to existing project? `N`
    - Project name? `bloem-co`
    - In which directory is your code located? press Enter
    If it asks about connecting a Git repository or anything else extra, choose No or press Enter.
14. **Add the four settings.** Open https://vercel.com/dashboard, click the `bloem-co` project, then **Settings**, then **Environment Variables**. Add these four, one at a time. Type the name in **Key** and the value in **Value**. Keep every environment ticked and do not add quotes around any value:

    | Key | Value |
    | --- | --- |
    | `SHOP_USER` | your username |
    | `SHOP_PASSWORD` | your password |
    | `SESSION_SECRET` | the 64-character result from step 9 |
    | `DATABASE_URL` | the Neon string from step 6 |

    Check: all four keys are listed.
15. **Deploy.** Back in PowerShell run:
    `vercel --prod`
    Wait for the build to finish. Check: it prints a Production link and says the deployment is complete.

## Part 5: open the site and check it

16. **Open the right address.** In the Vercel dashboard open the project and look under **Domains** for the address that looks like `bloem-co.vercel.app`. Use that one. Vercel puts a login wall in front of the long link with random letters in it, so do not use that one.
17. You should see the black and white sign-in page. Sign in with your username and password.
    Check: the inventory loads with the demo items and the label at the top says **Synced** with a time.
18. Sell one item, then open the same address on your phone and sign in. The sale appears there too.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| `vercel.ps1 cannot be loaded because running scripts is disabled` | Run step 2, then try again. |
| A Vercel login page instead of your site | You opened the long generated link. Use the address under **Domains** (step 16). |
| `404: NOT_FOUND` | You deployed from the wrong folder. Open PowerShell inside the folder that contains `vercel.json` (steps 10 and 11) and run `vercel --prod` again. |
| "Sign-in is not set up yet" | One of `SHOP_USER`, `SHOP_PASSWORD` or `SESSION_SECRET` is missing, or the secret is shorter than 16 characters. Fix it in Environment Variables, then run `vercel --prod`. |
| "The database is not connected yet" or "DATABASE_URL is not a Postgres connection string" | `DATABASE_URL` is missing or is not the Neon string. Copy it again from Neon (step 6), save it, then run `vercel --prod`. |
| "Could not reach the database" | The Neon string is wrong or the Neon project was deleted. Copy a fresh string from Neon Connect, update `DATABASE_URL`, then run `vercel --prod`. The **Logs** tab in Vercel shows details. |
| "Incorrect username or password" | The username is not case sensitive, the password is. Check for a space at the start or end of `SHOP_PASSWORD` in Vercel. |
| You sign in and land back on the sign-in page | Cookies are blocked for the site, or `SESSION_SECRET` was changed after you signed in. Allow cookies and sign in again. |
| The old colours or icon still show | Refresh with Ctrl+F5, or try a private window. |

Any time you add or change a setting in Environment Variables, run `vercel --prod` again. Settings only apply to new deployments.

## Day to day

- Change the password: edit `SHOP_PASSWORD`, then `vercel --prod`. To sign everyone out at once, change `SESSION_SECRET` and redeploy.
- Update the site: replace the files, then run `vercel --prod` in the project folder.
- Start with your own stock: use **Edit** then **Delete item** on each demo item and add your real ones. The **Reset to demo data** button erases everything and reloads the demo, so do not press it once you use real numbers.
- This is one shared shop login, not separate accounts for each person.
- Neon Free plan limits: 1 GB storage and 100 compute hours a month. The database sleeps after 5 minutes without use, so the first request after a quiet spell is a little slower. See https://neon.com/pricing.

## Alternative: deploy through GitHub

If you prefer GitHub, push the folder to a new repository, then at https://vercel.com/new import it with Framework Preset **Other** and the root `./`, add the four settings under Environment Variables on that screen, and click Deploy. Every later `git push` redeploys.
