import { createFileRoute } from "@tanstack/react-router";
import { Activity, Calendar, Users, Video, FileText, BarChart3, Shield, Bell, CloudUpload, Pill, Stethoscope, Lock } from "lucide-react";
import { PageShell, PageHero, FeatureGrid, CTAStrip } from "@/components/page-shell";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform — DocPulse" },
      { name: "description", content: "One unified platform for appointments, EHR, telemedicine, billing, and analytics." },
      { property: "og:title", content: "The DocPulse Platform" },
      { property: "og:description", content: "Everything your clinic needs in one intelligent OS." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="The Platform"
        title="One intelligent OS for modern healthcare."
        subtitle="DocPulse unifies appointments, records, telemedicine, billing, and analytics into a single platform built for clinicians."
      />
      <FeatureGrid
        items={[
          { icon: Calendar, title: "Smart scheduling", body: "AI-optimized slots, waitlists and reminders that reduce no-shows by up to 38%." },
          { icon: Video, title: "Telemedicine", body: "HIPAA-grade video consults with built-in notes, prescriptions and follow-ups." },
          { icon: FileText, title: "Electronic records", body: "Structured EHR with rich timelines, attachments and shareable summaries." },
          { icon: Pill, title: "e-Prescriptions", body: "Send prescriptions to pharmacies in one click with drug-interaction checks." },
          { icon: BarChart3, title: "Practice analytics", body: "Real-time dashboards on revenue, utilization, patient flow and outcomes." },
          { icon: Bell, title: "Patient engagement", body: "SMS, email and in-app reminders that keep patients informed and on-time." },
          { icon: CloudUpload, title: "Cloud-native", body: "Encrypted at rest and in transit. 99.99% uptime backed by global infrastructure." },
          { icon: Shield, title: "Compliance built-in", body: "HIPAA, GDPR, SOC2 and HL7/FHIR support out of the box." },
          { icon: Stethoscope, title: "Clinician-first UX", body: "Designed with thousands of clinicians. Fast, keyboard-friendly and calm." },
        ]}
      />
      <CTAStrip />
    </PageShell>
  );
}
