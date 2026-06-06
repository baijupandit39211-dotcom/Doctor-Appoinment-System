import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Stethoscope, Building2, HeartPulse, Baby, Brain, Eye, Activity } from "lucide-react";
import { PageShell, PageHero, CTAStrip } from "@/components/page-shell";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions — DocPulse" },
      { name: "description", content: "Solutions for clinics, hospitals, specialists and telemedicine providers." },
      { property: "og:title", content: "DocPulse Solutions" },
      { property: "og:description", content: "Built for every kind of healthcare practice." },
    ],
  }),
  component: Page,
});

const solutions = [
  { icon: Stethoscope, title: "Independent clinics", body: "Run your single-location practice with everything you need in one place." },
  { icon: Building2, title: "Multi-site hospitals", body: "Centralize scheduling, records and billing across every facility." },
  { icon: HeartPulse, title: "Cardiology", body: "Specialty templates, ECG attachments and longitudinal patient tracking." },
  { icon: Baby, title: "Pediatrics", body: "Growth charts, immunization tracking and parent communication built-in." },
  { icon: Brain, title: "Mental health", body: "Recurring sessions, structured assessments and secure messaging." },
  { icon: Eye, title: "Specialty practices", body: "Configure DocPulse for dermatology, ophthalmology, dental and more." },
  { icon: Activity, title: "Telemedicine providers", body: "Scale virtual-first care with provider rotations and instant queues." },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Solutions"
        title="Built for every kind of practice."
        subtitle="From solo clinicians to multi-site hospital groups — DocPulse adapts to your workflow."
      />
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-5">
          {solutions.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="p-7 rounded-2xl border border-border bg-white/60 flex gap-5 hover:shadow-soft transition"
            >
              <div className="size-12 rounded-xl bg-hero-gradient grid place-items-center shadow-glow shrink-0">
                <s.icon className="size-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <CTAStrip />
    </PageShell>
  );
}
