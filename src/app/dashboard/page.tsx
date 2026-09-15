import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const dashboards = [
  {
    label: "ADMIN",
    title: "Admin Dashboard",
    description: "Platform operations, properties, leads, and user management.",
    href: "/admin",
    tone: "bg-gradient-to-br from-slate-900 to-slate-800",
    items: ["Overview", "Properties", "Tenant Leads", "Visits", "Owners", "Tenants"],
  },
  {
    label: "OWNER",
    title: "Owner Dashboard",
    description: "Manage your properties, track enquiries, and monitor visits.",
    href: "/my-properties",
    tone: "bg-gradient-to-br from-blue-600 to-blue-700",
    items: ["My Properties", "Enquiries", "Visit Requests", "Performance"],
  },
  {
    label: "TENANT",
    title: "Tenant Dashboard",
    description: "Search properties, track enquiries, and schedule visits.",
    href: "/my-enquiries",
    tone: "bg-gradient-to-br from-emerald-600 to-emerald-700",
    items: ["My Enquiries", "My Visits", "Visit tracking", "Notifications"],
  },
];

export default async function DashboardSelectionPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?redirect=/dashboard");
  const currentRole = session.user.role.toUpperCase();

  return (
    <main className="app-page dashboard-selection min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="text-xl font-bold">
            Gurugram<span className="text-slate-500">Property</span>
          </Link>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{session.user.name}</p>
            <p className="text-xs text-slate-500">{session.user.role}</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            GurugramProperty Platform
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Choose Your Workspace
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">
            Select the dashboard that matches your role. Your permissions are verified on every access.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {dashboards.map((dashboard) => {
            const allowed = dashboard.label === currentRole;
            const cardClassName = `group relative ${dashboard.tone} rounded-3xl p-8 text-white transition duration-300 ${allowed ? "hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-400" : "cursor-not-allowed opacity-75"}`;
            const cardContent = (
              <>
              {/* Background accent */}
              <div className="absolute inset-0 rounded-3xl bg-white/5 opacity-0 transition group-hover:opacity-100" />

              {/* Content */}
              <div className="relative">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 text-lg font-bold">
                  {dashboard.label === "ADMIN"
                    ? "⚙️"
                    : dashboard.label === "OWNER"
                      ? "🏠"
                      : "🔍"}
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  {dashboard.label}
                </p>

                <h2 className="mt-2 text-2xl font-bold">{dashboard.title}</h2>

                <p className="mt-3 min-h-12 text-sm leading-6 text-white/80">
                  {dashboard.description}
                </p>

                <ul className="mt-6 space-y-2 border-t border-white/20 pt-5 text-sm text-white/75">
                  {dashboard.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-white/40">•</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 transition group-hover:bg-slate-50">
                  {allowed ? "Open dashboard" : "Access restricted"}{" "}
                  <span aria-hidden="true" className="transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
              </>
            );

            return allowed ? (
              <Link key={dashboard.label} href={dashboard.href} className={cardClassName} aria-label={`Open ${dashboard.title}`}>
                {cardContent}
              </Link>
            ) : (
              <div key={dashboard.label} className={cardClassName} aria-disabled="true" aria-label={`${dashboard.title} requires a ${dashboard.label.toLowerCase()} account`}>
                {cardContent}
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          {currentRole === "TENANT" && <p className="mb-4 text-sm text-slate-600"><Link href="/my-enquiries#notifications" className="font-semibold text-blue-600 hover:text-blue-700">Open my notifications</Link></p>}
          <p className="text-sm text-slate-600">
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Switch accounts
            </Link>
            {" "}or{" "}
            <Link href="/" className="font-semibold text-slate-900 hover:text-slate-700">
              back to home
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
