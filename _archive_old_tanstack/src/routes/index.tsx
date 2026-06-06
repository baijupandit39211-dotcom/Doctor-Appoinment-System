import { createFileRoute } from "@tanstack/react-router";
import {
  Nav, Hero, Trusted, Bento, Showcase, HowItWorks,
  Benefits, Testimonials, Security, Pricing, FAQ, FinalCTA, Footer,
} from "@/components/landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocPulse — Healthcare Appointments, Simplified" },
      { name: "description", content: "Manage appointments, patients, doctors, telemedicine, and clinic operations from one intelligent healthcare platform." },
      { property: "og:title", content: "DocPulse — Modern Doctor Appointment & Clinic Platform" },
      { property: "og:description", content: "The intelligent OS for modern clinics, hospitals, and healthcare providers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="bg-background text-foreground">
      <Nav />
      <Hero />
      <Trusted />
      <Bento />
      <Showcase />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Security />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
