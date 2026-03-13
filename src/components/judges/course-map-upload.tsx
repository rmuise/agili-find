"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";

interface CourseMapUploadProps {
  judgeSlug: string;
  onUploaded: () => void;
}

export function CourseMapUpload({ judgeSlug, onUploaded }: CourseMapUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [className, setClassName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (caption) formData.append("caption", caption);
      if (className) formData.append("class_name", className);

      const res = await fetch(`/api/judges/${judgeSlug}/course-maps`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      toast("Course map uploaded!", "success");
      setIsOpen(false);
      setFile(null);
      setPreview(null);
      setCaption("");
      setClassName("");
      onUploaded();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <div className="bg-[var(--surface-3)] rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--cream)]">
          Upload Course Map
        </h3>
        <button
          onClick={() => {
            setIsOpen(false);
            setFile(null);
            setPreview(null);
          }}
          className="text-[var(--muted-2)] hover:text-[var(--cream)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {preview ? (
        <div className="mb-3">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 rounded border border-[var(--border)] object-contain"
          />
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-[var(--border)] rounded-lg py-8 text-center text-sm text-[var(--muted-text)] hover:border-[rgba(232,255,71,0.3)] hover:text-[var(--cream)] transition-colors mb-3"
        >
          Click to select an image
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--cream)] placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--agili-accent)]"
        />
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--cream)] focus:outline-none focus:border-[var(--agili-accent)]"
        >
          <option value="">Class (optional)</option>
          <option value="Standard">Standard</option>
          <option value="JWW">Jumpers With Weaves</option>
          <option value="FAST">FAST</option>
          <option value="T2B">Time 2 Beat</option>
          <option value="Premier Standard">Premier Standard</option>
          <option value="Premier JWW">Premier JWW</option>
          <option value="Snooker">Snooker</option>
          <option value="Gamblers">Gamblers</option>
          <option value="Jumpers">Jumpers</option>
          <option value="Steeplechase">Steeplechase</option>
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="w-full px-3 py-2 text-sm font-medium rounded-md bg-[var(--agili-accent)] text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-1.5"
      >
        {uploading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading...
          </>
        ) : (
          "Upload"
        )}
      </button>
    </div>
  );
}
