export const userRoles = ["patient", "doctor", "clinic_admin", "super_admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const genders = ["male", "female", "other"] as const;
export type Gender = (typeof genders)[number];

export const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type DayOfWeek = (typeof daysOfWeek)[number];

export const appointmentStatuses = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const cancelledByValues = ["patient", "doctor", "clinic_admin"] as const;
export type CancelledBy = (typeof cancelledByValues)[number];

export const notificationTypes = ["appointment", "reminder", "system"] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const subscriptionPlans = ["starter", "professional", "enterprise"] as const;
export type SubscriptionPlan = (typeof subscriptionPlans)[number];

export const subscriptionStatuses = ["active", "inactive", "expired"] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const doctorProfileStatuses = ["pending", "approved", "rejected"] as const;
export type DoctorProfileStatus = (typeof doctorProfileStatuses)[number];
