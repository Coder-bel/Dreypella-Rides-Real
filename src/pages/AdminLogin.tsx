import PasswordInput from "@/components/PasswordInput";
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const code = companyCode.trim().toUpperCase();
    if (!/^ADPR-\d{4}$/.test(code)) {
      return setError("Invalid Company Code format. Expected: ADPR-XXXX");
    }
    if (!email.trim()) return setError("Email is required");
    if (!password) return setError("Password is required");

    setLoading(true);

    // Step 1: Sign in with email and password
    console.log("Step 1: Attempting signin with:", email.trim().toLowerCase());
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    console.log("Step 1 result - signInErr:", signInErr);

    if (signInErr) {
      setLoading(false);
      return setError("Invalid login credentials.");
    }

    // Step 2: Get authenticated user
    const { data: { user: authedUser } } = await supabase.auth.getUser();
    const uid = authedUser?.id;
    console.log("Step 2 - uid:", uid);
    if (!uid) {
      setLoading(false);
      return setError("Invalid login credentials.");
    }

    // Step 3: Check admin role in user_roles
    const { data: rolesData, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);

    console.log("Step 3 - rolesData:", rolesData, "rolesErr:", rolesErr);

    const roles = (rolesData || []).map((r: any) => r.role);
    console.log("Step 3 - roles array:", roles, "includes admin:", roles.includes("admin"));


    if (!roles.includes("admin")) {
      await supabase.auth.signOut();
      setLoading(false);
      return setError("Invalid login credentials.");
    }

    // Step 4: Find admin record
    const { data: adminData, error: adminErr } = await supabase
      .from("admins")
      .select("id, company_code")
      .eq("user_id", uid)
      .maybeSingle();

    console.log("adminData:", adminData, "adminErr:", adminErr, "code entered:", code);

    if (!adminData) {
      await supabase.auth.signOut();
      setLoading(false);
      return setError("Admin record not found. Contact support.");
    }

    // Step 5: Verify company code matches

    console.log("Step 5 - DB code:", adminData.company_code, "Entered code:", code, "Match:", adminData.company_code === code);

    if (adminData.company_code !== code) {
      await supabase.auth.signOut();
      setLoading(false);
      return setError("Invalid company code.");
    }

    setLoading(false);
    navigate("/admin");
  };

  const inputCls = "w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-navy-gradient sticky top-0 z-50">
        <div className="container flex items-center justify-center h-14 px-4">
          <span className="font-display font-bold text-lg text-primary-foreground tracking-tight">
            DREYPELLA<span className="text-red-brand"> RIDE</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-card rounded-2xl border p-6 sm:p-8 w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-5">
            <ShieldCheck size={36} className="mx-auto text-accent mb-2" />
            <h1 className="font-display font-bold text-xl">Admin Login</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in with your company code, email and password
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              No account yet?{" "}
              <Link to="/admin-signup" className="font-semibold text-accent hover:underline">
                Sign up here
              </Link>
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg mb-3 flex items-start gap-2 animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Company Code</label>
              <input
                className={inputCls + " font-mono uppercase"}
                placeholder="ADPR-XXXX"
                maxLength={9}
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                className={inputCls}
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <PasswordInput className={inputCls} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-xl disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
