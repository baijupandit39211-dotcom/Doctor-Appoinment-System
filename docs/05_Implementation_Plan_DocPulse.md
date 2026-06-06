# DocPulse - Implementation Plan

## 1. Development Phases

## Phase 1: Project Setup

### Tasks

- Create project root folder.
- Create Next.js frontend app structure.
- Create Node.js + Express backend structure.
- Install frontend dependencies.
- Install backend dependencies.
- Setup TypeScript.
- Setup Tailwind CSS.
- Setup environment variables.
- Setup Git repository.

### Expected Output

```txt
Frontend runs on http://localhost:3000
Backend runs on http://localhost:5000
```

## Phase 2: Frontend Landing Page

### Tasks

- Build homepage.
- Add navbar.
- Add hero section.
- Add features section.
- Add how it works section.
- Add pricing section.
- Add FAQ section.
- Add footer.
- Add responsive design.
- Add Framer Motion animations.

### Expected Output

```txt
DocPulse landing page looks complete and professional.
```

## Phase 3: Backend Base Setup

### Tasks

- Create Express app.
- Connect MongoDB.
- Add global error middleware.
- Add CORS.
- Add cookie parser.
- Add route registry.
- Add health check route.

### Expected Output

```txt
GET /api/health returns backend status.
MongoDB connects successfully.
```

## Phase 4: Authentication Module

### Tasks

- Create User model.
- Create register API.
- Create login API.
- Create logout API.
- Create /me API.
- Hash password with bcrypt.
- Generate JWT token.
- Store JWT in HTTP-only cookie.
- Create auth middleware.
- Create role middleware.

### Expected Output

```txt
Users can register, login, logout, and access protected routes.
```

## Phase 5: Role-Based Dashboard UI

### Tasks

- Create patient dashboard.
- Create doctor dashboard.
- Create clinic admin dashboard.
- Create super admin dashboard.
- Add role-based redirection after login.
- Protect frontend dashboard pages.

### Expected Output

```txt
Each role sees only their own dashboard.
```

## Phase 6: Doctor and Department Module

### Tasks

- Create Department model.
- Create Doctor model.
- Add doctor CRUD API.
- Add department CRUD API.
- Create doctor listing page.
- Create doctor details page.
- Add doctor profile UI.
- Add admin doctor management UI.

### Expected Output

```txt
Admins can manage doctors and patients can view doctors.
```

## Phase 7: Availability Module

### Tasks

- Create Availability model.
- Add doctor availability API.
- Allow doctors/admin to create available time slots.
- Show availability on doctor profile.
- Validate available slots.

### Expected Output

```txt
Doctors can set availability and patients can see slots.
```

## Phase 8: Appointment Module

### Tasks

- Create Appointment model.
- Add appointment booking API.
- Add appointment list API.
- Add appointment status update API.
- Prevent double booking.
- Add patient appointment page.
- Add doctor appointment page.
- Add admin appointment management page.

### Expected Output

```txt
Patients can book appointments and doctors/admins can manage them.
```

## Phase 9: Notification and Email Module

### Tasks

- Configure Nodemailer.
- Send appointment confirmation email.
- Send cancellation email.
- Send reminder email.
- Create notification model.
- Add notification API.

### Expected Output

```txt
Users receive appointment confirmation and update emails.
```

## Phase 10: Reports and Analytics

### Tasks

- Create reports API.
- Add admin dashboard stats.
- Show total appointments.
- Show active doctors.
- Show total patients.
- Show completed and cancelled appointments.
- Add simple charts.

### Expected Output

```txt
Admin can view clinic activity and appointment reports.
```

## Phase 11: Testing

### Testing Checklist

- Register API works.
- Login API works.
- Logout clears cookie.
- Protected routes block unauthenticated users.
- Role middleware works.
- Doctor CRUD works.
- Department CRUD works.
- Availability creation works.
- Appointment booking works.
- Double booking is blocked.
- Appointment status updates correctly.
- Dashboard pages are responsive.
- No console errors.
- No backend errors.

## Phase 12: Final Polish

### Tasks

- Improve UI spacing.
- Fix mobile responsiveness.
- Add loading states.
- Add empty states.
- Add error messages.
- Update README.
- Clean unused code.
- Prepare final demo.

## Recommended Build Order

```txt
1. Landing Page
2. Backend Setup
3. Auth
4. Role Dashboards
5. Doctor Module
6. Department Module
7. Availability Module
8. Appointment Module
9. Email Notification
10. Reports
11. Testing
12. Final Polish
```

## Final Acceptance

The project is ready when:

- Frontend and backend run successfully.
- MongoDB stores data correctly.
- Authentication works.
- Role-based access works.
- Patients can book appointments.
- Doctors can manage appointments.
- Admin can manage doctors and appointments.
- UI is responsive and professional.
- All important APIs are tested in Postman.

