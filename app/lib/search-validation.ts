import {
  normalizePhone,
  normalizeReference,
  validatePhone,
  validateReference,
} from "./validation.ts";

export type PortalLookupFields = {
  reference: string;
  phone: string;
};

export type PortalLookupFieldErrors = Partial<
  Record<keyof PortalLookupFields, string>
>;

export type AdminSearchFields = {
  reference: string;
};

export type AdminSearchFieldErrors = Partial<
  Record<keyof AdminSearchFields, string>
>;

export function validatePortalLookupInput(input: PortalLookupFields) {
  const normalizedReference = normalizeReference(input.reference);
  const normalizedPhone = normalizePhone(input.phone);
  const fieldErrors: PortalLookupFieldErrors = {};

  if (normalizedReference === "") {
    fieldErrors.reference = "Booking reference is required.";
  } else if (!validateReference(normalizedReference)) {
    fieldErrors.reference = "Use a value like BRN00001.";
  }

  if (normalizedPhone === "") {
    fieldErrors.phone = "Phone number is required.";
  } else if (!validatePhone(normalizedPhone)) {
    fieldErrors.phone = "Phone must contain 10 to 12 digits.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false as const,
      fieldErrors,
    };
  }

  return {
    ok: true as const,
    data: {
      reference: normalizedReference,
      phone: normalizedPhone,
    },
  };
}

export function validateAdminSearchInput(input: AdminSearchFields) {
  const normalizedReference = normalizeReference(input.reference);

  if (normalizedReference === "") {
    return {
      ok: true as const,
      data: {
        reference: "",
      },
    };
  }

  if (!validateReference(normalizedReference)) {
    return {
      ok: false as const,
      fieldErrors: {
        reference: "Invalid booking reference format. Use a value like BRN00001.",
      },
    };
  }

  return {
    ok: true as const,
    data: {
      reference: normalizedReference,
    },
  };
}
