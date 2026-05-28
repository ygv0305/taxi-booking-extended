"use server";

import { redirect } from "next/navigation";

import { assignBooking, createBooking } from "./bookings.ts";
import type { BookingActionState, BookingFormFields } from "./types.ts";
import {
  normalizeReference,
  validateBookingForm,
  validateReference,
} from "./validation.ts";

function readBookingFormData(formData: FormData): BookingFormFields {
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

function buildAdminRedirectUrl(
  currentReference: string,
  status: string,
  message: string,
) {
  const params = new URLSearchParams();

  if (currentReference) {
    params.set("reference", currentReference);
  }

  params.set("status", status);
  params.set("message", message);

  return `/admin?${params.toString()}`;
}

export async function createBookingAction(
  _previousState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const bookingInput = readBookingFormData(formData);
  const validation = validateBookingForm(bookingInput);

  if (!validation.ok) {
    return {
      status: "error",
      message: validation.message,
      fieldErrors: validation.fieldErrors,
      confirmation: null,
    };
  }

  try {
    const confirmation = await createBooking(validation.data);

    return {
      status: "success",
      message: "Thank you for your booking.",
      fieldErrors: {},
      confirmation,
    };
  } catch (error) {
    console.error("createBookingAction failed", error);

    const message =
      error instanceof Error && error.message
        ? `Unable to save your booking right now. ${error.message}`
        : "Unable to save your booking right now. Check the database settings and try again.";

    return {
      status: "error",
      message,
      fieldErrors: {},
      confirmation: null,
    };
  }
}

export async function assignBookingAction(formData: FormData) {
  const reference = normalizeReference(String(formData.get("reference") ?? ""));
  const currentReference = normalizeReference(
    String(formData.get("currentReference") ?? ""),
  );

  if (!validateReference(reference)) {
    redirect(
      buildAdminRedirectUrl(
        currentReference,
        "error",
        "Invalid booking reference format.",
      ),
    );
  }

  let outcome;

  try {
    outcome = await assignBooking(reference);
  } catch (error) {
    console.error("assignBookingAction failed", error);

    const message =
      error instanceof Error && error.message
        ? `Unable to assign the booking right now. ${error.message}`
        : "Unable to assign the booking right now. Please try again.";

    redirect(buildAdminRedirectUrl(currentReference, "error", message));
  }

  redirect(
    buildAdminRedirectUrl(currentReference, outcome.status, outcome.message),
  );
}
