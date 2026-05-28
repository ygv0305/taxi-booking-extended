"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { createBookingAction } from "@/app/lib/actions";
import { formatDateForInput, formatTimeForInput } from "@/app/lib/date-time";
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

const formCardClassName = `
  rounded-[2rem] border border-slate-200/80 bg-white/90 p-6
  shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8
`;

const inputClassName = `
  w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3
  text-base text-slate-950 outline-none transition
  focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100
`;

const formFooterClassName = `
  flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row
  sm:items-center sm:justify-between
`;

type BookingFormProps = {
  onStateChange?: (state: BookingActionState) => void;
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

export function BookingForm({ onStateChange }: BookingFormProps) {
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

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

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
    <div className={formCardClassName}>
      <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">
              Customer name
            </span>
            <input
              name="customerName"
              required
              className={inputClassName}
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
              className={inputClassName}
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
              className={inputClassName}
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
              className={inputClassName}
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
              className={inputClassName}
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
              className={inputClassName}
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
              className={inputClassName}
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
              className={inputClassName}
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
              className={inputClassName}
              onChange={() => clearError("pickupTime")}
            />
            {errors.pickupTime ? (
              <p className="text-sm text-rose-600">{errors.pickupTime}</p>
            ) : null}
          </label>
        </div>

        <div className={formFooterClassName}>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Pickups cannot be scheduled in the past, and phone numbers must be
            10 to 12 digits long.
          </p>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
