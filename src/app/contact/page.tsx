"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ContactContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyId = searchParams.get("propertyId");

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [moveInDate, setMoveInDate] = useState("");

  // =========================================================
  // CHECK LOGIN
  // =========================================================

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        const result = await response.json();

        if (result.authenticated) {
          setAuthenticated(true);

          // Logged-in user ki information automatically fill karo
          if (result.user) {
            setName(result.user.name || "");
            setPhone(result.user.phone || "");
            setEmail(result.user.email || "");
          }
        } else {
          const redirectUrl = `/contact?propertyId=${propertyId}`;

          router.push(
            `/login?redirect=${encodeURIComponent(redirectUrl)}`
          );
        }
      } catch (error) {
        console.error("Authentication check failed:", error);

        const redirectUrl = `/contact?propertyId=${propertyId}`;

        router.push(
          `/login?redirect=${encodeURIComponent(redirectUrl)}`
        );
      } finally {
        setLoading(false);
      }
    }

    if (propertyId) {
      checkLogin();
    } else {
      setLoading(false);
    }
  }, [propertyId, router]);

  // =========================================================
  // SUBMIT ENQUIRY
  // =========================================================

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",

        body: JSON.stringify({
          propertyId: Number(propertyId),
          name,
          phone,
          email,
          message,
          moveInDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to submit enquiry.");
        return;
      }

      setSuccess(
        "Your enquiry has been submitted successfully. Our team will contact you shortly."
      );

      // Form clear
      setMessage("");
      setMoveInDate("");
    } catch (error) {
      console.error("Enquiry submission failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Checking login...</h1>
      </main>
    );
  }

  // =========================================================
  // INVALID PROPERTY
  // =========================================================

  if (!propertyId) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Invalid Property</h1>
        <p>Property ID is missing.</p>
      </main>
    );
  }

  // =========================================================
  // NOT AUTHENTICATED
  // =========================================================

  if (!authenticated) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Redirecting to login...</h1>
      </main>
    );
  }

  // =========================================================
  // ENQUIRY FORM
  // =========================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "0 auto",
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Property Enquiry
        </h1>

        <p
          style={{
            color: "#64748b",
            marginBottom: "30px",
          }}
        >
          You are enquiring about property ID:{" "}
          <strong>{propertyId}</strong>
        </p>

        {success && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "14px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "14px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* NAME */}

          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          />

          {/* PHONE */}

          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Phone
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          />

          {/* EMAIL */}

          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          />

          {/* MOVE IN DATE */}

          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Expected Move-in Date
          </label>

          <input
            type="date"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          />

          {/* MESSAGE */}

          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Message
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you are looking for..."
            rows={5}
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              marginBottom: "25px",
              resize: "vertical",
            }}
          />

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "14px",
              background: submitting ? "#94a3b8" : "#111827",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Enquiry"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: "40px" }}>
          <h1>Loading...</h1>
        </main>
      }
    >
      <ContactContent />
    </Suspense>
  );
}