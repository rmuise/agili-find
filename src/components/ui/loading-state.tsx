interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="animate-pulse text-[var(--muted-text)]">{message}</div>
    </div>
  );
}
