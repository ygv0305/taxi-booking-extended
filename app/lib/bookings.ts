import mongoose, { Schema, model, type Model, type Types } from "mongoose";

import {
  formatDateForInput,
  formatDateTimeForDatabase,
  formatTimeForInput,
  getUpcomingWindow,
  startOfCurrentMinute,
} from "./date-time.ts";
import { connectToDatabase } from "./db.ts";
import type {
  AssignBookingOutcome,
  BookingConfirmation,
  BookingEditableFields,
  BookingRecord,
  BookingStatus,
  CancelBookingOutcome,
  CancelledBy,
  DriverRecord,
  UpdateBookingOutcome,
  ValidatedBookingInput,
} from "./types.ts";
import { validateBookingForm } from "./validation.ts";

type BookingDocument = {
  bookingNumber: number;
  reference: string;
  customerName: string;
  phone: string;
  unitNumber: string | null;
  streetNumber: string;
  streetName: string;
  pickupSuburb: string | null;
  destinationSuburb: string | null;
  pickupAt: Date;
  createdAt: Date;
  updatedAt: Date;
  assignedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: CancelledBy | null;
  driverId: string | null;
  driverName: string | null;
  driverVehicleLabel: string | null;
};

type CounterDocument = {
  _id: string;
  value: number;
};

type DriverDocument = {
  name: string;
  vehicleLabel: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type BookingListItem = {
  bookingNumber: number;
  reference: string;
  customerName: string;
  phone: string;
  unitNumber: string | null;
  streetNumber: string;
  streetName: string;
  pickupSuburb: string | null;
  destinationSuburb: string | null;
  pickupAt: Date;
  createdAt: Date;
  assignedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: CancelledBy | null;
  driverId: string | null;
  driverName: string | null;
  driverVehicleLabel: string | null;
};

type DriverListItem = {
  _id: Types.ObjectId;
  name: string;
  vehicleLabel: string | null;
  active: boolean;
};

type BookingStatusSource = Pick<
  BookingListItem,
  "pickupAt" | "assignedAt" | "cancelledAt"
>;

const defaultDrivers = [
  { name: "Ariana Singh", vehicleLabel: "Toyota Prius - CAB 12" },
  { name: "Luca Bennett", vehicleLabel: "Skoda Octavia - CAB 18" },
  { name: "Mei Chen", vehicleLabel: "Kia Niro - CAB 24" },
];

let driverRosterSeedPromise: Promise<void> | null = null;

const bookingSchema = new Schema<BookingDocument>(
  {
    bookingNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    unitNumber: {
      type: String,
      default: null,
      trim: true,
    },
    streetNumber: {
      type: String,
      required: true,
      trim: true,
    },
    streetName: {
      type: String,
      required: true,
      trim: true,
    },
    pickupSuburb: {
      type: String,
      default: null,
      trim: true,
    },
    destinationSuburb: {
      type: String,
      default: null,
      trim: true,
    },
    pickupAt: {
      type: Date,
      required: true,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
      index: true,
    },
    cancelledBy: {
      type: String,
      enum: ["customer", "admin", null],
      default: null,
    },
    driverId: {
      type: String,
      default: null,
      index: true,
    },
    driverName: {
      type: String,
      default: null,
      trim: true,
    },
    driverVehicleLabel: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    collection: "bookings_p2",
    timestamps: true,
  },
);

bookingSchema.index({ assignedAt: 1, cancelledAt: 1, pickupAt: 1 });

const counterSchema = new Schema<CounterDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    collection: "booking_counters_p2",
    versionKey: false,
  },
);

const driverSchema = new Schema<DriverDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    vehicleLabel: {
      type: String,
      default: null,
      trim: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  {
    collection: "drivers_p2",
    timestamps: true,
  },
);

const BookingModel =
  (mongoose.models.BookingP2 as Model<BookingDocument> | undefined) ||
  model<BookingDocument>("BookingP2", bookingSchema);

const CounterModel =
  (mongoose.models.BookingCounterP2 as Model<CounterDocument> | undefined) ||
  model<CounterDocument>("BookingCounterP2", counterSchema);

const DriverModel =
  (mongoose.models.DriverP2 as Model<DriverDocument> | undefined) ||
  model<DriverDocument>("DriverP2", driverSchema);

export function makeBookingReference(id: number) {
  return `BRN${String(id).padStart(5, "0")}`;
}

export function getBookingStatus(
  booking: BookingStatusSource,
  now = new Date(),
): BookingStatus {
  if (booking.cancelledAt) {
    return "cancelled";
  }

  if (booking.assignedAt && booking.pickupAt < now) {
    return "completed";
  }

  if (booking.assignedAt) {
    return "assigned";
  }

  return "pending";
}

export function canEditBooking(status: BookingStatus) {
  return status === "pending";
}

