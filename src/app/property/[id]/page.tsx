"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "@/app/property/property.module.css";

// =========================================================
// PROPERTY TYPE
// =========================================================
// Ye fields database se property ke baare mein public
// information receive karengi.
//
// IMPORTANT:
// Owner/broker ka private contact data yahan intentionally
// use nahi kiya ja raha public UI mein.
type Property = {
  id: number;

  // Basic property information
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;

  // Furnishing information
  furnishing: string;
  furnishingDetails: string | null;

  // Property features
  areaSqFt: number;
  vastu: string | null;

  // Availability
  availableFrom: string;

  // Public location information
  // Society visible rahegi.
  societyName: string;

  // Property description
  description: string | null;

  media: {
    id: number;
    type: string;
    secureUrl: string;
    position: number;
  }[];

  createdAt: string;
};

export default function PropertyDetails() {
  // =======================================================
  // GET PROPERTY ID FROM URL
  // =======================================================
  // Example:
  // /property/2
  //
  // Yahan id = 2 milega.
  const params = useParams();
  const id = Number(params.id);

  // =======================================================
  // PAGE STATE
  // =======================================================
  const [property, setProperty] = useState<Property | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Page load hone tak loading message show hoga.
  const [loading, setLoading] = useState(true);

  // =======================================================
  // LOAD PROPERTY
  // =======================================================
  // Abhi hum existing GET /api/properties se properties
  // fetch kar rahe hain aur requested ID wali property
  // find kar rahe hain.
  useEffect(() => {
    async function loadProperty() {
      try {
        // API se properties fetch karna
        const response = await fetch("/api/properties");

        const result = await response.json();

        // Agar API successfully data return kare
        if (result.success) {
          // URL ki ID ke according property find karna
          const foundProperty = result.properties.find(
            (item: Property) => item.id === id
          );

          setProperty(foundProperty || null);
        }
      } catch (error) {
        // Debugging ke liye terminal mein error show hoga.
        console.error("Failed to load property:", error);
      } finally {
        // Loading complete
        setLoading(false);
      }
    }

    // Valid ID hone par hi property load karenge.
    if (id) {
      loadProperty();
    }
  }, [id]);

  // =======================================================
  // LOADING SCREEN
  // =======================================================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          Loading property...
        </p>
      </main>
    );
  }

  // =======================================================
  // PROPERTY NOT FOUND
  // =======================================================
  if (!property) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">

          <h1 className="text-3xl font-bold">
            Property Not Found
          </h1>

          <p className="mt-3 text-slate-500">
            This property does not exist or has been removed.
          </p>

          <a
            href="/properties"
            className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-bold text-white"
          >
            Back to Properties
          </a>

        </div>
      </main>
    );
  }

  const images = property.media.filter((media) => media.type === "IMAGE");
  const videos = property.media.filter((media) => media.type === "VIDEO");
  const activeImage = images[activeImageIndex];

  function showPreviousImage() {
    setActiveImageIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function showNextImage() {
    setActiveImageIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

  // =======================================================
  // MAIN PROPERTY PAGE
  // =======================================================
  return (
    <main className="min-h-screen min-w-0 overflow-x-clip bg-slate-50 font-sans text-slate-900">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">

          {/* WEBSITE LOGO */}
          <a href="/" className="text-xl font-semibold tracking-tight">
            Gurugram
            <span className="text-slate-500">
              Property
            </span>
          </a>

          {/* BACK TO PROPERTIES */}
          <a
            href="/properties"
            className="text-sm font-medium leading-5 text-slate-600"
          >
            ← Back to properties
          </a>

        </div>
      </header>

      {/* =====================================================
          PROPERTY CONTENT
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">

        <div className="grid min-w-0 gap-8 lg:grid-cols-2">

          {/* =================================================
              PROPERTY IMAGE AREA
          ================================================== */}
          {(activeImage || videos.length > 0) && (
            <div className="min-w-0 max-w-full rounded-3xl bg-slate-200 p-2 sm:p-4">
              {activeImage && (
                <>
                  <div className="relative flex min-h-[260px] max-w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[420px]">
                    <img
                      src={activeImage.secureUrl}
                      alt={`${property.bhk} ${property.propertyType}`}
                      className="h-full max-h-[560px] max-w-full object-contain"
                    />

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={showPreviousImage}
                          className="absolute left-2 rounded-full bg-black/60 px-2 py-2 text-xs font-semibold leading-5 tracking-[0.01em] text-white sm:left-4 sm:px-4 sm:py-3 sm:text-sm"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={showNextImage}
                          className="absolute right-2 rounded-full bg-black/60 px-2 py-2 text-xs font-semibold leading-5 tracking-[0.01em] text-white sm:right-4 sm:px-4 sm:py-3 sm:text-sm"
                        >
                          Next
                        </button>
                      </>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="mt-4 flex max-w-full gap-3 overflow-x-auto pb-1">
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${
                            index === activeImageIndex
                              ? "border-slate-900"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={image.secureUrl}
                            alt={`Property image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {videos.length > 0 && (
                <div className="mt-5 grid gap-4">
                  {videos.map((video) => (
                    <video
                      key={video.id}
                      controls
                      src={video.secureUrl}
                      className="aspect-video w-full rounded-2xl bg-slate-950"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!activeImage && (
          <div className="flex min-h-[300px] max-w-full items-center justify-center rounded-3xl bg-slate-200 sm:min-h-[500px]">

            <div className="text-center">

              <div className="text-7xl">
                🏠
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Property Images
              </p>

            </div>

          </div>
          )}

          {/* =================================================
              PROPERTY DETAILS
          ================================================== */}
          <div className="min-w-0 max-w-full rounded-3xl bg-white p-5 shadow-md transition duration-200 hover:shadow-lg hover:-translate-y-1 sm:p-8">

            {/* VERIFIED BADGE */}
            <span className={`inline-block rounded-full bg-emerald-50 px-4 py-2 text-emerald-600 ${styles.verifiedBadge}`}>
              ✓ Verified Property
            </span>

            {/* PROPERTY TITLE */}
            <h1 className={`mt-6 ${styles.propertyTitle}`}>
              {property.bhk} {property.propertyType}
            </h1>

            {/* SECTOR
                Sector is public.
                Exact address is NOT shown.
            */}
            <p className={`mt-3 ${styles.propertyLocation}`}>
              {property.sector}, Gurugram
            </p>

            {/* =================================================
                MONTHLY RENT
            ================================================== */}
            <div className="mt-8">

              <p className={styles.rentLabel}>
                Monthly Rent
              </p>

              <p className={styles.rentValue}>

                ₹{property.monthlyRent.toLocaleString("en-IN")}

                <span className={styles.rentSuffix}>
                  {" "}
                  / month
                </span>

              </p>

            </div>

            {/* =================================================
                BASIC PROPERTY DETAILS
            ================================================== */}
            <div className="mt-8 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">

              {/* PROPERTY TYPE */}
              <div className="rounded-2xl bg-slate-50 p-5 transition duration-200 hover:shadow-sm hover:bg-white">

                <p className={styles.detailLabel}>
                  Property
                </p>

                <p className={styles.detailValue}>
                  {property.propertyType}
                </p>

              </div>

              {/* BHK */}
              <div className="rounded-2xl bg-slate-50 p-5 transition duration-200 hover:shadow-sm hover:bg-white">

                <p className={styles.detailLabel}>
                  Bedrooms
                </p>

                <p className={styles.detailValue}>
                  {property.bhk}
                </p>

              </div>

              {/* AREA */}
              <div className="rounded-2xl bg-slate-50 p-5 transition duration-200 hover:shadow-sm hover:bg-white">

                <p className={styles.detailLabel}>
                  Area
                </p>

                <p className={styles.detailValue}>
                  {property.areaSqFt > 0
                    ? `${property.areaSqFt.toLocaleString("en-IN")} sq. ft.`
                    : "Not specified"}
                </p>

              </div>

              {/* FURNISHING */}
              <div className="rounded-2xl bg-slate-50 p-5 transition duration-200 hover:shadow-sm hover:bg-white">

                <p className={styles.detailLabel}>
                  Furnishing
                </p>

                <p className={styles.detailValue}>
                  {property.furnishing}
                </p>

              </div>

              {/* VASTU */}
              <div className="rounded-2xl bg-slate-50 p-5 transition duration-200 hover:shadow-sm hover:bg-white">

                <p className={styles.detailLabel}>
                  Vastu
                </p>

                <p className={styles.detailValue}>
                  {property.vastu || "Not specified"}
                </p>

              </div>

              {/* AVAILABLE FROM */}
              <div className="rounded-2xl bg-slate-50 p-5 transition duration-200 hover:shadow-sm hover:bg-white">

                <p className={styles.detailLabel}>
                  Available From
                </p>

                <p className={styles.detailValue}>
                  {property.availableFrom}
                </p>

              </div>

            </div>

            {/* =================================================
                PUBLIC PROPERTY LOCATION
            ================================================== */}
            <div className="mt-8">

              <h2 className={styles.sectionHeading}>
                Property Location
              </h2>

              {/* SOCIETY NAME IS PUBLIC */}
              <p className={`mt-3 ${styles.sectionTextStandard}`}>
                <strong>Society:</strong>{" "}
                {property.societyName}
              </p>

              {/* SECTOR IS PUBLIC */}
              <p className={`mt-2 ${styles.sectionTextStandard}`}>
                <strong>Area:</strong>{" "}
                {property.sector}, Gurugram
              </p>

              {/* PRIVACY NOTICE */}
              <div className="mt-4 break-words rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                🔒 Exact flat/house number and exact address
                are kept private for security and are shared
                only after verification and visit confirmation.
              </div>

            </div>

            {/* =================================================
                FURNISHING DETAILS
            ================================================== */}
            <div className="mt-8">

              <h2 className={styles.sectionHeading}>
                Furnishing & Included Items
              </h2>

              {property.furnishingDetails ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-5 transition duration-200 hover:shadow-sm hover:bg-white">

                    <p className={styles.sectionText}>
                    {property.furnishingDetails}
                  </p>

                </div>
              ) : (
                <p className="mt-3 text-slate-500">
                  No furnishing details provided.
                </p>
              )}

            </div>

            {/* =================================================
                PROPERTY DESCRIPTION
            ================================================== */}
            <div className="mt-8">

              <h2 className={styles.sectionHeading}>
                About this property
              </h2>

              <p className={styles.sectionText}>
                {property.description ||
                  "No description provided."}
              </p>

            </div>

            {/* =================================================
                CONTACT OUR TEAM
            ================================================== */}
            {/* IMPORTANT:
                Owner/Broker ka naam, phone aur email yahan
                intentionally show nahi kar rahe hain.

                Tenant sirf hamari team ko contact karega.
            */}
            <div className={styles.contactHeading}>

              <h2 className={styles.sectionHeading}>
                Interested in this property?
              </h2>

              <p className={styles.contactText}>
                Contact our property team and we will help
                you with verification, property details and
                scheduling a visit.
              </p>

              {/* CONTACT US BUTTON
                  Next step mein is button ko tenant inquiry
                  system se connect karenge.
              */}
              <a
                href={`/contact?propertyId=${property.id}`}
                className="mt-6 block w-full rounded-2xl bg-slate-900 py-4 text-center font-semibold leading-6 tracking-[0.01em] text-white hover:bg-slate-700"
              >
                Contact Us
              </a>

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
