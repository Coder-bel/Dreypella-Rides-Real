# TODO - Admin/User/Biker security hardening

- [ ] Inspect current Supabase RLS policies for admins/user_roles/profiles/bookings/dispatches/bikers
- [ ] Add a Supabase migration that *normalizes* RLS policies so:
  - [ ] only `admin` role can read/update admin tables/pages
  - [ ] only owners can read/update user/biker data
  - [ ] remove/override any conflicting policies
- [ ] Harden frontend route guards to never allow wrong-route access even temporarily
- [ ] Ensure role resolution is consistent (single source of truth)
- [ ] Testing: sign in as admin + normal user + biker and verify:
  - [ ] admin cannot see `/dashboard` or `/bikers`
  - [ ] normal user cannot see `/admin`
  - [ ] biker cannot see `/admin` or `/dashboard`
- [ ] Run lint/tests and (if applicable) build

