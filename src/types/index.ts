export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'PAID' | 'PAY_AT_CLINIC';

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'PAY_AT_CLINIC';

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  hospital: string;
  fee: number;
  yearsExperience: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  _count?: {
    appointments?: number;
  };
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason?: string | null;
  status: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentAmount?: number;
  transactionId?: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: {
    id: string;
    name: string;
    specialty: string;
    hospital: string;
    fee: number;
  };
  patient: {
    id: string;
    name: string;
    email: string;
  };
}

export const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'General medicine',
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

// Standard Ente Hospital consultation slots: 09:00 to 11:30 and 14:00 to 16:30, every 30 minutes
export const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];
