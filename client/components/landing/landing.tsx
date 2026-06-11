"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Activity, Calendar, Video, Users, FileText, Pill, Shield, BarChart3,
  Bell, Stethoscope, Check, Star, ChevronDown, ArrowRight, Sparkles,
  Lock, CloudUpload, UserCog, Heart, Clock, TrendingUp, Plus, Play,
  Globe, Mail, MessageCircle, Menu, X,
} from "lucide-react";

import { API_BASE_URL } from "@/lib/api";
import { getCurrentUser, logoutUser, type AuthRole, type AuthUser } from "@/lib/auth";

function getDashboardHref(role?: AuthRole) {
  switch (role) {
    case "patient":
      return "/patient";
    case "doctor":
      return "/doctor";
    case "clinic_admin":
    case "super_admin":
      return `/${role === "clinic_admin" ? "admin" : "superadmin"}`;
    default:
      return "/login";
  }
}

function getProfileHref(role?: AuthRole) {
  switch (role) {
    case "patient":
      return "/patient?section=Profile";
    case "doctor":
      return "/doctor?section=Profile";
    case "clinic_admin":
      return "/admin";
    case "super_admin":
      return "/superadmin";
    default:
      return "/login";
  }
}

function getAppointmentsHref(role?: AuthRole) {
  switch (role) {
    case "patient":
      return "/patient?section=Appointments";
    case "doctor":
      return "/doctor?section=Appointments";
    case "clinic_admin":
      return "/admin?section=Appointments";
    case "super_admin":
      return "/superadmin?section=Appointments";
    default:
      return "/login";
  }
}

