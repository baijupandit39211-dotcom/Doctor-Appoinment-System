# DocPulse - Backend Schema Document

## 1. Database

Database: MongoDB  
ODM: Mongoose

## 2. Main Collections

```txt
users
clinics
departments
doctors
patients
availabilities
appointments
notifications
subscriptions
reports
```

## 3. User Schema

```ts
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ["patient", "doctor", "clinic_admin", "super_admin"],
    default: "patient",
  },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

## 4. Clinic Schema

```ts
const ClinicSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  logo: { type: String },
  adminId: { type: Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

## 5. Department Schema

```ts
const DepartmentSchema = new Schema({
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

## 6. Doctor Schema

```ts
const DoctorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic" },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
  specialization: { type: String, required: true },
  qualification: { type: String },
  experienceYears: { type: Number, default: 0 },
  consultationFee: { type: Number, default: 0 },
  bio: { type: String },
  languages: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });
```

## 7. Patient Schema

```ts
const PatientSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dateOfBirth: { type: Date },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  address: { type: String },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
}, { timestamps: true });
```

## 8. Availability Schema

```ts
const AvailabilitySchema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic" },
  dayOfWeek: {
    type: String,
    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  slotDurationMinutes: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

## 9. Appointment Schema

```ts
const AppointmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic" },
  appointmentDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  reason: { type: String },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled", "no_show"],
    default: "pending",
  },
  notes: { type: String },
  cancelledBy: {
    type: String,
    enum: ["patient", "doctor", "clinic_admin", null],
    default: null,
  },
  cancellationReason: { type: String },
}, { timestamps: true });

AppointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1 },
  { unique: true }
);
```

## 10. Notification Schema

```ts
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["appointment", "reminder", "system"],
    default: "system",
  },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });
```

## 11. Subscription Schema

```ts
const SubscriptionSchema = new Schema({
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
  plan: {
    type: String,
    enum: ["starter", "professional", "enterprise"],
    default: "starter",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "expired"],
    default: "active",
  },
  startDate: { type: Date },
  endDate: { type: Date },
}, { timestamps: true });
```

## 12. Important Database Rules

- User email must be unique.
- Appointment slot must be unique for each doctor.
- Password must never be returned in API response.
- Only doctors can manage their own availability.
- Only patients can book appointments for themselves.
- Clinic admin can manage only their own clinic data.
- Super admin can manage all clinics.

