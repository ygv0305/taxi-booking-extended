export type BookingFormFields = {
  customerName: string;
  phone: string;
  unitNumber: string;
  streetNumber: string;
  streetName: string;
  pickupSuburb: string;
  destinationSuburb: string;
  pickupDate: string;
  pickupTime: string;
};

export type BookingFieldErrors = Partial<
  Record<keyof BookingFormFields, string>
>;

export type BookingConfirmation = {
  reference: string;
  pickupDate: string;
  pickupTime: string;
};

export type BookingActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: BookingFieldErrors;
  confirmation: BookingConfirmation | null;
};

export type ValidatedBookingInput = {
  customerName: string;
  phone: string;
  unitNumber: string | null;
  streetNumber: string;
  streetName: string;
  pickupSuburb: string | null;
  destinationSuburb: string | null;
  pickupDate: string;
  pickupTime: string;
  pickupAt: Date;
};

export type BookingRecord = {
  id: number;
  reference: string;
  customerName: string;
  phone: string;
  unitNumber: string | null;
  streetNumber: string;
  streetName: string;
  pickupSuburb: string | null;
  destinationSuburb: string | null;
  pickupAt: string;
  createdAt: string;
  assignedAt: string | null;
};

export type AssignBookingOutcome = {
  status: "success" | "info" | "error";
  message: string;
};
