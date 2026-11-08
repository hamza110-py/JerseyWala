# Jersey Wala — Football Jersey Store

Next.js 14 (App Router) · Tailwind CSS · Supabase · Lucide icons · deployed on Vercel.

Customers browse jerseys, add them to a cart, then tap **ORDER VIA INSTAGRAM**. The order details are copied and your Instagram opens, so they can paste the details into a DM. There is no online payment.

**Start here:** open `SETUP_WITHOUT_VSCODE.md`. It explains every step in the browser (Supabase, GitHub, Vercel), with no code editor needed.

## What's inside

| Part | What it does |
|---|---|
| Home | Hero, New Arrivals, Popular, Featured, Shop by Club, Shop by Country, Retro, Why Choose Us, Instagram section |
| Shop | Search, category, club and country filters, sorting (newest / price) |
| Product | Gallery, size, quantity, stock, **Add to Cart**, **Message us on Instagram** |
| Cart | Change quantity, remove, total, **Order via Instagram**, **Copy order details** |
| About, Contact, Privacy | Text and contact details come from Store Settings |
| Admin `/admin` | Dashboard, All Products, Add Product, Orders, Categories, Store Settings, Logout |
| Mobile | Floating Instagram button |

### How ordering works (honest by design)
1. Customer fills the cart and taps **Order via Instagram**.
2. The order summary is copied, and `https://www.instagram.com/<your username>/` opens in a new tab.
3. A pop-up says clearly: **the order is not sent yet.** The customer pastes the details into an Instagram DM and sends.
4. The website saves an enquiry with status **Pending** and a reference (e.g. `JW-4K9QX`, also written inside the message). In **Admin → Orders** you match it with the DM, then set **Confirmed**. Stock drops automatically. **Cancelled** puts it back.

### Security
- Only the public **publishable (anon)** key is used. The `secret` / `service_role` key is never used. Never add it to Vercel or GitHub.
- Visitors can read published products only. They cannot read, edit or delete orders. They can only create an enquiry through the `place_order` function, which takes names and prices from the database (so prices can't be faked).
- Admin pages need a login **and** a row in the `admin_users` table. Row Level Security enforces this in the database itself.
- Images: everyone can view; only admins can upload or delete.

## Files
```
app/(site)/        home, shop, product/[slug], cart, about, contact, privacy
app/admin/         login + panel (dashboard, products, orders, categories, settings)
components/        cart, navbar, footer, product pieces, admin pieces
lib/               helpers + Supabase connections
middleware.js      sends logged-out visitors away from /admin
supabase/schema.sql  ONE complete database script (run first)
supabase/seed.sql    optional demo products
```

## Test checklist (do this once after deploying)
1. Log in at `/admin`, open **Store Settings**, confirm the Instagram username is `jers10ywala`, and save.
2. **Add Product**: 2 photos, price 5000, sale price 4200, sizes S–XL, stock 5, country, club. Publish.
3. Shop: the jersey appears with a discount badge. Search, club filter, country filter and sorting work.
4. Open it, pick size **L**, quantity **2**, press **Add to Cart**. The cart icon shows 2.
5. Cart: change quantity, remove and re-add. Press **Order via Instagram**.
6. Instagram opens, the pop-up shows the order details. Paste them into any chat to check they copied.
7. Admin → **Orders**: a Pending order with the same reference appears. Set it to **Confirmed** and check that stock dropped by 2.
8. Edit the product (mark sold out), then check the shop. Then delete it.
9. Open `/admin` in a private window. You should be sent to the login page.

> This project was written in an environment that could not install packages, so `npm run build` has **not** been run on it. Vercel runs the build when you deploy. If it reports an error, send the error text to Claude to fix.
