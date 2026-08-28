"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Property = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  status: string;
  createdAt: string;
  media: { id: number; type: string; secureUrl: string; position: number }[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: string) {
  if (status === "AVAILABLE") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        const response = await fetch("/api/my-properties", {
          credentials: "include",
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load your properties.");
        }
        setProperties(result.properties || []);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load your properties.");
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  return (
    <main className="app-page dashboard-page min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Gurugram<span className="text-slate-500">Property</span>
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/list-property">List a property</Link>
            <Link href="/">Home</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Owner dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">My Properties</h1>
            <p className="mt-3 text-slate-500">Manage your listings, details, and property media.</p>
          </div>
          <Link href="/list-property" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Add Property
          </Link>
        </div>

        {loading && <div className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">Loading your properties...</div>}
        {!loading && error && <div className="mt-8 rounded-2xl bg-red-50 p-5 text-red-700">{error}</div>}
        {!loading && !error && properties.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center">
            <h2 className="text-xl font-bold">You have no properties yet</h2>
            <p className="mt-2 text-slate-500">Create your first listing to start managing it here.</p>
            <Link href="/list-property" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white">List a Property</Link>
          </div>
        )}

        {!loading && !error && properties.length > 0 && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {properties.map((property) => {
              const firstImage = property.media.find((media) => media.type === "IMAGE");
              const photoCount = property.media.filter((media) => media.type === "IMAGE").length;
              const videoCount = property.media.filter((media) => media.type === "VIDEO").length;
              return (
                <article key={property.id} className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-md transition duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="grid sm:grid-cols-[180px_1fr]">
                    <div className="flex min-h-44 items-center justify-center bg-slate-200 sm:min-h-full overflow-hidden">
                      {firstImage ? <img src={firstImage.secureUrl} alt={`${property.bhk} ${property.propertyType}`} className="h-full min-h-44 w-full object-cover transition duration-200 hover:scale-105" /> : <div className="media-fallback" aria-label="Property preview"><span>Gurugram living</span></div>}
                    </div>
                    <div className="min-w-0 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Property #{property.id}</p>
                          <h2 className="mt-1 break-words text-xl font-bold">{property.bhk} {property.propertyType}</h2>
                          <p className="mt-1 break-words text-sm text-slate-500">{property.sector}, Gurugram</p>
                        </div>
                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(property.status)}`}>{property.status}</span>
                      </div>
                      <p className="mt-5 text-2xl font-bold">₹{property.monthlyRent.toLocaleString("en-IN")} <span className="text-sm font-normal text-slate-400">/ month</span></p>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>{photoCount} photo{photoCount === 1 ? "" : "s"}</span>
                        <span>{videoCount} video{videoCount === 1 ? "" : "s"}</span>
                        <span>Added {formatDate(property.createdAt)}</span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link href={`/my-properties/${property.id}`} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Edit & Manage</Link>
                        {property.status === "AVAILABLE" && <Link href={`/property/${property.id}`} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">View Public</Link>}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
