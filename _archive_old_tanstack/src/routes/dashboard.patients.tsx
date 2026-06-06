import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/dashboard/patients")({
  component: Patients,
});

const patients = [
  { name: "Emma Carter", email: "emma.carter@mail.com", age: 34, gender: "Female", last: "Jun 02, 2026", status: "Active" },
  { name: "Liam Patel", email: "liam.p@mail.com", age: 41, gender: "Male", last: "May 28, 2026", status: "Active" },
  { name: "Sophia Nguyen", email: "sophia.n@mail.com", age: 27, gender: "Female", last: "May 24, 2026", status: "Follow-up" },
  { name: "Noah Williams", email: "noah.w@mail.com", age: 52, gender: "Male", last: "May 21, 2026", status: "Active" },
  { name: "Olivia Martinez", email: "olivia.m@mail.com", age: 36, gender: "Female", last: "May 18, 2026", status: "Inactive" },
  { name: "James Anderson", email: "james.a@mail.com", age: 60, gender: "Male", last: "May 10, 2026", status: "Active" },
  { name: "Ava Thompson", email: "ava.t@mail.com", age: 29, gender: "Female", last: "Apr 29, 2026", status: "Follow-up" },
];

function Patients() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1 text-sm">Unified records, history, and care plans.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-hero-gradient text-white text-sm font-medium shadow-glow inline-flex items-center gap-2">
          <Plus className="size-4" /> Add patient
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total patients", value: "2,341" },
          { label: "New this month", value: "184" },
          { label: "Follow-ups due", value: "47" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search patients"
              className="w-full pl-9 pr-3 h-10 rounded-xl bg-secondary/60 border border-transparent focus:border-ring focus:bg-background outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">Last visit</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right" />
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.email} className="border-t border-border hover:bg-secondary/30 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-hero-gradient text-white grid place-items-center text-xs font-semibold">
                        {p.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">{p.age}</td>
                  <td className="px-5 py-3.5">{p.gender}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{p.last}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      p.status === "Active" ? "bg-teal/15 text-teal" :
                      p.status === "Follow-up" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="p-1.5 rounded-lg hover:bg-secondary"><MoreHorizontal className="size-4" /></button>
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
