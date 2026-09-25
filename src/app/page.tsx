"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AIAssistant from "@/app/components/ai-assistant";

type Property = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  furnishing: string;
  areaSqFt?: number | null;
  societyName?: string | null;
  availableFrom?: string | null;
  description?: string | null;
  media: {
    id: number;
    type: string;
    secureUrl: string;
    position: number;
  }[];
};

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("Any Property");
  const [budget, setBudget] = useState("Any Budget");
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");

  // =========================================================
  // CHECK LOGIN STATUS
  // =========================================================

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.success && data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function loadFeaturedProperties() {
      try {
        const response = await fetch("/api/properties", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load properties.");
        }

        setProperties(result.properties || []);
      } catch (error) {
        console.error("Failed to load featured properties:", error);
        setPropertiesError(
          error instanceof Error
            ? error.message
            : "Unable to load properties right now."
        );
      } finally {
        setPropertiesLoading(false);
      }
    }

    loadFeaturedProperties();
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setUser(null);
        setMobileMenuOpen(false);
        router.push("/login");
      } else {
        alert(data.error || "Logout failed.");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }
  async function handleSearch() {
    const params = new URLSearchParams();

    if (location.trim()) {
      params.set("location", location.trim());
    }

    if (propertyType !== "Any Property") {
      params.set("propertyType", propertyType);
    }

    if (budget !== "Any Budget") {
      params.set("budget", budget);
    }

    router.push(`/properties?${params.toString()}`);
  }

  return (
    <main className="homepage min-h-screen bg-white text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="site-header border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">

          {/* LOGO */}

          <Link href="/" className="block">
            <h1 className="text-xl font-bold">
              Gurugram
              <span className="text-slate-500">Property</span>
            </h1>

            <p className="text-xs text-slate-400">
              Find. Visit. Move.
            </p>
          </Link>

          {/* NAVIGATION */}

          <nav className="hidden flex-wrap items-center justify-end gap-2 sm:flex sm:gap-3 md:gap-5 lg:gap-8">

            <a
              href="#properties"
              className="hidden text-sm font-medium hover:text-slate-500 sm:inline"
            >
              Find Property
            </a>

            <a
              href="#locations"
              className="hidden text-sm font-medium hover:text-slate-500 sm:inline"
            >
              Locations
            </a>

            <a
              href="#how"
              className="hidden text-sm font-medium hover:text-slate-500 sm:inline"
            >
              How It Works
            </a>

            {/* AUTH BUTTONS */}

            {checkingAuth ? (
              <span className="text-sm text-slate-400">
                Loading...
              </span>
            ) : user ? (
              <>
                <span className="text-sm font-semibold text-slate-700">
                  Hi, {user.name}
                </span>

                <Link
                  href="/dashboard"
                  className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 lg:inline-flex"
                >
                  Dashboard
                </Link>

                {user.role.toUpperCase() === "TENANT" && (
                  <Link
                    href="/my-visits"
                    className="hidden text-sm font-medium hover:text-slate-500 lg:inline"
                  >
                    My Visits
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-100"
                >
                  Login
                </a>

                <a
                  href="/register"
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-100"
                >
                  Sign Up
                </a>
              </>
            )}

            {/* LIST PROPERTY */}

            <a
              href="/list-property"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              List a Property
            </a>

          </nav>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold sm:hidden"
          >
            <span className="flex w-4 flex-col gap-1" aria-hidden="true">
              <span className="h-0.5 w-full bg-slate-900" />
              <span className="h-0.5 w-full bg-slate-900" />
              <span className="h-0.5 w-full bg-slate-900" />
            </span>
            Menu
          </button>

        </div>

        {mobileMenuOpen && (
          <div id="mobile-navigation" className="border-t border-slate-200 bg-white px-4 py-4 sm:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
              <a
                href="#properties"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-100"
              >
                Find Property
              </a>
              <a
                href="#locations"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-100"
              >
                Locations
              </a>
              <a
                href="#how"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-100"
              >
                How It Works
              </a>
              <a
                href="/list-property"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-100"
              >
                List a Property
              </a>

              {checkingAuth ? (
                <span className="px-4 py-3 text-sm text-slate-400">Loading...</span>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-100"
                  >
                    Dashboard
                  </Link>
                  {user.role.toUpperCase() === "TENANT" && (
                    <Link
                      href="/my-visits"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-100"
                    >
                      My Visits
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="rounded-xl px-4 py-3 text-left text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-100"
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-100"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero-shell relative mx-3 min-h-[720px] overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl sm:mx-5 md:min-h-[780px] lg:mx-6 lg:min-h-[calc(100vh-7rem)]">
        {/* Background Image with Overlay */}
        <div
          className="hero-backdrop absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: 'url("/gurugram-high-rise.jpg")',
          }}
        >
          {/* Dark Navy Gradient Overlay */}
          <div className="hero-overlay absolute inset-0"></div>
        </div>

        {/* Hero Content */}
        <div className="relative mx-auto flex min-h-[720px] max-w-7xl flex-col justify-between px-6 py-12 sm:min-h-[780px] sm:py-16 md:px-12 md:py-20">

          {/* Text Content */}
          <div className="flex flex-col justify-center flex-1 max-w-3xl">

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Rental homes in Gurugram
            </p>

            <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Find a place
              <br />
              <span className="hero-accent">
                you can call home.
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Search rental properties in Gurugram and get personal
              assistance from property search to your actual visit.
            </p>

          </div>

          {/* SEARCH - Overlapping Box */}

          <div className="relative z-10 -mb-20 mx-auto w-full max-w-4xl">
            <div className="hero-search-panel rounded-3xl bg-white p-3 shadow-2xl sm:p-4">

              <div className="grid gap-3 grid-cols-1 sm:gap-2 sm:grid-cols-2 lg:grid-cols-4">

              <div className="min-w-0 rounded-2xl bg-slate-100 px-5 py-4 transition duration-200 hover:bg-slate-50 hover:shadow-sm">

                <p className="text-xs font-bold uppercase text-slate-400">
                  Location
                </p>

                
                  <input
                type="text"
               value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location, e.g. Sector 67"
            className="mt-2 w-full bg-transparent text-sm outline-none transition duration-150"
/>
              </div>

              <div className="min-w-0 rounded-2xl bg-slate-100 px-5 py-4 transition duration-200 hover:bg-slate-50 hover:shadow-sm">

                <p className="text-xs font-bold uppercase text-slate-400">
                  Property
                </p>

                <select
  value={propertyType}
  onChange={(e) => setPropertyType(e.target.value)}
  className="mt-2 w-full bg-transparent text-sm outline-none transition duration-150"
>
                  <option>Any Property</option>
                  <option>Apartment</option>
                  <option>Independent House</option>
                  <option>Villa</option>
                </select>

              </div>

              <div className="min-w-0 rounded-2xl bg-slate-100 px-5 py-4 transition duration-200 hover:bg-slate-50 hover:shadow-sm">

                <p className="text-xs font-bold uppercase text-slate-400">
                  Budget
                </p>

                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-2 w-full bg-transparent text-sm outline-none transition duration-150"
>
                  <option>Any Budget</option>
                  <option>Below ₹20K</option>
                  <option>₹20K - ₹30K</option>
                  <option>₹30K - ₹40K</option>
                  <option>₹40K - ₹50K</option>
                  <option>₹50K+</option>
                </select>

              </div>

              <button
  onClick={handleSearch}
  className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition duration-200 hover:bg-slate-700 hover:-translate-y-1 hover:shadow-lg"
>
  Search Properties
</button>

            </div>

            </div>
          </div>

        </div>
      </section>

        <AIAssistant />

      {/* =====================================================
          LOCATIONS
      ===================================================== */}

      {/* =====================================================
          PROPERTIES
      ===================================================== */}

      <section
        id="properties"
        className="homepage-section properties-section px-4 py-20 sm:px-6 sm:py-24 md:py-28"
      >

        <div className="mx-auto max-w-7xl px-0">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Featured homes
          </p>

          <div className="mt-3 flex items-end justify-between">

            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Properties you may like
            </h2>

            <Link href="/properties" className="inline-flex shrink-0 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold transition hover:border-slate-900 hover:bg-slate-900 hover:text-white sm:px-5 sm:text-sm">
              View all properties <span aria-hidden="true">→</span>
            </Link>

          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.95fr)]">

            <div className="min-w-0">
              {propertiesLoading && (
                <div className="property-loading-grid grid gap-6 md:grid-cols-3" aria-label="Loading properties">
                  {[1, 2, 3].map((item) => <div key={item} className="property-skeleton h-[27rem] rounded-3xl" />)}
                </div>
              )}

              {!propertiesLoading && propertiesError && (
                <div className="empty-state rounded-3xl p-8 text-center">
                  <h3 className="text-xl font-bold">Properties are temporarily unavailable</h3>
                  <p className="mt-2 text-sm text-slate-500">Please try again in a moment.</p>
                </div>
              )}

              {!propertiesLoading && !propertiesError && properties.length === 0 && (
                <div className="empty-state rounded-3xl p-8 text-center">
                  <h3 className="text-xl font-bold">No properties available yet</h3>
                  <p className="mt-2 text-sm text-slate-500">New Gurugram listings will appear here.</p>
                </div>
              )}

              {!propertiesLoading && !propertiesError && properties.length > 0 && (
                <div className="grid gap-6 md:grid-cols-3">
                  {properties.slice(0, 3).map((property) => {
                    const firstImage = property.media?.find((media) => media.type === "IMAGE");
                    const propertyTitle = `${property.bhk} ${property.propertyType}`;
                    const areaLabel = property.areaSqFt ? `${property.areaSqFt} sq ft` : "Area on request";

                    return (
                      <Link
                        key={property.id}
                        href={`/property/${property.id}`}
                        className="group block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                        aria-label={`View details for ${propertyTitle} in ${property.sector}`}
                      >
                        <div className="property-media relative flex h-56 items-end overflow-hidden bg-slate-200 p-5">
                          {firstImage ? (
                            <Image
                              src={firstImage.secureUrl}
                              alt={`${propertyTitle} in ${property.sector}`}
                              fill
                              unoptimized
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300" aria-hidden="true" />
                          )}
                          <div className="property-media-shade absolute inset-0" aria-hidden="true" />
                          <div className="relative z-10">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                              {property.societyName || "Gurugram Property"}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-white">{property.sector}</p>
                          </div>
                          <span className="property-media-badge absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-semibold text-white">
                            {property.bhk}
                          </span>
                        </div>

                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-slate-900">{propertyTitle}</h3>
                              <p className="mt-1 text-sm text-slate-500">{property.sector}, Gurugram</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-lg font-bold text-slate-900">₹{property.monthlyRent.toLocaleString("en-IN")}</p>
                              <p className="text-[11px] text-slate-400">/ month</p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              {property.furnishing}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              {areaLabel}
                            </span>
                          </div>

                          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                              {property.availableFrom || "Available now"}
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                              View Details <span aria-hidden="true">→</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

            </div>

            <div id="locations" className="locations-panel rounded-3xl p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Explore Gurugram</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Popular locations</h2>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {["Sector 52", "Sector 57", "Sector 65", "Sector 66", "Sector 67", "Golf Course Road"].map((area) => (
                  <Link key={area} href={`/properties?location=${encodeURIComponent(area)}`} className="location-chip rounded-2xl p-4 text-white transition hover:-translate-y-1">
                    <span className="location-mark" aria-hidden="true">GP</span>
                    <span className="mt-3 block text-sm font-bold">{area}</span>
                    <span className="mt-1 block text-xs text-slate-300">Explore properties <span aria-hidden="true">→</span></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how"
        className="homepage-section how-section px-4 py-20 sm:px-6 sm:py-24 md:py-28"
      >

        <div className="mx-auto max-w-7xl">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Simple process
          </p>

          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            From search to visit
          </h2>

          <div className="process-grid relative mt-10 grid gap-5 md:grid-cols-3">

            <div className="process-card rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-8">

              <p className="process-number text-sm font-bold">
                01
              </p>

              <h3 className="mt-8 text-xl font-bold">
              Search
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Tell us your preferred location, budget and property
              requirements.
            </p>

          </div>

          <div className="process-card rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-8">

            <p className="process-number text-sm font-bold">
              02
            </p>

            <h3 className="mt-8 text-xl font-bold">
              Send an inquiry
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Found something you like? Request a property visit
              through our platform.
            </p>

          </div>

          <div className="process-card rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-8">

            <p className="process-number text-sm font-bold">
              03
            </p>

            <h3 className="mt-8 text-xl font-bold">
              Visit & move
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Our representative coordinates your visit and helps
              you through the rental process.
            </p>

          </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="cta-section relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 md:py-28">

        <div className="mx-auto max-w-4xl text-center">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Make your next move
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Ready to find your next home?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Explore rental properties in Gurugram and let our team
            help you arrange the visit.
          </p>

          <a
            href="/properties"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3 font-bold text-slate-900 transition duration-200 hover:shadow-lg hover:-translate-y-1"
          >
            Start Searching
          </a>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="site-footer border-t border-slate-200 bg-slate-950 text-slate-300">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <p className="text-slate-400">
            © 2026 GurugramProperty
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-400">

            <span className="hover:text-slate-200 cursor-pointer transition">Privacy</span>
            <span className="hover:text-slate-200 cursor-pointer transition">Terms</span>
            <span className="hover:text-slate-200 cursor-pointer transition">Contact</span>

          </div>

        </div>

      </footer>

    </main>
  );
}