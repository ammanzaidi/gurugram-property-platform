"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: identifier,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid email or password.");
      }

      setSuccess("Login successful!");

      const requestedRedirect = new URLSearchParams(window.location.search).get("redirect");
      const redirectTarget = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
        ? requestedRedirect
        : "/";

      setTimeout(() => {
        router.push(redirectTarget);
      }, 500);
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page auth-page min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold">
            Gurugram
            <span className="text-slate-500">Property</span>
          </Link>

          <a
            href="/register"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-900"
          >
            Create Account
          </a>
        </div>
      </header>

      {/* LOGIN FORM */}
      <section className="mx-auto flex max-w-md justify-center px-6 py-16">
        <div className="w-full rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
              Gurugram Property
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Welcome Back
            </h1>

            <p className="mt-3 text-slate-500">
              Login to manage your properties.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-bold"
              >
                Email or phone
              </label>

              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="your@email.com or 10 digit phone"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
                {success}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* REGISTER LINK */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-slate-900"
            >
              Create Account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}