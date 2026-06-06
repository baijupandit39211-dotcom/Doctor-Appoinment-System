import { createFileRoute } from "@tanstack/react-router";
import { Video, Phone, MessageSquare, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/consultations")({
  component: Consultations,
});

const live = [
  { patient: "Liam Patel", started: "10:14", duration: "08:32", reason: "Tele-consult — General" },
];
const queue = [
  { patient: "Noah Williams", time: "10:45", reason: "Lab results" },
  { patient: "Ava Thompson", time: "14:00", reason: "Tele-consult" },
];

function Consultations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Consultations</h1>
        <p className="text-muted-foreground mt-1 text-sm">Run secure video, voice, and chat consultations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-foreground via-primary/40 to-sky/40 relative">
            <div className="absolute inset-0 grid place-items-center text-white/90">
              <div className="text-center">
                <div className="mx-auto size-20 rounded-full bg-white/15 backdrop-blur grid place-items-center mb-3 animate-pulse-glow">
                  <Video className="size-8" />
                </div>
                <div className="font-semibold">Liam Patel</div>
                <div className="text-xs opacity-75 mt-1">Connected · HD secure session</div>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 size-28 rounded-xl bg-foreground/60 border border-white/20 backdrop-blur grid place-items-center text-white text-xs">
              You
            </div>
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/90 text-white text-xs font-medium">
              <span className="size-1.5 rounded-full bg-white animate-pulse" /> LIVE · 08:32
            </div>
          </div>
          <div className="p-4 flex flex-wrap items-center justify-center gap-3 border-t border-border">
            {[Video, Phone, MessageSquare, FileText].map((Icon, i) => (
              <button
                key={i}
                className="size-12 rounded-full border border-border bg-white grid place-items-center hover:bg-secondary transition"
              >
                <Icon className="size-5 text-foreground" />
              </button>
            ))}
            <button className="px-5 h-12 rounded-full bg-destructive text-white text-sm font-medium">
              End call
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card">
            <h2 className="font-semibold tracking-tight">Live now</h2>
            <ul className="mt-3 space-y-3">
              {live.map((l) => (
                <li key={l.patient} className="p-3 rounded-xl bg-secondary/50 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-hero-gradient text-white grid place-items-center text-xs font-semibold">LP</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.patient}</div>
                    <div className="text-xs text-muted-foreground">{l.reason}</div>
                  </div>
                  <span className="text-xs font-medium text-destructive">{l.duration}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card">
            <h2 className="font-semibold tracking-tight">Up next</h2>
            <ul className="mt-3 space-y-3">
              {queue.map((q) => (
                <li key={q.patient} className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-secondary grid place-items-center text-xs font-semibold">
                    {q.patient.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{q.patient}</div>
                    <div className="text-xs text-muted-foreground">{q.reason}</div>
                  </div>
                  <span className="text-xs inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" /> {q.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
