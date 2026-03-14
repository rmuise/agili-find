import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  backHref?: string;
  backLabel?: string;
  maxWidth?: "3xl" | "4xl" | "5xl";
}

export function PageHeader({
  backHref = "/",
  backLabel = "Search",
  maxWidth = "3xl",
}: PageHeaderProps) {
  return (
    <header className="glass border-b border-[var(--border)]">
      <div
        className={`${
          maxWidth === "5xl" ? "max-w-5xl" : maxWidth === "4xl" ? "max-w-4xl" : "max-w-3xl"
        } mx-auto px-4 py-3 sm:py-4 flex items-center justify-between`}
      >
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-[var(--accent)] rounded-[10px] flex items-center justify-center">
            <span className="font-display text-[0.85rem] tracking-[0.05em] text-black">AF</span>
          </div>
          <span className="font-display text-[1.2rem] tracking-[0.05em] text-cream">AgiliFind</span>
        </Link>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[0.82rem] text-[var(--muted-text)] hover:text-cream transition-colors no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
