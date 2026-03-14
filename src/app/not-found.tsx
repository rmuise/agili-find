import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[var(--surface-2)] border border-[var(--border)] rounded-[20px] flex items-center justify-center mx-auto mb-4">
          <span className="font-display text-[1.4rem] tracking-[0.05em] text-[var(--muted-text)]">404</span>
        </div>
        <h1 className="font-display text-[2rem] tracking-[0.04em] text-cream mb-2">
          Page not found
        </h1>
        <p className="text-[var(--muted-text)] text-[0.9rem] mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-[0.6rem] text-[0.85rem] font-medium text-black bg-[var(--accent)] hover:bg-[var(--accent-dark)] rounded-[10px] transition-colors active:scale-[0.96] no-underline"
        >
          Back to search
        </Link>
      </div>
    </div>
  );
}
