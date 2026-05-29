"use client";

import Link from "next/link";
import { useState } from "react";

import { BookingForm } from "@/app/components/booking-form";
import {
  formatDateForDisplay,
  formatTimeForDisplay,
} from "@/app/lib/date-time";
import type { BookingActionState } from "@/app/lib/types";

const initialBookingActionState: BookingActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  confirmation: null,
};

export default function HomePage() {
  const [bookingState, setBookingState] = useState<BookingActionState>(
    initialBookingActionState,
  );

  return (
    <div
      className={`
        mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8
        sm:px-6 lg:px-8
      `}
    >
      <section
        className={`
          grid gap-6 lg:grid-cols-[0.92fr_1.08fr]
        `}
      >
        <div
          className={`
            rounded-[2rem] border border-slate-200/80 bg-white/80 p-6
            shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8
          `}
        >
          {bookingState.status === "error" && bookingState.message ? (
            <div
              className={`
                mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50
                px-5 py-4 text-sm text-rose-700
              `}
            >
              {bookingState.message}
            </div>
          ) : null}

          {bookingState.status === "success" && bookingState.confirmation ? (
            <div
              className={`
                rounded-[1.75rem] border border-emerald-200
                bg-emerald-50/90 p-6 shadow-inner shadow-emerald-100
              `}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Booking confirmed
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-emerald-950">
                {bookingState.message}
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Reference
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {bookingState.confirmation.reference}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Pickup date
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatDateForDisplay(bookingState.confirmation.pickupDate)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Pickup time
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatTimeForDisplay(bookingState.confirmation.pickupTime)}
                  </p>
                </div>
              </div>
              <div className="mt-5 border-t border-emerald-200/80 pt-5">
                <p className="text-sm leading-6 text-emerald-800">
                  Need to check the booking later? Use the customer portal with
                  your booking reference and phone number.
                </p>
                <Link
                  href={`/portal?reference=${bookingState.confirmation.reference}`}
                  className={`
                    mt-4 inline-flex min-h-11 items-center justify-center
                    rounded-full bg-emerald-600 px-5 text-sm font-semibold
                    text-white transition hover:bg-emerald-500
                  `}
                >
                  Open customer portal
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Booking Details
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Arrange a pickup
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Enter your contact and the pickup details in the booking form.
                The booking confirmation will be displayed below on successful
                application.
              </p>
            </>
          )}
        </div>

        <BookingForm onStateChange={setBookingState} />
      </section>
    </div>
  );
}
