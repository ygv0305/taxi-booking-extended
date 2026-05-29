import { BookingStatusBadge } from "@/app/components/booking-status-badge";
import { CancelButton } from "@/app/components/cancel-button";
import { PortalLookupForm } from "@/app/components/portal-lookup-form";
import { ResponseScrollController } from "@/app/components/response-scroll-controller";
import { SaveButton } from "@/app/components/save-button";
import { StatusBanner } from "@/app/components/status-banner";
import {
  cancelPortalBookingAction,
  updatePortalBookingAction,
} from "@/app/lib/actions";
import {
  canCancelBooking,
  canEditBooking,
  findBookingByPortalAccess,
} from "@/app/lib/bookings";
import { formatDatabaseDateTimeForDisplay } from "@/app/lib/date-time";
import type { BookingRecord } from "@/app/lib/types";
import {
  normalizePhone,
  normalizeReference,
  validatePhone,
  validateReference,
} from "@/app/lib/validation";

export const dynamic = "force-dynamic";

type PortalPageProps = {
  searchParams: Promise<{
    reference?: string | string[];
    phone?: string | string[];
    status?: string | string[];
    message?: string | string[];
  }>;
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const feedbackAnchorId = "portal-feedback-anchor";

export default async function PortalPage({ searchParams }: PortalPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawReference = pickFirst(resolvedSearchParams.reference) ?? "";
  const rawPhone = pickFirst(resolvedSearchParams.phone) ?? "";
  const normalizedReference = normalizeReference(rawReference);
  const normalizedPhone = normalizePhone(rawPhone);
  const bannerStatus = pickFirst(resolvedSearchParams.status);
  const bannerMessage = pickFirst(resolvedSearchParams.message);

  const hasLookupAttempt = normalizedReference !== "" && normalizedPhone !== "";

  let booking: BookingRecord | null = null;
  let pageError = "";

  if (hasLookupAttempt) {
    if (
      !validateReference(normalizedReference) ||
      !validatePhone(normalizedPhone)
    ) {
      pageError = "We couldn't find that booking.";
    } else {
      try {
        booking = await findBookingByPortalAccess(
          normalizedReference,
          normalizedPhone,
        );

        if (!booking) {
          pageError = "We couldn't find that booking.";
        }
      } catch {
        pageError =
          "Unable to load your booking right now. Please try again in a moment.";
      }
    }
  }

  return (
    <div
      className={`
        mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8
        sm:px-6 lg:px-8
      `}
    >
      <section
        className={`
          grid gap-6 rounded-[2rem] border border-slate-200/70 bg-white/85
          p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur
          lg:grid-cols-[1.05fr_0.95fr]
        `}
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Customer Portal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Look up or manage a booking
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Enter your booking reference and phone number to check the current
            status, update pickup details before assignment, or cancel the
            booking if it is still active.
          </p>
        </div>

        <PortalLookupForm
          initialReference={normalizedReference}
          initialPhone={normalizedPhone}
        />
      </section>

      <ResponseScrollController targetId={feedbackAnchorId} />
      <div id={feedbackAnchorId} aria-hidden="true" />

      {bannerStatus && bannerMessage ? (
        <StatusBanner status={bannerStatus} message={bannerMessage} />
      ) : null}

      {pageError ? <StatusBanner status="error" message={pageError} /> : null}

      {booking ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div
            className={`
              rounded-[2rem] border border-slate-200/80 bg-white/90 p-6
              shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8
            `}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Booking found
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {booking.reference}
                </h2>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Customer
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {booking.customerName}
                </p>
                <p className="mt-1 text-sm text-slate-600">{booking.phone}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Pickup time
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatDatabaseDateTimeForDisplay(booking.pickupAt)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Pickup address
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {booking.streetNumber} {booking.streetName}
                  {booking.unitNumber ? `, Unit ${booking.unitNumber}` : ""}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {booking.pickupSuburb ?? "Suburb not provided"}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Destination
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {booking.destinationSuburb ?? "Not provided"}
                </p>
                {booking.driverName ? (
                  <p className="mt-3 text-sm text-slate-600">
                    Assigned driver:{" "}
                    <span className="font-semibold text-slate-900">
                      {booking.driverName}
                    </span>
                    {booking.driverVehicleLabel
                      ? ` (${booking.driverVehicleLabel})`
                      : ""}
                  </p>
                ) : null}
                {booking.cancelledAt ? (
                  <p className="mt-3 text-sm text-slate-600">
                    Cancelled{" "}
                    {booking.cancelledBy ? `by ${booking.cancelledBy}` : ""} on{" "}
                    {formatDatabaseDateTimeForDisplay(booking.cancelledAt)}.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {canEditBooking(booking.status) ? (
              <form
                action={updatePortalBookingAction}
                className={`
                  rounded-[2rem] border border-slate-200/80 bg-white/90 p-6
                  shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur
                  sm:p-8
                `}
              >
                <input
                  type="hidden"
                  name="reference"
                  value={booking.reference}
                />
                <input type="hidden" name="phone" value={booking.phone} />

                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Edit Booking
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Update pickup details
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  You can update the pickup address, destination, date, and time
                  until the booking is assigned.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Unit number
                    </span>
                    <input
                      name="unitNumber"
                      defaultValue={booking.unitNumber ?? ""}
                      className={`
                        w-full rounded-2xl border border-slate-200
                        bg-slate-50 px-4 py-3 text-base text-slate-950
                        outline-none transition focus:border-sky-400
                        focus:bg-white focus:ring-4 focus:ring-sky-100
                      `}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Street number
                    </span>
                    <input
                      name="streetNumber"
                      defaultValue={booking.streetNumber}
                      required
                      className={`
                        w-full rounded-2xl border border-slate-200
                        bg-slate-50 px-4 py-3 text-base text-slate-950
                        outline-none transition focus:border-sky-400
                        focus:bg-white focus:ring-4 focus:ring-sky-100
                      `}
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Street name
                    </span>
                    <input
                      name="streetName"
                      defaultValue={booking.streetName}
                      required
                      className={`
                        w-full rounded-2xl border border-slate-200
                        bg-slate-50 px-4 py-3 text-base text-slate-950
                        outline-none transition focus:border-sky-400
                        focus:bg-white focus:ring-4 focus:ring-sky-100
                      `}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Pickup suburb
                    </span>
                    <input
                      name="pickupSuburb"
                      defaultValue={booking.pickupSuburb ?? ""}
                      className={`
                        w-full rounded-2xl border border-slate-200
                        bg-slate-50 px-4 py-3 text-base text-slate-950
                        outline-none transition focus:border-sky-400
                        focus:bg-white focus:ring-4 focus:ring-sky-100
                      `}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Destination suburb
                    </span>
                    <input
                      name="destinationSuburb"
                      defaultValue={booking.destinationSuburb ?? ""}
                      className={`
                        w-full rounded-2xl border border-slate-200
                        bg-slate-50 px-4 py-3 text-base text-slate-950
                        outline-none transition focus:border-sky-400
                        focus:bg-white focus:ring-4 focus:ring-sky-100
                      `}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Pickup date
                    </span>
                    <input
                      name="pickupDate"
                      type="date"
                      defaultValue={booking.pickupDate}
                      required
                      className={`
                        w-full rounded-2xl border border-slate-200
                        bg-slate-50 px-4 py-3 text-base text-slate-950
                        outline-none transition focus:border-sky-400
                        focus:bg-white focus:ring-4 focus:ring-sky-100
                      `}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Pickup time
                    </span>
                    <input
                      name="pickupTime"
                      type="time"
                      defaultValue={booking.pickupTime}
                      required
                      className={`
                        w-full rounded-2xl border border-slate-200
                        bg-slate-50 px-4 py-3 text-base text-slate-950
                        outline-none transition focus:border-sky-400
                        focus:bg-white focus:ring-4 focus:ring-sky-100
                      `}
                    />
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-end border-t border-slate-200 pt-5">
                  <SaveButton />
                </div>
              </form>
            ) : (
              <div
                className={`
                  rounded-[2rem] border border-slate-200/80 bg-white/90 p-6
                  shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur
                  sm:p-8
                `}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Edit Booking
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Editing unavailable
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Booking details can only be changed before the booking has
                  been assigned.
                </p>
              </div>
            )}

            {canCancelBooking(booking.status) ? (
              <form
                action={cancelPortalBookingAction}
                className={`
                  rounded-[2rem] border border-rose-200/80 bg-white/90 p-6
                  shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur
                  sm:p-8
                `}
              >
                <input
                  type="hidden"
                  name="reference"
                  value={booking.reference}
                />
                <input type="hidden" name="phone" value={booking.phone} />

                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">
                  Cancel Booking
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  No longer need this trip?
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  You can cancel this booking here while it is still active.
                </p>

                <div className="mt-6 flex items-center justify-end border-t border-rose-100 pt-5">
                  <CancelButton />
                </div>
              </form>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
