import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?redirect=/admin");

  if (session.user.role.toUpperCase() !== "ADMIN") {
    return (
      <main className="app-page dashboard-page flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-lg">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">403</p>
          <h1 className="mt-3 text-3xl font-bold">Admin access required</h1>
          <p className="mt-3 text-slate-500">This internal area is restricted to administrators.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Back to home</Link>
        </div>
      </main>
    );
  }

  return children;
}
