"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Tenant = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  enquiryCount: number;
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTenants() {
      try {
        const response = await fetch("/api/admin/tenants", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load tenants.");
        }

        setTenants(result.tenants || []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load tenants."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTenants();
  }, []);

  return (
    <main className="app-page dashboard-page min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/admin" className="text-xl font-bold">
            Gurugram<span className="text-slate-500">Property</span>
          </Link>
          <Link href="/admin" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Back to admin
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
          Platform Management
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Tenants
        </h1>
        <p className="mt-3 text-slate-500">
          View all tenant accounts on the platform.
        </p>

        {loading && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading tenants...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && tenants.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold">No tenants yet</h2>
            <p className="mt-2 text-slate-500">
              When tenants register, they will appear here.
            </p>
          </div>
        )}

        {!loading && !error && tenants.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Enquiries
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="text-xs">{tenant.phone}</p>
                      {tenant.email && (
                        <p className="text-xs text-slate-500">{tenant.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {tenant.enquiryCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(tenant.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
