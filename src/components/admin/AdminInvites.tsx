/**
 * Admin: Onboard New Admin via invite code (ADPR-XXXX, expires 48h).
 * DEV MODE: invite code shown on screen for the existing admin to share via WhatsApp.
 */
import { useEffect, useState } from "react";
import { ShieldCheck, Send, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isValidPhone } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const genCode = () => "ADPR-" + Math.floor(1000 + Math.random() * 9000);

const AdminInvites = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invites, setInvites] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchInvites = async () => {
    const { data } = await supabase.from("admin_invites").select("*").order("created_at", { ascending: false });
    setInvites(data || []);
  };

  useEffect(() => { fetchInvites(); }, []);

  const generate = async () => {
    setError("");
    if (!fullName.trim()) return setError("Full name is required");
    if (!email.trim()) return setError("Email is required");
    if (!isValidPhone(phone)) return setError("Phone must be exactly 11 digits");
    setBusy(true);
    const code = genCode();
    const { error: insErr } = await supabase.from("admin_invites").insert({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      invite_code: code,
      invited_by: user?.id,
    });
    setBusy(false);
    if (insErr) return setError(insErr.message);
    toast({ title: "Invite generated", description: `${code} — share via WhatsApp.` });
    setFullName(""); setEmail(""); setPhone("");
    fetchInvites();
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const inputCls = "w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 outline-none placeholder:text-white/30";

  return (
    <div className="space-y-5">
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h2 className="font-display font-semibold text-base flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-[#C8102E]" /> Onboard New Admin
        </h2>
        {error && <div className="bg-destructive/20 text-red-300 text-xs p-2 rounded mb-3">{error}</div>}
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <input className={inputCls} placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={inputCls} type="tel" placeholder="Phone (11 digits)" value={phone} maxLength={11} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
        </div>
        <button
          onClick={generate}
          disabled={busy}
          className="bg-[#C8102E] hover:bg-[#a30d25] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          <Send size={14} /> {busy ? "Generating..." : "Generate Invite Code"}
        </button>
        <p className="text-[11px] text-white/40 mt-2">
          DEV MODE: WhatsApp delivery placeholder. Copy the code and share manually for now. Code expires in 48 hours.
        </p>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-display font-semibold text-sm">Recent Invites</h3>
        </div>
        {invites.length === 0 ? (
          <p className="text-sm text-white/40 p-6 text-center">No invites generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Code</TableHead>
                  <TableHead className="text-white/60">Full Name</TableHead>
                  <TableHead className="text-white/60">Email</TableHead>
                  <TableHead className="text-white/60">Phone</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Expires</TableHead>
                  <TableHead className="text-white/60">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((i) => {
                  const expired = new Date(i.expires_at) < new Date();
                  const status = i.status === "used" ? "used" : expired ? "expired" : "pending";
                  return (
                    <TableRow key={i.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-[#C8102E] font-mono text-xs font-bold">{i.invite_code}</TableCell>
                      <TableCell className="text-white text-xs">{i.full_name}</TableCell>
                      <TableCell className="text-white/70 text-xs">{i.email}</TableCell>
                      <TableCell className="text-white/70 text-xs">{i.phone}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status === "used" ? "bg-green-500/20 text-green-400" : status === "expired" ? "bg-white/10 text-white/40" : "bg-yellow-500/20 text-yellow-400"}`}>{status}</span>
                      </TableCell>
                      <TableCell className="text-white/60 text-xs">{new Date(i.expires_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <button onClick={() => copy(i.invite_code)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs">
                          {copied === i.invite_code ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvites;
