"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Media = {
  id: number;
  type: string;
  secureUrl: string;
  resourceType: string;
  position: number;
  createdAt: string;
};

type Property = {
  id: number;
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: number;
  furnishing: string;
  furnishingDetails: string | null;
  availableFrom: string;
  areaSqFt: number;
  vastu: string | null;
  societyName: string;
  address: string;
  description: string | null;
  status: string;
  createdAt: string;
  media: Media[];
};

type SelectedMedia = { file: File; previewUrl: string };

type FormState = {
  propertyType: string;
  bhk: string;
  sector: string;
  monthlyRent: string;
  furnishing: string;
  furnishingDetails: string;
  availableFrom: string;
  areaSqFt: string;
  vastu: string;
  societyName: string;
  description: string;
};

const emptyForm: FormState = {
  propertyType: "",
  bhk: "",
  sector: "",
  monthlyRent: "",
  furnishing: "",
  furnishingDetails: "",
  availableFrom: "",
  areaSqFt: "",
  vastu: "",
  societyName: "",
  description: "",
};

const mediaTypes: Record<string, "IMAGE" | "VIDEO"> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "video/mp4": "VIDEO",
  "video/quicktime": "VIDEO",
};

function toFormState(property: Property): FormState {
  return {
    propertyType: property.propertyType,
    bhk: property.bhk,
    sector: property.sector,
    monthlyRent: String(property.monthlyRent),
    furnishing: property.furnishing,
    furnishingDetails: property.furnishingDetails || "",
    availableFrom: property.availableFrom,
    areaSqFt: String(property.areaSqFt),
    vastu: property.vastu || "",
    societyName: property.societyName,
    description: property.description || "",
  };
}

