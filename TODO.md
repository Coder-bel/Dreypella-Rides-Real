# TODO - Critical fixes

## Step 1: Roles (Admin/Biker/User) + protected redirects
- [x] Update `src/hooks/useAdmin.tsx` to check `public.admin_profiles` (not `public.admins`)
- [ ] Update `src/hooks/useUserRole.tsx` to detect bikers from `public.bikers.status` with values 'Active'/'Inactive'
- [ ] Update `src/pages/Auth.tsx` to redirect after login based on `public.user_roles`:
  - admin → `/admin`
  - biker → `/bikers`
  - user → `/dashboard`
- [ ] Ensure Auth login error always shows exactly: `Invalid login credentials.` (no role leakage)
- [ ] Reject admins/bikers trying to use normal `/auth` page with same error + redirect to their role login pages

## Step 2: Company code login enforcement
- [ ] Implement `src/pages/AdminLogin.tsx`
- [ ] Update `src/App.tsx` routing to include `/admin-login`
- [ ] Enforce company code rules:
  - Admin code format ADPR-XXXX; verify against `public.admin_profiles.company_code` AFTER successful password auth
  - Biker code format DPR-XXXX; verify against `public.bikers.company_code` AFTER successful password auth
  - Wrong code anywhere shows `Invalid login credentials.`
  - Normal users do NOT need company code and use `/auth`

## Step 3: Signup pages / wrong page handling
- [ ] Ensure wrong page for any role shows `Invalid login credentials.` and redirects to correct login page
- [ ] Confirm `src/pages/BikersSignup.tsx` and `src/pages/AdminSignup.tsx` enforce DPR/ADPR formats

## Step 4: Supabase schema/value strictness
- [ ] Ensure all status/value checks use exact required capitalization/strings

## Step 5: Payment account name replacement
- [ ] Replace `Oluwadamilare` with `Ajayi Oluwadamilare John` in `src/pages/Dashboard.tsx`

## Step 6: SendPackage base fee
- [ ] Update `src/pages/SendPackage.tsx`: base fee = 600 for ALL distances; keep per-km ₦120/km (short) and ₦150/km (long)

## Step 7: Biker earnings
- [ ] Update `src/pages/BikersDashboard.tsx`:
  - commission 20% → 30%
  - earnings sum only last 24h (filter by updated_at or created_at)

## Step 8: Admin signup edge function invocation
- [ ] Update `src/pages/AdminSignup.tsx` to invoke:
  - `supabase.functions.invoke('admin-signup', { body: payload, headers: { Authorization: Bearer token } })`
  - then auto sign-in and redirect `/admin`

## Step 9: Dark mode text colors / Navbar
- [ ] Update `src/components/Layout.tsx` so navbar uses `bg-navy-gradient` always and text/nav links adapt correctly with Tailwind `dark:` classes

## Step 10: Build/test
- [ ] Run `npm run build` (and/or `npm run lint`) to confirm TypeScript passes

