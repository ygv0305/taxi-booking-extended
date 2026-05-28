import Form from "next/form";

import { AssignButton } from "@/app/components/assign-button";
import { BookingStatusBadge } from "@/app/components/booking-status-badge";
import { CancelButton } from "@/app/components/cancel-button";
import { StatusBanner } from "@/app/components/status-banner";
import {
  assignBookingAction,
  cancelAdminBookingAction,
} from "@/app/lib/actions";
import {
  canAssignBooking,
  canCancelBooking,
  getActiveDrivers,
  searchBookings,
} from "@/app/lib/bookings";
import { formatDatabaseDateTimeForDisplay } from "@/app/lib/date-time";
import type { BookingRecord, DriverRecord } from "@/app/lib/types";
import { normalizeReference, validateReference } from "@/app/lib/validation";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    reference?: string | string[];
    status?: string | string[];
    message?: string | string[];
  }>;
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function renderDriverLabel(booking: BookingRecord) {
  if (!booking.driverName) {
    return "Not assigned";
  }

  return booking.driverVehicleLabel
    ? `${booking.driverName} (${booking.driverVehicleLabel})`
    : booking.driverName;
}

function DriverAssignmentForm({
  booking,
  currentReference,
  drivers,
}: {
  booking: BookingRecord;
  currentReference: string;
  drivers: DriverRecord[];
}) {
  const isAssignable = canAssignBooking(booking.status);

  if (!isAssignable) {
    return (
      <p className="text-xs font-medium text-slate-500">
        {booking.status === "assigned"
          ? "Already assigned"
          : booking.status === "completed"
            ? "Completed"
            : "Cancelled"}
      </p>
    );
  }

  return (
    <form
      action={assignBookingAction}
      className={`
        flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end
      `}
    >
      <input type="hidden" name="reference" value={booking.reference} />
      <input type="hidden" name="currentReference" value={currentReference} />
      <select
        name="driverId"
        defaultValue=""
        className={`
          min-w-52 rounded-2xl border border-slate-200 bg-white px-4 py-2.5
          text-sm text-slate-900 outline-none transition
          focus:border-sky-400 focus:ring-4 focus:ring-sky-100
        `}
      >
        <option value="" disabled>
          Select driver
        </option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.vehicleLabel
              ? `${driver.name} (${driver.vehicleLabel})`
              : driver.name}
          </option>
        ))}
      </select>
      <AssignButton
        disabled={drivers.length === 0}
        idleLabel="Assign driver"
        pendingLabel="Assigning..."
        disabledLabel="No drivers"
      />
    </form>
  );
}

function CancelBookingForm({
  booking,
  currentReference,
}: {
  booking: BookingRecord;
  currentReference: string;
}) {
  if (!canCancelBooking(booking.status)) {
    return null;
  }

  return (
    <form action={cancelAdminBookingAction}>
      <input type="hidden" name="reference" value={booking.reference} />
      <input type="hidden" name="currentReference" value={currentReference} />
      <CancelButton idleLabel="Cancel" pendingLabel="Cancelling..." />
    </form>
  );
}

