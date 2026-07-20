import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  auth,
  ApiError,
  CATEGORIES,
  CATEGORY_LABELS,
  type Analytics,
  type Category,
  type FeedbackList,
} from "../lib/api";
import CategoryChart, { CATEGORY_COLORS } from "../components/CategoryChart";
import TrendChart from "../components/TrendChart";
import Logo from "../components/Logo";

export default function Dashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [list, setList] = useState<FeedbackList | null>(null);
  const [category, setCategory] = useState<Category | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleAuthError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/admin/login");
        return true;
      }
      return false;
    },
    [navigate]
  );

  useEffect(() => {
    api
      .analytics()
      .then(setAnalytics)
      .catch((err) => {
        if (!handleAuthError(err)) setError("Failed to load analytics.");
      });
  }, [handleAuthError]);

  useEffect(() => {
    setLoadingList(true);
    api
      .listFeedback({ category, search: debouncedSearch, page, pageSize: 8 })
      .then((data) => {
        setList(data);
        setError(null);
      })
      .catch((err) => {
        if (!handleAuthError(err)) setError("Failed to load feedback.");
      })
      .finally(() => setLoadingList(false));
  }, [category, debouncedSearch, page, handleAuthError]);

  function logout() {
    auth.clear();
    navigate("/admin/login");
  }

  const last7 = analytics?.trend.reduce((s, t) => s + t.count, 0) ?? 0;

  return (
    <div className="min-h-screen bg-stone-100 lg:grid lg:grid-cols-[248px_1fr]">
      {/* ---------- Sidebar ---------- */}
      <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-ink-900 bg-dotgrid p-5 lg:flex">
        <div>
          <div className="px-2 py-2">
            <Logo variant="light" />
          </div>
          <nav className="mt-8 space-y-1">
            <NavItem icon="📊" label="Overview" active />
            <NavItem icon="💬" label="All Feedback" />
            <NavItem icon="📈" label="Insights" />
            <NavItem icon="⚙️" label="Settings" />
          </nav>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-ink-950">
              A
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Admin</p>
              <p className="truncate text-xs text-white/40">admin@acowale.com</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-white/10 py-2 text-xs font-semibold text-white/70 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="flex flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3 lg:hidden">
          <Logo variant="dark" />
          <button
            onClick={logout}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-600"
          >
            Sign out
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl px-5 py-8 lg:px-10">
          <div className="animate-fade-up mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
                Feedback Overview
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                A live pulse of what your customers are telling you.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              Live
            </span>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Stat cards */}
          <div className="animate-fade-up mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon="💬"
              label="Total Feedback"
              value={analytics ? String(analytics.total) : "—"}
              tint="from-brand-500 to-brand-700"
            />
            <StatCard
              icon="⭐"
              label="Average Rating"
              value={
                analytics?.averageRating
                  ? `${analytics.averageRating.toFixed(1)}`
                  : "—"
              }
              suffix={analytics?.averageRating ? "/ 5" : ""}
              tint="from-amber-400 to-amber-600"
            />
            <StatCard
              icon="🏷️"
              label="Categories Used"
              value={
                analytics ? String(analytics.categoryDistribution.length) : "—"
              }
              tint="from-violet-500 to-violet-700"
            />
            <StatCard
              icon="📈"
              label="Last 7 Days"
              value={analytics ? String(last7) : "—"}
              tint="from-emerald-500 to-emerald-700"
            />
          </div>

          {/* Charts */}
          <div className="animate-fade-up-delay-1 mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card title="Category Distribution" className="lg:col-span-2">
              {analytics ? (
                <CategoryChart
                  data={analytics.categoryDistribution}
                  total={analytics.total}
                />
              ) : (
                <ChartSkeleton />
              )}
            </Card>
            <Card
              title="Feedback Trend"
              subtitle="Submissions · last 7 days"
              className="lg:col-span-3"
            >
              {analytics ? <TrendChart data={analytics.trend} /> : <ChartSkeleton />}
            </Card>
          </div>

          {/* Table */}
          <div className="animate-fade-up-delay-2">
            <Card
              title="All Feedback"
              subtitle={
                list ? `${list.total} result${list.total === 1 ? "" : "s"}` : undefined
              }
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      🔍
                    </span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search comments or email…"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 sm:w-64"
                    />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value as Category | "");
                      setPage(1);
                    }}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                  >
                    <option value="">All categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
              }
            >
              {!list || loadingList ? (
                <TableSkeleton />
              ) : list.items.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mb-2 text-4xl">🕊️</div>
                  <p className="font-bold text-stone-600">No feedback found</p>
                  <p className="mt-1 text-sm text-stone-400">
                    Try a different search term or category.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                          <th className="pb-3 pr-4 font-bold">Feedback</th>
                          <th className="pb-3 pr-4 font-bold">Category</th>
                          <th className="pb-3 pr-4 font-bold">Rating</th>
                          <th className="pb-3 pr-4 font-bold">From</th>
                          <th className="pb-3 font-bold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.items.map((f) => (
                          <tr
                            key={f.id}
                            className="border-b border-stone-50 transition hover:bg-stone-50/70"
                          >
                            <td className="max-w-md py-3.5 pr-4">
                              <p className="truncate text-stone-800" title={f.comment}>
                                {f.comment}
                              </p>
                            </td>
                            <td className="py-3.5 pr-4">
                              <CategoryBadge category={f.category} />
                            </td>
                            <td className="whitespace-nowrap py-3.5 pr-4 text-stone-600">
                              {f.rating ? `⭐ ${f.rating}` : "—"}
                            </td>
                            <td className="py-3.5 pr-4 text-stone-500">
                              {f.email ?? (
                                <span className="italic text-stone-400">
                                  Anonymous
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap py-3.5 text-stone-500">
                              {new Date(f.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {list.totalPages > 1 && (
                    <div className="mt-5 flex items-center justify-between">
                      <p className="text-xs text-stone-400">
                        Page {list.page} of {list.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <PageBtn
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          ← Prev
                        </PageBtn>
                        <PageBtn
                          disabled={page >= list.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next →
                        </PageBtn>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- presentational bits ---------- */

function NavItem({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-brand-500/15 text-white"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      <span>{icon}</span>
      {label}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  tint,
}: {
  icon: string;
  label: string;
  value: string;
  suffix?: string;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-lg shadow-sm`}
      >
        {icon}
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-stone-900">
        {value}
        {suffix && (
          <span className="ml-1 text-sm font-semibold text-stone-400">
            {suffix}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-sm text-stone-500">{label}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-extrabold text-stone-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-stone-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function PageBtn({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ChartSkeleton() {
  return <div className="h-56 animate-pulse rounded-xl bg-stone-100" />;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-lg bg-stone-100" />
      ))}
    </div>
  );
}
