import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageShell, PageHero, CTAStrip } from "@/components/page-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — DocPulse" },
      { name: "description", content: "Our mission is to give every clinician superpowers and every patient a better experience." },
      { property: "og:title", content: "About DocPulse" },
      { property: "og:description", content: "Building the operating system for modern healthcare." },
    ],
  }),
  component: Page,
});

const stats = [
  { v: "12k+", l: "Clinicians" },
  { v: "4.2M", l: "Patients served" },
  { v: "38%", l: "Fewer no-shows" },
  { v: "99.99%", l: "Uptime" },
];

const values = [
  { t: "Patient first", b: "Every decision begins with the question: does this make care better?" },
  { t: "Clinician obsessed", b: "We sit with doctors weekly. Their time is sacred and so is their workflow." },
  { t: "Security as a feature", b: "We treat patient data the way we'd want our own family's data treated." },
  { t: "Quietly ambitious", b: "We aim to be infrastructure — invisible, dependable, and everywhere." },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About"
        title="We're building the OS for modern healthcare."
        subtitle="Founded by clinicians and engineers, DocPulse exists to give every practice the tools they deserve."
      />
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="p-6 rounded-2xl border border-border bg-white/60 text-center"
            >
              <p className="text-3xl font-semibold tracking-tight">{s.v}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">What we believe</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="p-7 rounded-2xl border border-border bg-white/60"
              >
                <h3 className="font-semibold tracking-tight">{v.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <CTAStrip />
    </PageShell>
  );
}
