import Link from "next/link";

import { BookingForm } from "@/app/components/booking-form";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Next.js Rewrite
          </div>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Book a city pickup without the old-school friction.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            This rewrite keeps the original taxi booking rules intact while
            giving the experience a cleaner, faster, mobile-friendly flow.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Same booking rules
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Required fields, phone validation, and no past pickup times.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Modern client flow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Native date and time controls with inline feedback and a clear
                confirmation state.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Admin queue
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search by booking reference or review upcoming unassigned jobs.
              </p>
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-between gap-4 rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-200">
              Dispatch Snapshot
            </p>
            <p className="mt-5 text-2xl font-semibold leading-tight">
              Customer bookings land instantly and the admin team can assign
              them from one clean queue.
            </p>
          </div>
          <div className="space-y-3 text-sm leading-6 text-slate-300">
            <p>
              Leave the admin search blank to show all unassigned bookings due
              within the next two hours.
            </p>
            <p>
              Need the dispatcher view now? Open the{" "}
              <Link
                href="/admin"
                className="font-semibold text-sky-300 underline decoration-sky-500/40 underline-offset-4 transition hover:text-sky-200"
              >
                admin dashboard
              </Link>
              .
            </p>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Booking Details
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Arrange a pickup
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Enter the customer and pickup details below. The booking reference
            is generated after the request is saved to MySQL.
          </p>
        </div>

        <BookingForm />
      </section>
    </div>
  );
}
