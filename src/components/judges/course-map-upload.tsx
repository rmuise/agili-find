"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";

interface CourseMapUploadProps {
  judgeSlug: string;
  /** Called after a successful upload so the parent can refresh if needed */
  onUploaded?: () => void;
}

/**
 * CourseMapUpload — Upload button + inline form for submitting course maps.
 *
 * All uploads are submitted with is_approved = false on the server.
 * After a successful submit, we show a "pending review" confirmation message
 * rather than immediately triggering a data refresh (the map won't be visible
 * until an admin approves it).
 *
 * Hidden from unauthenticated users.
 */
export function CourseMapUpload({ judgeSlug, onUploaded }: CourseMapUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form fields
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [courseType, setCourseType] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [caption, setCaption] = useState("");

  // Not logged in — hide entirely
  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Client-side size check before uploading (10 MB max)
    if (f.size > 10 * 1024 * 1024) {
      toast("File must be under 10 MB", "error");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubmitted(false);
    setFile(null);
    setPreview(null);
    setCourseType("");
    setSourceLabel("");
    setCaption("");
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (courseType) formData.append("course_type", courseType);
      if (sourceLabel) formData.append("source_label", sourceLabel);
      if (caption) formData.append("caption", caption);

      const res = await fetch(`/api/judges/${judgeSlug}/course-maps`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      // Show the "pending review" confirmation — do NOT call onUploaded because
      // the map is not yet visible (is_approved = false).
      setSubmitted(true);
      onUploaded?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  // --- Trigger button (collapsed state) ---
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-[var(--surface-3)] text-[var(--cream)] border border-[var(--border)] hover:border-[rgba(232,255,71,0.4)] hover:text-[var(--agili-accent)] transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload Course Map
      </button>
    );
  }

  // --- Success / pending review state ---
  if (submitted) {
    return (
      <div className="bg-[var(--surface-3)] rounded-lg border border-[rgba(93,202,165,0.3)] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#5dcaa5] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--cream)]">
              Map submitted for review
            </p>
            <p className="text-xs text-[var(--muted-text)] mt-1">
              Thank you! Your course map has been submitted and will appear on
              this profile once it&rsquo;s been reviewed and approved.
            </p>
            <button
              onClick={handleClose}
              className="mt-3 text-xs text-[var(--agili-accent)] hover:underline"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Upload form (expanded state) ---
  return (
    <div className="bg-[var(--surface-3)] rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--cream)]">
          Upload Course Map
        </h3>
        <button
          onClick={handleClose}
          className="text-[var(--muted-2)] hover:text-[var(--cream)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* File picker / preview */}
      {preview ? (
        <div className="mb-3 relative group">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 rounded border border-[var(--border)] object-contain"
          />
          <button
            onClick={() => {
              setFile(null);
              setPreview(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-[var(--border)] rounded-lg py-8 text-center text-sm text-[var(--muted-text)] hover:border-[rgba(232,255,71,0.3)] hover:text-[var(--cream)] transition-colors mb-3"
        >
          Click to select an image (max 10 MB)
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Form fields */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Course type dropdown */}
        <select
          value={courseType}
          onChange={(e) => setCourseType(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--cream)] focus:outline-none focus:border-[var(--agili-accent)] transition-colors"
        >
          <option value="">Course Type (optional)</option>
          <option value="Standard">Standard</option>
          <option value="Jumpers">Jumpers</option>
          <option value="JWW">Jumpers With Weaves</option>
          <option value="FAST">FAST</option>
          <option value="T2B">Time 2 Beat</option>
          <option value="Premier Standard">Premier Standard</option>
          <option value="Premier JWW">Premier JWW</option>
          <option value="Snooker">Snooker</option>
          <option value="Gamblers">Gamblers</option>
          <option value="Steeplechase">Steeplechase</option>
          <option value="Other">Other</option>
        </select>

        {/* Caption */}
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--cream)] placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--agili-accent)] transition-colors"
        />
      </div>

      {/* Source label — full width */}
      <input
        value={sourceLabel}
        onChange={(e) => setSourceLabel(e.target.value)}
        placeholder='Source, e.g. "AKC Regionals 2024" (optional)'
        className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--cream)] placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--agili-accent)] transition-colors mb-3"
      />

      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="w-full px-3 py-2 text-sm font-medium rounded-md bg-[var(--agili-accent)] text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-1.5"
      >
        {uploading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading…
          </>
        ) : (
          "Submit for Review"
        )}
      </button>
    </div>
  );
}
