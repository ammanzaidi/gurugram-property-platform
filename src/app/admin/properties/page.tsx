"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Property = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  furnishing: string;
  furnishingDetails: string | null;
  availableFrom: string;
  areaSqFt: number;
  vastu: string | null;
  societyName: string;
  address: string;
  description: string | null;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  status: string;
  createdAt: string;
  media: {
    id: number;
    type: string;
    secureUrl: string;
    resourceType: string;
    position: number;
  }[];
};

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        setError("");

        const response = await fetch("/api/admin/properties", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load properties for review."
          );
        }

        setProperties(result.properties || []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load properties for review."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  async function updatePropertyStatus(
    propertyId: number,
    status: "AVAILABLE" | "REJECTED"
  ) {
    try {
      setUpdatingId(propertyId);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update property status.");
      }

      setProperties((current) =>
        current.filter((property) => property.id !== propertyId)
      );
      setSuccess(result.message);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update property status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="app-page dashboard-page admin-page min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold">
            Gurugram<span className="text-slate-500">Property</span>
          </Link>

          <Link
            href="/enquiries"
            className="text-sm font-semibold text-slate-600"
          >
            View Enquiries
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
          Admin Review
        </p>

        <h1 className="mt-3 text-4xl font-bold">Pending Properties</h1>

        <p className="mt-4 text-slate-500">
          Review property submissions before making them public.
        </p>

        {loading && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">
            Loading pending properties...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && success && (
          <div className="mt-8 rounded-2xl bg-green-50 p-5 text-green-700">
            {success}
          </div>
        )}

        {!loading && !error && properties.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center">
            <h2 className="text-xl font-bold">No pending properties</h2>
            <p className="mt-2 text-slate-500">
              New property submissions will appear here for review.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-6">
          {properties.map((property) => {
            const isUpdating = updatingId === property.id;

            return (
              <article
                key={property.id}
                className="rounded-3xl bg-white p-7 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-400">
                      Property #{property.id}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">
                      {property.bhk} {property.propertyType}
                    </h2>
                    <p className="mt-2 text-slate-500">
                      {property.sector}, {property.societyName}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
                    {property.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <h3 className="font-bold">Property Details</h3>
                    <p className="mt-3 text-sm text-slate-600">
                      Rent: ₹{property.monthlyRent.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Furnishing: {property.furnishing}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Area: {property.areaSqFt.toLocaleString("en-IN")} sq. ft.
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Available from: {property.availableFrom}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-5">
                    <h3 className="font-bold">Owner / Broker Details</h3>
                    <p className="mt-3 text-sm text-slate-700">
                      {property.ownerName}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {property.ownerPhone}
                    </p>
                    <p className="mt-2 break-all text-sm text-slate-700">
                      {property.ownerEmail || "No email provided"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-5">
                    <h3 className="font-bold">Private Exact Address</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                      {property.address}
                    </p>
                  </div>
                </div>

                {(property.furnishingDetails || property.description) && (
                  <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                    {property.furnishingDetails && (
                      <p className="text-sm text-slate-600">
                        <strong>Furnishing details:</strong>{" "}
                        {property.furnishingDetails}
                      </p>
                    )}

                    {property.description && (
                      <p className="mt-3 text-sm text-slate-600">
                        <strong>Description:</strong> {property.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold">Property Media</h3>

                  {property.media.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No photos or videos uploaded.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {property.media.map((media) =>
                        media.type === "VIDEO" ? (
                          <video
                            key={media.id}
                            controls
                            src={media.secureUrl}
                            className="aspect-video w-full rounded-xl bg-slate-950 object-cover"
                          />
                        ) : (
                          <img
                            key={media.id}
                            src={media.secureUrl}
                            alt={`${property.bhk} ${property.propertyType}`}
                            className="aspect-video w-full rounded-xl object-cover"
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updatePropertyStatus(property.id, "AVAILABLE")
                    }
                    disabled={isUpdating}
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdating ? "Updating..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updatePropertyStatus(property.id, "REJECTED")
                    }
                    disabled={isUpdating}
                    className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdating ? "Updating..." : "Reject"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
