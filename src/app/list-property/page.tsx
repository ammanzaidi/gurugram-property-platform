"use client";

import { useState } from "react";

type SelectedMedia = {
  file: File;
  previewUrl: string;
};

const MAX_IMAGES = 8;
const MAX_VIDEOS = 2;
const MAX_MEDIA = MAX_IMAGES + MAX_VIDEOS;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;

const MEDIA_TYPES: Record<string, "IMAGE" | "VIDEO"> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "video/mp4": "VIDEO",
  "video/quicktime": "VIDEO",
};

export default function ListProperty() {
  // ---------------------------------------------------------
  // FORM STATE
  // ---------------------------------------------------------
  // submitted = property successfully database mein save hui ya nahi
  // loading = form submit hone ke time button loading state
  // error = agar database/API mein error aaye
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createdPropertyId, setCreatedPropertyId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [error, setError] = useState("");

  function addSelectedMedia(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const currentImages = selectedMedia.filter((media) =>
      media.file.type.startsWith("image/")
    ).length;
    const currentVideos = selectedMedia.filter((media) =>
      media.file.type.startsWith("video/")
    ).length;
    let newImages = 0;
    let newVideos = 0;

    for (const file of files) {
      const mediaType = MEDIA_TYPES[file.type];

      if (!mediaType) {
        setError("Only JPG, JPEG, PNG, WEBP, MP4, and MOV files are allowed.");
        event.target.value = "";
        return;
      }

      const maximumSize =
        mediaType === "IMAGE" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;

      if (file.size <= 0 || file.size > maximumSize) {
        setError(
          mediaType === "IMAGE"
            ? "Each image must be 10 MB or smaller."
            : "Each video must be 25 MB or smaller."
        );
        event.target.value = "";
        return;
      }

      if (mediaType === "IMAGE") newImages += 1;
      if (mediaType === "VIDEO") newVideos += 1;
    }

    if (
      selectedMedia.length + files.length > MAX_MEDIA ||
      currentImages + newImages > MAX_IMAGES ||
      currentVideos + newVideos > MAX_VIDEOS
    ) {
      setError("Select up to 8 photos and 2 videos (10 media items total).");
      event.target.value = "";
      return;
    }

    setSelectedMedia((current) => [
      ...current,
      ...files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);

    setError("");
    event.target.value = "";
  }

  function removeSelectedMedia(index: number) {
    setSelectedMedia((current) => {
      const media = current[index];

      if (media) {
        URL.revokeObjectURL(media.previewUrl);
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function uploadPropertyMedia(propertyId: number) {
    const formData = new FormData();

    selectedMedia.forEach((media) => {
      formData.append("files", media.file);
    });

    setUploading(true);
    setUploadProgress(0);

    const result = await new Promise<{ success?: boolean; error?: string }>(
      (resolve, reject) => {
        const request = new XMLHttpRequest();

        request.open("POST", `/api/properties/${propertyId}/media`);
        request.withCredentials = true;
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        request.onerror = () => reject(new Error("Failed to upload property media."));
        request.onload = () => {
          try {
            resolve(JSON.parse(request.responseText));
          } catch {
            reject(new Error("Failed to read the media upload response."));
          }
        };
        request.send(formData);
      }
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to upload property media.");
    }

    setUploadProgress(100);
  }

  // ---------------------------------------------------------
  // HANDLE FORM SUBMISSION
  // ---------------------------------------------------------
  // Ye function form submit hone par chalega.
  // Form ka data collect karke /api/properties ko bhejega.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    // Form ke saare input values collect karna
    const form = event.currentTarget;
    const formData = new FormData(form);

    // -------------------------------------------------------
    // PROPERTY DATA
    // -------------------------------------------------------
    // Yahan form ke values ko ek object mein collect kar rahe hain.
    const data = {
      // Basic property details
      propertyType: formData.get("propertyType"),
      bhk: formData.get("bhk"),
      sector: formData.get("sector"),
      monthlyRent: formData.get("monthlyRent"),

      // Furnishing information
      furnishing: formData.get("furnishing"),
      furnishingDetails: formData.get("furnishingDetails"),

      // New property features
      areaSqFt: formData.get("areaSqFt"),
      vastu: formData.get("vastu"),

      // Availability
      availableFrom: formData.get("availableFrom"),

      // Private location information
      // Ye database mein save hogi, public page par nahi dikhayenge.
      societyName: formData.get("societyName"),
      address: formData.get("address"),

      // Private owner/contact information
      ownerName: formData.get("ownerName"),
      ownerPhone: formData.get("ownerPhone"),
      ownerEmail: formData.get("ownerEmail"),

      // Property description
      description: formData.get("description"),
    };

    try {
      let propertyId = createdPropertyId;

      if (!propertyId) {
        // -------------------------------------------------------
        // SEND DATA TO BACKEND
        // -------------------------------------------------------
        // Frontend se property data API ko bhej rahe hain.
        const response = await fetch("/api/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        // API ka response read karna
        const result = await response.json();

        // Agar API error return kare to error show karenge.
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Something went wrong");
        }

        propertyId = result.property?.id;

        if (!propertyId) {
          throw new Error("Property was created, but its ID was not returned.");
        }

        setCreatedPropertyId(propertyId);
      }

      if (selectedMedia.length > 0) {
        await uploadPropertyMedia(propertyId);

        selectedMedia.forEach((media) => URL.revokeObjectURL(media.previewUrl));
        setSelectedMedia([]);
      }

      // Property successfully save ho gayi.
      setSubmitted(true);
    } catch (err) {
      // Terminal mein detailed error debugging ke liye.
      console.error("Property submission error:", err);

      // User ko simple error message dikhayenge.
      setError(
        err instanceof Error
          ? err.message
          : "Property save nahi ho paayi. Please try again."
      );
    } finally {
      // Loading state ko wapas false karna.
      setLoading(false);
      setUploading(false);
    }
  }

  // ---------------------------------------------------------
  // SUCCESS SCREEN
  // ---------------------------------------------------------
  // Jab property successfully database mein save ho jaye,
  // ye screen show hogi.
  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50">
        {/* WEBSITE HEADER */}
        <header className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <a href="/" className="text-xl font-bold">
              Gurugram
              <span className="text-slate-500">Property</span>
            </a>
          </div>
        </header>

        {/* SUCCESS MESSAGE */}
        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">✓</div>

            <h1 className="mt-5 text-3xl font-bold">
              Property Submitted
            </h1>

            <p className="mt-4 leading-7 text-slate-500">
              Thank you. Our team will review your property details and
              contact you shortly for verification.
            </p>

            <a
              href="/"
              className="mt-8 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white"
            >
              Back to Home
            </a>
          </div>
        </section>
      </main>
    );
  }

  // ---------------------------------------------------------
  // MAIN PROPERTY LISTING FORM
  // ---------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-bold">
            Gurugram
            <span className="text-slate-500">Property</span>
          </a>

          <a
            href="/"
            className="text-sm font-semibold text-slate-600"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      {/* =====================================================
          PAGE INTRODUCTION
      ====================================================== */}
      <section className="mx-auto max-w-4xl px-6 py-12">

        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Property Listing
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            List Your Property
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-500">
            Tell us about your property. Our team will verify the details
            and help connect you with genuine tenants in Gurugram.
          </p>
        </div>

        {/* ===================================================
            FORM
        ==================================================== */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-8 shadow-sm"
        >

          {/* =================================================
              PROPERTY DETAILS
          ================================================== */}
          <h2 className="text-xl font-bold">
            Property Details
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* PROPERTY TYPE */}
            <div>
              <label className="text-sm font-semibold">
                Property Type
              </label>

              <select
                name="propertyType"
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              >
                <option value="">
                  Select property type
                </option>

                <option>Apartment</option>
                <option>Independent House</option>
                <option>Builder Floor</option>
                <option>Villa</option>
                <option>Studio</option>
              </select>
            </div>

            {/* BHK */}
            <div>
              <label className="text-sm font-semibold">
                BHK
              </label>

              <select
                name="bhk"
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              >
                <option value="">
                  Select BHK
                </option>

                <option>1 BHK</option>
                <option>2 BHK</option>
                <option>3 BHK</option>
                <option>4 BHK</option>
                <option>5+ BHK</option>
              </select>
            </div>

            {/* SECTOR */}
            <div>
              <label className="text-sm font-semibold">
                Sector
              </label>

              <input
                name="sector"
                required
                type="text"
                placeholder="e.g. Sector 67"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            {/* MONTHLY RENT */}
            <div>
              <label className="text-sm font-semibold">
                Monthly Rent
              </label>

              <input
                name="monthlyRent"
                required
                type="number"
                min="0"
                placeholder="e.g. 32000"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            {/* FURNISHING TYPE */}
            <div>
              <label className="text-sm font-semibold">
                Furnishing
              </label>

              <select
                name="furnishing"
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              >
                <option value="">
                  Select furnishing
                </option>

                <option>Fully Furnished</option>
                <option>Semi Furnished</option>
                <option>Unfurnished</option>
              </select>
            </div>

            {/* AREA */}
            <div>
              <label className="text-sm font-semibold">
                Area (sq. ft.)
              </label>

              <input
                name="areaSqFt"
                required
                type="number"
                min="1"
                placeholder="e.g. 1250"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            {/* VASTU */}
            <div>
              <label className="text-sm font-semibold">
                Vastu
              </label>

              <select
                name="vastu"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              >
                <option value="">
                  Select Vastu status
                </option>

                <option>Vastu Compliant</option>
                <option>Partially Vastu Compliant</option>
                <option>Not Vastu Compliant</option>
                <option>Not Specified</option>
              </select>
            </div>

            {/* AVAILABLE FROM */}
            <div>
              <label className="text-sm font-semibold">
                Available From
              </label>

              <input
                name="availableFrom"
                required
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>

            {/* =================================================
                FURNISHING DETAILS / ACCESSORIES
            ================================================== */}
            <div className="md:col-span-2">

              <label className="text-sm font-semibold">
                Furnishing Details / Included Items
              </label>

              <p className="mt-1 text-sm text-slate-500">
                Mention all furniture, appliances and accessories
                included with the property.
              </p>

              <textarea
                name="furnishingDetails"
                rows={4}
                placeholder="e.g. Modular kitchen, wardrobes, fans, lights, geyser, AC, refrigerator, sofa, bed, washing machine..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>
          </div>

          {/* =================================================
              PROPERTY LOCATION
          ================================================== */}
          <div className="mt-8">

            <h2 className="text-xl font-bold">
              Property Location
            </h2>

            <div className="mt-6 grid gap-5">

              {/* SOCIETY NAME */}
              <div>
                <label className="text-sm font-semibold">
                  Society / Building Name
                </label>

                <input
                  name="societyName"
                  required
                  type="text"
                  placeholder="e.g. Bestech Park View"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              {/* EXACT ADDRESS */}
              <div>
                <label className="text-sm font-semibold">
                  Full Address
                </label>

                <textarea
                  name="address"
                  required
                  rows={3}
                  placeholder="Enter exact property address"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              {/* PRIVACY NOTICE */}
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                🔒 <strong>Privacy:</strong> Exact property location
                will be kept private and will not be shown publicly
                to tenants.
              </div>
            </div>
          </div>

          {/* =================================================
              PROPERTY PHOTOS AND VIDEOS
          ================================================== */}
          <div className="mt-8">
            <h2 className="text-xl font-bold">Photos & Videos</h2>

            <p className="mt-2 text-sm text-slate-500">
              Upload up to 8 photos and 2 videos. Images must be JPG, PNG,
              or WEBP (up to 10 MB each); videos must be MP4 or MOV (up to
              25 MB each).
            </p>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              multiple
              onChange={addSelectedMedia}
              disabled={loading || uploading}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />

            {selectedMedia.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {selectedMedia.map((media, index) => (
                  <div
                    key={media.previewUrl}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    {media.file.type.startsWith("video/") ? (
                      <video
                        controls
                        src={media.previewUrl}
                        className="aspect-video w-full bg-slate-950"
                      />
                    ) : (
                      <img
                        src={media.previewUrl}
                        alt={`Selected media ${index + 1}`}
                        className="aspect-video w-full object-cover"
                      />
                    )}

                    <div className="flex items-center justify-between gap-3 p-3">
                      <p className="min-w-0 truncate text-sm text-slate-600">
                        {media.file.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeSelectedMedia(index)}
                        disabled={loading || uploading}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <p className="mt-4 text-sm font-semibold text-slate-600">
                Uploading media ({uploadProgress}%)...
              </p>
            )}
          </div>

          {/* =================================================
              OWNER / BROKER CONTACT DETAILS
          ================================================== */}
          <div className="mt-8">

            <h2 className="text-xl font-bold">
              Contact Details
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              These details are private and will only be used by our
              property team to contact you.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* OWNER NAME */}
              <div>
                <label className="text-sm font-semibold">
                  Your Name
                </label>

                <input
                  name="ownerName"
                  required
                  type="text"
                  placeholder="Full name"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              {/* OWNER PHONE */}
              <div>
                <label className="text-sm font-semibold">
                  Phone Number
                </label>

                <input
                  name="ownerPhone"
                  required
                  type="tel"
                  placeholder="10 digit mobile number"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              {/* OWNER EMAIL */}
              <div className="md:col-span-2">

                <label className="text-sm font-semibold">
                  Email
                </label>

                <input
                  name="ownerEmail"
                  type="email"
                  placeholder="your@email.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              PROPERTY DESCRIPTION
          ================================================== */}
          <div className="mt-8">

            <h2 className="text-xl font-bold">
              About the Property
            </h2>

            <textarea
              name="description"
              rows={5}
              placeholder="Tell us about the property, amenities, parking, nearby metro, etc."
              className="mt-6 w-full resize-none rounded-xl border border-slate-200 px-4 py-3"
            />
          </div>

          {/* =================================================
              ERROR MESSAGE
          ================================================== */}
          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* =================================================
              SUBMIT BUTTON
          ================================================== */}
          <div className="mt-10 border-t border-slate-100 pt-8">

            <p className="mb-5 text-sm text-slate-500">
              By submitting this form, you agree that our team may
              contact you regarding the property.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 py-4 font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading || uploading
                ? uploading
                  ? "Uploading Media..."
                  : "Submitting..."
                : createdPropertyId
                ? "Retry Media Upload"
                : "Submit Property"}
            </button>

          </div>
        </form>
      </section>
    </main>
  );
}
