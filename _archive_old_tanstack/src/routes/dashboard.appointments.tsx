import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Plus, Filter, Video, Users, CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/appointments")({
  component: Appointments,
});

const data = [
  { id: 1, time: "09:00", patient: "Emma Carter", doctor: "Dr. Reyes", type: "Follow-up", mode: "Clinic", status: "Confirmed" },
  { id: 2, time: "09:30", patient: "Liam Patel", doctor: "Dr. Khan", type: "Tele-consult", mode: "Video", status: "Confirmed" },
  { id: 3, time: "10:00", patient: "Sophia Nguyen", doctor: "Dr. Reyes", type: "Post-op", mode: "Clinic", status: "Pending" },
  { id: 4, time: "10:45", patient: "Noah Williams", doctor: "Dr. Lee", type: "Lab review", mode: "Video", status: "Confirmed" },
  { id: 5, time: "11:30", patient: "Olivia Martinez", doctor: "Dr. Reyes", type: "New patient", mode: "Clinic", status: "Cancelled" },
  { id: 6, time: "13:15", patient: "James Anderson", doctor: "Dr. Khan", type: "Routine", mode: "Clinic", status: "Confirmed" },
  { id: 7, time: "14:00", patient: "Ava Thompson", doctor: "Dr. Lee", type: "Tele-consult", mode: "Video", status: "Confirmed" },
];

const tabs = ["All", "Today", "Upcoming", "Past"] as const;

function Appointments() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Today");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your bookings, reschedule, and run consultations.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-hero-gradient text-white text-sm font-medium shadow-glow inline-flex items-center gap-2">
          <Plus className="size-4" /> Schedule appointment
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-secondary p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition ${
                tab === t ? "bg-white shadow-soft text-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white/70 text-sm hover:bg-white transition">
          <Filter className="size-4" /> Filter
        </button>
        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white/70 text-sm hover:bg-white transition">
          <Calendar className="size-4" /> June 4, 2026
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Patient</th>
              <th className="px-5 py-3 font-medium">Doctor</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Mode</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t border-border hover:bg-secondary/30 transition">
                <td className="px-5 py-3.5 font-medium">{row.time}</td>
                <td className="px-5 py-3.5">{row.patient}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{row.doctor}</td>
                <td className="px-5 py-3.5">{row.type}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    row.mode === "Video" ? "bg-sky/15 text-sky" : "bg-teal/15 text-teal"
                  }`}>
                    {row.mode === "Video" ? <Video className="size-3" /> : <Users className="size-3" />}
                    {row.mode}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition">
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; icon: typeof CheckCircle2 }> = {
    Confirmed: { bg: "bg-teal/15", fg: "text-teal", icon: CheckCircle2 },
    Pending: { bg: "bg-primary/10", fg: "text-primary", icon: Clock },
    Cancelled: { bg: "bg-destructive/10", fg: "text-destructive", icon: XCircle },
  };
  const s = map[status] ?? map.Pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.fg}`}>
      <Icon className="size-3" /> {status}
    </span>
  );
}
