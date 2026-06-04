/**
 * Strict role-based access control implemented.
 * Admin-only Users Overview — list all registered users with email, ride/package counts.
 * Searchable by name or email. Sortable by name or signup date.
 */
import { useState, useEffect } from "react";
import { Users, Search, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  matric_number: string | null;
  created_at: string;
  total_rides: number;
  total_packages: number;
}

type SortKey = "created_at" | "full_name";
type SortDir = "asc" | "desc";

const UsersOverview = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: nonUserRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["biker", "admin"]);

  const excludeIds = (nonUserRoles || []).map((r: any) => r.user_id);
    const { data, error } = await supabase.rpc("get_users_overview" as any);
    if (error) {
      console.error("Failed to fetch users overview:", error);
      setUsers([]);
    }else {
    // Filter out bikers and admins
    const filtered = ((data as any[]) || []).filter(
      (u) => !excludeIds.includes(u.user_id)
    );
    setUsers(filtered.map((u) => ({
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      matric_number: u.matric_number,
      created_at: u.created_at,
      total_rides: Number(u.total_rides) || 0,
      total_packages: Number(u.total_packages) || 0,
    })));
    }
    setLoading(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" ? "desc" : "asc");
    }
  };

  const filtered = users
    .filter((u) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = (a.full_name || "").localeCompare(b.full_name || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 hover:text-white transition-colors"
    >
      {label}
      <ArrowUpDown size={11} className={sortKey === k ? "text-[#C8102E]" : "text-white/30"} />
    </button>
  );

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
            placeholder="Search by name or email..."
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
                <TableHead className="text-white/60"><SortBtn k="full_name" label="Full Name" /></TableHead>
                <TableHead className="text-white/60">Email</TableHead>
                <TableHead className="text-white/60">Phone</TableHead>
                <TableHead className="text-white/60"><SortBtn k="created_at" label="Signup Date" /></TableHead>
                <TableHead className="text-white/60 text-center">Rides</TableHead>
                <TableHead className="text-white/60 text-center">Packages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.user_id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-medium text-xs">{u.full_name || "—"}</TableCell>
                  <TableCell className="text-white/70 text-xs break-all">{u.email || "—"}</TableCell>
                  <TableCell className="text-white/70 text-xs">{u.phone || "—"}</TableCell>
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