export function canAssignBooking(status: BookingStatus) {
  return status === "pending";
}

export function canCancelBooking(status: BookingStatus) {
  return status !== "completed" && status !== "cancelled";
}

export function resolveAssignBookingOutcome(
  reference: string,
  {
    didAssign,
    bookingStatus,
    driverName,
    driverFound = true,
  }: {
    didAssign: boolean;
    bookingStatus: BookingStatus | null;
    driverName?: string;
    driverFound?: boolean;
  },
): AssignBookingOutcome {
  if (didAssign) {
    return {
      status: "success",
      message: `Booking request ${reference} has been assigned${
        driverName ? ` to ${driverName}` : ""
      }.`,
    };
  }

  if (!driverFound) {
    return {
      status: "error",
      message: "Select an active driver before assigning the booking.",
    };
  }

  if (!bookingStatus) {
    return {
      status: "error",
      message: `Booking request ${reference} does not exist.`,
    };
  }

  if (bookingStatus === "assigned") {
    return {
      status: "info",
      message: `Booking request ${reference} is already assigned.`,
    };
  }

  if (bookingStatus === "completed") {
    return {
      status: "error",
      message: `Booking request ${reference} is already completed.`,
    };
  }

  if (bookingStatus === "cancelled") {
    return {
      status: "error",
      message: `Booking request ${reference} has been cancelled.`,
    };
  }

  return {
    status: "error",
    message: `Booking request ${reference} could not be updated.`,
  };
}

export function resolveCancelBookingOutcome(
  reference: string,
  {
    didCancel,
    bookingStatus,
  }: {
    didCancel: boolean;
    bookingStatus: BookingStatus | null;
  },
): CancelBookingOutcome {
  if (didCancel) {
    return {
      status: "success",
      message: `Booking request ${reference} has been cancelled.`,
    };
  }

  if (!bookingStatus) {
    return {
      status: "error",
      message: `Booking request ${reference} does not exist.`,
    };
  }

  if (bookingStatus === "cancelled") {
    return {
      status: "info",
      message: `Booking request ${reference} is already cancelled.`,
    };
  }

  if (bookingStatus === "completed") {
    return {
      status: "error",
      message: `Booking request ${reference} is already completed and cannot be cancelled.`,
    };
  }

  return {
    status: "error",
    message: `Booking request ${reference} could not be cancelled.`,
  };
}

export function resolveUpdateBookingOutcome(
  reference: string,
  {
    didUpdate,
    bookingStatus,
  }: {
    didUpdate: boolean;
    bookingStatus: BookingStatus | null;
  },
): UpdateBookingOutcome {
  if (didUpdate) {
    return {
      status: "success",
      message: `Booking request ${reference} has been updated.`,
    };
  }

  if (!bookingStatus) {
    return {
      status: "error",
      message: "We couldn't find that booking.",
    };
  }

  if (bookingStatus === "assigned") {
    return {
      status: "error",
      message: `Booking request ${reference} can no longer be updated because it is already assigned.`,
    };
  }

  if (bookingStatus === "completed") {
    return {
      status: "error",
      message: `Booking request ${reference} can no longer be updated because it is already completed.`,
    };
  }

  if (bookingStatus === "cancelled") {
    return {
      status: "error",
      message: `Booking request ${reference} can no longer be updated because it has been cancelled.`,
    };
  }

  return {
    status: "error",
    message: `Booking request ${reference} could not be updated.`,
  };
}

function mapBookingRecord(
  booking: BookingListItem,
  now = new Date(),
): BookingRecord {
  const status = getBookingStatus(booking, now);

  return {
    id: booking.bookingNumber,
    reference: booking.reference,
    customerName: booking.customerName,
    phone: booking.phone,
    unitNumber: booking.unitNumber,
    streetNumber: booking.streetNumber,
    streetName: booking.streetName,
    pickupSuburb: booking.pickupSuburb,
    destinationSuburb: booking.destinationSuburb,
    pickupAt: formatDateTimeForDatabase(booking.pickupAt),
    pickupDate: formatDateForInput(booking.pickupAt),
    pickupTime: formatTimeForInput(booking.pickupAt),
    createdAt: formatDateTimeForDatabase(booking.createdAt),
    assignedAt: booking.assignedAt
      ? formatDateTimeForDatabase(booking.assignedAt)
      : null,
    cancelledAt: booking.cancelledAt
      ? formatDateTimeForDatabase(booking.cancelledAt)
      : null,
    cancelledBy: booking.cancelledBy,
    driverId: booking.driverId,
    driverName: booking.driverName,
    driverVehicleLabel: booking.driverVehicleLabel,
    status,
  };
}

function mapDriverRecord(driver: DriverListItem): DriverRecord {
  return {
    id: String(driver._id),
    name: driver.name,
    vehicleLabel: driver.vehicleLabel,
    active: driver.active,
  };
}