function BookingResults({
  bookings,
  currentReference,
  drivers,
}: {
  bookings: BookingRecord[];
  currentReference: string;
  drivers: DriverRecord[];
}) {
  return (
    <>
      <div
        className={`
          hidden overflow-hidden rounded-[1.75rem] border
          border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]
          xl:block
        `}
      >
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead
            className={`
              bg-slate-50/80 text-left text-xs font-semibold uppercase
              tracking-[0.22em] text-slate-500
            `}
          >
            <tr>
              <th className="px-5 py-4">Reference</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Phone</th>
              <th className="px-5 py-4">Pickup</th>
              <th className="px-5 py-4">Destination</th>
              <th className="px-5 py-4">Pickup At</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Driver</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {bookings.map((booking) => (
              <tr key={booking.reference} className="align-top">
                <td className="px-5 py-4 font-semibold text-slate-950">
                  {booking.reference}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-900">
                    {booking.customerName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {booking.streetNumber} {booking.streetName}
                    {booking.unitNumber ? `, Unit ${booking.unitNumber}` : ""}
                  </p>
                </td>
                <td className="px-5 py-4 text-slate-700">{booking.phone}</td>
                <td className="px-5 py-4 text-slate-700">
                  {booking.pickupSuburb ?? "Not provided"}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {booking.destinationSuburb ?? "Not provided"}
                </td>
                <td className="px-5 py-4 font-medium text-slate-900">
                  {formatDatabaseDateTimeForDisplay(booking.pickupAt)}
                </td>
                <td className="px-5 py-4">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {renderDriverLabel(booking)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-end gap-3">
                    <DriverAssignmentForm
                      booking={booking}
                      currentReference={currentReference}
                      drivers={drivers}
                    />
                    <CancelBookingForm
                      booking={booking}
                      currentReference={currentReference}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 xl:hidden">
        {bookings.map((booking) => (
          <article
            key={booking.reference}
            className={`
              rounded-[1.5rem] border border-slate-200/80 bg-white p-5
              shadow-[0_18px_48px_rgba(15,23,42,0.08)]
            `}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Reference
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {booking.reference}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Customer:</span>{" "}
                {booking.customerName}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Phone:</span>{" "}
                {booking.phone}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Address:</span>{" "}
                {booking.streetNumber} {booking.streetName}
                {booking.unitNumber ? `, Unit ${booking.unitNumber}` : ""}
              </p>
              <p>
                <span className="font-semibold text-slate-900">
                  Pickup suburb:
                </span>{" "}
                {booking.pickupSuburb ?? "Not provided"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">
                  Destination:
                </span>{" "}
                {booking.destinationSuburb ?? "Not provided"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Pickup at:</span>{" "}
                {formatDatabaseDateTimeForDisplay(booking.pickupAt)}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Driver:</span>{" "}
                {renderDriverLabel(booking)}
              </p>
              {booking.cancelledAt ? (
                <p>
                  <span className="font-semibold text-slate-900">
                    Cancelled:
                  </span>{" "}
                  {formatDatabaseDateTimeForDisplay(booking.cancelledAt)}
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <DriverAssignmentForm
                booking={booking}
                currentReference={currentReference}
                drivers={drivers}
              />
              <CancelBookingForm
                booking={booking}
                currentReference={currentReference}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawReference = pickFirst(resolvedSearchParams.reference) ?? "";
  const normalizedReference = normalizeReference(rawReference);
  const bannerStatus = pickFirst(resolvedSearchParams.status);
  const bannerMessage = pickFirst(resolvedSearchParams.message);

  let bookings: BookingRecord[] = [];
  let drivers: DriverRecord[] = [];
  let pageError = "";

  if (normalizedReference !== "" && !validateReference(normalizedReference)) {
    pageError = "Invalid booking reference format. Use a value like BRN00001.";
  } else {
    try {
      [bookings, drivers] = await Promise.all([
        searchBookings(normalizedReference || undefined),
        getActiveDrivers(),
      ]);
    } catch {
      pageError =
        "Unable to load bookings right now. Check the database settings and try again.";
    }
  }

  const hasSearch = normalizedReference !== "";

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
          lg:grid-cols-[1.1fr_0.9fr]
        `}
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Admin Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Manage bookings
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Search a booking by reference, or leave the field blank to load all
            active unassigned bookings due within the next two hours.
          </p>
        </div>

        <Form
          action="/admin"
          className={`
            rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5
          `}
        >
          <label
            htmlFor="reference"
            className="text-sm font-semibold text-slate-900"
          >
            Booking reference
          </label>
          <input
            id="reference"
            name="reference"
            defaultValue={normalizedReference}
            placeholder="BRN00001"
            autoComplete="off"
            className={`
              mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4
              py-3 text-base text-slate-900 outline-none transition
              focus:border-sky-400 focus:ring-4 focus:ring-sky-100
            `}
          />
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Leave empty to show the upcoming active queue.
          </p>
          <button
            type="submit"
            className={`
              mt-5 inline-flex min-h-12 items-center justify-center
              rounded-full bg-slate-950 px-5 text-sm font-semibold text-white
              transition hover:bg-slate-800
            `}
          >
            Search bookings
          </button>
        </Form>
      </section>

      {bannerStatus && bannerMessage ? (
        <StatusBanner status={bannerStatus} message={bannerMessage} />
      ) : null}

      {pageError ? <StatusBanner status="error" message={pageError} /> : null}

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {hasSearch ? "Search result" : "Upcoming active bookings"}
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              {hasSearch
                ? `Showing bookings matching ${normalizedReference}.`
                : "Bookings are ordered by pickup time and ready for dispatch."}
            </p>
          </div>
          {!pageError ? (
            <p className="text-sm font-medium text-slate-500">
              {bookings.length} booking{bookings.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {!pageError && bookings.length === 0 ? (
          <div
            className={`
              rounded-[1.75rem] border border-dashed border-slate-300
              bg-white/70 p-8 text-center
              shadow-[0_18px_48px_rgba(15,23,42,0.06)]
            `}
          >
            <p className="text-lg font-semibold text-slate-900">
              No bookings found.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasSearch
                ? "Try another booking reference or clear the search to view the default queue."
                : "There are no active unassigned bookings scheduled within the next two hours."}
            </p>
          </div>
        ) : null}

        {!pageError && bookings.length > 0 ? (
          <BookingResults
            bookings={bookings}
            currentReference={normalizedReference}
            drivers={drivers}
          />
        ) : null}
      </section>
    </div>
  );
}
