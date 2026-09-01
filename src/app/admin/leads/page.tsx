"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  visitDate: string | null;
  visitTime: string | null;
  createdAt: string;
  property: {
    id: number;
    bhk: string;
    propertyType: string;
    sector: string;
    monthlyRent: number;
  };
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadLeads() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/leads", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load leads.");
        }

        setLeads(result.leads || []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load leads."
        );
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, []);

  const filteredLeads =
    statusFilter === "ALL"
      ? leads
      : leads.filter((lead) => lead.status === statusFilter);

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
          Tenant Leads
        </h1>
        <p className="mt-3 text-slate-500">
          Manage all property enquiries and visit requests from tenants.
        </p>

        {/* Status Filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["ALL", "NEW", "CONTACTED", "VISIT_SCHEDULED", "VISIT_COMPLETED", "CLOSED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === status
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {status.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>

        {loading && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading leads...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filteredLeads.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold">No leads found</h2>
            <p className="mt-2 text-slate-500">
              {statusFilter === "ALL"
                ? "No enquiries yet."
                : `No enquiries with status ${statusFilter.replace(/_/g, " ")}.`}
            </p>
          </div>
        )}

        {!loading && !error && filteredLeads.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {filteredLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/enquiries?enquiryId=${lead.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900">{lead.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{lead.phone}</p>
                    {lead.email && (
                      <p className="text-sm text-slate-600">{lead.email}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 whitespace-nowrap">
                    {lead.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {lead.property.bhk} {lead.property.propertyType}
                  </p>
                  <p className="text-xs text-slate-600">
                    {lead.property.sector} • ₹{lead.property.monthlyRent.toLocaleString("en-IN")}
                  </p>
                </div>

                {lead.visitDate && (
                  <div className="mt-3 text-xs text-slate-600">
                    <p>
                      <span className="font-semibold">Visit:</span> {lead.visitDate}
                      {lead.visitTime && ` at ${lead.visitTime}`}
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs text-slate-500">
                  Received {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
