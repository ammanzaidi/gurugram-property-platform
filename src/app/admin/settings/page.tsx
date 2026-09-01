"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: string;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to log out.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to log out.");
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error("Failed to load user info.");
        }

        setUser(result.user || null);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load user info."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

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

      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Admin Settings
        </h1>
        <p className="mt-3 text-slate-500">
          Manage your admin account and platform settings.
        </p>

        {loading && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading settings...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && user && (
          <div className="mt-8 space-y-6">
            {/* Admin Profile */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-bold">Admin Profile</h2>
              <p className="mt-1 text-sm text-slate-500">Your account information</p>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{user.name}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{user.phone}</p>
                </div>

                {user.email && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{user.email}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Role</p>
                  <p className="mt-2 inline-flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                      {user.role}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-bold">Account Security</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage your account access and security settings
              </p>

              <div className="mt-6 space-y-3">
                <p className="text-sm text-slate-600">
                  Your account is protected by session-based authentication. Session tokens are stored securely in HTTP-only cookies and are never exposed to client-side JavaScript.
                </p>
                <p className="text-sm text-slate-600">
                  All admin actions are logged and verified server-side. To change your password or account details, please contact the platform administrator.
                </p>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-bold">Notification Preferences</h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure how you receive platform notifications
              </p>

              <div className="mt-6 space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">
                    New property submissions
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">
                    Pending tenant leads
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">
                    Visit requests and updates
                  </span>
                </label>

                <p className="mt-4 text-xs text-slate-500">
                  Notification settings are currently managed by the platform. Contact the administrator to customize preferences.
                </p>
              </div>
            </div>

            {/* Session Info */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-bold">Active Session</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your current login session information
              </p>

              <div className="mt-6 space-y-3">
                <p className="text-sm text-slate-600">
                  You are currently logged in to the GurugramProperty Admin Panel.
                </p>
                <p className="text-sm text-slate-600">
                  Your session is protected by a secure HTTP-only cookie that expires after a period of inactivity. Do not share your login credentials or session token with anyone.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button type="button" onClick={handleLogout} disabled={loggingOut} className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
