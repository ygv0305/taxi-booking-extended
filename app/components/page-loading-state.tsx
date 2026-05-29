import { LoadingSpinner } from "./loading-spinner";

export function PageLoadingState() {
  return (
    <div
      className={`
        mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8
        sm:px-6 lg:px-8
      `}
      aria-live="polite"
      aria-busy="true"
    >
      <section
        className={`
          grid gap-6 rounded-[2rem] border border-slate-200/70 bg-white/85
          p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur
          lg:grid-cols-[1fr_0.9fr]
        `}
      >
        <div>
          <div className="flex items-center gap-3 text-slate-900">
            <LoadingSpinner className="h-5 w-5 text-sky-500" />
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Loading
            </p>
          </div>
          <div className="mt-4 h-10 w-64 animate-pulse rounded-2xl bg-slate-200/80" />
          <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-full bg-slate-200/70" />
          <div className="mt-3 h-5 w-4/5 animate-pulse rounded-full bg-slate-200/60" />
        </div>

        <div
          className={`
            rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5
          `}
        >
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200/70" />
          <div className="mt-4 h-12 animate-pulse rounded-2xl bg-white" />
          <div className="mt-4 h-4 w-48 animate-pulse rounded-full bg-slate-200/70" />
          <div className="mt-6 h-12 w-40 animate-pulse rounded-full bg-slate-900/85" />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.75rem] bg-white/75 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="h-6 w-52 animate-pulse rounded-full bg-slate-200/70" />
          <div className="mt-5 space-y-3">
            <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-100" />
            <div className="h-24 animate-pulse rounded-[1.5rem] bg-slate-100" />
          </div>
        </div>
        <div className="rounded-[1.75rem] bg-white/75 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200/70" />
          <div className="mt-5 space-y-3">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </section>
    </div>
  );
}
