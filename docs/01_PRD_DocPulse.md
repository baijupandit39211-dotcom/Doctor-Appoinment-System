# PRD: DocPulse - SaaS Doctor Appointment System

## 1. Product Overview

DocPulse is a full-stack SaaS doctor appointment system designed for clinics, doctors, patients, and clinic administrators. The platform helps patients book doctor appointments online and helps clinics manage doctors, schedules, appointments, patient information, reminders, and reports from one central system.

## 2. Final Stack

```txt
Frontend: Next.js + React + TypeScript + Tailwind CSS
Backend: Node.js + Express.js
Database: MongoDB + Mongoose
Authentication: JWT + HTTP-only Cookies
UI: shadcn/ui + Radix UI + Lucide React
Animation: Framer Motion
Email/Reminder: Nodemailer
File Upload: Cloudinary
```

## 3. Product Name

DocPulse

## 4. Tagline

Smart appointment scheduling for modern clinics and healthcare teams.

## 5. Product Goal

Provide a secure, simple, and modern doctor appointment management system where patients can book appointments online and clinics can manage appointments, doctors, schedules, and patient records efficiently.

## 6. Target Users

- Patients
- Doctors
- Clinic Admins
- Super Admins

## 7. Problem Statement

Many clinics still manage appointments manually through phone calls, paper records, spreadsheets, or messaging apps. This causes double bookings, missed appointments, long waiting times, poor doctor schedule visibility, and difficulty managing patient records.

DocPulse solves this by providing a digital appointment system with role-based dashboards, online booking, schedule management, reminders, and reporting.

## 8. Product Objectives

- Build a professional healthcare SaaS platform.
- Allow patients to book doctor appointments online.
- Allow doctors to manage their appointment schedules.
- Allow clinic admins to manage doctors, patients, appointments, and departments.
- Provide secure login and role-based access.
- Provide appointment reminders through email.
- Provide dashboard analytics and reports.
- Make the system responsive for mobile, tablet, and desktop.
- Use MongoDB for flexible healthcare data storage.
- Use Express.js APIs for backend logic.
- Use Next.js for fast frontend pages and dashboards.

## 9. Core Features

### Authentication and Roles

- Register
- Login
- Logout
- JWT cookie authentication
- Password hashing
- Role-based access
- Patient dashboard
- Doctor dashboard
- Clinic admin dashboard
- Super admin dashboard

### Patient Features

- Create profile
- Search doctors
- Filter by department or specialization
- View doctor profile
- View available time slots
- Book appointment
- Cancel appointment
- View appointment history
- Receive appointment reminder

### Doctor Features

- Manage profile
- Set availability
- View today's appointments
- Accept or reject appointments if needed
- Update appointment status
- View patient basic information

### Clinic Admin Features

- Manage doctors
- Manage departments
- Manage appointments
- Manage patients
- View reports
- Manage clinic profile
- View dashboard stats

### Super Admin Features

- Manage clinics
- Manage platform users
- Manage subscription plans
- View platform analytics
- Activate or deactivate clinics

### Appointment Management

- Patient selects doctor
- Patient selects date and time
- System checks availability
- Appointment is created
- Doctor or admin can update status
- Patient receives confirmation

### Schedule Management

- Doctors can add available days
- Doctors can add time slots
- Admin can manage doctor schedules
- System prevents double booking

### Notifications and Reminders

- Appointment confirmation email
- Appointment cancellation email
- Reminder before appointment
- Admin notification for new appointment

### Reports and Analytics

- Total appointments
- Completed appointments
- Cancelled appointments
- Active doctors
- Active patients
- Department-wise appointments

## 10. Version 1 Scope

- Landing page
- Authentication
- Patient dashboard
- Doctor dashboard
- Clinic admin dashboard
- Doctor listing
- Doctor profile
- Appointment booking
- Appointment management
- Doctor availability
- Basic email notification
- MongoDB database
- Express REST API

## 11. Future Scope

- Online payment
- Video consultation
- Prescription management
- Medical records
- SMS reminders
- AI doctor recommendation
- Multi-branch clinic support
- Subscription billing
- Advanced analytics
- Mobile app

## 12. Success Criteria

- Patients can register and book appointments.
- Doctors can view and manage appointments.
- Clinic admins can manage doctors and appointments.
- System prevents double booking.
- Users access only their allowed dashboard.
- MongoDB stores all important data correctly.
- UI is responsive and professional.
- Backend APIs work correctly.
- Authentication is secure with JWT cookies.
- The website looks like a real SaaS healthcare product.

