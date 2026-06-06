import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero, CTAStrip } from "@/components/page-shell";
import { Pricing, FAQ } from "@/components/landing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — DocPulse" },
      { name: "description", content: "Simple, transparent pricing for clinics of every size." },
      { property: "og:title", content: "DocPulse Pricing" },
      { property: "og:description", content: "Plans for solo clinicians, growing practices and enterprises." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Pricing"
        title="Simple pricing that scales with you."
        subtitle="Start free. Upgrade when you need more. Cancel anytime."
      />
      <Pricing />
      <FAQ />
      <CTAStrip />
    </PageShell>
  );
}
