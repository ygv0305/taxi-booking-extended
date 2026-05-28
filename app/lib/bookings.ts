import mongoose, { Schema, model, type Model } from "mongoose";

import { formatDateTimeForDatabase, getUpcomingWindow } from "./date-time.ts";
import { connectToDatabase } from "./db.ts";
import type {
  AssignBookingOutcome,
  BookingConfirmation,
  BookingRecord,
  ValidatedBookingInput,
} from "./types.ts";

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
};

type CounterDocument = {
  _id: string;
  value: number;
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
};

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
  },
  {
    collection: "bookings_p2",
    timestamps: true,
  },
);

bookingSchema.index({ assignedAt: 1, pickupAt: 1 });

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

const BookingModel =
  (mongoose.models.BookingP2 as Model<BookingDocument> | undefined) ||
  model<BookingDocument>("BookingP2", bookingSchema);

const CounterModel =
  (mongoose.models.BookingCounterP2 as Model<CounterDocument> | undefined) ||
  model<CounterDocument>("BookingCounterP2", counterSchema);

export function makeBookingReference(id: number) {
  return `BRN${String(id).padStart(5, "0")}`;
}

function mapBookingRecord(booking: BookingListItem): BookingRecord {
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
    createdAt: formatDateTimeForDatabase(booking.createdAt),
    assignedAt: booking.assignedAt
      ? formatDateTimeForDatabase(booking.assignedAt)
      : null,
  };
}

export function resolveAssignBookingOutcome(
  reference: string,
  exists: boolean,
  alreadyAssigned: boolean,
  didAssign: boolean,
): AssignBookingOutcome {
  if (didAssign) {
    return {
      status: "success",
      message: `Booking request ${reference} has been assigned.`,
    };
  }

  if (!exists) {
    return {
      status: "error",
      message: `Booking request ${reference} does not exist.`,
    };
  }

  if (alreadyAssigned) {
    return {
      status: "info",
      message: `Booking request ${reference} is already assigned.`,
    };
  }

  return {
    status: "error",
    message: `Booking request ${reference} could not be updated.`,
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
  });

  return {
    reference,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
  };
}

export async function searchBookings(reference?: string) {
  await connectToDatabase();

  if (reference) {
    const bookings = await BookingModel.find({ reference })
      .sort({ pickupAt: 1, bookingNumber: 1 })
      .lean<BookingListItem[]>()
      .exec();

    return bookings.map(mapBookingRecord);
  }

  const { start, end } = getUpcomingWindow(new Date());
  const bookings = await BookingModel.find({
    assignedAt: null,
    pickupAt: {
      $gte: start,
      $lte: end,
    },
  })
    .sort({ pickupAt: 1, bookingNumber: 1 })
    .lean<BookingListItem[]>()
    .exec();

  return bookings.map(mapBookingRecord);
}

export async function assignBooking(reference: string) {
  await connectToDatabase();

  const assignedBooking = await BookingModel.findOneAndUpdate(
    {
      reference,
      assignedAt: null,
    },
    {
      $set: {
        assignedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  )
    .lean<BookingListItem | null>()
    .exec();

  if (assignedBooking) {
    return resolveAssignBookingOutcome(reference, true, false, true);
  }

  const booking = await BookingModel.findOne({ reference })
    .select({ assignedAt: 1, reference: 1 })
    .lean<{ assignedAt: Date | null; reference: string } | null>()
    .exec();

  return resolveAssignBookingOutcome(
    reference,
    Boolean(booking),
    Boolean(booking?.assignedAt),
    false,
  );
}
