import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Clock,
  Video,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

const stats = [
  { label: "Appointments today", value: "48", delta: "+12%", icon: Calendar, tint: "from-primary to-sky" },
  { label: "Active patients", value: "2,341", delta: "+8.2%", icon: Users, tint: "from-sky to-teal" },
  { label: "Revenue (MTD)", value: "$148.2K", delta: "+18%", icon: DollarSign, tint: "from-teal to-primary" },
  { label: "Avg. wait time", value: "6m 12s", delta: "−14%", icon: Clock, tint: "from-primary to-teal" },
];

const upcoming = [
  { time: "09:30", patient: "Emma Carter", reason: "Follow-up — Cardiology", mode: "In-clinic" },
  { time: "10:15", patient: "Liam Patel", reason: "Tele-consult — General", mode: "Video" },
  { time: "11:00", patient: "Sophia Nguyen", reason: "Post-op review", mode: "In-clinic" },
  { time: "11:45", patient: "Noah Williams", reason: "Lab results", mode: "Video" },
  { time: "13:00", patient: "Olivia Martinez", reason: "New consultation", mode: "In-clinic" },
];

const activity = [
  { icon: CheckCircle2, text: "Prescription signed for Emma Carter", time: "2m ago" },
  { icon: Video, text: "Video call completed with Liam Patel", time: "18m ago" },
  { icon: Users, text: "New patient onboarded — Mia Brooks", time: "1h ago" },
  { icon: DollarSign, text: "Invoice #4128 paid — $240.00", time: "3h ago" },
];

export default function Overview() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Good morning, Dr. Reyes</h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's what's happening across your practice today.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-hero-gradient text-white text-sm font-medium shadow-glow inline-flex items-center gap-2 hover:opacity-95 transition">
          New appointment <ArrowUpRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card hover:shadow-glow transition"
          >
            <div className="flex items-center justify-between">
              <div className={`size-10 rounded-xl bg-gradient-to-br ${s.tint} grid place-items-center shadow-glow`}>
                <s.icon className="size-5 text-white" />
              </div>
              <span className="text-xs font-medium text-teal inline-flex items-center gap-1">
                <TrendingUp className="size-3" /> {s.delta}
              </span>
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold tracking-tight">Patient flow</h2>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <div className="flex gap-1 text-xs">
              {["7D", "30D", "90D"].map((t, i) => (
                <button
                  key={t}
                  className={`px-3 py-1.5 rounded-lg ${i === 0 ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Chart />
        </div>

        <div className="p-6 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card">
          <h2 className="font-semibold tracking-tight">Recent activity</h2>
          <ul className="mt-4 space-y-4">
            {activity.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-secondary grid place-items-center shrink-0">
                  <a.icon className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold tracking-tight">Today's schedule</h2>
          <a className="text-sm text-primary hover:underline cursor-pointer">View all</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-4 font-medium">Time</th>
                <th className="py-2.5 pr-4 font-medium">Patient</th>
                <th className="py-2.5 pr-4 font-medium">Reason</th>
                <th className="py-2.5 pr-4 font-medium">Mode</th>
                <th className="py-2.5 pr-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((u, i) => (
                <tr key={i} className="border-t border-border hover:bg-secondary/40 transition">
                  <td className="py-3 pr-4 font-medium">{u.time}</td>
                  <td className="py-3 pr-4">{u.patient}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{u.reason}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.mode === "Video" ? "bg-sky/15 text-sky" : "bg-teal/15 text-teal"
                      }`}
                    >
                      {u.mode === "Video" ? <Video className="size-3" /> : <Users className="size-3" />}
                      {u.mode}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition">
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Chart() {
  const points = [22, 38, 30, 52, 44, 68, 60];
  const max = Math.max(...points);
  const w = 600;
  const h = 200;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * (h - 20) - 10}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.55 0.22 263)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="oklch(0.55 0.22 263)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g)" />
      <path d={path} fill="none" stroke="oklch(0.55 0.22 263)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={i * step} cy={h - (p / max) * (h - 20) - 10} r="4" fill="white" stroke="oklch(0.55 0.22 263)" strokeWidth="2" />
      ))}
    </svg>
  );
}
