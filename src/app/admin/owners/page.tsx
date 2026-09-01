"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Owner = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  propertyCount: number;
};

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOwners() {
      try {
        const response = await fetch("/api/admin/owners", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load owners.");
        }

        setOwners(result.owners || []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load owners."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOwners();
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
          Owners & Brokers
        </h1>
        <p className="mt-3 text-slate-500">
          View all owner-equivalent accounts registered on the platform.
        </p>

        {loading && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading owners...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && owners.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold">No owners yet</h2>
            <p className="mt-2 text-slate-500">
              When owners register, they will appear here.
            </p>
          </div>
        )}

        {!loading && !error && owners.length > 0 && (
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
                    Properties
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {owner.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="text-xs">{owner.phone}</p>
                      {owner.email && (
                        <p className="text-xs text-slate-500">{owner.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {owner.propertyCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(owner.createdAt).toLocaleDateString("en-IN")}
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
