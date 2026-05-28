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

export type ActionFeedback = {
  status: "success" | "info" | "error";
  message: string;
};

export type BookingActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: BookingFieldErrors;
  confirmation: BookingConfirmation | null;
};

export type BookingStatus = "pending" | "assigned" | "completed" | "cancelled";

export type CancelledBy = "customer" | "admin";

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

export type BookingEditableFields = Pick<
  BookingFormFields,
  | "unitNumber"
  | "streetNumber"
  | "streetName"
  | "pickupSuburb"
  | "destinationSuburb"
  | "pickupDate"
  | "pickupTime"
>;

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
  pickupDate: string;
  pickupTime: string;
  createdAt: string;
  assignedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: CancelledBy | null;
  driverId: string | null;
  driverName: string | null;
  driverVehicleLabel: string | null;
  status: BookingStatus;
};

export type DriverRecord = {
  id: string;
  name: string;
  vehicleLabel: string | null;
  active: boolean;
};

export type AssignBookingOutcome = ActionFeedback;
export type CancelBookingOutcome = ActionFeedback;
export type UpdateBookingOutcome = ActionFeedback;
