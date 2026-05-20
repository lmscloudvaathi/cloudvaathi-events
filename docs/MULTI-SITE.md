# Cloud Vaathi multi-site layout

One codebase, one Worker, two hostnames.

| Domain | Role |
|--------|------|
| `cloudvaathi.in` | Marketing: Home, Testimonials; nav links to Events & LMS |
| `events.cloudvaathi.in` | Courses & events catalog, registration, auth, admin |
| `lms.cloudvaathi.in` | External LMS |

Hostname selects the UI in production. See **[CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md)** for DNS and custom domain steps.

## Environment files

| File | When loaded | URLs |
|------|-------------|------|
| `.env.development` | `vite dev` only | `http://localhost:8080`, `http://localhost:8081` |
| `.env.production` | `vite build` / `npm run deploy` | `https://cloudvaathi.in`, `https://events.cloudvaathi.in` |

## Local dev

```bash
npm run dev:marketing   # http://localhost:8080
npm run dev:events      # http://localhost:8081
```

## Production deploy

```bash
npm run build    # --mode production → .env.production
npm run deploy
```
