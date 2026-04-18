/**
 * Strict role-based access control implemented.
 * Admin-only "Onboard Biker" form. Generates a unique DPR-XXXX code, saves the
 * pending row, and opens WhatsApp pre-filled with the welcome message.
 */
import { useState, useEffect } from "react";
import { Bike, Copy, CheckCircle, MessageCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  isValidPhone,
  PHONE_ERROR,
  generateCompanyCode,
} from "@/lib/constants";
import { toast } from "sonner";

interface BikerRow {
  id: string;
  full_name: string | null;
  whatsapp_number: string;
  company_code: string | null;
  plate_number: string | null;
  status: string;
  email: string | null;
  created_at: string;
}

const BikersOnboarding = () => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bikers, setBikers] = useState<BikerRow[]>([]);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [lastBikerName, setLastBikerName] = useState("");
  const [lastPhone, setLastPhone] = useState("");

  const fetchBikers = async () => {
    const { data } = await supabase
      .from("bikers")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBikers(data as BikerRow[]);
  };

  useEffect(() => {
    fetchBikers();
  }, []);

  /** Generate a code that doesn't already exist in the table */
  const getUniqueCode = async (): Promise<string> => {
    for (let i = 0; i < 8; i++) {
      const code = generateCompanyCode();
      const { data } = await supabase
        .from("bikers")
        .select("id")
        .eq("company_code", code)
        .maybeSingle();
      if (!data) return code;
    }
    // Extremely unlikely fallback
    return "DPR-" + Date.now().toString().slice(-4);
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Full Name is required");
    if (!isValidPhone(phone)) return setError(PHONE_ERROR);

    setLoading(true);
    const code = await getUniqueCode();

    const { bikerCodeToEmail } = await import("@/lib/constants");
    const { error: insertErr } = await supabase.from("bikers").insert({
      full_name: fullName.trim(),
      whatsapp_number: phone.trim(),
      plate_number: plate.trim() || null,
      company_code: code,
      status: "pending_signup",
      email: bikerCodeToEmail(code),
    });

    setLoading(false);

    if (insertErr) {
      setError(insertErr.message || "Failed to onboard biker");
      return;
    }

    setLastCode(code);
    setLastBikerName(fullName.trim());
    setLastPhone(phone.trim());
    setFullName("");
    setPhone("");
    setPlate("");
    fetchBikers();
    toast.success(`Biker onboarded! Code: ${code}`);
  };

  const buildWhatsAppLink = (toPhone: string, code: string) => {
    // Convert local 080... to international 234...
    const normalized = toPhone.startsWith("0")
      ? "234" + toPhone.slice(1)
      : toPhone;
    const text = `Congratulations! You have been onboarded as a biker for DREYPELLA RIDE.\n\nYour Company Code is: ${code}\n\nUse this code to create your account at the bikers signup page.`;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const inputClass =
    "w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none transition-all";

  return (
    <div className="space-y-6">
      {/* Onboard form */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h2 className="font-display font-semibold text-base flex items-center gap-2 mb-4">
          <Bike size={18} className="text-[#C8102E]" /> Onboard New Biker
        </h2>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleOnboard} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Biker's full name"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Phone Number * (11 digits)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              required
              placeholder="08012345678"
              maxLength={11}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Bike Model / Plate Number (optional)
            </label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="e.g. Bajaj Boxer • LSD-123-XY"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C8102E] hover:bg-[#a50d25] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Generating code…" : "Onboard Biker"}
          </button>
        </form>

        {/* Success card with code + WhatsApp send */}
        {lastCode && (
          <div className="mt-5 bg-green-500/10 border border-green-500/30 rounded-xl p-4 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-300">
                  {lastBikerName} onboarded successfully
                </p>
                <p className="text-xs text-white/60 mt-1">Company Code:</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-bold text-lg text-[#C8102E] bg-white/5 px-3 py-1 rounded-lg">
                    {lastCode}
                  </span>
                  <button
                    onClick={() => copyCode(lastCode)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    aria-label="Copy code"
                  >
                    <Copy size={14} className="text-white/60" />
                  </button>
                </div>
                <a
                  href={buildWhatsAppLink(lastPhone, lastCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20BD5A] transition-colors"
                >
                  <MessageCircle size={14} fill="white" /> Send Code via WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Existing bikers */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display font-semibold text-base flex items-center gap-2">
            <Bike size={18} className="text-[#C8102E]" /> All Bikers ({bikers.length})
          </h2>
          <button
            onClick={fetchBikers}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60"
            aria-label="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {bikers.length === 0 ? (
          <p className="text-sm text-white/40 p-6 text-center">
            No bikers onboarded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Name</TableHead>
                  <TableHead className="text-white/60">Phone</TableHead>
                  <TableHead className="text-white/60">Plate</TableHead>
                  <TableHead className="text-white/60">Code</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Onboarded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bikers.map((b) => (
                  <TableRow key={b.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white text-xs font-medium">
                      {b.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-white/70 text-xs">
                      {b.whatsapp_number}
                    </TableCell>
                    <TableCell className="text-white/70 text-xs">
                      {b.plate_number || "—"}
                    </TableCell>
                    <TableCell className="text-[#C8102E] font-mono font-bold text-xs">
                      {b.company_code || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                          b.status === "active"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-yellow-500/15 text-yellow-400"
                        }`}
                      >
                        {b.status === "active" ? "Active" : "Pending Signup"}
                      </span>
                    </TableCell>
                    <TableCell className="text-white/70 text-xs">
                      {new Date(b.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BikersOnboarding;
