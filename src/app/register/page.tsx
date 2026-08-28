"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [accountType, setAccountType] = useState("OWNER");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          role: accountType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create account.");
      }

      setSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page auth-page min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Link href="/" className="text-xl font-bold">
            Gurugram
            <span className="text-slate-500">Property</span>
          </Link>
        </div>
      </header>

      <section className="flex min-h-[80vh] items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Owner / Broker
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Create Your Account
          </h1>

          <p className="mt-3 text-slate-500">
            Create an account to list and manage your properties.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="accountType" className="text-sm font-semibold">
                Account type
              </label>
              <select
                id="accountType"
                value={accountType}
                onChange={(event) => setAccountType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              >
                <option value="OWNER">Owner / Broker</option>
                <option value="TENANT">Tenant</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold">
                Full Name
              </label>

              <input
                name="name"
                required
                type="text"
                placeholder="Enter your full name"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Phone Number
              </label>

              <input
                name="phone"
                required
                type="tel"
                placeholder="10 digit mobile number"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Email
              </label>

              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Password
              </label>

              <input
                name="password"
                required
                type="password"
                minLength={6}
                placeholder="Minimum 6 characters"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Confirm Password
              </label>

              <input
                name="confirmPassword"
                required
                type="password"
                minLength={6}
                placeholder="Re-enter password"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                Account created successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 py-4 font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-bold text-slate-900"
            >
              Login
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}