'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { SIDEBAR_NAV } from '@/lib/nav';

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-r border-[var(--border)] px-4 py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto hidden md:flex flex-col gap-1">
      {SIDEBAR_NAV.map(({ section, links }) => (
        <div key={section}>
          <div className="text-[0.6rem] font-medium tracking-[0.16em] uppercase text-[var(--muted-text)] px-3 py-2 mt-3 first:mt-0">
            {section}
          </div>
          {links.map(({ href, label, icon: Icon, count, countVariant }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 text-[0.85rem] px-3 py-[0.625rem] rounded-[10px]
                  no-underline transition-all duration-150 cursor-pointer
                  ${active
                    ? 'bg-[rgba(232,255,71,0.08)] text-[var(--accent)]'
                    : 'text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-cream'
                  }
                `}
              >
                <Icon size={15} className={`shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`} />
                {label}
                {count !== undefined && (
                  <span
                    className={`
                      ml-auto text-[0.68rem] px-2 py-[0.1rem] rounded-full
                      ${countVariant === 'danger'
                        ? 'bg-[rgba(240,149,149,0.15)] text-[#f09595]'
                        : active
                          ? 'bg-[rgba(232,255,71,0.15)] text-[var(--accent)]'
                          : 'bg-[var(--surface-3)] text-[var(--muted-text)]'
                      }
                    `}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Sign out */}
      <div className="mt-auto pt-4 border-t border-[var(--border)]">
        <button className="flex items-center gap-3 text-[0.82rem] text-[var(--muted-text)] px-3 py-[0.625rem] rounded-[10px] w-full hover:bg-[var(--surface-2)] hover:text-cream transition-all cursor-pointer bg-transparent border-none">
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
