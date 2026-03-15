'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { OrgChip } from '@/components/ui/OrgChip';
import { useAuth } from '@/lib/supabase/auth-context';
import { useSavedTrials } from '@/lib/hooks/saved-trials-context';
import { formatDateRange } from '@/lib/utils';
import { STATUS_LABELS } from '@/lib/constants';
import type { TrialResult } from '@/types/search';

interface SavedTrialResult extends TrialResult {
  saved_status?: string;
  saved_at?: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { savedMap, toggleSave } = useSavedTrials();
  const router = useRouter();
  const [savedTrials, setSavedTrials] = useState<SavedTrialResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch saved trials with full data
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetch('/api/saved-trials/full')
      .then((res) => res.json())
      .then((data) => {
        setSavedTrials(data.savedTrials || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user, savedMap.size]); // refetch when saves change

  if (authLoading || !user) return null;

  const upcoming = savedTrials
    .filter((t) => new Date(t.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5);

  const closingSoon = savedTrials.filter((t) => {
    if (!t.entry_close_date) return false;
    const daysLeft = (new Date(t.entry_close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 14;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || '';

  return (
    <>
      <Navbar />
      <div className="grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-56px)] items-start">
        <DashboardSidebar />

        <main className="px-5 md:px-8 py-8 min-w-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-[2rem] tracking-[0.04em] text-cream mb-1">
              {greeting}{displayName ? `, ${displayName}` : ''}
            </h1>
            <p className="text-[0.85rem] text-[var(--muted-text)] font-light">
              Here's what's happening with your trials.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Saved Trials', value: savedTrials.length, sub: `${closingSoon.length} closing soon` },
              { label: 'Upcoming', value: upcoming.length, sub: upcoming[0] ? `Next: ${new Date(upcoming[0].start_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}` : 'None scheduled' },
              { label: 'Closing Soon', value: closingSoon.length, sub: closingSoon.length > 0 ? 'Check entry deadlines' : 'All clear' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[14px] px-5 py-4">
                <div className="text-[0.62rem] font-medium tracking-[0.12em] uppercase text-[var(--muted-text)] mb-[0.4rem]">
                  {label}
                </div>
                <div className="font-display text-[2rem] leading-none tracking-[0.04em] text-cream mb-[0.25rem]">
                  {value}
                </div>
                <div className="text-[0.72rem] text-[var(--muted-text)]">{sub}</div>
              </div>
            ))}
          </div>

          {/* Saved trials list */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 font-display text-[1.1rem] tracking-[0.06em] text-cream flex-1">
                Saved Trials
                <span className="flex-1 h-px bg-[var(--border)]" />
              </div>
              <Link href="/schedule" className="text-[0.75rem] text-[var(--muted-text)] no-underline hover:text-[var(--accent)] transition-colors ml-3 shrink-0">
                View schedule →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[14px] h-[88px] animate-pulse" />
                ))}
              </div>
            ) : savedTrials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-[var(--border-2)] rounded-[14px] gap-3">
                <div className="text-[0.88rem] font-medium text-cream">No saved trials</div>
                <div className="text-[0.78rem] text-[var(--muted-text)] max-w-[200px] leading-[1.6]">
                  Browse trials and save ones you're interested in.
                </div>
                <Link href="/" className="text-[0.78rem] bg-[var(--accent)] text-black font-medium px-4 py-[0.45rem] rounded-[8px] no-underline hover:bg-[var(--accent-dark)] transition-colors mt-1">
                  Browse trials
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-[0.625rem]">
                {savedTrials.slice(0, 8).map((trial) => {
                  const status = trial.saved_status || 'interested';
                  const statusInfo = STATUS_LABELS[status];
                  return (
                    <div
                      key={trial.id}
                      className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[14px] px-5 py-4 grid grid-cols-[1fr_auto] gap-3 transition-all duration-150 hover:border-[var(--border-2)]"
                    >
                      <div className="min-w-0">
                        <Link href={`/trials/${trial.id}`} className="text-[0.92rem] font-medium text-cream no-underline hover:text-[var(--accent)] transition-colors block mb-[0.25rem] truncate">
                          {trial.title || trial.hosting_club || 'Untitled Trial'}
                        </Link>
                        <div className="flex items-center gap-2 text-[0.75rem] text-[var(--muted-text)] flex-wrap">
                          <span>{formatDateRange(trial.start_date, trial.end_date)}</span>
                          <span className="w-[2.5px] h-[2.5px] rounded-full bg-[var(--muted-2)] inline-block" />
                          <span>{trial.city}{trial.state ? `, ${trial.state}` : ''}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <OrgChip orgId={trial.organization_id} />
                        {statusInfo && (
                          <span className={`text-[0.68rem] font-medium px-[0.6rem] py-[0.25rem] rounded-full whitespace-nowrap border ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        )}
                        <button
                          onClick={() => toggleSave(trial.id)}
                          className="text-[0.68rem] text-[var(--muted-text)] bg-transparent border-none cursor-pointer hover:text-[#f09595] transition-colors p-0"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coming up */}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-3 font-display text-[1.1rem] tracking-[0.06em] text-cream flex-1 mb-4">
                Coming Up
                <span className="flex-1 h-px bg-[var(--border)]" />
              </div>
              <div className="divide-y divide-[var(--border)]">
                {upcoming.slice(0, 3).map((trial, i) => {
                  const d = new Date(trial.start_date);
                  return (
                    <div key={trial.id} className={`flex items-center gap-4 py-3 ${i === 0 ? 'pt-0' : ''}`}>
                      <div className="text-center min-w-[48px] shrink-0">
                        <div className="font-display text-[0.65rem] tracking-[0.1em] text-[var(--accent)]">
                          {d.toLocaleDateString('en-CA', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="font-display text-[1.2rem] leading-none tracking-[0.04em] text-cream">
                          {d.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/trials/${trial.id}`} className="text-[0.85rem] font-medium text-cream no-underline hover:text-[var(--accent)] transition-colors block truncate mb-[0.15rem]">
                          {trial.title || trial.hosting_club || 'Untitled Trial'}
                        </Link>
                        <div className="text-[0.72rem] text-[var(--muted-text)]">
                          {trial.city}{trial.state ? `, ${trial.state}` : ''}
                        </div>
                      </div>
                      <OrgChip orgId={trial.organization_id} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
