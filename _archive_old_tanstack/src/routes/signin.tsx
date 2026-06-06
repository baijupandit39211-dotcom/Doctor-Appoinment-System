import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — DocPulse" },
      { name: "description", content: "Sign in to your DocPulse account." },
    ],
  }),
  component: Page,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fe: typeof errors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as "email" | "password";
        fe[k] = i.message;
      });
      setErrors(fe);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("invalid")
        ? "Invalid email or password."
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
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
      <div className="hidden lg:block relative overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 0, transparent 50%)" }} />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-white/20 backdrop-blur grid place-items-center"><Activity className="size-4" /></div>
            <span className="font-semibold">DocPulse</span>
          </Link>
          <div>
            <p className="text-3xl font-semibold leading-tight max-w-md">"DocPulse cut our admin time in half and made our patients happier."</p>
            <p className="mt-4 text-white/80 text-sm">— Dr. Amara Okafor, Sunrise Health</p>
          </div>
          <p className="text-xs text-white/60">© {new Date().getFullYear()} DocPulse, Inc.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-8 rounded-xl bg-hero-gradient grid place-items-center"><Activity className="size-4 text-white" /></div>
            <span className="font-semibold">DocPulse</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your DocPulse account.</p>

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
            <div>
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                aria-invalid={!!errors.email}
                className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="password">Password</label>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-full bg-foreground text-background font-medium shadow-soft hover:opacity-90 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            New to DocPulse? <Link to="/get-started" className="text-primary font-medium hover:underline">Create account</Link>
          </p>
        </motion.div>
      </div>
    </main>
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
