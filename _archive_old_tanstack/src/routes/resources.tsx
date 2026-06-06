import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, FileText, GraduationCap, Newspaper, LifeBuoy, Code2 } from "lucide-react";
import { PageShell, PageHero, CTAStrip } from "@/components/page-shell";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — DocPulse" },
      { name: "description", content: "Guides, documentation, customer stories and developer APIs." },
      { property: "og:title", content: "DocPulse Resources" },
      { property: "og:description", content: "Everything to help you get the most out of DocPulse." },
    ],
  }),
  component: Page,
});

const resources = [
  { icon: BookOpen, title: "Guides", body: "Step-by-step playbooks for setup, migration and best practice." },
  { icon: FileText, title: "Documentation", body: "Deep technical docs for admins, integrators and developers." },
  { icon: GraduationCap, title: "DocPulse Academy", body: "Free certifications for clinicians and front-desk teams." },
  { icon: Newspaper, title: "Blog", body: "Product news, healthcare trends and customer stories." },
  { icon: LifeBuoy, title: "Help Center", body: "Searchable knowledge base with 500+ articles." },
  { icon: Code2, title: "Developer API", body: "Build on DocPulse with REST, webhooks and HL7/FHIR." },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Everything you need to succeed."
        subtitle="Documentation, learning and developer tools — all in one place."
      />
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="p-6 rounded-2xl border border-border bg-white/60 hover:shadow-soft transition group"
            >
              <div className="size-11 rounded-xl bg-hero-gradient grid place-items-center shadow-glow group-hover:scale-105 transition">
                <r.icon className="size-5 text-white" />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">{r.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              <Link to="/contact" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Learn more →</Link>
            </motion.div>
          ))}
        </div>
      </section>
      <CTAStrip />
    </PageShell>
  );
}
