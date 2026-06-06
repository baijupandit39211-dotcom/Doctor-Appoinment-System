# DocPulse - App Flow Document

## 1. Full System Flow

```txt
Visitor opens website
↓
Views DocPulse landing page
↓
Registers or logs in
↓
System checks user role
↓
Redirects to correct dashboard
↓
User performs role-based actions
```

## 2. User Role Entry Flow

```txt
User enters email and password
↓
Backend validates credentials
↓
Backend compares hashed password
↓
Backend creates JWT token
↓
JWT token is stored in HTTP-only cookie
↓
Frontend calls /api/auth/me
↓
User role is checked
↓
Redirect:
Patient -> Patient Dashboard
Doctor -> Doctor Dashboard
Clinic Admin -> Admin Dashboard
Super Admin -> Super Admin Dashboard
```

## 3. Patient Appointment Booking Flow

```txt
Patient logs in
↓
Patient searches doctor
↓
Patient filters by department or specialization
↓
Patient opens doctor profile
↓
Patient selects date
↓
System shows available time slots
↓
Patient selects time slot
↓
Patient submits appointment request
↓
Backend checks if slot is still available
↓
Backend creates appointment
↓
Appointment status becomes Pending or Confirmed
↓
Patient receives confirmation
↓
Doctor/Admin sees new appointment
```

## 4. Doctor Availability Flow

```txt
Doctor logs in
↓
Doctor opens availability page
↓
Doctor selects available days
↓
Doctor adds start time and end time
↓
Backend saves availability
↓
Patient can see those slots while booking
```

## 5. Appointment Status Flow

```txt
Appointment created
↓
Status: Pending / Confirmed
↓
Doctor/Admin reviews appointment
↓
Status can change to:
- Confirmed
- Completed
- Cancelled
- No Show
↓
Patient dashboard updates
↓
Doctor dashboard updates
```

## 6. Clinic Admin Flow

```txt
Clinic Admin logs in
↓
Admin opens dashboard
↓
Admin manages:
- Doctors
- Departments
- Patients
- Appointments
- Reports
↓
Admin can add doctor
↓
Admin can assign department
↓
Admin can update appointment status
↓
Admin can view clinic analytics
```

## 7. Super Admin Flow

```txt
Super Admin logs in
↓
Super Admin opens platform dashboard
↓
Super Admin manages:
- Clinics
- Subscription plans
- Platform users
- Platform analytics
↓
Super Admin can activate/deactivate clinic
```

## 8. Email Notification Flow

```txt
Appointment is created or updated
↓
Backend calls email service
↓
Nodemailer sends email
↓
Patient receives appointment confirmation/reminder
↓
Doctor/Admin receives appointment update if needed
```

## 9. Double Booking Prevention Flow

```txt
Patient selects slot
↓
Backend checks appointment collection
↓
If same doctor + same date + same time already exists:
    Reject request
Else:
    Create appointment
```

## 10. Logout Flow

```txt
User clicks logout
↓
Frontend calls /api/auth/logout
↓
Backend clears JWT cookie
↓
Frontend redirects to login page
```

