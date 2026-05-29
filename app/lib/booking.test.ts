import assert from "node:assert/strict";
import test from "node:test";

import {
  canAssignBooking,
  canCancelBooking,
  canEditBooking,
  getBookingStatus,
  makeBookingReference,
  resolveAssignBookingOutcome,
  resolveCancelBookingOutcome,
  resolveUpdateBookingOutcome,
} from "./bookings.ts";
import {
  BUSINESS_TIME_ZONE,
  formatDateForInput,
  formatTimeForInput,
  formatDatabaseDateTimeForDisplay,
  getUpcomingWindow,
  parseLocalDateAndTime,
  startOfCurrentMinute,
} from "./date-time.ts";
import {
  normalizePhone,
  validateBookingForm,
  validatePhone,
  validateReference,
} from "./validation.ts";
import {
  validateAdminSearchInput,
  validatePortalLookupInput,
} from "./search-validation.ts";

test("makeBookingReference pads identifiers", () => {
  assert.equal(makeBookingReference(1), "BRN00001");
  assert.equal(makeBookingReference(125), "BRN00125");
  assert.equal(makeBookingReference(123456), "BRN123456");
});

test("validateReference accepts BRN values with five or more digits", () => {
  assert.equal(validateReference("BRN00001"), true);
  assert.equal(validateReference("BRN123456"), true);
  assert.equal(validateReference("brn00001"), false);
  assert.equal(validateReference("ABC00001"), false);
});

test("normalizePhone trims surrounding whitespace", () => {
  assert.equal(normalizePhone(" 0212345678 "), "0212345678");
});

test("validatePhone accepts 10 to 12 digit values", () => {
  assert.equal(validatePhone("0212345678"), true);
  assert.equal(validatePhone("123456789012"), true);
  assert.equal(validatePhone("02123"), false);
  assert.equal(validatePhone("02123ABC78"), false);
});

test("validatePortalLookupInput requires both fields", () => {
  assert.deepEqual(
    validatePortalLookupInput({
      reference: "",
      phone: "",
    }),
    {
      ok: false,
      fieldErrors: {
        reference: "Booking reference is required.",
        phone: "Phone number is required.",
      },
    },
  );
});

test("validatePortalLookupInput normalizes and validates lookup values", () => {
  assert.deepEqual(
    validatePortalLookupInput({
      reference: " brn00001 ",
      phone: " 0212345678 ",
    }),
    {
      ok: true,
      data: {
        reference: "BRN00001",
        phone: "0212345678",
      },
    },
  );

  assert.deepEqual(
    validatePortalLookupInput({
      reference: "booking-1",
      phone: "12345",
    }),
    {
      ok: false,
      fieldErrors: {
        reference: "Use a value like BRN00001.",
        phone: "Phone must contain 10 to 12 digits.",
      },
    },
  );
});

test("validateAdminSearchInput allows blank references for queue lookup", () => {
  assert.deepEqual(
    validateAdminSearchInput({
      reference: "   ",
    }),
    {
      ok: true,
      data: {
        reference: "",
      },
    },
  );
});

test("validateAdminSearchInput normalizes valid references and rejects invalid ones", () => {
  assert.deepEqual(
    validateAdminSearchInput({
      reference: " brn00025 ",
    }),
    {
      ok: true,
      data: {
        reference: "BRN00025",
      },
    },
  );

  assert.deepEqual(
    validateAdminSearchInput({
      reference: "invalid-ref",
    }),
    {
      ok: false,
      fieldErrors: {
        reference: "Invalid booking reference format. Use a value like BRN00001.",
      },
    },
  );
});

test("parseLocalDateAndTime rejects impossible dates", () => {
  assert.equal(parseLocalDateAndTime("2026-02-31", "10:15"), null);
  assert.equal(parseLocalDateAndTime("2026-05-28", "24:01"), null);
});

test("parseLocalDateAndTime resolves Auckland pickup times independently of host timezone", () => {
  const parsedDate = parseLocalDateAndTime("2026-05-28", "09:30");

  assert.ok(parsedDate);
  assert.equal(BUSINESS_TIME_ZONE, "Pacific/Auckland");
  assert.equal(parsedDate.toISOString(), "2026-05-27T21:30:00.000Z");
});

test("formatDateForInput and formatTimeForInput use the business timezone", () => {
  const pickupAt = new Date("2026-05-27T21:30:00.000Z");

  assert.equal(formatDateForInput(pickupAt), "2026-05-28");
  assert.equal(formatTimeForInput(pickupAt), "09:30");
});

test("validateBookingForm accepts a booking at the current minute", () => {
  const now = new Date("2026-05-27T21:30:45.000Z");
  const validation = validateBookingForm(
    {
      customerName: "Taylor",
      phone: "0212345678",
      unitNumber: "",
      streetNumber: "12A",
      streetName: "Queen Street",
      pickupSuburb: "CBD",
      destinationSuburb: "Ponsonby",
      pickupDate: "2026-05-28",
      pickupTime: "09:30",
    },
    now,
  );

  assert.equal(validation.ok, true);
});

