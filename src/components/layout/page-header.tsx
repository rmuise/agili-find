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
    <header className="bg-white border-b border-gray-200">
      <div
        className={`${
          maxWidth === "5xl" ? "max-w-5xl" : maxWidth === "4xl" ? "max-w-4xl" : "max-w-3xl"
        } mx-auto px-4 py-3 sm:py-4 flex items-center justify-between`}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AgiliFind</span>
        </Link>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
