import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, CATEGORIES, CATEGORY_LABELS, type Category } from "../lib/api";
import Logo from "../components/Logo";

const CATEGORY_ICONS: Record<Category, string> = {
  PRODUCT: "📦",
  BUG: "🐞",
  FEATURE_REQUEST: "✨",
  UI_UX: "🎨",
  SUPPORT: "🛟",
  BILLING: "💳",
  OTHER: "💬",
};

export default function FeedbackForm() {
  const [category, setCategory] = useState<Category | null>(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!category) return setError("Please choose what your feedback is about.");
    if (comment.trim().length < 5)
      return setError("Please write at least 5 characters of feedback.");

    setSubmitting(true);
    try {
      await api.submitFeedback({
        category,
        comment: comment.trim(),
        ...(rating > 0 && { rating }),
        ...(email.trim() && { email: email.trim() }),
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.details?.[0]?.message ?? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setDone(false);
    setCategory(null);
    setComment("");
    setRating(0);
    setEmail("");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Left brand panel ---------- */}
      <aside className="relative hidden overflow-hidden bg-ink-900 bg-dotgrid p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-700/20 blur-3xl" />

        <Logo variant="light" />

        <div className="relative animate-fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-brand-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300" />
            Customer Feedback
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            Your voice shapes
            <br />
            what we{" "}
            <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
              build next.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-white/60">
            Every note you leave goes straight to the team. Real feedback, real
            changes — that's how we close the loop.
          </p>
        </div>

        <div className="relative flex gap-8 text-sm">
          <Stat value="< 60s" label="to submit" />
          <Stat value="100%" label="read by the team" />
          <Stat value="Anon" label="if you prefer" />
        </div>
      </aside>

      {/* ---------- Right form panel ---------- */}
      <main className="flex flex-col bg-stone-50">
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          <div className="lg:hidden">
            <Logo variant="dark" />
          </div>
          <span className="hidden lg:block" />
          <Link
            to="/admin/login"
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-500 transition hover:bg-white hover:text-brand-700"
          >
            Team login →
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-10">
          {done ? (
            <SuccessCard onReset={reset} />
          ) : (
            <form
              onSubmit={handleSubmit}
              className="animate-fade-up w-full max-w-md"
            >
              <h2 className="text-2xl font-extrabold tracking-tight text-stone-900">
                Share your feedback
              </h2>
              <p className="mt-1.5 text-stone-500">
                Tell us what's working — or what isn't.
              </p>

              {/* Category */}
              <label className="mb-2 mt-7 block text-sm font-bold text-stone-700">
                What's this about? <span className="text-brand-600">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
                        active
                          ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25"
                          : "border-stone-200 bg-white text-stone-600 hover:border-brand-300 hover:text-brand-700"
                      }`}
                    >
                      <span>{CATEGORY_ICONS[c]}</span>
                      {CATEGORY_LABELS[c]}
                    </button>
                  );
                })}
              </div>

              {/* Rating */}
              <label className="mb-2 mt-7 block text-sm font-bold text-stone-700">
                Rate your experience{" "}
                <span className="font-medium text-stone-400">(optional)</span>
              </label>
              <div
                className="inline-flex gap-1.5 rounded-2xl border border-stone-200 bg-white px-3 py-2"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    onMouseEnter={() => setHoverRating(star)}
                    className="text-2xl transition-transform hover:scale-125 active:scale-95"
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    <span
                      className={
                        star <= (hoverRating || rating)
                          ? "grayscale-0"
                          : "opacity-25 grayscale"
                      }
                    >
                      ⭐
                    </span>
                  </button>
                ))}
              </div>

              {/* Comment */}
              <label className="mb-2 mt-7 block text-sm font-bold text-stone-700">
                Your feedback <span className="text-brand-600">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Share your thoughts, ideas, or issues in detail…"
                className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-800 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
              <div className="mt-1 text-right text-xs text-stone-400">
                {comment.length} / 2000
              </div>

              {/* Email */}
              <label className="mb-2 mt-4 block text-sm font-bold text-stone-700">
                Email{" "}
                <span className="font-medium text-stone-400">
                  (optional — for follow-up)
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-800 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />

              {error && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Spinner /> Sending…
                  </>
                ) : (
                  "Send feedback"
                )}
              </button>
              <p className="mt-4 text-center text-xs text-stone-400">
                🔒 Secure · your email is never shared · submit anonymously
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}

function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="animate-fade-up w-full max-w-md text-center">
      <div className="animate-float-slow mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-100 text-4xl">
        🎉
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight text-stone-900">
        Feedback received!
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-stone-500">
        Thank you for helping us improve. The team reads every single
        submission — you've just made the product a little better.
      </p>
      <button
        onClick={onReset}
        className="mt-7 inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-2.5 font-bold text-stone-700 transition hover:border-brand-300 hover:text-brand-700 active:scale-[0.98]"
      >
        Share more feedback
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
