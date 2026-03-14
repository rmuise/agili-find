'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

interface NavbarProps {
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;
}

export function Navbar({
  showSearch = false,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearchSubmit?.();
  };

  return (
    <>
      <nav className="glass border-b border-[var(--border)] sticky top-0 z-[200] flex items-center gap-4 px-6 h-14">
        {/* Logo */}
        <Link href="/" className="font-display text-[1.45rem] tracking-[0.05em] text-cream shrink-0 mr-2">
          Agi<span className="text-[var(--accent)]">Find</span>
        </Link>

        {/* Inline search (results/detail pages) */}
        {showSearch && (
          <div className="flex-1 max-w-[420px] flex bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[10px] overflow-hidden focus-within:border-[rgba(232,255,71,0.45)] transition-colors">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={handleKey}
              placeholder="City, state, or postal code…"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-cream text-[0.85rem] font-light px-[0.875rem] h-9 placeholder:text-[var(--muted-2)]"
              autoComplete="off"
              autoCorrect="off"
            />
            <button
              onClick={onSearchSubmit}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] active:scale-[0.96] border-none text-black font-display text-[0.85rem] tracking-[0.08em] px-[0.875rem] transition-all"
            >
              Search
            </button>
          </div>
        )}

        {/* Desktop nav links */}
        <ul className="hidden md:flex gap-7 list-none items-center ml-auto">
          {[
            { href: '/trials', label: 'Browse Trials' },
            { href: '/map', label: 'Map View' },
            { href: '/saved', label: 'Saved' },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-[0.82rem] transition-colors no-underline ${
                  pathname?.startsWith(href)
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--muted-text)] hover:text-cream'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Sign up CTA */}
        <Link
          href="/signup"
          className="hidden md:flex bg-[var(--accent)] hover:bg-[var(--accent-dark)] active:scale-[0.96] text-black text-[0.8rem] font-medium px-4 py-[0.45rem] rounded-[10px] transition-all no-underline whitespace-nowrap ml-2"
        >
          Sign Up
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-[10px] text-[var(--muted-text)] hover:text-cream hover:bg-[var(--surface-2)] transition-all ml-1"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Hamburger (mobile) */}
        <button
          className="md:hidden ml-auto flex flex-col gap-[4.5px] cursor-pointer p-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-[1.5px] bg-cream rounded-sm transition-all duration-250"
            style={{ transform: menuOpen ? 'translateY(6px) rotate(45deg)' : '' }}
          />
          <span
            className="block w-5 h-[1.5px] bg-cream rounded-sm transition-all duration-250"
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-[1.5px] bg-cream rounded-sm transition-all duration-250"
            style={{ transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : '' }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="glass fixed inset-0 top-14 z-[190] flex flex-col px-6 pt-6 pb-8 border-t border-[var(--border)] md:hidden">
          {[
            { href: '/trials', label: 'Browse Trials' },
            { href: '/map', label: 'Map View' },
            { href: '/saved', label: 'Saved' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-cream text-[1.3rem] py-4 border-b border-[var(--border)] no-underline hover:text-[var(--accent)] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/signup"
            className="mt-6 bg-[var(--accent)] text-black text-[1rem] font-medium py-[1rem] rounded-[14px] text-center no-underline"
            onClick={() => setMenuOpen(false)}
          >
            Create Free Account
          </Link>
          <button
            onClick={toggleTheme}
            className="mt-4 flex items-center gap-3 text-[var(--muted-text)] text-[0.9rem] py-3"
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>
      )}
    </>
  );
}
