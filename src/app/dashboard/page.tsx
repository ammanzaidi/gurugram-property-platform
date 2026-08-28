import Link from "next/link";

const dashboards = [
  { label: "ADMIN", title: "Admin Dashboard", description: "Manage leads, properties, owners, tenants, and visits.", href: "/admin", tone: "dashboard-card-admin", items: ["Leads", "Properties", "Owners", "Tenants", "Visits"] },
  { label: "OWNER", title: "Owner Dashboard", description: "Manage your properties and property activity.", href: "/my-properties", tone: "dashboard-card-owner", items: ["My Properties", "Property Enquiries", "Visits", "Performance"] },
  { label: "TENANT", title: "Tenant Dashboard", description: "Track your enquiries and property visits.", href: "/my-enquiries", tone: "dashboard-card-tenant", items: ["My Enquiries", "Track Visits", "Saved Properties", "Notifications"] },
];

export default function DashboardSelectionPage() {
  return (
    <main className="app-page dashboard-selection min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6"><Link href="/" className="text-xl font-bold">Gurugram<span className="text-slate-500">Property</span></Link><Link href="/" className="text-sm font-semibold text-slate-600">Back to home</Link></div></header>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">GurugramProperty workspace</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Choose a dashboard</h1><p className="mt-4 text-lg leading-7 text-slate-500">Select the workspace you want to open. Your account permissions are checked again on every dashboard.</p></div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">{dashboards.map((dashboard) => <Link key={dashboard.label} href={dashboard.href} className={`dashboard-card ${dashboard.tone} rounded-3xl p-7 text-white transition duration-200 hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-400 sm:p-8`} aria-label={`Open ${dashboard.title}`}><div className="dashboard-card-icon" aria-hidden="true">{dashboard.label === "ADMIN" ? "A" : dashboard.label === "OWNER" ? "O" : "T"}</div><p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-white/65">{dashboard.label}</p><h2 className="mt-2 text-2xl font-bold">{dashboard.title}</h2><p className="mt-3 min-h-14 text-sm leading-6 text-white/75">{dashboard.description}</p><ul className="mt-6 space-y-2 border-t border-white/15 pt-5 text-sm text-white/85">{dashboard.items.map((item) => <li key={item}>{item}</li>)}</ul><span className="mt-8 inline-flex items-center rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-900">Open dashboard <span className="ml-2" aria-hidden="true">→</span></span></Link>)}</div>
      </section>
    </main>
  );
}
