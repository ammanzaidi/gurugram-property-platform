"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type PropertySuggestion = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  furnishing: string;
  areaSqFt: number | null;
  societyName: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  properties?: PropertySuggestion[];
};

const suggestedPrompts = [
  "Find me a 2 BHK in Sector 67 under ₹40,000",
  "Show me semi-furnished properties",
  "Compare these properties",
  "How do I schedule a property visit?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(message: string) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading) return;

    setMessages((current) => [...current, { role: "user", content: trimmedMessage }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "The assistant is unavailable right now.");
      }

      setMessages((current) => [...current, {
        role: "assistant",
        content: result.message,
        properties: Array.isArray(result.properties) ? result.properties : [],
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section id="assistant" className="homepage-section px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-4xl bg-slate-950 shadow-2xl">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Your rental guide</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Ask about your next home.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                Search live available listings, compare public details, and understand the next step without sharing private contact information.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 lg:mt-10">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={loading}
                  className="rounded-full border border-white/15 px-3 py-2 text-left text-xs font-semibold text-slate-200 transition hover:border-amber-300/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex h-[36rem] max-h-[calc(100dvh-2rem)] min-h-0 flex-col rounded-3xl bg-white p-4 sm:p-5">
            <div ref={messagesContainerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto" aria-live="polite">
              {messages.length === 0 && (
                <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 text-center text-sm leading-6 text-slate-500">
                  Ask for a location, budget, BHK, furnishing preference, or visit guidance.
                </div>
              )}
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[96%]">
                    <p className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {message.content}
                    </p>
                    {message.role === "assistant" && message.properties && message.properties.length > 0 && (
                      // Property facts and IDs come directly from the server-side public Prisma selection.
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {message.properties.map((property) => (
                          <Link
                            key={property.id}
                            href={`/property/${property.id}`}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                            aria-label={`View details for ${property.bhk} ${property.propertyType} in ${property.sector}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">
                                  {property.societyName || "Gurugram Property"}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  {property.bhk} {property.propertyType}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-bold text-slate-900">
                                ₹{property.monthlyRent.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                              <span className="rounded-full bg-slate-100 px-2 py-1">{property.sector}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-1">{property.furnishing}</span>
                              {property.areaSqFt && <span className="rounded-full bg-slate-100 px-2 py-1">{property.areaSqFt} sq ft</span>}
                            </div>
                            <span className="mt-3 inline-flex text-xs font-bold text-slate-900 group-hover:text-slate-600">
                              View Property <span aria-hidden="true" className="ml-1">→</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && <p className="text-sm text-slate-400">Checking available listings...</p>}
            </div>

            {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <label htmlFor="ai-assistant-message" className="sr-only">Ask the property assistant</label>
              <input
                id="ai-assistant-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about available properties..."
                maxLength={2000}
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ask
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}