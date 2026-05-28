# Taxi Booking P2

This project rewrites the original `part1` taxi booking system as a Next.js 16 app with:

- a customer booking page at `/`
- an admin dispatch page at `/admin`
- MongoDB-backed persistence
- Server Actions for booking creation and assignment

## Environment

Configure the MongoDB connection string:

```bash
DB_URL=
```

You can copy values from `.env.example` and create your own `.env.local`.

## Database bootstrap

No SQL bootstrap is required. The app uses MongoDB with:

- database: `taxi_booking_p2`
- bookings collection: `bookings_p2`
- counter collection: `booking_counters_p2`

The counter collection is used to generate `BRNxxxxx` booking references.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
```