test("validateBookingForm rejects past pickup times", () => {
  const now = new Date("2026-05-27T21:30:45.000Z");
  const validation = validateBookingForm(
    {
      customerName: "Taylor",
      phone: "0212345678",
      unitNumber: "",
      streetNumber: "12A",
      streetName: "Queen Street",
      pickupSuburb: "CBD",
      destinationSuburb: "Ponsonby",
      pickupDate: "2026-05-28",
      pickupTime: "09:29",
    },
    now,
  );

  assert.equal(validation.ok, false);

  if (!validation.ok) {
    assert.equal(
      validation.fieldErrors.pickupTime,
      "Pickup time cannot be in the past.",
    );
  }
});

test("getUpcomingWindow builds a two-hour range from the current minute", () => {
  const now = new Date("2026-05-27T21:30:45.000Z");
  const { start, end } = getUpcomingWindow(now);

  assert.deepEqual(start, startOfCurrentMinute(now));
  assert.equal(end.getTime() - start.getTime(), 2 * 60 * 60 * 1000);
});

test("getBookingStatus returns pending for unassigned bookings", () => {
  const now = new Date("2026-05-27T21:30:00.000Z");

  assert.equal(
    getBookingStatus(
      {
        pickupAt: new Date("2026-05-27T21:00:00.000Z"),
        assignedAt: null,
        cancelledAt: null,
      },
      now,
    ),
    "pending",
  );
});

test("getBookingStatus returns assigned for future assigned bookings", () => {
  const now = new Date("2026-05-27T21:30:00.000Z");

  assert.equal(
    getBookingStatus(
      {
        pickupAt: new Date("2026-05-27T22:00:00.000Z"),
        assignedAt: new Date("2026-05-27T21:15:00.000Z"),
        cancelledAt: null,
      },
      now,
    ),
    "assigned",
  );
});

test("getBookingStatus returns completed for past assigned bookings", () => {
  const now = new Date("2026-05-27T21:30:00.000Z");

  assert.equal(
    getBookingStatus(
      {
        pickupAt: new Date("2026-05-27T21:00:00.000Z"),
        assignedAt: new Date("2026-05-27T20:45:00.000Z"),
        cancelledAt: null,
      },
      now,
    ),
    "completed",
  );
});

test("getBookingStatus prioritizes cancelled over all other states", () => {
  const now = new Date("2026-05-27T21:30:00.000Z");

  assert.equal(
    getBookingStatus(
      {
        pickupAt: new Date("2026-05-27T21:00:00.000Z"),
        assignedAt: new Date("2026-05-27T20:45:00.000Z"),
        cancelledAt: new Date("2026-05-27T20:50:00.000Z"),
      },
      now,
    ),
    "cancelled",
  );
});

test("booking lifecycle helpers enforce pending-only edit and assign", () => {
  assert.equal(canEditBooking("pending"), true);
  assert.equal(canEditBooking("assigned"), false);
  assert.equal(canAssignBooking("pending"), true);
  assert.equal(canAssignBooking("completed"), false);
  assert.equal(canCancelBooking("assigned"), true);
  assert.equal(canCancelBooking("cancelled"), false);
});

test("resolveAssignBookingOutcome distinguishes success and blocked states", () => {
  assert.deepEqual(
    resolveAssignBookingOutcome("BRN00001", {
      didAssign: true,
      bookingStatus: "assigned",
      driverName: "Ariana Singh",
    }),
    {
      status: "success",
      message: "Booking request BRN00001 has been assigned to Ariana Singh.",
    },
  );

  assert.deepEqual(
    resolveAssignBookingOutcome("BRN00001", {
      didAssign: false,
      bookingStatus: "assigned",
    }),
    {
      status: "info",
      message: "Booking request BRN00001 is already assigned.",
    },
  );

  assert.deepEqual(
    resolveAssignBookingOutcome("BRN00001", {
      didAssign: false,
      bookingStatus: null,
      driverFound: false,
    }),
    {
      status: "error",
      message: "Select an active driver before assigning the booking.",
    },
  );
});

test("resolveCancelBookingOutcome blocks completed bookings", () => {
  assert.deepEqual(
    resolveCancelBookingOutcome("BRN00001", {
      didCancel: false,
      bookingStatus: "completed",
    }),
    {
      status: "error",
      message:
        "Booking request BRN00001 is already completed and cannot be cancelled.",
    },
  );
});

test("resolveUpdateBookingOutcome reports stale assigned bookings", () => {
  assert.deepEqual(
    resolveUpdateBookingOutcome("BRN00001", {
      didUpdate: false,
      bookingStatus: "assigned",
    }),
    {
      status: "error",
      message:
        "Booking request BRN00001 can no longer be updated because it is already assigned.",
    },
  );
});

test("formatDatabaseDateTimeForDisplay formats database datetime strings", () => {
  assert.equal(
    formatDatabaseDateTimeForDisplay("2026-05-28 09:30:00"),
    "28/05/2026 09:30",
  );
});
