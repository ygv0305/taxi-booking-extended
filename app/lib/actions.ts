"use server";

import { redirect } from "next/navigation";

import {
  assignBooking,
  cancelBooking,
  createBooking,
  updateBookingForCustomer,
} from "./bookings.ts";
import type {
  BookingActionState,
  BookingEditableFields,
  BookingFormFields,
} from "./types.ts";
import {
  normalizePhone,
  normalizeReference,
  validateBookingForm,
  validatePhone,
  validateReference,
} from "./validation.ts";
import { AUTO_SCROLL_PARAM, AUTO_SCROLL_RESPONSE_VALUE } from "./auto-scroll.ts";

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

function readEditableBookingFormData(
  formData: FormData,
): BookingEditableFields {
  return {
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
  params.set(AUTO_SCROLL_PARAM, AUTO_SCROLL_RESPONSE_VALUE);

  return `/admin?${params.toString()}`;
}

function buildPortalRedirectUrl(
  reference: string,
  phone: string,
  status?: string,
  message?: string,
) {
  const params = new URLSearchParams();

  if (reference) {
    params.set("reference", reference);
  }

  if (phone) {
    params.set("phone", phone);
  }

  if (status) {
    params.set("status", status);
  }

  if (message) {
    params.set("message", message);
  }

  params.set(AUTO_SCROLL_PARAM, AUTO_SCROLL_RESPONSE_VALUE);

  const search = params.toString();
  return search ? `/portal?${search}` : "/portal";
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
  const driverId = String(formData.get("driverId") ?? "").trim();

  if (!validateReference(reference)) {
    redirect(
      buildAdminRedirectUrl(
        currentReference,
        "error",
        "Invalid booking reference format.",
      ),
    );
  }

  if (driverId === "") {
    redirect(
      buildAdminRedirectUrl(
        currentReference,
        "error",
        "Select an active driver before assigning the booking.",
      ),
    );
  }

  let outcome;

  try {
    outcome = await assignBooking(reference, driverId);
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

export async function cancelAdminBookingAction(formData: FormData) {
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
    outcome = await cancelBooking(reference, "admin");
  } catch (error) {
    console.error("cancelAdminBookingAction failed", error);

    const message =
      error instanceof Error && error.message
        ? `Unable to cancel the booking right now. ${error.message}`
        : "Unable to cancel the booking right now. Please try again.";

    redirect(buildAdminRedirectUrl(currentReference, "error", message));
  }

  redirect(
    buildAdminRedirectUrl(currentReference, outcome.status, outcome.message),
  );
}

export async function updatePortalBookingAction(formData: FormData) {
  const reference = normalizeReference(String(formData.get("reference") ?? ""));
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const editableFields = readEditableBookingFormData(formData);

  if (!validateReference(reference) || !validatePhone(phone)) {
    redirect(
      buildPortalRedirectUrl(
        reference,
        phone,
        "error",
        "We couldn't find that booking.",
      ),
    );
  }

  let outcome;

  try {
    outcome = await updateBookingForCustomer(reference, phone, editableFields);
  } catch (error) {
    console.error("updatePortalBookingAction failed", error);

    const message =
      error instanceof Error && error.message
        ? `Unable to update your booking right now. ${error.message}`
        : "Unable to update your booking right now. Please try again.";

    redirect(buildPortalRedirectUrl(reference, phone, "error", message));
  }

  redirect(
    buildPortalRedirectUrl(reference, phone, outcome.status, outcome.message),
  );
}

export async function cancelPortalBookingAction(formData: FormData) {
  const reference = normalizeReference(String(formData.get("reference") ?? ""));
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!validateReference(reference) || !validatePhone(phone)) {
    redirect(
      buildPortalRedirectUrl(
        reference,
        phone,
        "error",
        "We couldn't find that booking.",
      ),
    );
  }

  let outcome;

  try {
    outcome = await cancelBooking(reference, "customer", { phone });
  } catch (error) {
    console.error("cancelPortalBookingAction failed", error);

    const message =
      error instanceof Error && error.message
        ? `Unable to cancel your booking right now. ${error.message}`
        : "Unable to cancel your booking right now. Please try again.";

    redirect(buildPortalRedirectUrl(reference, phone, "error", message));
  }

  redirect(
    buildPortalRedirectUrl(reference, phone, outcome.status, outcome.message),
  );
}
