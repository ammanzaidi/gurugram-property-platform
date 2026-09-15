"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Visit = {
  id: number;
  visitDate: string | null;
  visitTime: string | null;
  status: string;
  tenantName: string;
  tenantPhone: string;
  ownerName: string;
  ownerPhone: string;
  property: {
    id: number;
    bhk: string;
    propertyType: string;
    sector: string;
    monthlyRent: number;
  };
};

export default function AdminVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    async function loadVisits() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/visits", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load visits.");
        }

        setVisits(result.visits || []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load visits."
        );
      } finally {
        setLoading(false);
      }
    }

    loadVisits();
  }, []);

  const filteredVisits =
    filterType === "ALL"
      ? visits
      : visits.filter((visit) => {
          if (filterType === "UPCOMING") {
            const today = new Date();
            const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

            return (
              visit.visitDate &&
              visit.visitDate >= todayString &&
              visit.status === "VISIT_SCHEDULED"
            );
          }
          if (filterType === "COMPLETED") {
            return visit.status === "VISIT_COMPLETED";
          }
          return true;
        });

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
          Property Visits
        </h1>
        <p className="mt-3 text-slate-500">
          Monitor all scheduled property visits and their status.
        </p>

        {/* Filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["ALL", "UPCOMING", "COMPLETED"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filterType === type
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading visits...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filteredVisits.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold">No visits found</h2>
            <p className="mt-2 text-slate-500">
              {filterType === "ALL"
                ? "No scheduled visits yet."
                : `No ${filterType.toLowerCase()} visits.`}
            </p>
          </div>
        )}

        {!loading && !error && filteredVisits.length > 0 && (
          <div className="mt-8 space-y-4">
            {filteredVisits.map((visit) => (
              <Link
                key={visit.id}
                href={`/enquiries?enquiryId=${visit.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">
                      {visit.property.bhk} {visit.property.propertyType}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {visit.property.sector} • ₹{visit.property.monthlyRent.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap ${
                      visit.status === "VISIT_COMPLETED"
                        ? "bg-green-50 text-green-700"
                        : visit.status === "VISIT_SCHEDULED"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {visit.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Date</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {visit.visitDate || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Time</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {visit.visitTime || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Tenant</p>
                    <p className="mt-1 font-semibold text-slate-900">{visit.tenantName}</p>
                    <p className="text-xs text-slate-600">{visit.tenantPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Owner</p>
                    <p className="mt-1 font-semibold text-slate-900">{visit.ownerName}</p>
                    <p className="text-xs text-slate-600">{visit.ownerPhone}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
