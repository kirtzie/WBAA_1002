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

This is a **static site with no server**, so it can't silently deliver form
submissions to WhatsApp in the background — WhatsApp doesn't offer that from
a browser without a backend and the WhatsApp Business API. Instead, the form:

1. Validates name, phone, and message client-side (with inline errors).
2. On successful submit, builds a pre-filled WhatsApp message and opens
   `wa.me` in a new tab, so the visitor just taps **Send**.

If you later want submissions to land automatically without the visitor
tapping send (e.g. straight into an inbox or CRM), you'd need a small backend
or a form service (Formspree, Web3Forms, etc.) plus the WhatsApp Business
API — that's outside "frontend only."

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
