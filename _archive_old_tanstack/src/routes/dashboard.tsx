import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  Calendar,
  Users,
  Video,
  CreditCard,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DocPulse" },
      { name: "description", content: "Manage appointments, patients, consultations and billing." },
    ],
  }),
  component: DashboardLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/appointments", label: "Appointments", icon: Calendar },
  { to: "/dashboard/patients", label: "Patients", icon: Users },
  { to: "/dashboard/consultations", label: "Consultations", icon: Video },
  { to: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/signin" });
        return;
      }
      setEmail(data.session.user.email ?? null);
      setReady(true);
    });
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/signin" });
  }

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="size-10 rounded-full bg-hero-gradient animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-background text-foreground">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-white/80 backdrop-blur-xl transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-hero-gradient grid place-items-center shadow-glow">
              <Activity className="size-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">DocPulse</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-hero-gradient text-white shadow-glow"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-border bg-white/60">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-9 rounded-full bg-hero-gradient grid place-items-center text-white text-sm font-semibold">
              {(email ?? "D")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{email ?? "Doctor"}</div>
              <div className="text-xs text-muted-foreground">Clinician</div>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-white/70 backdrop-blur-xl">
          <div className="h-full px-4 sm:px-6 flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-secondary"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex-1 max-w-md relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search patients, appointments…"
                className="w-full pl-9 pr-3 h-10 rounded-xl bg-secondary/60 border border-transparent focus:border-ring focus:bg-background outline-none text-sm transition"
              />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-secondary" aria-label="Notifications">
              <Bell className="size-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
