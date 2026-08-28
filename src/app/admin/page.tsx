import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, prisma } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?redirect=/admin");
  if (session.user.role.toUpperCase() !== "ADMIN") {
    return (
      <main className="app-page dashboard-page flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-lg">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">403</p>
          <h1 className="mt-3 text-3xl font-bold">Admin access required</h1>
          <p className="mt-3 text-slate-500">This internal dashboard is restricted to administrators.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Back to home</Link>
        </div>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [totalProperties, activeProperties, pendingProperties, totalLeads, newLeads, upcomingVisits, totalOwners, totalTenants] = await prisma.$transaction([
    prisma.property.count(),
    prisma.property.count({ where: { status: "AVAILABLE" } }),
    prisma.property.count({ where: { status: "PENDING" } }),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.count({ where: { visitDate: { gte: today }, status: "VISIT_SCHEDULED" } }),
    prisma.user.count({ where: { role: { in: ["OWNER", "BROKER"] } } }),
    prisma.user.count({ where: { role: "TENANT" } }),
  ]);
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, propertyType: true, bhk: true, sector: true, monthlyRent: true, status: true },
  });
  const leads = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, status: true, visitDate: true, property: { select: { bhk: true, propertyType: true, sector: true } } },
  });

  return (
    <main className="app-page dashboard-page min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="text-xl font-bold">Gurugram<span className="text-slate-500">Property</span></Link>
          <nav className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <Link href="/admin/properties">Properties</Link>
            <Link href="/enquiries">Tenant Leads</Link>
            <Link href="/">Exit admin</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Internal operations</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Admin Dashboard</h1>
        <p className="mt-3 text-slate-500">Platform activity, new listings, tenant leads, and visits.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Properties", totalProperties], ["Active listings", activeProperties], ["Pending review", pendingProperties], ["Tenant leads", totalLeads], ["New leads", newLeads], ["Upcoming visits", upcomingVisits], ["Owners", totalOwners], ["Tenants", totalTenants]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>)}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">New properties</h2><Link href="/admin/properties" className="text-sm font-semibold text-slate-600">Review all</Link></div><div className="mt-4 divide-y divide-slate-100">{properties.map((property) => <div key={property.id} className="flex items-center justify-between gap-3 py-4"><div><p className="font-semibold">{property.bhk} {property.propertyType}</p><p className="text-sm text-slate-500">{property.sector} · ₹{property.monthlyRent.toLocaleString("en-IN")}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{property.status}</span></div>)}</div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Tenant leads</h2><Link href="/enquiries" className="text-sm font-semibold text-slate-600">Manage leads</Link></div><div className="mt-4 divide-y divide-slate-100">{leads.map((lead) => <div key={lead.id} className="py-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{lead.name}</p><span className="text-xs font-semibold text-slate-500">{lead.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-sm text-slate-500">{lead.property.bhk} {lead.property.propertyType} · {lead.property.sector}{lead.visitDate ? ` · Visit ${lead.visitDate}` : ""}</p></div>)}</div></div>
        </div>
      </section>
    </main>
  );
}
