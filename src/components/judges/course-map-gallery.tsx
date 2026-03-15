"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import type { JudgeCourseMap } from "@/types/judge";
import { OrgChip as OrgBadge } from "@/components/ui/OrgChip";

interface CourseMapGalleryProps {
  maps: JudgeCourseMap[];
}

export function CourseMapGallery({ maps }: CourseMapGalleryProps) {
  const [selected, setSelected] = useState<JudgeCourseMap | null>(null);

  if (maps.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {maps.map((map) => (
          <button
            key={map.id}
            onClick={() => setSelected(map)}
            className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-3)] hover:border-[rgba(232,255,71,0.4)] transition-colors"
          >
            <img
              src={map.image_url}
              alt={map.caption || "Course map"}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {map.class_name && (
              <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white">
                {map.class_name}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selected.image_url}
              alt={selected.caption || "Course map"}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
              {selected.trial?.organization_id && (
                <OrgBadge orgId={selected.trial.organization_id} />
              )}
              {selected.caption && <span>{selected.caption}</span>}
              {selected.class_name && (
                <span className="text-white/50">({selected.class_name})</span>
              )}
              {selected.trial && (
                <span className="text-white/50 ml-auto">
                  {selected.trial.title} &middot;{" "}
                  {new Date(selected.trial.start_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
