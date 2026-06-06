import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, CreditCard, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/billing")({
  component: Billing,
});

const invoices = [
  { id: "#4131", patient: "Emma Carter", date: "Jun 02, 2026", amount: "$240.00", status: "Paid" },
  { id: "#4130", patient: "Liam Patel", date: "Jun 01, 2026", amount: "$120.00", status: "Paid" },
  { id: "#4129", patient: "Sophia Nguyen", date: "May 28, 2026", amount: "$340.00", status: "Pending" },
  { id: "#4128", patient: "Noah Williams", date: "May 27, 2026", amount: "$180.00", status: "Paid" },
  { id: "#4127", patient: "Olivia Martinez", date: "May 25, 2026", amount: "$420.00", status: "Overdue" },
];

function Billing() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1 text-sm">Invoices, payments, and revenue analytics.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium inline-flex items-center gap-2 hover:bg-secondary transition">
            <Download className="size-4" /> Export
          </button>
          <button className="px-4 py-2.5 rounded-xl bg-hero-gradient text-white text-sm font-medium shadow-glow inline-flex items-center gap-2">
            <Plus className="size-4" /> New invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Revenue (MTD)", value: "$148,240", delta: "+18%" },
          { label: "Outstanding", value: "$12,480", delta: "−4%" },
          { label: "Avg. invoice", value: "$214", delta: "+2.4%" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-hero-gradient grid place-items-center shadow-glow">
                <CreditCard className="size-5 text-white" />
              </div>
              <span className="text-xs font-medium text-teal inline-flex items-center gap-1">
                <ArrowUpRight className="size-3" /> {s.delta}
              </span>
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white/70 backdrop-blur shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold tracking-tight">Invoices</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Invoice</th>
              <th className="px-5 py-3 font-medium">Patient</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-border hover:bg-secondary/30 transition">
                <td className="px-5 py-3.5 font-medium">{inv.id}</td>
                <td className="px-5 py-3.5">{inv.patient}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{inv.date}</td>
                <td className="px-5 py-3.5 font-medium">{inv.amount}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    inv.status === "Paid" ? "bg-teal/15 text-teal" :
                    inv.status === "Pending" ? "bg-primary/10 text-primary" :
                    "bg-destructive/10 text-destructive"
                  }`}>{inv.status}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition">
                    View
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