export default function ManagePropertyPage() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);
  const [property, setProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [loading, setLoading] = useState(Number.isInteger(propertyId) && propertyId > 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!Number.isInteger(propertyId) || propertyId <= 0) return;

    let cancelled = false;
    async function loadProperty() {
      try {
        const response = await fetch(`/api/properties/${propertyId}`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Failed to load property.");
        if (!cancelled) {
          setProperty(result.property);
          setForm(toFormState(result.property));
        }
      } catch (error) {
        if (!cancelled) setError(error instanceof Error ? error.message : "Failed to load property.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProperty();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addSelectedMedia(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length || !property) return;

    const existingImages = property.media.filter((media) => media.type === "IMAGE").length + selectedMedia.filter((media) => media.file.type.startsWith("image/")).length;
    const existingVideos = property.media.filter((media) => media.type === "VIDEO").length + selectedMedia.filter((media) => media.file.type.startsWith("video/")).length;
    let newImages = 0;
    let newVideos = 0;

    for (const file of files) {
      const type = mediaTypes[file.type];
      if (!type) {
        setError("Only JPG, JPEG, PNG, WEBP, MP4, and MOV files are allowed.");
        event.target.value = "";
        return;
      }
      const maximumSize = type === "IMAGE" ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size <= 0 || file.size > maximumSize) {
        setError(type === "IMAGE" ? "Each image must be 10 MB or smaller." : "Each video must be 25 MB or smaller.");
        event.target.value = "";
        return;
      }
      if (type === "IMAGE") newImages += 1;
      else newVideos += 1;
    }

    if (existingImages + newImages > 8 || existingVideos + newVideos > 2 || property.media.length + selectedMedia.length + files.length > 10) {
      setError("A property can have up to 8 photos and 2 videos.");
      event.target.value = "";
      return;
    }

    setSelectedMedia((current) => [...current, ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
    setError("");
    event.target.value = "";
  }

  function removeSelectedMedia(index: number) {
    setSelectedMedia((current) => {
      const item = current[index];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function uploadSelectedMedia(): Promise<Media[]> {
    if (!selectedMedia.length) return [];
    const formData = new FormData();
    selectedMedia.forEach((media) => formData.append("files", media.file));
    setUploading(true);
    setUploadProgress(0);

    const result = await new Promise<{ success?: boolean; error?: string; media?: Media[] }>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", `/api/properties/${propertyId}/media`);
      request.withCredentials = true;
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
      };
      request.onerror = () => reject(new Error("Failed to upload property media."));
      request.onload = () => {
        try { resolve(JSON.parse(request.responseText)); }
        catch { reject(new Error("Failed to read the media upload response.")); }
      };
      request.send(formData);
    });

    if (!result.success) throw new Error(result.error || "Failed to upload property media.");
    selectedMedia.forEach((media) => URL.revokeObjectURL(media.previewUrl));
    setSelectedMedia([]);
    setUploadProgress(100);
    return result.media || [];
  }

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, monthlyRent: Number(form.monthlyRent), areaSqFt: Number(form.areaSqFt) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to update property.");
      setProperty(result.property);
      setForm(toFormState(result.property));
      if (selectedMedia.length) {
        const uploadedMedia = await uploadSelectedMedia();
        setProperty((current) => current ? { ...current, media: [...current.media, ...uploadedMedia] } : current);
      }
      setMessage(result.message || "Property updated and sent for review.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update property.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function deleteMedia(media: Media) {
    setDeletingMediaId(media.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/properties/${propertyId}/media/${media.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to delete media.");
      setProperty((current) => current ? { ...current, media: current.media.filter((item) => item.id !== media.id) } : current);
      setMessage("Media deleted successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete media.");
    } finally {
      setDeletingMediaId(null);
    }
  }

  if (!Number.isInteger(propertyId) || propertyId <= 0) return <main className="app-page form-page flex min-h-screen items-center justify-center bg-slate-50"><div className="text-center"><p className="text-red-700">Invalid property ID.</p><Link href="/my-properties" className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Back to My Properties</Link></div></main>;
  if (loading) return <main className="app-page form-page flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Loading property...</main>;
  if (!property) return <main className="app-page form-page flex min-h-screen items-center justify-center bg-slate-50"><div className="text-center"><p className="text-red-700">{error || "Property not found."}</p><Link href="/my-properties" className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Back to My Properties</Link></div></main>;

  return (
    <main className="app-page form-page min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/my-properties" className="text-xl font-semibold tracking-tight">My Properties</Link>
          <Link href="/" className="text-sm font-medium text-slate-600">Home</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Property #{property.id}</p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight">Edit & Manage Property</h1>
            <p className="mt-2 text-slate-500">Changes require admin review before becoming public.</p>
          </div>
          <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">{property.status}</span>
        </div>

        {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        {message && <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}

        <form onSubmit={saveProperty} className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">Property Type<select value={form.propertyType} onChange={(event) => updateField("propertyType", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Select property type</option><option>Apartment</option><option>Independent House</option><option>Builder Floor</option><option>Villa</option><option>Studio</option></select></label>
            <label className="text-sm font-semibold">BHK<select value={form.bhk} onChange={(event) => updateField("bhk", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Select BHK</option><option>1 BHK</option><option>2 BHK</option><option>3 BHK</option><option>4 BHK</option><option>5+ BHK</option></select></label>
            <label className="text-sm font-semibold">Sector<input value={form.sector} onChange={(event) => updateField("sector", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
            <label className="text-sm font-semibold">Monthly Rent<input type="number" min="0" value={form.monthlyRent} onChange={(event) => updateField("monthlyRent", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
            <label className="text-sm font-semibold">Area (sq. ft.)<input type="number" min="0" value={form.areaSqFt} onChange={(event) => updateField("areaSqFt", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
            <label className="text-sm font-semibold">Available From<input type="date" value={form.availableFrom} onChange={(event) => updateField("availableFrom", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
            <label className="text-sm font-semibold">Furnishing<select value={form.furnishing} onChange={(event) => updateField("furnishing", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Select furnishing</option><option>Fully Furnished</option><option>Semi Furnished</option><option>Unfurnished</option></select></label>
            <label className="text-sm font-semibold">Vastu<select value={form.vastu} onChange={(event) => updateField("vastu", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Not specified</option><option>Vastu Compliant</option><option>Partially Vastu Compliant</option><option>Not Vastu Compliant</option></select></label>
            <label className="text-sm font-semibold sm:col-span-2">Society / Building Name<input value={form.societyName} onChange={(event) => updateField("societyName", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
            <label className="text-sm font-semibold sm:col-span-2">Furnishing Details<textarea rows={3} value={form.furnishingDetails} onChange={(event) => updateField("furnishingDetails", event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3" /></label>
            <label className="text-sm font-semibold sm:col-span-2">About the Property<textarea rows={4} value={form.description} onChange={(event) => updateField("description", event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3" /></label>
          </div>
          <button type="submit" disabled={saving || uploading} className="mt-7 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{uploading ? `Uploading media (${uploadProgress}%)...` : saving ? "Saving changes..." : "Save Changes"}</button>
        </form>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">Photos & Videos</h2><p className="mt-2 text-sm text-slate-500">Up to 8 photos and 2 videos. Existing server-side limits still apply.</p></div><label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Add Media<input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={addSelectedMedia} disabled={saving || uploading} className="sr-only" /></label></div>
          {selectedMedia.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2">{selectedMedia.map((media, index) => <div key={media.previewUrl} className="overflow-hidden rounded-xl border border-slate-200"><div className="aspect-video bg-slate-950">{media.file.type.startsWith("video/") ? <video controls src={media.previewUrl} className="h-full w-full" /> : <img src={media.previewUrl} alt={`Selected media ${index + 1}`} className="h-full w-full object-cover" />}</div><button type="button" onClick={() => removeSelectedMedia(index)} className="m-3 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700">Remove before upload</button></div>)}</div>}
          {property.media.length === 0 && selectedMedia.length === 0 && <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No photos or videos uploaded.</p>}
          {property.media.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{property.media.map((media) => <div key={media.id} className="overflow-hidden rounded-xl border border-slate-200"><div className="aspect-video bg-slate-950">{media.type === "VIDEO" ? <video controls src={media.secureUrl} className="h-full w-full" /> : <img src={media.secureUrl} alt={`${property.bhk} ${property.propertyType}`} className="h-full w-full object-cover" />}</div><button type="button" onClick={() => deleteMedia(media)} disabled={deletingMediaId === media.id || saving || uploading} className="m-3 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60">{deletingMediaId === media.id ? "Removing..." : "Remove media"}</button></div>)}</div>}
        </section>
      </section>
    </main>
  );
}
