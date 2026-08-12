# VASTRA — Boutique Demo Site

A frontend-only demo site for a boutique in Rohtak. Pure HTML/CSS/JS —
no build step, no backend, no dependencies.

```
index.html   — structure & copy
style.css    — all styling, tokens, animations
script.js    — nav, 3D tilt, form validation, WhatsApp handoff
```

## Customize first

- **Name & copy**: "VASTRA" and all body text in `index.html` are placeholders —
  swap in the real boutique name, address and story.
- **WhatsApp number**: currently set to `+447823590526`. It appears in two places —
  update both to keep them in sync:
  - `WHATSAPP_NUMBER` at the top of `script.js` (digits only, no `+` or spaces)
  - the `href="https://wa.me/447823590526..."` links in `index.html`
- **Images**: the hero, collection cards and atelier visual are CSS-generated
  gradients (no real photos needed for the demo). Swap them for real product
  photography by replacing the relevant `.vitrine__fabric`, `.card__visual`,
  and `.atelier__core` backgrounds with `background-image` or an `<img>`.
- **Map**: the "Visit" section uses a stylised placeholder map, not a real
  embed. Swap in a Google Maps / OpenStreetMap iframe if you want a live map.

## How the enquiry form works

The form does two things on submit:

1. **Saves the enquiry to Supabase** (a hosted Postgres database) — so every
   lead is on record even if the visitor never taps Send in WhatsApp.
2. **Opens a pre-filled WhatsApp chat** to your number — so you still get
   pinged for a fast reply.

It still can't send silently straight into WhatsApp itself — no browser-only
site can do that without the paid WhatsApp Business API — but nothing is
lost anymore even if step 2 is skipped, because step 1 already saved it.

### Set up Supabase (one-time)

1. Go to [supabase.com](https://supabase.com), sign in, and click
   **New project**. Pick any name/region and a database password (save it
   somewhere safe — you won't need it for this integration, but keep it).
2. Once the project is ready, open the **SQL Editor** (left sidebar) and
   run this to create the enquiries table:

   ```sql
   create table enquiries (
     id bigint generated always as identity primary key,
     full_name text not null,
     phone text not null,
     occasion text,
     message text not null,
     created_at timestamptz not null default now()
   );

   -- Lock the table down: the public "anon" key can only INSERT,
   -- never read, update, or delete other people's enquiries.
   alter table enquiries enable row level security;

   create policy "Anyone can submit an enquiry"
     on enquiries for insert
     to anon
     with check (true);
   ```

3. Go to **Project Settings → API**. Copy two values:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (a long token — this one is safe to use in
     frontend code; it can only insert, thanks to the policy above)
4. Paste both into `script.js`, near the top:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
5. Commit and push — Cloudflare Pages redeploys automatically, and new
   enquiries will start appearing in **Table Editor → enquiries** in Supabase.

If you leave the placeholders in place, the site quietly skips the database
save and just does the WhatsApp handoff like before — nothing breaks.

### Set up Login / Sign Up (Supabase Auth)

The site now has a Log In / Sign Up modal (button in the top nav) built on
**Supabase Auth** — no separate database table needed for passwords;
Supabase stores and hashes them securely on its own.

1. This uses the same Supabase project as the enquiry form — if you already
   did the "Set up Supabase" steps above and pasted `SUPABASE_URL` and
   `SUPABASE_ANON_KEY` into `script.js`, login/signup work automatically.
2. In your Supabase project, go to **Authentication → Providers** and
   confirm **Email** is enabled (it is by default).
3. Go to **Authentication → Settings** and decide on **"Confirm email"**:
   - **ON** (default, recommended for a real site): new users get a
     confirmation email and can't log in until they click it. The site
     already handles this — it tells the user to check their email after
     signup.
   - **OFF** (fine for a quick demo): new users are logged in immediately
     after signing up, no email step.
4. That's it — no extra table, no extra keys. New users appear under
   **Authentication → Users** in the Supabase dashboard.

Signed-up users aren't linked to the enquiries table by default — they're
just accounts for now (e.g. so future features like "my orders" or "saved
measurements" have someone to belong to). If you want enquiries tied to a
logged-in user later, add a `user_id uuid references auth.users` column to
the `enquiries` table and set it from `supabaseClient.auth.getUser()` when
saving.

### Forgot / reset password

The Log In form has a "Forgot password?" link. The flow:

1. Visitor enters their email → Supabase emails them a reset link (uses the
   same default email sending as signup confirmation — no extra setup).
2. Clicking that link brings them back to your site with a special token in
   the URL. The site detects this automatically (via Supabase's
   `PASSWORD_RECOVERY` event) and opens the modal straight to a "Choose a new
   password" screen — no page or link of your own to build.
3. They set a new password, and they're logged in.

This uses the **same Site URL / Redirect URLs** you already set up in
Supabase's Authentication → URL Configuration for signup confirmation — no
additional configuration needed there.

Note: neither you nor Supabase can ever see a user's actual password —
only a one-way hash is stored. Password reset (via emailed link) is the
correct way to help a user who's locked out; there's no "look up their
password" option, by design.

### Viewing your leads

Supabase's **Table Editor** works fine for occasional checking. If you want
something nicer later, you can build a small internal dashboard, or connect
a tool like Retool, or export to a spreadsheet from the Table Editor's
"Export" button — none of that is required for the site to keep working.

## Deploy: GitHub → Cloudflare Pages

1. **Push to GitHub**
   ```bash
   cd vastra-boutique
   git init
   git add .
   git commit -m "Initial boutique demo site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. **Connect Cloudflare Pages**
   - Go to the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
   - Select the GitHub repo you just pushed.
   - Build settings: this is a static site, so leave **Build command** empty
     and set **Build output directory** to `/` (the repo root).
   - Click **Save and Deploy**.

3. Cloudflare will give you a `*.pages.dev` URL immediately; attach a custom
   domain afterward under the project's **Custom domains** tab if you have one.

No environment variables or secrets are needed — everything runs client-side.
