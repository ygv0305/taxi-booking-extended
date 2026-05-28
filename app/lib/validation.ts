import { parseLocalDateAndTime, startOfCurrentMinute } from "./date-time.ts";
import type {
  BookingFieldErrors,
  BookingFormFields,
  ValidatedBookingInput,
} from "./types.ts";

type BookingValidationResult =
  | { ok: true; data: ValidatedBookingInput }
  | { ok: false; message: string; fieldErrors: BookingFieldErrors };

function normalizeRequiredValue(value: string) {
  return value.trim();
}

function normalizeOptionalValue(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

function firstErrorMessage(fieldErrors: BookingFieldErrors) {
  for (const fieldName of Object.keys(fieldErrors) as Array<
    keyof BookingFieldErrors
  >) {
    const fieldError = fieldErrors[fieldName];

    if (fieldError) {
      return fieldError;
    }
  }

  return "Please check the form fields and try again.";
}

export function normalizeReference(reference: string) {
  return reference.trim().toUpperCase();
}

export function normalizePhone(phone: string) {
  return phone.trim();
}

export function validateReference(reference: string) {
  return /^BRN\d{5,}$/.test(reference);
}

export function validatePhone(phone: string) {
  return /^\d{10,12}$/.test(phone);
}

export function validateBookingForm(
  input: BookingFormFields,
  now = new Date(),
): BookingValidationResult {
  const normalizedInput = {
    customerName: normalizeRequiredValue(input.customerName),
    phone: normalizeRequiredValue(input.phone),
    unitNumber: normalizeOptionalValue(input.unitNumber),
    streetNumber: normalizeRequiredValue(input.streetNumber),
    streetName: normalizeRequiredValue(input.streetName),
    pickupSuburb: normalizeOptionalValue(input.pickupSuburb),
    destinationSuburb: normalizeOptionalValue(input.destinationSuburb),
    pickupDate: normalizeRequiredValue(input.pickupDate),
    pickupTime: normalizeRequiredValue(input.pickupTime),
  };

  const fieldErrors: BookingFieldErrors = {};

  if (normalizedInput.customerName === "") {
    fieldErrors.customerName = "Customer name is required.";
  }

  if (normalizedInput.phone === "") {
    fieldErrors.phone = "Phone is required.";
  } else if (!validatePhone(normalizedInput.phone)) {
    fieldErrors.phone = "Phone must contain 10 to 12 digits.";
  }

  if (normalizedInput.streetNumber === "") {
    fieldErrors.streetNumber = "Street number is required.";
  }

  if (normalizedInput.streetName === "") {
    fieldErrors.streetName = "Street name is required.";
  }

  if (normalizedInput.pickupDate === "") {
    fieldErrors.pickupDate = "Pickup date is required.";
  }

  if (normalizedInput.pickupTime === "") {
    fieldErrors.pickupTime = "Pickup time is required.";
  }

  const pickupAt = parseLocalDateAndTime(
    normalizedInput.pickupDate,
    normalizedInput.pickupTime,
  );

  if (!pickupAt) {
    if (!fieldErrors.pickupDate) {
      fieldErrors.pickupDate = "Enter a valid pickup date.";
    }

    if (!fieldErrors.pickupTime) {
      fieldErrors.pickupTime = "Enter a valid pickup time.";
    }
  } else if (pickupAt < startOfCurrentMinute(now)) {
    fieldErrors.pickupTime = "Pickup time cannot be in the past.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: firstErrorMessage(fieldErrors),
      fieldErrors,
    };
  }

  return {
    ok: true,
    data: {
      ...normalizedInput,
      pickupAt: pickupAt as Date,
    },
  };
}
