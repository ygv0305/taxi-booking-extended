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

test("parseLocalDateAndTime rejects impossible dates", () => {
  assert.equal(parseLocalDateAndTime("2026-02-31", "10:15"), null);
  assert.equal(parseLocalDateAndTime("2026-05-28", "24:01"), null);
});

test("validateBookingForm accepts a booking at the current minute", () => {
  const now = new Date(2026, 4, 28, 9, 30, 45);
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
  const now = new Date(2026, 4, 28, 9, 30, 45);
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
  const now = new Date(2026, 4, 28, 9, 30, 45);
  const { start, end } = getUpcomingWindow(now);

  assert.deepEqual(start, startOfCurrentMinute(now));
  assert.equal(end.getTime() - start.getTime(), 2 * 60 * 60 * 1000);
});

test("getBookingStatus returns pending for unassigned bookings", () => {
  const now = new Date(2026, 4, 28, 9, 30, 0);

  assert.equal(
    getBookingStatus(
      {
        pickupAt: new Date(2026, 4, 28, 9, 0, 0),
        assignedAt: null,
        cancelledAt: null,
      },
      now,
    ),
    "pending",
  );
});

test("getBookingStatus returns assigned for future assigned bookings", () => {
  const now = new Date(2026, 4, 28, 9, 30, 0);

  assert.equal(
    getBookingStatus(
      {
        pickupAt: new Date(2026, 4, 28, 10, 0, 0),
        assignedAt: new Date(2026, 4, 28, 9, 15, 0),
        cancelledAt: null,
      },
      now,
    ),
    "assigned",
  );
});

test("getBookingStatus returns completed for past assigned bookings", () => {
  const now = new Date(2026, 4, 28, 9, 30, 0);

  assert.equal(
    getBookingStatus(
      {
        pickupAt: new Date(2026, 4, 28, 9, 0, 0),
        assignedAt: new Date(2026, 4, 28, 8, 45, 0),
        cancelledAt: null,
      },
      now,
    ),
    "completed",
  );
});

test("getBookingStatus prioritizes cancelled over all other states", () => {
  const now = new Date(2026, 4, 28, 9, 30, 0);

  assert.equal(
    getBookingStatus(
      {
        pickupAt: new Date(2026, 4, 28, 9, 0, 0),
        assignedAt: new Date(2026, 4, 28, 8, 45, 0),
        cancelledAt: new Date(2026, 4, 28, 8, 50, 0),
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
