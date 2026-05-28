import test from "node:test";
import assert from "node:assert/strict";

import {
  formatDatabaseDateTimeForDisplay,
  getUpcomingWindow,
  parseLocalDateAndTime,
  startOfCurrentMinute,
} from "./date-time.ts";
import {
  makeBookingReference,
  resolveAssignBookingOutcome,
} from "./bookings.ts";
import { validateBookingForm, validateReference } from "./validation.ts";

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

test("resolveAssignBookingOutcome distinguishes success, assigned, and missing states", () => {
  assert.deepEqual(resolveAssignBookingOutcome("BRN00001", true, false, true), {
    status: "success",
    message: "Booking request BRN00001 has been assigned.",
  });

  assert.deepEqual(resolveAssignBookingOutcome("BRN00001", true, true, false), {
    status: "info",
    message: "Booking request BRN00001 is already assigned.",
  });

  assert.deepEqual(
    resolveAssignBookingOutcome("BRN00001", false, false, false),
    {
      status: "error",
      message: "Booking request BRN00001 does not exist.",
    },
  );
});

test("formatDatabaseDateTimeForDisplay formats MySQL datetime strings", () => {
  assert.equal(
    formatDatabaseDateTimeForDisplay("2026-05-28 09:30:00"),
    "28/05/2026 09:30",
  );
});
