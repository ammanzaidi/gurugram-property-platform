"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Visit = {
  id: number;
  status: string;
  visitDate: string | null;
  visitTime: string | null;
  property: {
    id: number;
    propertyType: string;
    bhk: string;
    sector: string;
    monthlyRent: number;
    societyName: string;
    media: { secureUrl: string }[];
  };
};

export default function MyVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/my-visits", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Failed to load visits.");
        setVisits(result.visits || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load visits."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="app-page dashboard-page min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6"><Link href="/" className="text-xl font-bold">Gurugram<span className="text-slate-500">Property</span></Link><nav className="flex gap-4 text-sm font-semibold text-slate-600"><Link href="/my-enquiries">My Enquiries</Link><Link href="/">Home</Link></nav></div></header>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Tenant dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">My Visits</h1>
        <p className="mt-3 text-slate-500">Keep track of scheduled property visits and their current status.</p>
        {loading && <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Loading your visits...</div>}
        {!loading && error && <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">{error}</div>}
        {!loading && !error && visits.length === 0 && <div className="empty-state mt-8 rounded-3xl p-10 text-center"><h2 className="text-xl font-bold">No visits scheduled</h2><p className="mt-2 text-slate-500">When a visit is scheduled for one of your enquiries, it will appear here.</p><Link href="/properties" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Browse properties</Link></div>}
        {!loading && !error && visits.length > 0 && <div className="mt-8 grid gap-5 md:grid-cols-2">{visits.map((visit) => <article key={visit.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="h-48 overflow-hidden bg-slate-200">{visit.property.media[0] ? <img src={visit.property.media[0].secureUrl} alt={`${visit.property.bhk} ${visit.property.propertyType}`} className="h-full w-full object-cover" /> : <div className="media-fallback" aria-label="Property preview"><span>Gurugram living</span></div>}</div><div className="p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{visit.property.bhk} {visit.property.propertyType}</h2><p className="mt-1 text-sm text-slate-500">{visit.property.societyName} · {visit.property.sector}, Gurugram</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{visit.status.replaceAll("_", " ")}</span></div><div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4"><div><p className="text-xs uppercase tracking-wide text-slate-400">Date</p><p className="mt-1 font-semibold">{visit.visitDate}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-400">Time</p><p className="mt-1 font-semibold">{visit.visitTime || "To be confirmed"}</p></div></div><Link href={`/property/${visit.property.id}`} className="mt-5 inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">View property</Link></div></article>)}</div>}
      </section>
    </main>
  );
}
