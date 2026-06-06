import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { PageShell, PageHero } from "@/components/page-shell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — DocPulse" },
      { name: "description", content: "Talk to sales, get support or visit our offices." },
      { property: "og:title", content: "Contact DocPulse" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
  component: Page,
});

function Page() {
  const [sent, setSent] = useState(false);
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="Let's talk."
        subtitle="Whether you're scoping a rollout or just curious — we're here."
      />
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {[
              { icon: Mail, t: "Email", v: "hello@docpulse.health" },
              { icon: Phone, t: "Sales", v: "+1 (415) 555-0199" },
              { icon: MapPin, t: "HQ", v: "548 Market St, San Francisco, CA" },
            ].map((c) => (
              <div key={c.t} className="p-5 rounded-2xl border border-border bg-white/60 flex gap-4 items-start">
                <div className="size-10 rounded-xl bg-hero-gradient grid place-items-center shadow-glow shrink-0">
                  <c.icon className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.t}</p>
                  <p className="text-sm text-muted-foreground">{c.v}</p>
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="lg:col-span-3 p-8 rounded-3xl border border-border bg-white/70 shadow-soft space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" name="name" placeholder="Jane Doe" />
              <Field label="Work email" name="email" type="email" placeholder="jane@clinic.com" />
            </div>
            <Field label="Organization" name="org" placeholder="Sunrise Health Clinic" />
            <div>
              <label className="text-sm font-medium">How can we help?</label>
              <textarea required rows={5} className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Tell us about your practice…" />
            </div>
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium shadow-soft hover:opacity-90 transition">
              {sent ? "Message sent" : "Send message"} <Send className="size-4" />
            </button>
            {sent && <p className="text-sm text-muted-foreground">Thanks — our team will get back within one business day.</p>}
          </form>
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} required placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
