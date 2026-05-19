export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  phone?: string;
  notes?: string;
}

export interface BookingPolicies {
  slotDuration?: number; // 15, 30, 60 min
  minDuration?: number; // minutes
  maxDuration?: number; // minutes
  allowedHoursStart?: string; // HH:MM
  allowedHoursEnd?: string; // HH:MM
  minAdvanceDays?: number;
  maxAdvanceDays?: number;
  cancelWindowHours?: number;
  maxActiveBookings?: number;
  autoConfirm?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  imageUrl?: string;
  isActive: boolean;
  policiesOverride?: BookingPolicies;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationBlock: number; // e.g. 15, 30, 60 minutes
  color: string; // Tailwind color class or hex (e.g., 'blue', 'indigo')
  isActive: boolean;
  policiesOverride?: BookingPolicies;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  serviceId: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  // Denormalized for display/queries speed
  userEmail: string;
  userName: string;
  roomName: string;
  serviceName: string;
}

export interface SpecialDate {
  date: string; // YYYY-MM-DD
  label: string;
  isBlocked: boolean;
  allowedHoursStart?: string;
  allowedHoursEnd?: string;
}

export interface SystemSettings {
  id: string;
  globalPolicies: Required<BookingPolicies>;
  specialDates: SpecialDate[];
  updatedAt: string;
}

// Repositories Interfaces
export interface IUserRepository {
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
  listAll(): Promise<User[]>;
}

export interface IRoomRepository {
  getById(id: string): Promise<Room | null>;
  create(room: Room): Promise<Room>;
  update(id: string, room: Partial<Room>): Promise<Room>;
  delete(id: string): Promise<boolean>;
  listAll(): Promise<Room[]>;
}

export interface IServiceRepository {
  getById(id: string): Promise<Service | null>;
  create(service: Service): Promise<Service>;
  update(id: string, service: Partial<Service>): Promise<Service>;
  delete(id: string): Promise<boolean>;
  listAll(): Promise<Service[]>;
}

export interface IBookingRepository {
  getById(id: string): Promise<Booking | null>;
  create(booking: Booking): Promise<Booking>;
  update(id: string, booking: Partial<Booking>): Promise<Booking>;
  listAll(filters?: {
    userId?: string;
    roomId?: string;
    serviceId?: string;
    status?: BookingStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Booking[]>;
}

export interface ISettingsRepository {
  getSettings(): Promise<SystemSettings>;
  updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings>;
}
