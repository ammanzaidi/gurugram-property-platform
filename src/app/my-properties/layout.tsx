import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const authorization = await requireRole("OWNER");
  if (!authorization.session) {
    return <main className="app-page dashboard-page flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-lg"><p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">{authorization.status === 401 ? "Login required" : "403"}</p><h1 className="mt-3 text-3xl font-bold">Owner dashboard access required</h1><p className="mt-3 text-slate-500">This dashboard only shows the signed-in owner&apos;s property activity.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Back to dashboards</Link></div></main>;
  }
  return children;
}