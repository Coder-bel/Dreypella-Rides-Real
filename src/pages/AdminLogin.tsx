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
		// Sign in with email and password    
		const { error: signInErr } = await supabase.auth.signInWithPassword({      
	   		email: email.trim().toLowerCase(),      
	   		password, 
		});

		if (signInErr) {
			setLoading(false);
			return setError("Invalid login credentials.");
		}

		// Verify they have admin role    
		const { data: { user: authedUser } } = await supabase.auth.getUser();
		const uid = authedUser?.id;


		if (uid) {      
			const { data: rolesData } = await supabase
				.from("user_roles")
				.select("role")
				.eq("user_id", uid);
		 	const roles = (rolesData || []).map((r: any) => r.role);


			if (!roles.includes("admin")) {
				await supabase.auth.signOut();
				setLoading(false);
				return setError("Invalid login credentials.");
			}


			// Verify company code belongs to this admin
			const { data: adminData } = await supabase
				.from("admins")
				.select("id, company_code")
				.eq("user_id", uid)
				.eq("company_code", code)
				.maybeSingle();

			if (!adminData) {
				await supabase.auth.signOut();
				setLoading(false);
				return setError("Invalid login credentials.");
			} 
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
						<p className="text-xs text-muted-foreground mt-3">No account yet?{" "}
						<Link to="/admin-signup" className="font-semibold text-accent hover:underline">Sign up here</Link></p></div>
					</div>

						{error && (
						<div className="bg-destructive/10 text-destructive text-sm px-3 py-2 
							rounded-lg mb-3 flex items-start gap-2 animate-shake">
							<AlertCircle size={14} className="shrink-0 mt-0.5" />
							<span>{error}</span>
						</div>
						)}
					

						<form onSubmit={handleLogin} className="space-y-3">
							<div>
								<label className="block text-sm font-medium mb-1.5">Company Code</label>
								<input className={inputCls + " font-mono uppercase"} placeholder="ADPR-XXXX" maxLength={9} value={companyCode}
								onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1.5">Email</label>
								<input className={inputCls} 
									type="email" 
									placeholder="admin@example.com" 
									value={email} 
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1.5">Password</label>
								<input 
									className={inputCls}
									type="password"
									placeholder="••••••••"  
									value={password}  
									onChange={(e) => setPassword(e.target.value)}
								/>
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
