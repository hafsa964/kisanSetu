# KisanSetuAI Frontend

This frontend was created against the supplied KisanSetuAI Express backend.

## Backend endpoints used

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/centres`
- `POST /api/slots/recommend`
- `GET /api/slots`
- `POST /api/queue/book`
- `GET /api/queue/my-tokens`
- `GET /api/alerts/my-alerts`
- `PATCH /api/alerts/:id/read`
- Socket.IO events: `join_farmer_room`, `token_status_update`, `new_alert`

## Run

1. Install Node.js.
2. Extract this folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Keep `VITE_API_URL=http://localhost:5000/api` if the supplied backend runs on port 5000.
6. Run `npm run dev`.

The frontend does not connect directly to MongoDB. It talks to the Express backend, which talks to MongoDB Atlas.

## Important

The backend's current `/api/queue/book` accepts `quantityKg`; the demo UI sends `0` unless you add a quantity field.
