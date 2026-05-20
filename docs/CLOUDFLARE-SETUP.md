# Cloudflare setup: `cloudvaathi.in` + `events.cloudvaathi.in`

You already run **events.cloudvaathi.in** on the Worker `cloudvaathi-events`. Add **cloudvaathi.in** to the **same Worker** so one deploy serves both sites (hostname picks marketing vs events).

---

## 1. Production URLs in the app (already configured)

| File | Purpose |
|------|---------|
| `.env.production` | Baked into `npm run build` — `https://cloudvaathi.in`, `https://events.cloudvaathi.in` |
| `.env.development` | **Dev only** — `http://localhost:8080` / `:8081` |
| `wrangler.jsonc` → `APP_BASE_URL` | `https://events.cloudvaathi.in` (emails, Razorpay return URLs) |

Build and deploy:

```bash
cd cloud-vaathi-hub
npm run build
npm run deploy
```

Or push to GitHub if CI deploys on merge to `main`.

---

## 2. DNS (Cloudflare zone for `cloudvaathi.in`)

In **Cloudflare Dashboard** → your zone **cloudvaathi.in** → **DNS** → **Records**:

### If `events.cloudvaathi.in` already works

You likely already have something like:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `events` | `cloudvaathi-events.<account>.workers.dev` (or route target) | Proxied (orange) |

### Add marketing host(s)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | Same target as `events` (your Worker custom domain hostname), **or** use Workers custom domain UI (step 3) | Proxied |
| CNAME | `www` | `cloudvaathi.in` | Proxied |

**Easiest:** skip manual CNAME for apex and use **Workers → Custom domains** (step 3); Cloudflare creates DNS for you.

---

## 3. Attach custom domains to the same Worker

1. **Workers & Pages** → open worker **`cloudvaathi-events`** (same as events site).
2. **Settings** → **Domains & Routes** (or **Triggers** → **Custom Domains**).
3. Confirm **`events.cloudvaathi.in`** is listed.
4. **Add Custom Domain**:
   - `cloudvaathi.in`
   - `www.cloudvaathi.in` (optional but recommended)
5. Wait until status is **Active** (SSL certificate issued).

Both hostnames now hit the **same** Worker code. The app reads the `Host` header:

- `cloudvaathi.in` / `www.cloudvaathi.in` → marketing (Home, Testimonials)
- `events.cloudvaathi.in` → courses & events catalog + registration

---

## 4. Worker variables (dashboard)

**Workers & Pages** → `cloudvaathi-events` → **Settings** → **Variables**:

| Variable | Value |
|----------|--------|
| `APP_BASE_URL` | `https://events.cloudvaathi.in` |

`wrangler.jsonc` also sets this on deploy; keep dashboard in sync if you edit vars there.

**Secrets** (unchanged): `TIDB_PASSWORD`, `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `GMAIL_APP_PASSWORD`, `TIDB_CA`, etc. — use `npm run cf:push-secrets` from a machine with `.env` filled in.

---

## 5. Razorpay / Gmail (if used)

- **Razorpay** allowed origins / redirect: include `https://events.cloudvaathi.in`
- Payment callbacks use `APP_BASE_URL` → must stay **events** subdomain
- Marketing site only links to events for checkout; no change on `cloudvaathi.in` alone

---

## 6. Verify after deploy

| URL | Expected |
|-----|----------|
| https://cloudvaathi.in | Landing, nav: Home · Events · LMS · Testimonials |
| https://cloudvaathi.in/testimonials | Testimonials page |
| Nav **Events** on marketing | Goes to **https://events.cloudvaathi.in** |
| https://events.cloudvaathi.in | Combined courses + events list |
| Nav **Home** on events | Goes to **https://cloudvaathi.in** |
| https://events.cloudvaathi.in/login | Sign in (unchanged) |

Try in a private window. Hard refresh if you see old nav or favicon.

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| `cloudvaathi.in` shows events catalog | Old deploy; redeploy latest `main`. Confirm Host is `cloudvaathi.in` not workers.dev URL. |
| Nav links still `localhost` | Production build must use `npm run build` (`--mode production`). Clear browser cache. |
| SSL pending on new domain | Wait 5–15 min; check Custom Domain status in Workers. |
| 522 / Worker error | Check **Workers** → **Logs**; confirm TiDB secrets and `TIDB_CA` secret. |
| `www` not working | Add `www.cloudvaathi.in` custom domain or CNAME `www` → apex. |

---

## 8. Optional: redirect `www` → apex

**Rules** → **Redirect Rules** (or Bulk Redirect):

- `www.cloudvaathi.in/*` → `https://cloudvaathi.in/$1` (301)

---

## Summary

1. Deploy latest code (`npm run build` uses production URLs).
2. Add **`cloudvaathi.in`** (+ `www`) as custom domains on worker **`cloudvaathi-events`**.
3. Set **`APP_BASE_URL`** = `https://events.cloudvaathi.in`.
4. Test both URLs and cross-links in the header.

No second Worker is required.
