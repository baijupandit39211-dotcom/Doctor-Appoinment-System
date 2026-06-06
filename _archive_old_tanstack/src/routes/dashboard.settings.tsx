import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Lock, Bell, Building2, CreditCard, Shield } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "clinic", label: "Clinic", icon: Building2 },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "compliance", label: "Compliance", icon: Shield },
] as const;

function SettingsPage() {
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account, clinic, and integrations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <nav className="rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card p-2 h-fit">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active === s.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <s.icon className="size-4" /> {s.label}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card p-6">
          {active === "profile" && <ProfileForm />}
          {active !== "profile" && (
            <div className="text-sm text-muted-foreground">
              {sections.find((s) => s.id === active)?.label} settings coming soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileForm() {
  return (
    <form className="space-y-5 max-w-xl">
      <h2 className="font-semibold tracking-tight">Profile</h2>
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-hero-gradient text-white grid place-items-center text-xl font-semibold shadow-glow">DR</div>
        <button type="button" className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary">
          Upload photo
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name" defaultValue="Diana" />
        <Field label="Last name" defaultValue="Reyes" />
        <Field label="Email" type="email" defaultValue="diana@docpulse.com" />
        <Field label="Specialty" defaultValue="Cardiology" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-xl bg-hero-gradient text-white text-sm font-medium shadow-glow">Save changes</button>
      </div>
    </form>
  );
}

function Field({ label, type = "text", defaultValue }: { label: string; type?: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="mt-1 w-full h-10 px-3 rounded-xl bg-secondary/60 border border-transparent focus:border-ring focus:bg-background outline-none text-sm"
      />
    </label>
  );
}
