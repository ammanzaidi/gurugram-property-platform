"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
type Property = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  furnishing: string;
  availableFrom: string;
  societyName: string;
  address: string;
  description: string | null;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  media: {
    id: number;
    type: string;
    secureUrl: string;
    position: number;
  }[];
  createdAt: string;
};

export default function PropertiesPage() {
    const searchParams = useSearchParams();

  const location = searchParams.get("location");
  const propertyType = searchParams.get("propertyType");
  const budget = searchParams.get("budget");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        const params = new URLSearchParams();

if (location) {
  params.set("location", location);
}

if (propertyType) {
  params.set("propertyType", propertyType);
}

if (budget) {
  params.set("budget", budget);
}

const response = await fetch(`/api/properties?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setProperties(result.properties);
        }
      } catch (error) {
        console.error("Failed to load properties:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, [location, propertyType, budget]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-bold">
            Gurugram<span className="text-slate-500">Property</span>
          </a>

          <a
            href="/list-property"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            List Your Property
          </a>
        </div>
      </header>

      {/* PAGE */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Gurugram Properties
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Available Properties
          </h1>

          <p className="mt-4 text-slate-500">
            Browse properties listed by owners in Gurugram.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center">
            Loading properties...
          </div>
        )}

        {/* NO PROPERTIES */}
        {!loading && properties.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center">
            <h2 className="text-xl font-bold">
              No properties available
            </h2>

            <p className="mt-2 text-slate-500">
              Be the first owner to list a property.
            </p>

            <a
              href="/list-property"
              className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-bold text-white"
            >
              List Your Property
            </a>
          </div>
        )}

        {/* PROPERTY CARDS */}
        {!loading && properties.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="overflow-hidden rounded-3xl bg-white shadow-md transition duration-200 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="h-48 bg-slate-200 flex items-center justify-center overflow-hidden">
                  {property.media?.find((media) => media.type === "IMAGE") ? (
                    <img
                      src={property.media.find((media) => media.type === "IMAGE")?.secureUrl}
                      alt={`${property.bhk} ${property.propertyType}`}
                      className="h-full w-full object-cover transition duration-200 hover:scale-105"
                    />
                  ) : (
                    <span className="text-5xl">🏠</span>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        {property.bhk} {property.propertyType}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {property.societyName}
                      </p>
                    </div>

                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold">
                      {property.furnishing}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    📍 {property.sector}, Gurugram
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        ₹{property.monthlyRent.toLocaleString("en-IN")}
                      </p>

                      <p className="text-xs text-slate-400">
                        per month
                      </p>
                    </div>

                    <a
                      href={`/property/${property.id}`}
                      className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}