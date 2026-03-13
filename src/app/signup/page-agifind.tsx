'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Mode = 'signup' | 'login' | 'forgot';

const FEATURES = [
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1l1.5 3h3.2l-2.6 2 1 3-3.1-1.9L3.4 9l1-3L1.8 4H5z" stroke="#e8ff47" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
    text: 'Save trials and track registration deadlines',
  },
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1.5A4.5 4.5 0 0111 6c0 1.75.5 3 .9 4H1.1C1.5 9 2 7.75 2 6a4.5 4.5 0 014.5-4.5z" stroke="#e8ff47" strokeWidth="1.2" />
        <path d="M5.5 10a1 1 0 002 0" stroke="#e8ff47" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    text: 'Get alerted when new trials match your area',
  },
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1" y="2" width="11" height="10" rx="1.5" stroke="#e8ff47" strokeWidth="1.2" />
        <path d="M1 5.5h11" stroke="#e8ff47" strokeWidth="1.2" />
        <path d="M4.5 1v2M8.5 1v2" stroke="#e8ff47" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    text: 'Plan your full season across all 6 orgs',
  },
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="#e8ff47" strokeWidth="1.2" />
        <path d="M4 6.5l2 2 3.5-3.5" stroke="#e8ff47" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    text: 'Free forever — no credit card required',
  },
];