async function allocateBookingNumber() {
  const counter = await CounterModel.findOneAndUpdate(
    { _id: "bookings_p2" },
    { $inc: { value: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  )
    .lean<{ _id: string; value: number }>()
    .exec();

  if (!counter) {
    throw new Error("Unable to allocate a booking reference.");
  }

  return counter.value;
}

async function ensureDriverRosterSeeded() {
  if (driverRosterSeedPromise) {
    return driverRosterSeedPromise;
  }

  // Seed the static driver roster once per server process to avoid
  // repeating the same writes on every admin page request.
  driverRosterSeedPromise = Promise.all(
    defaultDrivers.map((driver) =>
      DriverModel.updateOne(
        { name: driver.name },
        {
          $setOnInsert: {
            ...driver,
            active: true,
          },
        },
        { upsert: true },
      ).exec(),
    ),
  )
    .then(() => undefined)
    .catch((error) => {
      driverRosterSeedPromise = null;
      throw error;
    });

  return driverRosterSeedPromise;
}

function buildEditableBookingFields(
  booking: BookingListItem,
  input: BookingEditableFields,
) {
  return {
    customerName: booking.customerName,
    phone: booking.phone,
    unitNumber: input.unitNumber,
    streetNumber: input.streetNumber,
    streetName: input.streetName,
    pickupSuburb: input.pickupSuburb,
    destinationSuburb: input.destinationSuburb,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
  };
}

export async function createBooking(
  input: ValidatedBookingInput,
): Promise<BookingConfirmation> {
  await connectToDatabase();

  const bookingNumber = await allocateBookingNumber();
  const reference = makeBookingReference(bookingNumber);

  await BookingModel.create({
    bookingNumber,
    reference,
    customerName: input.customerName,
    phone: input.phone,
    unitNumber: input.unitNumber,
    streetNumber: input.streetNumber,
    streetName: input.streetName,
    pickupSuburb: input.pickupSuburb,
    destinationSuburb: input.destinationSuburb,
    pickupAt: input.pickupAt,
    assignedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    driverId: null,
    driverName: null,
    driverVehicleLabel: null,
  });

  return {
    reference,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
  };
}

export async function searchBookings(reference?: string, now = new Date()) {
  await connectToDatabase();

  if (reference) {
    const bookings = await BookingModel.find({ reference })
      .sort({ pickupAt: 1, bookingNumber: 1 })
      .lean<BookingListItem[]>()
      .exec();

    return bookings.map((booking) => mapBookingRecord(booking, now));
  }

  const { start, end } = getUpcomingWindow(now);
  const bookings = await BookingModel.find({
    assignedAt: null,
    cancelledAt: null,
    pickupAt: {
      $gte: start,
      $lte: end,
    },
  })
    .sort({ pickupAt: 1, bookingNumber: 1 })
    .lean<BookingListItem[]>()
    .exec();

  return bookings.map((booking) => mapBookingRecord(booking, now));
}

export async function findBookingByPortalAccess(
  reference: string,
  phone: string,
  now = new Date(),
) {
  await connectToDatabase();

  const booking = await BookingModel.findOne({ reference, phone })
    .lean<BookingListItem | null>()
    .exec();

  return booking ? mapBookingRecord(booking, now) : null;
}

export async function getActiveDrivers() {
  await connectToDatabase();
  await ensureDriverRosterSeeded();

  const drivers = await DriverModel.find({ active: true })
    .sort({ name: 1 })
    .lean<DriverListItem[]>()
    .exec();

  return drivers.map(mapDriverRecord);
}

export async function assignBooking(
  reference: string,
  driverId: string,
  now = new Date(),
) {
  await connectToDatabase();
  await ensureDriverRosterSeeded();

  if (!mongoose.isValidObjectId(driverId)) {
    return resolveAssignBookingOutcome(reference, {
      didAssign: false,
      bookingStatus: null,
      driverFound: false,
    });
  }

  const driver = await DriverModel.findOne({
    _id: driverId,
    active: true,
  })
    .lean<DriverListItem | null>()
    .exec();

  if (!driver) {
    return resolveAssignBookingOutcome(reference, {
      didAssign: false,
      bookingStatus: null,
      driverFound: false,
    });
  }

  const assignedBooking = await BookingModel.findOneAndUpdate(
    {
      reference,
      assignedAt: null,
      cancelledAt: null,
    },
    {
      $set: {
        assignedAt: new Date(),
        driverId: String(driver._id),
        driverName: driver.name,
        driverVehicleLabel: driver.vehicleLabel ?? null,
      },
    },
    {
      returnDocument: "after",
    },
  )
    .lean<BookingListItem | null>()
    .exec();

  if (assignedBooking) {
    return resolveAssignBookingOutcome(reference, {
      didAssign: true,
      bookingStatus: getBookingStatus(assignedBooking, now),
      driverName: driver.name,
    });
  }

  const booking = await BookingModel.findOne({ reference })
    .select({ pickupAt: 1, assignedAt: 1, cancelledAt: 1 })
    .lean<BookingStatusSource | null>()
    .exec();

  return resolveAssignBookingOutcome(reference, {
    didAssign: false,
    bookingStatus: booking ? getBookingStatus(booking, now) : null,
  });
}

export async function cancelBooking(
  reference: string,
  actor: CancelledBy,
  options?: {
    phone?: string;
    now?: Date;
  },
) {
  await connectToDatabase();

  const now = options?.now ?? new Date();
  const lookupFilter = {
    reference,
    ...(options?.phone ? { phone: options.phone } : {}),
  };

  const booking = await BookingModel.findOne(lookupFilter)
    .lean<BookingListItem | null>()
    .exec();

  if (!booking) {
    return actor === "customer"
      ? {
          status: "error" as const,
          message: "We couldn't find that booking.",
        }
      : resolveCancelBookingOutcome(reference, {
          didCancel: false,
          bookingStatus: null,
        });
  }

  const bookingStatus = getBookingStatus(booking, now);

  if (!canCancelBooking(bookingStatus)) {
    return actor === "customer"
      ? {
          status:
            bookingStatus === "cancelled"
              ? ("info" as const)
              : ("error" as const),
          message:
            bookingStatus === "cancelled"
              ? `Booking request ${reference} is already cancelled.`
              : `Booking request ${reference} is already completed and cannot be cancelled.`,
        }
      : resolveCancelBookingOutcome(reference, {
          didCancel: false,
          bookingStatus,
        });
  }

  const staleWindowStart = startOfCurrentMinute(now);
  const cancelledBooking = await BookingModel.findOneAndUpdate(
    {
      ...lookupFilter,
      cancelledAt: null,
      $or: [{ assignedAt: null }, { pickupAt: { $gte: staleWindowStart } }],
    },
    {
      $set: {
        cancelledAt: new Date(),
        cancelledBy: actor,
      },
    },
    {
      returnDocument: "after",
    },
  )
    .lean<BookingListItem | null>()
    .exec();

  if (cancelledBooking) {
    return resolveCancelBookingOutcome(reference, {
      didCancel: true,
      bookingStatus: "cancelled",
    });
  }

  const latestBooking = await BookingModel.findOne(lookupFilter)
    .lean<BookingListItem | null>()
    .exec();

  if (!latestBooking) {
    return {
      status: "error",
      message: "We couldn't find that booking.",
    };
  }

  return actor === "customer"
    ? {
        status: "error",
        message: `Booking request ${reference} can no longer be cancelled.`,
      }
    : resolveCancelBookingOutcome(reference, {
        didCancel: false,
        bookingStatus: getBookingStatus(latestBooking, now),
      });
}

export async function updateBookingForCustomer(
  reference: string,
  phone: string,
  input: BookingEditableFields,
  now = new Date(),
) {
  await connectToDatabase();

  const booking = await BookingModel.findOne({ reference, phone })
    .lean<BookingListItem | null>()
    .exec();

  if (!booking) {
    return {
      status: "error" as const,
      message: "We couldn't find that booking.",
    };
  }

  const bookingStatus = getBookingStatus(booking, now);

  if (!canEditBooking(bookingStatus)) {
    return resolveUpdateBookingOutcome(reference, {
      didUpdate: false,
      bookingStatus,
    });
  }

  const validation = validateBookingForm(
    buildEditableBookingFields(booking, input),
    now,
  );

  if (!validation.ok) {
    return {
      status: "error" as const,
      message: validation.message,
    };
  }

  const updatedBooking = await BookingModel.findOneAndUpdate(
    {
      reference,
      phone,
      assignedAt: null,
      cancelledAt: null,
    },
    {
      $set: {
        unitNumber: validation.data.unitNumber,
        streetNumber: validation.data.streetNumber,
        streetName: validation.data.streetName,
        pickupSuburb: validation.data.pickupSuburb,
        destinationSuburb: validation.data.destinationSuburb,
        pickupAt: validation.data.pickupAt,
      },
    },
    {
      returnDocument: "after",
    },
  )
    .lean<BookingListItem | null>()
    .exec();

  if (updatedBooking) {
    return resolveUpdateBookingOutcome(reference, {
      didUpdate: true,
      bookingStatus: getBookingStatus(updatedBooking, now),
    });
  }

  const latestBooking = await BookingModel.findOne({ reference, phone })
    .lean<BookingListItem | null>()
    .exec();

  return resolveUpdateBookingOutcome(reference, {
    didUpdate: false,
    bookingStatus: latestBooking ? getBookingStatus(latestBooking, now) : null,
  });
}
