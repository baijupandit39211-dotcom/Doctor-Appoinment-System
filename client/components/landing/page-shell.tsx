"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Nav, Footer } from "./landing";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <Nav />
      <div className="pt-24">{children}</div>
      <Footer />
    </main>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient opacity-10 blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong border border-border text-xs font-medium text-muted-foreground"
        >
          {eyebrow}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      </div>
    </section>
  );
}

export function CTAStrip() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-6xl rounded-3xl bg-hero-gradient p-10 sm:p-14 text-white shadow-glow relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0, transparent 40%)" }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ready to modernize your practice?</h3>
            <p className="mt-2 text-white/80">Join thousands of clinicians running on DocPulse.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/register" className="px-6 py-3 rounded-full bg-white text-foreground font-medium inline-flex items-center gap-2 shadow-soft">
              Start free trial <ArrowRight className="size-4" />
            </Link>
            <Link href="/login" className="px-6 py-3 rounded-full border border-white/40 text-white font-medium hover:bg-white/10 transition">
              Talk to sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid({ items }: { items: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }[] }) {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
            className="p-6 rounded-2xl border border-border bg-white/60 hover:shadow-soft transition group"
          >
            <div className="size-11 rounded-xl bg-hero-gradient grid place-items-center shadow-glow group-hover:scale-105 transition">
              <f.icon className="size-5 text-white" />
            </div>
            <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
