import type { BookingStatus } from "@/app/lib/types";

const bookingStatusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  assigned: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-200 text-slate-600",
};

const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`
        inline-flex rounded-full px-3 py-1 text-xs font-semibold
        ${bookingStatusStyles[status]}
      `}
    >
      {bookingStatusLabels[status]}
    </span>
  );
}
