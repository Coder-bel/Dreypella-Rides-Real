---
name: Biker Onboarding & Validation
description: Admin-issued DPR-XXXX company codes, biker Supabase signup flow, and global validation rules
type: feature
---
**Biker onboarding**
- Admin tab "Bikers" in /admin uses `BikersOnboarding.tsx` to create a row in `public.bikers` with status `pending_signup` + a unique `DPR-XXXX` company_code. Sends WhatsApp link with welcome + code.
- Bikers sign up at `/bikers-signup` via Supabase auth, then call `claim_biker_code(_company_code)` RPC (SECURITY DEFINER) which validates the code, links `bikers.user_id`, sets status `active`, and inserts `user_roles(role='biker')`.
- Legacy localStorage biker login at `/bikers-login` is preserved as fallback.

**Validation (global, in `src/lib/constants.ts`)**
- `isValidPhone` → exactly 11 digits. Error: `PHONE_ERROR`.
- `isValidPassword` → 8+ chars, ≥1 letter, ≥1 number, ≥1 special. Error: `PASSWORD_ERROR`.
- Applied in: Auth signup, Biker signup, Admin onboard form, BookRide, SendPackage (sender + receiver phones).

**Account details (Opay)** — `OPAY_ACCOUNT` constant
- Name: **Dreypella Ride** (was "Beloved Okikioluwa Isiak")
- Bank: Opay, Number: 8082144372
- Used by `PaymentModal.tsx` and SendPackage confirmation copy.

**Access control**
- `AdminRoute`, `BikerRoute`, `UserRoute` all show toast "Access Denied. You do not have permission to view this page." and redirect to the user's correct dashboard (admin → /admin, biker → /bikers, user → /dashboard, guest → /auth or /bikers-login).
- `useUserRole` checks Supabase `user_roles` for biker first, falls back to legacy localStorage.
