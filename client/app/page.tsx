import {
  Nav,
  Hero,
  Trusted,
  Bento,
  Showcase,
  HowItWorks,
  Benefits,
  Testimonials,
  Security,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
} from "@/components/landing/landing";

export default function HomePage() {
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
