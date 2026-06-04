/**
 * Admin: Bikers Overview — list all bikers with stats and active/inactive toggle.
 */
import { useEffect, useState } from "react";
import { Bike, Search, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface BikerRow {
  id: string;
  full_name: string | null;
  whatsapp_number: string;
  company_code: string | null;
  plate_number: string | null;
  onboarded: boolean;
  created_at: string;
  status: string;
  delivered: number;
}

const BikersOverview = () => {
  const [rows, setRows] = useState<BikerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [bRes, dRes] = await Promise.all([
      supabase.from("bikers").select("id, full_name, whatsapp_number, company_code, plate_number, onboarded, created_at, status").order("created_at", { ascending: false }),
      supabase.from("dispatches").select("assigned_biker_id, status").eq("status", "completed"),
    ]);
    const counts = new Map<string, number>();
    (dRes.data || []).forEach((d: any) => {
      if (d.assigned_biker_id) counts.set(d.assigned_biker_id, (counts.get(d.assigned_biker_id) || 0) + 1);
    });
    setRows(((bRes.data as any[]) || []).map((b) => ({ ...b, delivered: counts.get(b.id) || 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleActive = async (b: BikerRow) => {
    const { error } = await supabase.from("bikers").update({ onboarded: !b.onboarded }).eq("id", b.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: b.onboarded ? "Biker deactivated" : "Biker activated" }); fetchData(); }
  };

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.whatsapp_number || "").toLowerCase().includes(q) ||
      (r.company_code || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="font-display font-semibold text-base flex items-center gap-2">
          <Bike size={18} className="text-[#C8102E]" /> Registered Bikers ({rows.length})
        </h2>
        <div className="flex-1" />
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search name, phone, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/10 text-white text-xs rounded-lg pl-8 pr-3 py-2 border border-white/20 outline-none w-full sm:w-64 placeholder:text-white/30"
          />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-white/40 p-6 text-center">No bikers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Full Name</TableHead>
                <TableHead className="text-white/60">Phone</TableHead>
                <TableHead className="text-white/60">Company Code</TableHead>
                <TableHead className="text-white/60">Bike / Plate</TableHead>
                <TableHead className="text-white/60">Onboarded</TableHead>
                <TableHead className="text-white/60 text-center">Delivered</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white text-xs font-medium">{b.full_name || "—"}</TableCell>
                  <TableCell className="text-white/70 text-xs">{b.whatsapp_number}</TableCell>
                  <TableCell className="text-white/70 text-xs font-mono">{b.company_code || "—"}</TableCell>
                  <TableCell className="text-white/70 text-xs">{b.plate_number || "—"}</TableCell>
                  <TableCell className="text-white/70 text-xs">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-white/70 text-xs text-center">{b.delivered}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/50"}`}>
                      {b.onboarded ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleActive(b)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${b.onboarded ? "bg-white/10 text-white hover:bg-white/20" : "bg-green-600 text-white hover:bg-green-700"}`}
                    >
                      <Power size={12} /> {b.onboarded ? "Deactivate" : "Activate"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default BikersOverview;
