export type DepartmentRef = {
  _id?: string;
  name?: string;
  description?: string;
};

export type UserRef = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
};

export type DoctorRecord = {
  _id: string;
  specialization: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  bio?: string;
  isAvailable?: boolean;
  userId?: UserRef;
  departmentId?: DepartmentRef;
  clinicId?: { _id?: string; name?: string; city?: string } | string | null;
};

export type AvailabilityRecord = {
  _id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
  isActive?: boolean;
};
