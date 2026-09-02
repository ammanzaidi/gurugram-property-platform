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

function formatPropertyDate(value: string | null | undefined) {
  if (!value) return "Not specified";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

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
  const [imageLoadError, setImageLoadError] = useState(false);

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
        const response = await fetch(`/api/properties?id=${encodeURIComponent(String(id))}`, {
          cache: "no-store",
        });

        const result = await response.json();

        if (result.success && result.property) {
          setProperty(result.property as Property);
          return;
        }

        setProperty(null);
      } catch (error) {
        // Debugging ke liye terminal mein error show hoga.
        console.error("Failed to load property:", error);
        setProperty(null);
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

  useEffect(() => {
    if (property) {
      setImageLoadError(false);
    }
  }, [property]);

  // =======================================================
  // LOADING SCREEN
  // =======================================================
  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <span className={styles.loadingMark} aria-hidden="true" />
          <p className="text-slate-500">Loading property...</p>
        </div>
      </main>
    );
  }

  // =======================================================
  // PROPERTY NOT FOUND
  // =======================================================
  if (!property) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>

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

  const images = (property.media ?? []).filter((media) => media.type === "IMAGE");
  const videos = (property.media ?? []).filter((media) => media.type === "VIDEO");
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
    <main className={`${styles.page} min-h-screen min-w-0 overflow-x-clip font-sans text-slate-900`}>

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className={styles.siteHeader}>

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">

          {/* WEBSITE LOGO */}
          <a href="/" className={styles.logo}>
            Gurugram
            <span className="text-slate-500">
              Property
            </span>
          </a>

          {/* BACK TO PROPERTIES */}
          <a
            href="/properties"
            className={styles.backLink}
          >
            ← Back to properties
          </a>

        </div>
      </header>

      {/* =====================================================
          PROPERTY CONTENT
      ====================================================== */}
      <section className={styles.content}>

        <div className={styles.layout}>

          {/* =================================================
              PROPERTY IMAGE AREA
          ================================================== */}
          {(activeImage || videos.length > 0) && (
            <div className={styles.galleryPanel}>
              {activeImage && !imageLoadError && (
                <>
                  <div className={styles.heroImageFrame}>
                    <img
                      src={activeImage.secureUrl}
                      alt={`${property.bhk} ${property.propertyType}`}
                      onError={() => setImageLoadError(true)}
                      className={styles.heroImage}
                    />

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={showPreviousImage}
                          aria-label="Show previous image"
                          className={`${styles.galleryButton} left-3 sm:left-5`}
                        >
                          <span aria-hidden="true">←</span>
                        </button>
                        <button
                          type="button"
                          onClick={showNextImage}
                          aria-label="Show next image"
                          className={`${styles.galleryButton} right-3 sm:right-5`}
                        >
                          <span aria-hidden="true">→</span>
                        </button>
                      </>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className={styles.thumbnailRail}>
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          aria-label={`Show property image ${index + 1}`}
                          className={`${styles.thumbnail} ${
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
                <div className={styles.videoList}>
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

          {(!activeImage || imageLoadError) && (
          <div className={styles.mediaFallback}>

            <div className="text-center">

              <div className={styles.fallbackIcon} aria-hidden="true">⌂</div>

              <p className={styles.fallbackTitle}>
                Images unavailable
              </p>

              <p className={styles.fallbackText}>
                Media for this listing has not been provided.
              </p>

            </div>

          </div>
          )}

          {/* =================================================
              PROPERTY DETAILS
          ================================================== */}
          <div className={styles.detailsPanel}>

            {/* VERIFIED BADGE */}
            <span className={styles.verifiedBadge}>
              <span aria-hidden="true">✓</span> Verified Property
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
            <div className={styles.rentBlock}>

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
            <div className={styles.detailGrid}>

              {/* PROPERTY TYPE */}
              <div className={styles.detailCard}>

                <p className={styles.detailLabel}>
                  Property
                </p>

                <p className={styles.detailValue}>
                  {property.propertyType}
                </p>

              </div>

              {/* BHK */}
              <div className={styles.detailCard}>

                <p className={styles.detailLabel}>
                  Bedrooms
                </p>

                <p className={styles.detailValue}>
                  {property.bhk}
                </p>

              </div>

              {/* AREA */}
              <div className={styles.detailCard}>

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
              <div className={styles.detailCard}>

                <p className={styles.detailLabel}>
                  Furnishing
                </p>

                <p className={styles.detailValue}>
                  {property.furnishing}
                </p>

              </div>

              {/* VASTU */}
              <div className={styles.detailCard}>

                <p className={styles.detailLabel}>
                  Vastu
                </p>

                <p className={styles.detailValue}>
                  {property.vastu || "Not specified"}
                </p>

              </div>

              {/* AVAILABLE FROM */}
              <div className={styles.detailCard}>

                <p className={styles.detailLabel}>
                  Available From
                </p>

                <p className={styles.detailValue}>
                  {formatPropertyDate(property.availableFrom)}
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
                className={styles.contactButton}
              >
                <span>Contact our property team</span>
                <span aria-hidden="true">→</span>
              </a>

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
