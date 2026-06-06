import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/get-started")({
  head: () => ({
    meta: [
      { title: "Get Started — DocPulse" },
      { name: "description", content: "Create your DocPulse account and start a 14-day free trial." },
    ],
  }),
  component: Page,
});

const perks = [
  "14-day free trial, no credit card",
  "Concierge onboarding and data import",
  "HIPAA, GDPR & SOC2 compliant",
  "Cancel anytime",
];

const schema = z.object({
  first: z.string().trim().min(1, "Required").max(60),
  last: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  org: z.string().trim().min(1, "Required").max(120),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number"),
});

type FormVals = z.infer<typeof schema>;
type FormErrs = Partial<Record<keyof FormVals, string>>;

function Page() {
  const navigate = useNavigate();
  const [vals, setVals] = useState<FormVals>({ first: "", last: "", email: "", org: "", password: "" });
  const [errs, setErrs] = useState<FormErrs>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  function set<K extends keyof FormVals>(k: K, v: string) {
    setVals((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrs({});
    const parsed = schema.safeParse(vals);
    if (!parsed.success) {
      const fe: FormErrs = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof FormVals;
        if (!fe[k]) fe[k] = i.message;
      });
      setErrs(fe);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: parsed.data.first,
          last_name: parsed.data.last,
          organization: parsed.data.org,
        },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("registered")) {
        toast.error("An account with this email already exists.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Account created — check your email to confirm.");
    navigate({ to: "/signin" });
  }

  async function onGoogle() {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-screen bg-background text-foreground grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 order-2 lg:order-1">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="size-8 rounded-xl bg-hero-gradient grid place-items-center"><Activity className="size-4 text-white" /></div>
            <span className="font-semibold">DocPulse</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Start your free trial</h1>
          <p className="mt-2 text-sm text-muted-foreground">Up and running in under 5 minutes.</p>

          <button
            type="button"
            onClick={onGoogle}
            disabled={googleLoading || loading}
            className="mt-6 w-full py-3 rounded-full border border-border bg-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted/50 transition disabled:opacity-60"
          >
            {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First name" name="first" value={vals.first} onChange={(v) => set("first", v)} error={errs.first} autoComplete="given-name" />
              <Field label="Last name" name="last" value={vals.last} onChange={(v) => set("last", v)} error={errs.last} autoComplete="family-name" />
            </div>
            <Field label="Work email" name="email" type="email" value={vals.email} onChange={(v) => set("email", v)} error={errs.email} autoComplete="email" />
            <Field label="Clinic / organization" name="org" value={vals.org} onChange={(v) => set("org", v)} error={errs.org} autoComplete="organization" />
            <div>
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={vals.password}
                  onChange={(e) => set("password", e.target.value)}
                  aria-invalid={!!errs.password}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errs.password ? (
                <p className="mt-1 text-xs text-destructive">{errs.password}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">8+ characters with uppercase, lowercase, and a number.</p>
              )}
            </div>
            <button type="submit" disabled={loading || googleLoading} className="w-full py-3 rounded-full bg-foreground text-background font-medium shadow-soft hover:opacity-90 transition inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create account
            </button>
            <p className="text-xs text-muted-foreground text-center">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link to="/signin" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </motion.div>
      </div>
      <div className="relative overflow-hidden bg-hero-gradient order-1 lg:order-2">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 0, transparent 50%)" }} />
        <div className="relative h-full flex flex-col justify-center p-12 text-white">
          <h2 className="text-3xl font-semibold leading-tight max-w-md">Everything you need to run a modern practice.</h2>
          <ul className="mt-8 space-y-3 max-w-md">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/90">
                <span className="size-6 rounded-full bg-white/20 grid place-items-center"><Check className="size-4" /></span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

function Field({
  label, name, value, onChange, error, type = "text", autoComplete,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.6 39 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.2 5.1c-.4.4 6.5-4.7 6.5-14.4 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
