# Land Scaler System

## Setup Instructions

### Prerequisites
1. Node.js installed.
2. Supabase project created.

### Database Setup
1. Go to your Supabase SQL Editor.
2. Run the contents of `db_schema.sql` to create `users` and `payment_proofs` tables.

### Backend Setup
1. Navigate to `server/`.
2. run `npm install`.
3. Rename `.env` (or create one) and fill in your `SUPABASE_URL` and `SUPABASE_KEY`.
4. Run `npm start` or `node server.js`. Server runs on Port 5000.

### Frontend Setup
1. Navigate to `client/`.
2. run `npm install`.
3. Run `npm run dev`.
4. Open browser at `http://localhost:5173`.

### Usage
1. Register a new account.
2. To get tokens, click "Buy Tokens" on the dashboard or landing page.
3. Upload a dummy image as proof.
4. (As Admin) Go to the `payment_proofs` table in Supabase and manually set `status` to 'approved' OR develop the Admin UI further (Admin route is `/admin` but requires a user with role 'admin' in database).
   - To make yourself admin, manually edit your user row in Supabase `users` table: set `role` to 'admin'.
5. Once you have tokens, use the Generator on the Dashboard.

## Features
- **Token System**: 5 tokens per generation.
- **Payment Proof Upload**: Users upload QRIS receipts.
- **Admin Approval**: Admins approve proofs to grant tokens.
- **GIS Generation**: Creates a checked Polygon Shapefile (.shp, .shx, .dbf, .prj) zipped.
