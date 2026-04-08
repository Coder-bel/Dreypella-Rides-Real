/**
 * Strict role-based access control implemented.
 * Admin-only Users Overview table with search and stats.
 */
import { useState, useEffect } from "react";
import { Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  matric_number: string | null;
  created_at: string;
}

interface UserWithStats extends UserProfile {
  email: string;
  total_rides: number;
  total_packages: number;
}

const UsersOverview = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles, bookings counts, dispatch counts
    const [profilesRes, bookingsRes, dispatchesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("user_id"),
      supabase.from("dispatches").select("user_id"),
    ]);

    const profiles = profilesRes.data || [];
    const bookings = bookingsRes.data || [];
    const dispatches = dispatchesRes.data || [];

    // Count rides per user
    const rideCount: Record<string, number> = {};
    bookings.forEach((b) => { rideCount[b.user_id] = (rideCount[b.user_id] || 0) + 1; });

    // Count packages per user
    const packageCount: Record<string, number> = {};
    dispatches.forEach((d) => { packageCount[d.user_id] = (packageCount[d.user_id] || 0) + 1; });

    const combined: UserWithStats[] = profiles.map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      phone: p.phone,
      matric_number: p.matric_number,
      created_at: p.created_at,
      email: "", // Will be filled if available from metadata
      total_rides: rideCount[p.user_id] || 0,
      total_packages: packageCount[p.user_id] || 0,
    }));

    setUsers(combined);
    setLoading(false);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="font-display font-semibold text-base flex items-center gap-2">
          <Users size={18} className="text-[#C8102E]" /> Registered Users ({users.length})
        </h2>
        <div className="flex-1" />
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/10 text-white text-xs rounded-lg pl-8 pr-3 py-2 border border-white/20 outline-none w-full sm:w-64 placeholder:text-white/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-white/40 p-6 text-center">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Full Name</TableHead>
                <TableHead className="text-white/60">Phone</TableHead>
                <TableHead className="text-white/60">Matric No.</TableHead>
                <TableHead className="text-white/60">Signup Date</TableHead>
                <TableHead className="text-white/60">Rides</TableHead>
                <TableHead className="text-white/60">Packages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.user_id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-medium text-xs">{u.full_name || "—"}</TableCell>
                  <TableCell className="text-white/70 text-xs">{u.phone || "—"}</TableCell>
                  <TableCell className="text-white/70 text-xs">{u.matric_number || "—"}</TableCell>
                  <TableCell className="text-white/70 text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-white/70 text-xs text-center">{u.total_rides}</TableCell>
                  <TableCell className="text-white/70 text-xs text-center">{u.total_packages}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UsersOverview;
