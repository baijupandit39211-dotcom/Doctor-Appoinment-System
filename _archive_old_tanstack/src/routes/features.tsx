import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Users, Video, FileText, BarChart3, Bell, Pill, Shield, Heart, Clock, TrendingUp, UserCog } from "lucide-react";
import { PageShell, PageHero, FeatureGrid, CTAStrip } from "@/components/page-shell";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — DocPulse" },
      { name: "description", content: "Every feature your clinic needs: scheduling, EHR, telemedicine, billing, analytics and more." },
      { property: "og:title", content: "DocPulse Features" },
      { property: "og:description", content: "Powerful tools designed for modern healthcare teams." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Features"
        title="Powerful tools, beautifully designed."
        subtitle="Every workflow your team needs, polished to feel effortless."
      />
      <FeatureGrid
        items={[
          { icon: Calendar, title: "Online booking", body: "Branded booking pages, real-time availability and instant confirmations." },
          { icon: Users, title: "Patient CRM", body: "Rich patient profiles with history, allergies, documents and family links." },
          { icon: Video, title: "Video visits", body: "One-click telemedicine with screen sharing, recording and note capture." },
          { icon: FileText, title: "Clinical notes", body: "SOAP templates, voice-to-text and AI-assisted summaries." },
          { icon: Pill, title: "Prescriptions", body: "Send to pharmacy networks with drug safety checks." },
          { icon: BarChart3, title: "Analytics", body: "Slice revenue, utilization and outcomes by provider, location or service." },
          { icon: Bell, title: "Reminders", body: "Automated SMS, email and WhatsApp reminders with smart sequencing." },
          { icon: UserCog, title: "Roles & teams", body: "Granular permissions for doctors, nurses, admins and billing staff." },
          { icon: Shield, title: "Audit logs", body: "Full traceability for every record access and modification." },
          { icon: Heart, title: "Care plans", body: "Reusable templates for chronic care, post-op and wellness journeys." },
          { icon: Clock, title: "Waitlists", body: "Automatically fill cancellations from prioritized waitlists." },
          { icon: TrendingUp, title: "Marketing", body: "Recall campaigns and loyalty workflows that grow your practice." },
        ]}
      />
      <CTAStrip />
    </PageShell>
  );
}
