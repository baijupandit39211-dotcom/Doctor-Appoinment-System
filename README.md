# DocPulse

DocPulse is a SaaS doctor appointment system built with:

- Frontend: Next.js + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT + HTTP-only Cookies

## Run Commands

### Root
```bash
npm run dev
npm run dev:client
npm run dev:server
```

### Frontend
```bash
cd client
npm run dev
```

### Backend
```bash
cd server
npm run dev
```

### Build Checks
```bash
cd client
npm run build

cd ../server
npm run build
```

## Environment Setup

### Backend local environment

Create `server/.env` with:

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/docpulse
JWT_SECRET=docpulse_super_secret_key_change_later
JWT_EXPIRES_IN=7d
COOKIE_NAME=docpulse_token
```

### Environment notes

- `server/.env.example` stays as the safe template.
- Root `.env` is ignored and archived legacy Supabase config is not part of the active stack.
- If you move to MongoDB Atlas later, replace `MONGODB_URI` in `server/.env` with the Atlas connection string.

## Current Completed Modules

### Frontend
- Landing page
- Auth pages wired to backend
- Shared dashboard skeletons for:
  - patient
  - doctor
  - clinic admin
  - super admin
- Reusable landing/dashboard UI in `client/`

### Backend
- Express app bootstrap
- MongoDB connection setup
- Health route
- JWT auth module
- Auth middleware and role middleware
- Protected test routes
- Department module
- Doctor module
- Availability module
- Appointment module with double-booking prevention
- Notification module
- Reports module
- Mongoose models for the core collections

## Final Testing Checklist

- Health API: `GET http://localhost:4000/api/health`
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- `auth/me`: `GET /api/auth/me`
- Logout: `POST /api/auth/logout`
- Role redirects for:
  - `/patient`
  - `/doctor`
  - `/admin`
  - `/superadmin`
- Protected dashboards load after login
- Doctors API
- Departments API
- Availability API
- Appointments API
- Notifications API
- Reports API

## Demo Flow

1. Open the landing page at `http://localhost:3000/`
2. Register or login
3. Confirm role-based redirect to the correct dashboard
4. View the dashboard shell and live summary cards
5. Test backend health from `http://localhost:4000/api/health`

## Pending Work

- Final MongoDB Atlas migration, if you choose to move off local MongoDB later
- End-to-end dashboard data wiring for patient/doctor/admin/superadmin pages
- Real booking UI and data fetching in the client
- Email notifications and reminders
- Production hardening and final integration testing
- Optional cleanup of legacy root TanStack dependencies/scripts if you want to fully retire them

## Notes

- `.env` files are ignored in both the root and `server/`.
- Legacy TanStack/Supabase code is archived for reference only and is not part of the active stack.
