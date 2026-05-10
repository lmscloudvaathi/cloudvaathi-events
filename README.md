# Cloud Vaathi Hub

Full-stack TanStack Start app with:
- Email/password signup + OTP verification
- Login with JWT session token
- TiDB-backed courses/events/admin data
- Razorpay popup checkout flow
- Payment confirmation emails via Gmail SMTP

## Local setup

1. Copy `.env.example` to `.env` and fill values.
2. Keep `isrgrootx1.pem` in project root (or update `TIDB_CA_PATH`).
3. Install deps:
   - `npm install`
4. Run dev server:
   - `npm run dev`

## Implemented backend modules

- DB migrations and seed bootstrap: `src/lib/server/migrate.ts`
- Auth and OTP: `src/lib/server/auth.ts`, `src/lib/server/otp.ts`
- Catalog and orders: `src/lib/server/catalog.ts`, `src/lib/server/payments.ts`
- Razorpay: `src/lib/server/razorpay.ts`
- Mailer: `src/lib/server/mailer.ts`
- Server RPC endpoints: `src/lib/server/api.ts`

## Notes

- First admin account is seeded from environment variables.
- Razorpay payment is verified server-side before enrollment is granted.
- Confirmation email sending is best-effort and logged on failure.
