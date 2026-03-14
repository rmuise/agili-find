'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    section: 'My Account',
    links: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        ),
      },
      {
        href: '/dashboard/saved',
        label: 'Saved Trials',
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L1.7 5.2l4-.6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        ),
        count: 5,
      },
      {
        href: '/dashboard/calendar',
        label: 'My Calendar',
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1" y="2" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 5.5h13" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 1v2M10 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ),
        count: 3,
      },
    ],
  },
  {
    section: 'Alerts',
    links: [
      {
        href: '/alerts',
        label: 'Notifications',
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5A5 5 0 0112.5 6.5c0 2 .5 3.5 1 4.5H1.5c.5-1 1-2.5 1-4.5a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ),
        count: 3,
        countVariant: 'danger' as const,
      },
      {
        href: '/alerts/searches',
        label: 'Saved Searches',
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Account',
    links: [
      {
        href: '/dashboard/profile',
        label: 'Profile',
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1.5 13.5c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-r border-[var(--border)] px-4 py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto hidden md:flex flex-col gap-1">
      {NAV_ITEMS.map(({ section, links }) => (
        <div key={section}>
          <div className="text-[0.6rem] font-medium tracking-[0.16em] uppercase text-[var(--muted)] px-3 py-2 mt-3 first:mt-0">
            {section}
          </div>
          {links.map((link) => {
            const { href, label, icon, count } = link;
            const countVariant = 'countVariant' in link ? link.countVariant : undefined;
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
                    : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-cream'
                  }
                `}
              >
                <span className={`shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`}>
                  {icon}
                </span>
                {label}
                {count !== undefined && (
                  <span
                    className={`
                      ml-auto text-[0.68rem] px-2 py-[0.1rem] rounded-full
                      ${countVariant === 'danger'
                        ? 'bg-[rgba(240,149,149,0.15)] text-[#f09595]'
                        : active
                          ? 'bg-[rgba(232,255,71,0.15)] text-[var(--accent)]'
                          : 'bg-[var(--surface-3)] text-[var(--muted)]'
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
        <button className="flex items-center gap-3 text-[0.82rem] text-[var(--muted)] px-3 py-[0.625rem] rounded-[10px] w-full hover:bg-[var(--surface-2)] hover:text-cream transition-all cursor-pointer bg-transparent border-none">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M6 1H2a1 1 0 00-1 1v11a1 1 0 001 1h4M10 11l3-3.5-3-3.5M13 7.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
