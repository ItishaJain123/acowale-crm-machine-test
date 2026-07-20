// "Loop" wordmark — a circular loop glyph + name. Distinct brand identity.
export default function Logo({
  variant = "dark",
  compact = false,
}: {
  variant?: "dark" | "light";
  compact?: boolean;
}) {
  const text = variant === "light" ? "text-white" : "text-stone-900";
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-600/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M12 4a8 8 0 1 1-5.66 2.34"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="6.3" cy="6.3" r="2.1" fill="white" />
        </svg>
      </span>
      {!compact && (
        <span className={`text-lg font-extrabold tracking-tight ${text}`}>
          Loop
        </span>
      )}
    </div>
  );
}
