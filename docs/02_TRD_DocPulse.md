# TRD: DocPulse - Technical Requirements Document

## 1. Technical Overview

DocPulse is a full-stack doctor appointment SaaS platform using Next.js for frontend, Node.js and Express.js for backend APIs, and MongoDB for database storage.

## 2. Final Technology Stack

```txt
Frontend: Next.js + React + TypeScript
Styling: Tailwind CSS
UI Components: shadcn/ui + Radix UI
Icons: Lucide React
Animation: Framer Motion
Backend: Node.js + Express.js
Database: MongoDB + Mongoose
Authentication: JWT + HTTP-only Cookies
Password Security: bcrypt
Email Service: Nodemailer
File Upload: Cloudinary + Multer
Validation: Zod or Joi
API Testing: Postman
Version Control: Git + GitHub
```

## 3. Recommended Folder Structure

```txt
docpulse/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   ├── register/
│   ├── doctors/
│   ├── appointments/
│   ├── patient/
│   ├── doctor/
│   ├── admin/
│   └── superadmin/
├── components/
│   ├── landing/
│   ├── dashboard/
│   ├── forms/
│   └── ui/
├── lib/
├── hooks/
├── types/
├── styles/
├── server/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── validators/
│   └── package.json
└── README.md
```

## 4. Frontend Requirements

### Public Pages

- Home landing page
- Doctors listing page
- Doctor details page
- Login page
- Register page
- About page
- Contact page
- Pricing page

### Patient Pages

- Patient dashboard
- Book appointment page
- My appointments page
- Profile page

### Doctor Pages

- Doctor dashboard
- Today appointments
- Availability management
- Profile management

### Admin Pages

- Admin dashboard
- Manage doctors
- Manage patients
- Manage appointments
- Manage departments
- Reports

### Super Admin Pages

- Super admin dashboard
- Manage clinics
- Manage subscriptions
- Manage users
- Platform reports

## 5. Backend Requirements

### API Base URL

```txt
/api
```

### Main API Modules

```txt
/auth
/users
/doctors
/patients
/clinics
/departments
/availability
/appointments
/notifications
/reports
/admin
/superadmin
```

## 6. Authentication Technical Requirements

- Use bcrypt to hash passwords.
- Use JWT for authentication.
- Store JWT in HTTP-only cookie.
- Use middleware to protect private routes.
- Use role middleware for patient, doctor, admin, and super admin.
- Add logout route to clear cookie.

## 7. Role-Based Access

```txt
Patient:
- Book appointment
- View own appointments
- Cancel own appointments
- Manage own profile

Doctor:
- View assigned appointments
- Manage availability
- Update appointment status
- Manage own profile

Clinic Admin:
- Manage clinic doctors
- Manage clinic appointments
- Manage clinic departments
- View clinic reports

Super Admin:
- Manage all clinics
- Manage subscription plans
- View platform analytics
```

## 8. API Endpoints

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Doctors

```txt
GET    /api/doctors
GET    /api/doctors/:id
POST   /api/doctors
PATCH  /api/doctors/:id
DELETE /api/doctors/:id
GET    /api/doctors/:id/availability
```

### Patients

```txt
GET   /api/patients/me
PATCH /api/patients/me
GET   /api/patients/me/appointments
```

### Appointments

```txt
POST  /api/appointments
GET   /api/appointments/me
GET   /api/appointments/:id
PATCH /api/appointments/:id/status
PATCH /api/appointments/:id/cancel
```

### Availability

```txt
POST   /api/availability
GET    /api/availability/doctor/:doctorId
PATCH  /api/availability/:id
DELETE /api/availability/:id
```

### Departments

```txt
POST   /api/departments
GET    /api/departments
PATCH  /api/departments/:id
DELETE /api/departments/:id
```

### Reports

```txt
GET /api/reports/admin-overview
GET /api/reports/doctor-overview
GET /api/reports/appointments
```

## 9. Middleware Requirements

```txt
auth.middleware.ts
role.middleware.ts
error.middleware.ts
validate.middleware.ts
upload.middleware.ts
rateLimit.middleware.ts
```

## 10. Security Requirements

- Hash passwords using bcrypt.
- Use HTTP-only cookies.
- Validate all request body data.
- Sanitize user inputs.
- Use CORS safely.
- Use role-based middleware.
- Never expose password in API response.
- Add rate limiting for auth routes.
- Use environment variables for secrets.

## 11. Environment Variables

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/docpulse
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
COOKIE_NAME=docpulse_token
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
```

## 12. Technical Acceptance Criteria

- Next.js frontend runs successfully.
- Express backend runs successfully.
- MongoDB connects successfully.
- Register and login APIs work.
- JWT cookie authentication works.
- Role-based dashboards are protected.
- Appointment booking API works.
- Doctor availability prevents double booking.
- UI is responsive.
- No major TypeScript errors.

