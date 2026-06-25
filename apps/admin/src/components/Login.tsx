import { useState } from "react";
import { useAuth } from "../AuthContext";
import { TicketIcon } from "../icons";

export function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [reg, setReg] = useState({ businessName: "", name: "", phone: "", email: "", password: "", type: "Bus" });

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r =
      mode === "login"
        ? await login({ identifier, password })
        : await register(reg);
    if (!r.ok) {
      setError(r.error);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <TicketIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-ink">Bookie</div>
              <div className="text-[11px] text-muted">Operator Console</div>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-ink">
            {mode === "login" ? "Operator sign in" : "Register your business"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "login" ? "Manage your buses, schedules and bookings." : "List your buses, hotels, tours & more on Bookie."}
          </p>

          <div className="mt-6 space-y-3">
            {mode === "register" && (
              <>
                <input className={inp} placeholder="Business name (e.g. Daewoo Express)" value={reg.businessName} onChange={(e) => setReg({ ...reg, businessName: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} placeholder="Your name" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} />
                  <select className={inp} value={reg.type} onChange={(e) => setReg({ ...reg, type: e.target.value })}>
                    {["Bus", "Airline", "Railway", "Hotel", "Car", "Tours"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <input className={inp} placeholder="Email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} />
                <input className={inp} placeholder="Mobile (03XXXXXXXXX)" value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} />
                <input className={inp} type="password" placeholder="Password (min 6)" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} />
              </>
            )}
            {mode === "login" && (
              <>
                <input className={inp} placeholder="Email or mobile" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                <input className={inp} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </>
            )}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button disabled={busy} className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {mode === "login" ? "Sign in" : "Create operator account"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "login" ? "New operator? " : "Already registered? "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }} className="font-semibold text-brand-700 hover:underline">
              {mode === "login" ? "Register your business" : "Sign in"}
            </button>
          </p>
        </form>
      </div>

      <div className="relative hidden bg-brand-700 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-900" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-3xl font-extrabold leading-tight">Grow your business with Bookie.</h2>
          <p className="mt-3 max-w-md text-white/80">
            Add buses with seat maps, publish schedules, manage availability and track bookings — all in one console, live on the Bookie marketplace.
          </p>
        </div>
      </div>
    </div>
  );
}
