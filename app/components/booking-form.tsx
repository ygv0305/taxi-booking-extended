"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { createBookingAction } from "@/app/lib/actions";
import {
  formatDateForDisplay,
  formatDateForInput,
  formatTimeForDisplay,
  formatTimeForInput,
} from "@/app/lib/date-time";
import type {
  BookingActionState,
  BookingFieldErrors,
  BookingFormFields,
} from "@/app/lib/types";
import { validateBookingForm } from "@/app/lib/validation";

import { SubmitButton } from "./submit-button";

const initialBookingActionState: BookingActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  confirmation: null,
};

function readFormFields(formData: FormData): BookingFormFields {
  return {
    customerName: String(formData.get("customerName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    unitNumber: String(formData.get("unitNumber") ?? ""),
    streetNumber: String(formData.get("streetNumber") ?? ""),
    streetName: String(formData.get("streetName") ?? ""),
    pickupSuburb: String(formData.get("pickupSuburb") ?? ""),
    destinationSuburb: String(formData.get("destinationSuburb") ?? ""),
    pickupDate: String(formData.get("pickupDate") ?? ""),
    pickupTime: String(formData.get("pickupTime") ?? ""),
  };
}

export function BookingForm() {
  const [state, formAction] = useActionState(
    createBookingAction,
    initialBookingActionState,
  );
  const [clientErrors, setClientErrors] = useState<BookingFieldErrors>({});
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const now = new Date();

    if (dateInputRef.current && dateInputRef.current.value === "") {
      dateInputRef.current.value = formatDateForInput(now);
    }

    if (timeInputRef.current && timeInputRef.current.value === "") {
      timeInputRef.current.value = formatTimeForInput(now);
    }
  }, []);

  const errors =
    Object.keys(clientErrors).length > 0 ? clientErrors : state.fieldErrors;

  const clearError = (field: keyof BookingFormFields) => {
    setClientErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const validation = validateBookingForm(readFormFields(formData));

    if (!validation.ok) {
      event.preventDefault();
      setClientErrors(validation.fieldErrors);
      return;
    }

    setClientErrors({});
  };

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">
              Customer name
            </span>
            <input
              name="customerName"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("customerName")}
            />
            {errors.customerName ? (
              <p className="text-sm text-rose-600">{errors.customerName}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">Phone</span>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("phone")}
            />
            {errors.phone ? (
              <p className="text-sm text-rose-600">{errors.phone}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">
              Unit number
            </span>
            <input
              name="unitNumber"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("unitNumber")}
            />
            {errors.unitNumber ? (
              <p className="text-sm text-rose-600">{errors.unitNumber}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">
              Street number
            </span>
            <input
              name="streetNumber"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("streetNumber")}
            />
            {errors.streetNumber ? (
              <p className="text-sm text-rose-600">{errors.streetNumber}</p>
            ) : null}
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-900">
              Street name
            </span>
            <input
              name="streetName"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("streetName")}
            />
            {errors.streetName ? (
              <p className="text-sm text-rose-600">{errors.streetName}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">
              Pickup suburb
            </span>
            <input
              name="pickupSuburb"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("pickupSuburb")}
            />
            {errors.pickupSuburb ? (
              <p className="text-sm text-rose-600">{errors.pickupSuburb}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">
              Destination suburb
            </span>
            <input
              name="destinationSuburb"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("destinationSuburb")}
            />
            {errors.destinationSuburb ? (
              <p className="text-sm text-rose-600">
                {errors.destinationSuburb}
              </p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">
              Pickup date
            </span>
            <input
              ref={dateInputRef}
              name="pickupDate"
              type="date"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("pickupDate")}
            />
            {errors.pickupDate ? (
              <p className="text-sm text-rose-600">{errors.pickupDate}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">
              Pickup time
            </span>
            <input
              ref={timeInputRef}
              name="pickupTime"
              type="time"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              onChange={() => clearError("pickupTime")}
            />
            {errors.pickupTime ? (
              <p className="text-sm text-rose-600">{errors.pickupTime}</p>
            ) : null}
          </label>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Pickups cannot be scheduled in the past, and phone numbers must be
            10 to 12 digits long.
          </p>
          <SubmitButton />
        </div>
      </form>

      {state.status === "error" && state.message ? (
        <div className="mt-5 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {state.message}
        </div>
      ) : null}

      {state.status === "success" && state.confirmation ? (
        <div className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/90 p-6 shadow-inner shadow-emerald-100">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Booking confirmed
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-emerald-950">
            {state.message}
          </h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Reference
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {state.confirmation.reference}
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Pickup date
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {formatDateForDisplay(state.confirmation.pickupDate)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Pickup time
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {formatTimeForDisplay(state.confirmation.pickupTime)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
