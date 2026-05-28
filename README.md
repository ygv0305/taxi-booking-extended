# Taxi Booking P2

`taxi-booking-p2` is a Next.js taxi booking system with three main user flows:

- customer booking creation at `/`
- customer self-service portal at `/portal`
- admin dispatch and booking management at `/admin`

The system stores bookings in MongoDB, generates booking references in the
format `BRN00001`, supports named driver assignment, and allows customer/admin
booking updates based on the booking lifecycle.

## Technology Stack

- Framework: `Next.js 16`
- Language: `TypeScript`
- UI: `React 19`
- Styling: `Tailwind CSS 4`
- Database: `MongoDB`
- ODM: `Mongoose`
- Validation helpers: `Zod` plus custom server/client validation
- Linting: `ESLint`
- Testing: Node test runner with `node:test`

## Run and Build Locally

### Prerequisites

- `Node.js` installed locally
- A running MongoDB instance or MongoDB Atlas connection string

### Environment setup

Create `.env.local` in the project root and add:

```bash
DB_URL=your-mongodb-connection-string
```

You can copy from `.env.example` if needed.

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Then open:

- [http://localhost:3000](http://localhost:3000) for booking creation
- [http://localhost:3000/portal](http://localhost:3000/portal) for customer portal
- [http://localhost:3000/admin](http://localhost:3000/admin) for admin dispatch

### Run checks

```bash
npm run lint
npm run test
```

### Production build

```bash
npm run build
npm run start
```

## Server-side Routes and Actions

This project does **not** expose a separate REST API. It uses App Router pages
and Next.js Server Actions.

### App routes

- `/`
  Customer booking page. Creates a new booking and shows the generated booking
  reference.
- `/portal`
  Customer portal. Looks up a booking using `reference + phone`, displays its
  current status, and allows eligible bookings to be edited or cancelled.
- `/admin`
  Admin dashboard. Searches bookings by reference or loads the default upcoming
  active queue, assigns named drivers, and cancels eligible bookings.

### Server Actions

Defined in `app/lib/actions.ts`:

- `createBookingAction`
  Creates a new booking from the customer booking form.
- `assignBookingAction`
  Assigns a selected active driver to a pending booking from the admin page.
- `cancelAdminBookingAction`
  Cancels a booking from the admin page when it is still cancellable.
- `updatePortalBookingAction`
  Updates customer-editable booking fields from the portal when the booking is
  still pending.
- `cancelPortalBookingAction`
  Cancels a booking from the customer portal using booking reference and phone.

### Server-side booking/domain helpers

Implemented in `app/lib/bookings.ts`:

- booking creation and reference allocation
- customer portal lookup by `reference + phone`
- active driver roster seeding and loading
- named driver assignment
- booking cancellation
- booking update/reschedule
- derived booking status calculation:
  - `pending`
  - `assigned`
  - `completed`
  - `cancelled`

## Extended Features

### 1. Customer Portal

Customers can access `/portal` and enter:

- booking reference
- phone number used during booking

If both match an existing booking, the portal shows:

- booking reference
- current booking status
- customer name and phone
- pickup address
- destination suburb
- pickup date and time
- assigned driver details if available

The portal is intentionally lightweight and does not require user accounts or
external authentication.

### 2. Booking Status Lifecycle

The system now derives booking state automatically instead of relying only on
“assigned / unassigned”.

Supported statuses:

- `pending`
  Booking exists, has not been assigned, and has not been cancelled.
- `assigned`
  A driver has been assigned and the pickup time has not yet passed.
- `completed`
  A driver was assigned and the pickup time has passed.
- `cancelled`
  The booking was cancelled by a customer or admin.

Cancellation overrides all other statuses.

### 3. Customer Cancel Booking

Customers can cancel their booking from the portal when the booking is still
active.

Rules:

- customer must provide valid `reference + phone`
- completed bookings cannot be cancelled
- already-cancelled bookings are shown as cancelled and cannot be cancelled again

### 4. Admin Cancel Booking

Admins can cancel eligible bookings from `/admin`.

Rules:

- pending bookings can be cancelled
- assigned future bookings can also be cancelled
- completed bookings cannot be cancelled

Cancelled bookings are excluded from the default upcoming dispatch queue.

### 5. Customer Edit / Reschedule Booking

Customers can update the following fields from the portal while the booking is
still `pending`:

- `unitNumber`
- `streetNumber`
- `streetName`
- `pickupSuburb`
- `destinationSuburb`
- `pickupDate`
- `pickupTime`

Rules:

- customer name and phone are read-only
- past pickup times are rejected
- once a booking becomes assigned, completed, or cancelled, editing is blocked

### 6. Driver Roster and Named Assignment

The admin page now supports assigning a specific driver instead of only marking
the booking as assigned.

Implementation details:

- drivers are stored in MongoDB
- a default active driver roster is seeded lazily and idempotently
- admins choose a driver from a dropdown per booking
- assignment stores:
  - driver id
  - driver name
  - optional vehicle label snapshot

Rules:

- only `pending` bookings can be assigned
- already assigned bookings are not reassigned in this version
- cancelled and completed bookings cannot be assigned

## User Testing Instructions

Use the steps below to test the full system manually after starting the app.

### 1. Create a booking

1. Open `/`
2. Enter valid customer and address details
3. Choose a pickup date/time in the future
4. Submit the form
5. Confirm that:
   - the booking is saved successfully
   - a booking reference such as `BRN00001` is shown
   - the “Open customer portal” button appears

### 2. Test portal lookup

1. Open `/portal`
2. Enter the saved booking reference and the same phone number
3. Confirm that:
   - the booking is found
   - the status initially shows as `Pending`
   - the booking details are displayed correctly

### 3. Test customer editing/rescheduling

1. From `/portal`, update the address or pickup date/time
2. Save the changes
3. Confirm that:
   - a success banner is shown
   - the updated details are visible after redirect
4. Try changing the pickup time to a past time and confirm validation blocks it

### 4. Test admin driver assignment

1. Open `/admin`
2. Leave the search field blank to load the upcoming active queue, or search by
   the booking reference
3. Select a driver from the dropdown
4. Click `Assign driver`
5. Confirm that:
   - a success banner is shown
   - the booking status changes to `Assigned`
   - the driver name is shown in admin
   - the driver name is also visible in the customer portal

### 5. Test customer edit lock after assignment

1. Return to `/portal`
2. Look up the same booking
3. Confirm that editing is no longer available once the booking is assigned

### 6. Test cancellation

Customer cancellation:

1. Create a second booking that remains pending
2. Open it in `/portal`
3. Click `Cancel booking`
4. Confirm the status becomes `Cancelled`

Admin cancellation:

1. Search a pending or assigned future booking in `/admin`
2. Click `Cancel`
3. Confirm:
   - a success banner is shown
   - the booking status becomes `Cancelled`
   - cancelled bookings no longer appear in the default upcoming queue

### 7. Test completed status

To observe `Completed`, use a booking whose pickup time is now in the past and
has already been assigned.

Then confirm:

- the booking status is shown as `Completed`
- it cannot be edited
- it cannot be cancelled
- it cannot be assigned again

## Notes

- There is no separate public API layer; form submissions use Next.js Server
  Actions.
- The database collections used by this project are:
  - `bookings_p2`
  - `booking_counters_p2`
  - `drivers_p2`
