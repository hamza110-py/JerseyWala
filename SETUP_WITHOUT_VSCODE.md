# Setup without VS Code (Supabase + GitHub + Vercel, all in your browser)

You do not need to install anything.

## Step 0 — Keys: what is safe
- **Publishable key** (`sb_publishable_…`): safe. This is the one the website uses.
- **Secret key** (`sb_secret_…`) / service_role: **never** put it in this project, GitHub, Vercel or a chat.
  If you ever pasted one anywhere public, go to Supabase → **Project Settings → API Keys** and delete/rotate it.

## Step 1 — Get your Project URL
Supabase → **Project Settings → API** (or **Data API**) → copy the **Project URL**. It looks like `https://abcdefgh.supabase.co`.
(You have already shared your publishable key. The Project URL is the second value the website needs.)

## Step 2 — Run the database script
Supabase → **SQL Editor → New query**.
1. Open `supabase/schema.sql`, copy **everything**, paste, click **Run**. Expect “Success”.
   - It creates products, categories, orders, order_items, admin_users, security rules and the image storage.
   - If you ran an earlier version of this website, it upgrades it automatically.
2. *(Optional)* run `supabase/seed.sql` the same way to add 6 demo jerseys with placeholder pictures.

## Step 3 — Create your admin login
1. **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, and tick **Auto Confirm User**.
2. **SQL Editor** → run this (use your email):
```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'YOUR-EMAIL@example.com';
```
   It should say “1 row affected”. If it says 0, the email is spelled differently.
3. **Authentication → Sign In / Providers** → turn **off** “Allow new users to sign up” → Save.

## Step 4 — Upload the project to GitHub (browser only)
1. Unzip the project on your computer.
2. github.com → **New repository** → name `jersey-wala` → **Private** → Create.
3. Click **uploading an existing file**, then drag in **everything inside** the unzipped folder (the `app`, `components`, `lib`, `supabase` folders and `package.json`, `middleware.js`, `next.config.js`, etc.).
   - The folder structure must stay the same. `package.json` must be at the top level of the repository, not inside another folder.
   - If GitHub refuses so many files at once, upload folder by folder.
4. **Commit changes**.

## Step 5 — Deploy on Vercel
1. vercel.com → sign in with GitHub → **Add New → Project** → import `jersey-wala`.
2. Framework should show **Next.js**. Open **Environment Variables** and add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from Step 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your **publishable** key (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | your Vercel address (add it after the first deploy if you don't know it yet) |
| `NEXT_PUBLIC_INSTAGRAM_USERNAME` | `jers10ywala` |

3. Click **Deploy**.
4. Supabase → **Authentication → URL Configuration** → set **Site URL** to your website address.
5. If you add or change variables after deploying: Vercel → **Deployments → ⋯ → Redeploy**.

If the deploy fails, open the failed deployment, copy the red error text and send it to Claude.

## Step 6 — First things in the admin (`your-site/admin`)
1. **Store Settings**: check the Instagram username (`jers10ywala`), add email, phone, address and social links, and optionally a hero picture. Save.
2. **Categories**: rename or add yours. Keep one called “Retro Classics” if you want the Retro button on the home page to find it.
3. **Add Product**: fill the form, upload your **real** photos (first = main) and Publish. Tick **Popular**, **Retro**, **Featured** or **New Arrival** to place it on the home page.
4. Delete the demo products if you added them.

## Daily use
- **Orders**: a Pending enquiry appears when a customer taps Order via Instagram. Find their DM (it has the same “Order ref”), agree the details, then set **Confirmed**. Stock reduces automatically.
- **Sold out**: use “Mark sold out” or set stock to 0.
- **Hide a jersey without deleting**: Edit → turn off “Visible in the shop”.

## Updating the code later
Ask Claude for the change, then in GitHub open the file → pencil icon → paste → **Commit changes**. Vercel redeploys by itself.

## Troubleshooting
| Problem | Fix |
|---|---|
| Site says “Almost there!” | Environment variables missing or wrong in Vercel. Fix, then Redeploy. |
| “Not authorised” after login | Step 3-2 not done, or the email differs. |
| Dashboard says “Could not load” | Run `schema.sql` again (safe to re-run). |
| Photo upload fails | Use JPG/PNG/WEBP under 5 MB. Check Supabase → Storage has `product-images`. |
| Orders don't appear in admin | Make sure `schema.sql` ran fully. The customer's Instagram flow still works without it. |
