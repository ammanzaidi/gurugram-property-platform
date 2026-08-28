"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const properties = [
  {
    title: "Modern 2 BHK",
    location: "Sector 67, Gurugram",
    rent: "₹32,000",
    type: "2 BHK",
  },
  {
    title: "Premium 3 BHK",
    location: "Sector 57, Gurugram",
    rent: "₹48,000",
    type: "3 BHK",
  },
  {
    title: "Fully Furnished 1 BHK",
    location: "Sector 52, Gurugram",
    rent: "₹24,000",
    type: "1 BHK",
  },
];

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("Any Property");
  const [budget, setBudget] = useState("Any Budget");

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
        window.location.href = "/login";
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

    window.location.href = `/properties?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

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

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#properties"
              className="text-sm font-medium hover:text-slate-500"
            >
              Find Property
            </a>

            <a
              href="#locations"
              className="text-sm font-medium hover:text-slate-500"
            >
              Locations
            </a>

            <a
              href="#how"
              className="text-sm font-medium hover:text-slate-500"
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

        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero-shell relative min-h-[720px] overflow-hidden bg-slate-950 md:min-h-[780px] lg:min-h-screen">
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
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-12 sm:py-16 md:py-20">

          {/* Text Content */}
          <div className="flex flex-col justify-center flex-1 max-w-3xl">

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Rental homes in Gurugram
            </p>

            <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Find a place
              <br />
              <span className="bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">
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

      {/* =====================================================
          LOCATIONS
      ===================================================== */}

      <section
        id="locations"
        className="bg-slate-50 px-6 py-20 sm:py-24 md:py-32"
      >

        <div className="mx-auto max-w-7xl">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Explore Gurugram
          </p>

        <h2 className="mt-3 text-4xl font-bold">
          Popular locations
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-3">

          {[
            "Sector 52",
            "Sector 57",
            "Sector 65",
            "Sector 66",
            "Sector 67",
            "Golf Course Road",
          ].map((location) => (

            <div
              key={location}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
            >

              <p className="text-xs uppercase tracking-wide text-slate-400">
                Gurugram
              </p>

              <h3 className="mt-2 text-lg font-bold">
                {location}
              </h3>

              <p className="mt-3 text-sm text-slate-500">
                Explore rental properties →
              </p>

            </div>

          ))}

        </div>

        </div>
      </section>

      {/* =====================================================
          PROPERTIES
      ===================================================== */}

      <section
        id="properties"
        className="bg-white py-20 sm:py-24 md:py-32"
      >

        <div className="mx-auto max-w-7xl px-6">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Featured homes
          </p>

          <div className="mt-3 flex items-end justify-between">

            <h2 className="text-4xl font-bold">
              Properties you may like
            </h2>

            <button className="hidden rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold md:block">
              View all
            </button>

          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            {properties.map((property) => (

              <article
                key={property.title}
                className="property-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
              >

                <div className="flex h-52 items-center justify-center bg-slate-200 overflow-hidden">
                  <span className="text-sm text-slate-500">
                    Property Image
                  </span>
                </div>

                <div className="p-6">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <h3 className="text-lg font-bold">
                        {property.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {property.location}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="font-bold">
                        {property.rent}
                      </p>

                      <p className="text-xs text-slate-400">
                        / month
                      </p>

                    </div>

                  </div>

                  <div className="mt-5">

                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">
                      {property.type}
                    </span>

                  </div>

                  <button className="mt-6 w-full rounded-xl border border-slate-200 py-3 text-sm font-bold transition hover:bg-slate-900 hover:text-white">
                    View Property
                  </button>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how"
        className="bg-slate-50 px-6 py-20 sm:py-24 md:py-32"
      >

        <div className="mx-auto max-w-7xl">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Simple process
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            From search to visit
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">

              <p className="text-sm font-bold text-slate-400">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">

            <p className="text-sm font-bold text-slate-400">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">

            <p className="text-sm font-bold text-slate-400">
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

      <section className="bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-20 sm:py-24 md:py-32">

        <div className="mx-auto max-w-4xl text-center">

          <h2 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Ready to find your next home?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-slate-300 text-lg">
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

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">

        <div className="mx-auto flex max-w-7xl justify-between px-6 py-8 text-sm">

          <p className="text-slate-400">
            © 2026 GurugramProperty
          </p>

          <div className="flex gap-6 text-slate-400">

            <span className="hover:text-slate-200 cursor-pointer transition">Privacy</span>
            <span className="hover:text-slate-200 cursor-pointer transition">Terms</span>
            <span className="hover:text-slate-200 cursor-pointer transition">Contact</span>

          </div>

        </div>

      </footer>

    </main>
  );
}