export default function AuthPage() {
  const searchParams = useSearchParams();
  const defaultMode = searchParams?.get('mode') === 'login' ? 'login' : 'signup';
  const [mode, setMode] = useState<Mode>(defaultMode);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to Supabase Auth
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--black)]">
      {/* Minimal nav */}
      <nav className="flex items-center px-6 h-14 border-b border-[var(--border)] bg-[rgba(9,9,9,0.92)] backdrop-blur-xl sticky top-0 z-50">
        <Link href="/" className="font-display text-[1.45rem] tracking-[0.05em] text-cream no-underline">
          Agi<span className="text-[var(--accent)]">Find</span>
        </Link>
      </nav>

      <div className="flex-1 grid md:grid-cols-2">

        {/* ── LEFT — value prop ── */}
        <div className="hidden md:flex flex-col justify-center px-16 py-12 border-r border-[var(--border)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(232,255,71,0.04)] to-transparent pointer-events-none" />

          <div className="flex items-center gap-3 text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[var(--accent)] mb-5">
            <span className="w-6 h-px bg-[var(--accent)] block" />
            Free account
          </div>

          <h1 className="font-display text-[clamp(3rem,4.5vw,5rem)] leading-[0.92] tracking-[0.02em] text-cream mb-6">
            Your trials.<br />
            <span className="text-[var(--accent)]">Your season.</span><br />
            One place.
          </h1>

          <p className="text-[0.92rem] font-light text-[var(--muted)] leading-[1.75] max-w-[380px] mb-10">
            Save trials, set alerts, build your calendar, and get notified when registration opens — across all six major organizations.
          </p>

          <div className="flex flex-col gap-4">
            {FEATURES.map(({ icon, text }, i) => (
              <div key={i} className="flex items-center gap-4 text-[0.85rem] text-[var(--muted)]">
                <div className="w-7 h-7 rounded-[8px] bg-[rgba(232,255,71,0.07)] border border-[rgba(232,255,71,0.18)] flex items-center justify-center shrink-0">
                  {icon}
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT — form ── */}
        <div className="flex items-center justify-center px-6 py-10 bg-[var(--surface-2)] md:bg-transparent">
          <div className="w-full max-w-[400px] bg-[var(--black)] md:bg-transparent border border-[var(--border-2)] md:border-0 rounded-[20px] p-8 md:p-0">

            {mode !== 'forgot' && (
              <div className="flex bg-[var(--surface-2)] border border-[var(--border)] rounded-[10px] overflow-hidden mb-7">
                <button
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-[0.625rem] text-[0.82rem] font-medium border-none cursor-pointer transition-all ${mode === 'signup' ? 'bg-[var(--accent)] text-black' : 'bg-transparent text-[var(--muted)] hover:text-cream'}`}
                >
                  Create account
                </button>
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-[0.625rem] text-[0.82rem] font-medium border-none cursor-pointer transition-all ${mode === 'login' ? 'bg-[var(--accent)] text-black' : 'bg-transparent text-[var(--muted)] hover:text-cream'}`}
                >
                  Sign in
                </button>
              </div>
            )}

            {/* ── SIGN UP ── */}
            {mode === 'signup' && (
              <>
                <h2 className="font-display text-[1.8rem] tracking-[0.04em] text-cream mb-1">Get started free</h2>
                <p className="text-[0.82rem] text-[var(--muted)] font-light mb-6">No credit card. Cancel anytime.</p>

                <GoogleButton />
                <Divider />

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="First name" type="text" placeholder="Rob" value={form.firstName} onChange={(v) => update('firstName', v)} />
                    <FormField label="Last name" type="text" placeholder="Moffitt" value={form.lastName} onChange={(v) => update('lastName', v)} />
                  </div>
                  <FormField label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={(v) => update('email', v)} />
                  <FormField label="Password" type="password" placeholder="8+ characters" value={form.password} onChange={(v) => update('password', v)} />
                  <SubmitButton loading={loading} label="Create free account →" />
                </form>

                <p className="text-[0.7rem] text-[rgba(245,242,237,0.2)] text-center mt-4 leading-[1.6]">
                  By signing up you agree to our{' '}
                  <Link href="/terms" className="text-[var(--muted)] no-underline hover:text-[var(--accent)]">Terms</Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-[var(--muted)] no-underline hover:text-[var(--accent)]">Privacy Policy</Link>.
                </p>
              </>
            )}

            {/* ── SIGN IN ── */}
            {mode === 'login' && (
              <>
                <h2 className="font-display text-[1.8rem] tracking-[0.04em] text-cream mb-1">Welcome back</h2>
                <p className="text-[0.82rem] text-[var(--muted)] font-light mb-6">Sign in to your AgiFind account.</p>

                <GoogleButton />
                <Divider />

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FormField label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={(v) => update('email', v)} />
                  <div>
                    <FormField label="Password" type="password" placeholder="Your password" value={form.password} onChange={(v) => update('password', v)} />
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[0.75rem] text-[var(--muted)] bg-transparent border-none cursor-pointer hover:text-[var(--accent)] transition-colors p-0"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <SubmitButton loading={loading} label="Sign in →" />
                </form>
              </>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {mode === 'forgot' && (
              <>
                <button
                  onClick={() => setMode('login')}
                  className="flex items-center gap-2 text-[0.78rem] text-[var(--muted)] bg-transparent border-none cursor-pointer hover:text-cream transition-colors mb-6 p-0"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Back to sign in
                </button>
                <h2 className="font-display text-[1.8rem] tracking-[0.04em] text-cream mb-1">Reset password</h2>
                <p className="text-[0.82rem] text-[var(--muted)] font-light mb-6">
                  Enter your email and we'll send you a reset link.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FormField label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={(v) => update('email', v)} />
                  <SubmitButton loading={loading} label="Send reset link →" />
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function GoogleButton() {
  return (
    <button
      type="button"
      className="
        w-full flex items-center justify-center gap-[0.625rem]
        bg-[var(--surface-2)] hover:bg-[var(--surface-3)] active:scale-[0.98]
        border border-[var(--border-2)] rounded-[10px]
        text-cream text-[0.88rem] font-medium
        py-[0.875rem] cursor-pointer transition-all
      "
      style={{ minHeight: 48 }}
    >
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
        <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
      </svg>
      Continue with Google
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5 text-[var(--muted)] text-[0.75rem]">
      <span className="flex-1 h-px bg-[var(--border)]" />
      or
      <span className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function FormField({
  label, type, placeholder, value, onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[0.68rem] font-medium tracking-[0.1em] uppercase text-[var(--muted)] mb-[0.45rem]">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[10px] text-cream font-sans text-[1rem] px-4 py-[0.875rem] outline-none focus:border-[rgba(232,255,71,0.45)] transition-colors placeholder:text-[var(--muted-2)]"
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'given-name'}
      />
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="
        w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed
        text-black font-sans text-[0.92rem] font-medium
        py-[0.9rem] rounded-[10px] border-none cursor-pointer
        transition-all duration-150
      "
      style={{ minHeight: 48 }}
    >
      {loading ? 'Loading…' : label}
    </button>
  );
}