function getUserAvatarSrc(user?: AuthUser | null) {
  const avatar = user?.avatar?.trim();
  if (!avatar) {
    return "";
  }

  if (avatar.startsWith("data:") || avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  return avatar.startsWith("/") ? `${API_BASE_URL}${avatar}` : `${API_BASE_URL}/${avatar}`;
}

function getUserInitials(name?: string) {
  const value = name?.trim();
  if (!value) {
    return "U";
  }

  return value
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ---------------- NAV ---------------- */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links: { label: string; to: string }[] = [
    { label: "Platform", to: "#home" },
    { label: "Features", to: "#features" },
    { label: "Solutions", to: "#solutions" },
    { label: "Pricing", to: "#pricing" },
    { label: "Resources", to: "#resources" },
  ];
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong shadow-soft" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-hero-gradient grid place-items-center shadow-glow">
            <Activity className="size-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">DocPulse</span>
        </Link>
        <ul className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <li key={l.to}>
              <a href={l.to} className="hover:text-foreground transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-full hover:bg-secondary transition">
            Sign In
          </Link>
          <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold !text-white hover:!text-white hover:bg-blue-700 shadow-[0_14px_30px_rgba(37,99,235,0.22)] [&_*]:!text-white transition">
            Get Started
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass-strong overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {links.map((l) => (
                <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="text-sm py-2">
                  {l.label}
                </a>
              ))}
              <Link href="/register" onClick={() => setOpen(false)} className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold !text-white text-center hover:!text-white hover:bg-blue-700 [&_*]:!text-white">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ---------------- HERO ---------------- */
function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
      className="relative mx-auto max-w-5xl"
    >
      <div className="absolute -inset-4 bg-hero-gradient opacity-30 blur-3xl rounded-[3rem]" />
      <div className="relative glass-strong rounded-4xl p-4 sm:p-6 shadow-glow border border-white/60">
        <div className="rounded-3xl bg-white overflow-hidden border border-border">
          {/* topbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-hero-gradient" />
              <span className="text-xs font-semibold">DocPulse Dashboard</span>
            </div>
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-red-400" />
              <div className="size-2.5 rounded-full bg-yellow-400" />
              <div className="size-2.5 rounded-full bg-green-400" />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 p-5">
            {/* sidebar */}
            <div className="col-span-2 hidden md:flex flex-col gap-2">
              {[Calendar, Users, Video, FileText, BarChart3].map((Icon, i) => (
                <div key={i} className={`size-9 rounded-xl grid place-items-center ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="size-4" />
                </div>
              ))}
            </div>
            <div className="col-span-12 md:col-span-10 grid grid-cols-6 gap-4">
              {/* stats */}
              {[
                { l: "Appointments", v: "248", t: "+12%", c: "text-primary" },
                { l: "Patients", v: "1,420", t: "+8%", c: "text-teal" },
                { l: "Revenue", v: "$84K", t: "+22%", c: "text-sky" },
              ].map((s) => (
                <div key={s.l} className="col-span-2 rounded-2xl border border-border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                  <p className="text-xl font-bold mt-1">{s.v}</p>
                  <p className={`text-[10px] font-medium ${s.c}`}>{s.t} this week</p>
                </div>
              ))}
              {/* chart */}
              <div className="col-span-4 rounded-2xl border border-border p-4 h-44">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold">Revenue Analytics</p>
                  <span className="text-[10px] text-muted-foreground">Last 7 days</span>
                </div>
                <svg viewBox="0 0 300 100" className="w-full h-24">
                  <defs>
                    <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.22 263)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="oklch(0.55 0.22 263)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,80 C40,60 60,40 100,50 C140,60 160,20 200,30 C240,40 270,15 300,20 L300,100 L0,100 Z" fill="url(#ga)" />
                  <path d="M0,80 C40,60 60,40 100,50 C140,60 160,20 200,30 C240,40 270,15 300,20" fill="none" stroke="oklch(0.55 0.22 263)" strokeWidth="2" />
                </svg>
              </div>
              {/* appointments */}
              <div className="col-span-6 md:col-span-3 rounded-2xl border border-border p-4">
                <p className="text-xs font-semibold mb-3">Upcoming Appointments</p>
                {[
                  { n: "Dr. Sarah Chen", t: "Cardiology · 10:30 AM", c: "bg-primary" },
                  { n: "Dr. James Patel", t: "Pediatrics · 11:15 AM", c: "bg-teal" },
                  { n: "Dr. Maya Iyer", t: "Dermatology · 12:00 PM", c: "bg-sky" },
                ].map((a) => (
                  <div key={a.n} className="flex items-center gap-3 py-2">
                    <div className={`size-8 rounded-full ${a.c} text-white grid place-items-center text-[10px] font-semibold`}>
                      {a.n.split(" ")[1][0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.n}</p>
                      <p className="text-[10px] text-muted-foreground">{a.t}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* video widget */}
              <div className="col-span-6 md:col-span-3 rounded-2xl bg-foreground text-white p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-hero-gradient opacity-30" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider">Live consultation</span>
                  </div>
                  <p className="text-sm font-semibold">Dr. Sarah Chen</p>
                  <p className="text-[10px] opacity-70">Patient: Emma Wilson</p>
                  <div className="flex gap-2 mt-3">
                    <button className="size-8 rounded-full bg-white/20 grid place-items-center"><Video className="size-3.5" /></button>
                    <button className="size-8 rounded-full bg-red-500 grid place-items-center"><X className="size-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating cards */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-4 md:-left-16 top-20 hidden sm:block glass-strong rounded-2xl p-3 shadow-card w-56"
      >
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-teal/20 grid place-items-center">
            <Bell className="size-4 text-teal" />
          </div>
          <div>
            <p className="text-xs font-semibold">New appointment</p>
            <p className="text-[10px] text-muted-foreground">in 15 minutes</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-4 md:-right-12 top-40 hidden sm:block glass-strong rounded-2xl p-3 shadow-card w-52"
      >
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary/15 grid place-items-center">
            <TrendingUp className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">+22% Revenue</p>
            <p className="text-[10px] text-muted-foreground">vs last month</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-8 -bottom-6 hidden md:block glass-strong rounded-2xl p-3 shadow-card w-60"
      >
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-sky/20 grid place-items-center">
            <Heart className="size-4 text-sky" />
          </div>
          <div>
            <p className="text-xs font-semibold">98% Satisfaction</p>
            <p className="text-[10px] text-muted-foreground">2,431 reviews this week</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section id="home" className="relative pt-36 pb-24 overflow-hidden bg-mesh">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6"
        >
          <Sparkles className="size-3.5 text-primary" />
          AI-powered healthcare platform · v3.0
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-balance"
        >
          Healthcare Appointments,
          <br />
          <span className="gradient-text">Simplified.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty"
        >
          Manage appointments, patients, doctors, telemedicine, prescriptions, and clinic operations from one intelligent healthcare platform.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/register" className="group inline-flex h-14 items-center gap-3 rounded-full bg-blue-600 px-9 text-base font-semibold !text-white hover:!text-white hover:bg-blue-700 shadow-[0_16px_34px_rgba(37,99,235,0.24)] [&_*]:!text-white transition">
            Start Free Trial
            <ArrowRight className="size-5 !text-white transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link href="/doctors" className="inline-flex h-14 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-900 hover:bg-white transition">
            Find a Doctor
          </Link>
          <a href="#demo" className="inline-flex h-14 items-center gap-2 rounded-full glass px-6 text-sm font-medium hover:bg-white transition">
            <Play className="size-4" /> Book Demo
          </a>
        </motion.div>
        <div className="mt-[5.5rem]">
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}

/* ---------------- TRUSTED + STATS ---------------- */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const d = 1500;
    const id = requestAnimationFrame(function step() {
      const p = Math.min((Date.now() - start) / d, 1);
      setV(Math.floor(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(id);
  }, [inView, to]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
}

export function Trusted() {
  const logos = ["MediCore", "HealthPlus", "Verana", "ClinicAI", "Nordix Health", "VitaCare"];
  const stats = [
    { v: 10000, s: "+", l: "Doctors" },
    { v: 1, s: "M+", l: "Appointments" },
    { v: 500, s: "+", l: "Clinics" },
    { v: 98, s: "%", l: "Satisfaction Rate" },
  ];
  return (
    <section className="py-20 border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Trusted by Modern Healthcare Providers
        </p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-6 items-center justify-items-center">
          {logos.map((l) => (
            <div key={l} className="text-lg font-semibold text-muted-foreground/60 tracking-tight">{l}</div>
          ))}
        </div>
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-bold tracking-tight">
                <Counter to={s.v} suffix={s.s} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- BENTO FEATURES ---------------- */
export function Bento() {
  const items = [
    { i: Calendar, t: "AI Appointment Scheduling", d: "Smart algorithms auto-fill your calendar and reduce no-shows by 47%.", span: "md:col-span-2 md:row-span-2", accent: "primary" },
    { i: Video, t: "Telemedicine", d: "HD video consultations built-in.", span: "md:col-span-2", accent: "teal" },
    { i: Users, t: "Patient Management", d: "Unified patient profiles.", span: "md:col-span-2", accent: "sky" },
    { i: FileText, t: "Medical Records", d: "Secure, structured EHR with one-click export.", span: "md:col-span-2", accent: "primary" },
    { i: Pill, t: "E-Prescriptions", d: "Send prescriptions to any pharmacy.", span: "md:col-span-2", accent: "teal" },
    { i: Shield, t: "Insurance Processing", d: "Auto-verify coverage instantly.", span: "md:col-span-2", accent: "sky" },
    { i: Bell, t: "Automated Reminders", d: "SMS & email reduce no-shows.", span: "md:col-span-2", accent: "primary" },
    { i: BarChart3, t: "Healthcare Analytics", d: "Real-time insights for every department.", span: "md:col-span-2", accent: "teal" },
  ];
  const accents: Record<string, string> = {
    primary: "from-primary/10 to-transparent text-primary",
    teal: "from-teal/15 to-transparent text-teal",
    sky: "from-sky/15 to-transparent text-sky",
  };
  return (
    <section id="features" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-sm font-medium text-primary">Platform</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">A complete OS for modern clinics</h2>
          <p className="mt-4 text-muted-foreground text-lg">Every workflow, every department, every patient — connected.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[200px] gap-4">
          {items.map((it, idx) => {
            const Icon = it.i;
            return (
              <motion.div
                key={it.t}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.04 }}
                className={`group relative ${it.span} rounded-4xl border border-border bg-card p-6 overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${accents[it.accent]} opacity-60`} />
                <div className="relative h-full flex flex-col">
                  <div className={`size-11 rounded-2xl glass-strong grid place-items-center mb-4 ${accents[it.accent].split(" ").pop()}`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{it.t}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{it.d}</p>
                  {idx === 0 && (
                    <div className="mt-auto pt-6">
                      <div className="rounded-2xl glass-strong p-3 border border-white/40">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">Today's Schedule</span>
                          <span className="text-muted-foreground">9 booked</span>
                        </div>
                        <div className="mt-2 grid grid-cols-7 gap-1">
                          {Array.from({ length: 14 }).map((_, i) => (
                            <div key={i} className={`h-6 rounded ${[2,3,5,7,8,10,11,13].includes(i) ? "bg-primary" : "bg-secondary"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PRODUCT SHOWCASE WITH TABS ---------------- */
export function Showcase() {
  const tabs = ["Doctors", "Patients", "Analytics", "Billing"];
  const [active, setActive] = useState(0);
  return (
    <section id="demo" className="py-28 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything Your Clinic Needs</h2>
          <p className="mt-4 text-muted-foreground text-lg">One platform replaces a dozen tools.</p>
        </div>
        <div className="mt-10 flex justify-center">
          <div className="inline-flex p-1 rounded-full glass-strong border border-border">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setActive(i)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  active === i ? "bg-foreground text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-12 relative max-w-5xl mx-auto"
        >
          <div className="absolute -inset-6 bg-hero-gradient opacity-20 blur-3xl rounded-[3rem]" />
          <div className="relative rounded-4xl border border-border bg-card p-6 shadow-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { l: "Appointment Calendar", v: "248 scheduled", i: Calendar },
                { l: "Doctor Schedules", v: "42 active", i: Stethoscope },
                { l: "Revenue Reports", v: "$84,210", i: BarChart3 },
                { l: "Patient Records", v: "12,840 files", i: FileText },
                { l: "Staff Management", v: "86 members", i: Users },
                { l: "Analytics", v: "Live insights", i: TrendingUp },
              ].map((c) => {
                const Icon = c.i;
                return (
                  <div key={c.l} className="rounded-2xl border border-border p-4 bg-background hover:shadow-soft transition">
                    <Icon className="size-5 text-primary" />
                    <p className="mt-3 text-xs text-muted-foreground">{c.l}</p>
                    <p className="text-lg font-semibold">{c.v}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
export function HowItWorks() {
  const steps = [
    { n: "01", t: "Find a Doctor", d: "Search 10,000+ verified specialists by location & expertise.", i: Stethoscope },
    { n: "02", t: "Book Appointment", d: "Pick a slot in real-time, online or in-person.", i: Calendar },
    { n: "03", t: "Receive Confirmation", d: "Instant SMS & email confirmations with reminders.", i: Bell },
    { n: "04", t: "Attend Consultation", d: "Join video or visit the clinic — records sync automatically.", i: Video },
  ];
  return (
    <section id="resources" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">From search to consultation in minutes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute left-12 right-12 top-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((s, i) => {
            const Icon = s.i;
            return (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="relative mx-auto size-24 rounded-3xl bg-hero-gradient grid place-items-center shadow-glow">
                  <Icon className="size-10 text-white" strokeWidth={1.8} />
                  <span className="absolute -top-2 -right-2 size-7 rounded-full bg-foreground text-white text-xs font-bold grid place-items-center">{i+1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- BENEFITS ---------------- */
export function Benefits() {
  const items = [
    "Reduce no-shows by up to 47%",
    "Save 12+ hours of admin time per week",
    "Improve patient satisfaction scores",
    "Increase clinic efficiency end-to-end",
    "Secure, HIPAA-compliant patient records",
    "Better operational visibility in real-time",
  ];
  return (
    <section id="solutions" className="py-28 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-sm font-medium text-primary">Why DocPulse</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Outcomes that matter to your practice</h2>
          <p className="mt-4 text-muted-foreground text-lg">Real clinics. Real results. Backed by data from 500+ providers.</p>
          <ul className="mt-8 space-y-4">
            {items.map((t, i) => (
              <motion.li
                key={t}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 size-6 rounded-full bg-primary/10 grid place-items-center shrink-0">
                  <Check className="size-3.5 text-primary" strokeWidth={3} />
                </div>
                <span className="text-base">{t}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-6 bg-hero-gradient opacity-25 blur-3xl rounded-[3rem]" />
          <div className="relative rounded-4xl glass-strong p-6 shadow-glow">
            <div className="rounded-3xl bg-white p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">Clinic Performance</p>
                <span className="text-xs px-2 py-1 rounded-full bg-teal/15 text-teal font-medium">+18% MoM</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[{l:"No-shows",v:"3.2%",c:"text-teal"},{l:"NPS",v:"72",c:"text-primary"},{l:"Wait",v:"4 min",c:"text-sky"}].map(s=>(
                  <div key={s.l} className="rounded-2xl border border-border p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                    <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="h-32 rounded-2xl border border-border p-3">
                <p className="text-xs text-muted-foreground mb-2">Weekly bookings</p>
                <div className="flex items-end gap-2 h-20">
                  {[40,55,48,72,68,84,92].map((h,i)=>(
                    <div key={i} className="flex-1 rounded-t bg-hero-gradient" style={{height:`${h}%`}} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
export function Testimonials() {
  const list = [
    { n: "Dr. Amelia Carter", r: "Cardiologist · Mercy Health", q: "DocPulse cut our admin time in half. The scheduling is genuinely intelligent.", s: 5 },
    { n: "Rajiv Menon", r: "Operations Director · CityClinic Network", q: "We rolled out across 28 clinics in 3 weeks. Best onboarding I've seen in healthcare.", s: 5 },
    { n: "Dr. Sofia Reyes", r: "Pediatrician · BrightCare", q: "Patients love the reminders. No-shows dropped 47% in the first quarter.", s: 5 },
    { n: "Hannah Liu", r: "Clinic Manager · Northpoint Medical", q: "Finally, an EHR that doesn't get in the way of patient care.", s: 5 },
    { n: "Dr. Marcus Webb", r: "GP · WellSpring Group", q: "The telemedicine experience is the most polished I've used. Period.", s: 5 },
    { n: "Priya Shah", r: "CIO · Verana Hospitals", q: "Enterprise-grade security with the speed of a modern SaaS. Rare combo.", s: 5 },
  ];
  return (
    <section className="py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 mb-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Loved by healthcare teams</h2>
        <p className="mt-4 text-muted-foreground text-lg">From solo practitioners to hospital networks.</p>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex gap-5 w-max"
        >
          {[...list, ...list].map((t, i) => (
            <div key={i} className="w-[360px] rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex gap-0.5 mb-3">
                {Array.from({length:t.s}).map((_,j)=><Star key={j} className="size-4 fill-primary text-primary" />)}
              </div>
              <p className="text-base text-pretty">"{t.q}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="size-10 rounded-full bg-hero-gradient text-white grid place-items-center font-semibold text-sm">
                  {t.n.split(" ").map(w=>w[0]).slice(0,2).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.n}</p>
                  <p className="text-xs text-muted-foreground">{t.r}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- SECURITY ---------------- */
export function Security() {
  const cards = [
    { i: Shield, t: "HIPAA Compliance", d: "Fully compliant infrastructure with signed BAAs." },
    { i: Lock, t: "Data Encryption", d: "AES-256 at rest, TLS 1.3 in transit, end-to-end." },
    { i: CloudUpload, t: "Secure Cloud Storage", d: "SOC 2 Type II datacenters with 99.99% uptime." },
    { i: UserCog, t: "Role-Based Access", d: "Granular permissions and full audit logs." },
  ];
  return (
    <section className="py-28 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-medium text-primary">Trust & Security</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Built for Healthcare Compliance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => {
            const Icon = c.i;
            return (
              <motion.div
                key={c.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-3xl bg-card border border-border p-6 hover:shadow-card hover:-translate-y-1 transition"
              >
                <div className="size-12 rounded-2xl bg-primary/10 grid place-items-center text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{c.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.d}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {["HIPAA", "SOC 2", "GDPR", "ISO 27001", "HL7 FHIR"].map((b) => (
            <span key={b} className="px-4 py-2 rounded-full glass-strong border border-border text-xs font-semibold text-muted-foreground">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PRICING ---------------- */
export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const plans = [
    { n: "Starter", d: "Small clinics", m: 49, a: 39, feats: ["Up to 3 doctors","500 appointments/mo","Basic analytics","Email support"] },
    { n: "Professional", d: "Growing healthcare providers", m: 149, a: 119, feats: ["Up to 20 doctors","Unlimited appointments","Telemedicine","Advanced analytics","Priority support","E-prescriptions"], pop: true },
    { n: "Enterprise", d: "Hospitals and networks", m: null, a: null, feats: ["Unlimited doctors","Multi-location","Custom integrations","Dedicated CSM","SLA & on-prem options","24/7 phone support"] },
  ];
  return (
    <section id="pricing" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Simple, transparent pricing</h2>
          <div className="mt-8 inline-flex items-center gap-3 p-1 glass-strong border border-border rounded-full">
            <button onClick={()=>setAnnual(false)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${!annual?"bg-foreground text-white":"text-muted-foreground"}`}>Monthly</button>
            <button onClick={()=>setAnnual(true)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${annual?"bg-foreground text-white":"text-muted-foreground"}`}>Annual <span className="text-teal ml-1">-20%</span></button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p) => {
            const price = annual ? p.a : p.m;
            return (
              <motion.div
                key={p.n}
                whileHover={{ y: -6 }}
                className={`relative rounded-4xl p-8 border transition ${
                  p.pop ? "bg-foreground text-white border-foreground shadow-glow" : "bg-card border-border shadow-soft"
                }`}
              >
                {p.pop && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-hero-gradient text-white text-xs font-semibold shadow-glow">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.n}</h3>
                <p className={`text-sm mt-1 ${p.pop?"text-white/70":"text-muted-foreground"}`}>{p.d}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  {price === null ? (
                    <span className="text-4xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-5xl font-bold tracking-tight">${price}</span>
                      <span className={`text-sm ${p.pop?"text-white/70":"text-muted-foreground"}`}>/mo</span>
                    </>
                  )}
                </div>
                <button className={`mt-6 w-full py-3 rounded-full text-sm font-medium transition ${
                  p.pop ? "bg-background text-foreground hover:opacity-90" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                  {price === null ? "Contact Sales" : "Start Free Trial"}
                </button>
                <ul className="mt-6 space-y-3">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`size-4 ${p.pop?"text-teal":"text-primary"}`} strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
export function FAQ() {
  const qs = [
    { q: "How does appointment scheduling work?", a: "DocPulse uses AI to match patient needs with doctor availability in real-time, syncing across calendars and sending automated confirmations." },
    { q: "Is patient data secure?", a: "Yes. We are HIPAA compliant with AES-256 encryption at rest, TLS 1.3 in transit, SOC 2 Type II certification, and complete audit trails." },
    { q: "Can I manage multiple doctors?", a: "Absolutely. Professional and Enterprise plans support unlimited doctors with individual schedules, specializations, and permissions." },
    { q: "Do you support telemedicine?", a: "Yes — HD video consultations are built in, with screen sharing, file transfer, and post-visit notes." },
    { q: "Is there a free trial?", a: "All plans include a 14-day free trial. No credit card required." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-28 bg-secondary/30">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {qs.map((item, i) => (
            <div key={item.q} className="rounded-2xl bg-card border border-border overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
                aria-expanded={open === i}
              >
                <span className="font-medium">{item.q}</span>
                <ChevronDown className={`size-5 text-muted-foreground transition-transform ${open===i?"rotate-180":""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-muted-foreground">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FINAL CTA ---------------- */
export function FinalCTA() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative rounded-4xl overflow-hidden p-12 md:p-20 text-center bg-hero-gradient shadow-glow">
          <div className="absolute inset-0 opacity-30">
            {[Heart, Stethoscope, Calendar, Pill, Activity, Plus].map((Icon, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }}
                transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.4 }}
                className="absolute text-white/40"
                style={{ top: `${15 + (i*13)%70}%`, left: `${(i*17 + 8)%90}%` }}
              >
                <Icon className="size-8" />
              </motion.div>
            ))}
          </div>
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white text-balance">
              Ready to Modernize Your Healthcare Practice?
            </h2>
            <p className="mt-5 text-white/85 text-lg max-w-2xl mx-auto">
              Join 500+ clinics already running on DocPulse. Setup takes minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="group inline-flex h-16 items-center gap-3 rounded-full bg-blue-600 px-8 text-base font-semibold !text-white hover:!text-white hover:bg-blue-700 shadow-[0_16px_34px_rgba(37,99,235,0.24)] [&_*]:!text-white transition">
                Start Free Trial <ArrowRight className="size-5 !text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/doctors" className="px-6 py-3 rounded-full bg-white/15 backdrop-blur border border-white/30 text-white text-sm font-semibold hover:bg-white/25 transition">
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
export function Footer() {
  const cols: { t: string; l: { label: string; to: string }[] }[] = [
    { t: "Product", l: [{ label: "Features", to: "#features" }, { label: "Pricing", to: "#pricing" }, { label: "Platform", to: "#home" }] },
    { t: "Resources", l: [{ label: "Resources", to: "#resources" }, { label: "Documentation", to: "#resources" }, { label: "Support", to: "#faq" }] },
    { t: "Company", l: [{ label: "About", to: "#solutions" }, { label: "Solutions", to: "#solutions" }, { label: "Contact", to: "#faq" }] },
    { t: "Account", l: [{ label: "Sign In", to: "/login" }, { label: "Get Started", to: "/register" }] },
  ];
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-hero-gradient grid place-items-center">
                <Activity className="size-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold">DocPulse</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              The intelligent platform powering modern healthcare practices.
            </p>
            <div className="mt-5 flex gap-3">
              {[Globe, Mail, MessageCircle].map((Icon, i) => (
                <a key={i} href="#" aria-label="social" className="size-9 rounded-full glass-strong border border-border grid place-items-center hover:bg-foreground hover:text-white transition">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.t}>
              <p className="text-sm font-semibold">{c.t}</p>
              <ul className="mt-4 space-y-2.5">
                {c.l.map((x) => (
                <li key={x.label}>
                  <a href={x.to} className="text-sm text-muted-foreground hover:text-foreground transition">
                    {x.label}
                  </a>
                </li>
              ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-wrap justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DocPulse, Inc. All rights reserved.</p>
          <p>Made for modern healthcare.</p>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- PARALLAX WRAPPER ---------------- */
export function MouseParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);
  return <motion.div ref={ref} style={{ y }}>{children}</motion.div>;
}
