import {
  User,
  Room,
  Service,
  Booking,
  SystemSettings,
  IUserRepository,
  IRoomRepository,
  IServiceRepository,
  IBookingRepository,
  ISettingsRepository
} from '@/types';
import { readDataFile, writeDataFile } from './db';

export class JSONUserRepository implements IUserRepository {
  private filename = 'users.json';

  async getById(id: string): Promise<User | null> {
    const users = readDataFile<User[]>(this.filename);
    return users.find((u) => u.id === id) || null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const users = readDataFile<User[]>(this.filename);
    const searchEmail = email.toLowerCase().trim();
    return users.find((u) => u.email.toLowerCase().trim() === searchEmail) || null;
  }

  async create(user: User): Promise<User> {
    const users = readDataFile<User[]>(this.filename);
    users.push(user);
    writeDataFile(this.filename, users);
    return user;
  }

  async update(id: string, updatedFields: Partial<User>): Promise<User> {
    const users = readDataFile<User[]>(this.filename);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found`);
    }
    const updatedUser = { ...users[index], ...updatedFields };
    users[index] = updatedUser;
    writeDataFile(this.filename, users);
    return updatedUser;
  }

  async listAll(): Promise<User[]> {
    return readDataFile<User[]>(this.filename);
  }
}

export class JSONRoomRepository implements IRoomRepository {
  private filename = 'rooms.json';

  async getById(id: string): Promise<Room | null> {
    const rooms = readDataFile<Room[]>(this.filename);
    return rooms.find((r) => r.id === id) || null;
  }

  async create(room: Room): Promise<Room> {
    const rooms = readDataFile<Room[]>(this.filename);
    rooms.push(room);
    writeDataFile(this.filename, rooms);
    return room;
  }

  async update(id: string, updatedFields: Partial<Room>): Promise<Room> {
    const rooms = readDataFile<Room[]>(this.filename);
    const index = rooms.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Room with ID ${id} not found`);
    }
    const updatedRoom = { ...rooms[index], ...updatedFields };
    rooms[index] = updatedRoom;
    writeDataFile(this.filename, rooms);
    return updatedRoom;
  }

  async delete(id: string): Promise<boolean> {
    const rooms = readDataFile<Room[]>(this.filename);
    const index = rooms.findIndex((r) => r.id === id);
    if (index === -1) return false;
    rooms.splice(index, 1);
    writeDataFile(this.filename, rooms);
    return true;
  }

  async listAll(): Promise<Room[]> {
    return readDataFile<Room[]>(this.filename);
  }
}

export class JSONServiceRepository implements IServiceRepository {
  private filename = 'services.json';

  async getById(id: string): Promise<Service | null> {
    const services = readDataFile<Service[]>(this.filename);
    return services.find((s) => s.id === id) || null;
  }

  async create(service: Service): Promise<Service> {
    const services = readDataFile<Service[]>(this.filename);
    services.push(service);
    writeDataFile(this.filename, services);
    return service;
  }

  async update(id: string, updatedFields: Partial<Service>): Promise<Service> {
    const services = readDataFile<Service[]>(this.filename);
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Service with ID ${id} not found`);
    }
    const updatedService = { ...services[index], ...updatedFields };
    services[index] = updatedService;
    writeDataFile(this.filename, services);
    return updatedService;
  }

  async delete(id: string): Promise<boolean> {
    const services = readDataFile<Service[]>(this.filename);
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) return false;
    services.splice(index, 1);
    writeDataFile(this.filename, services);
    return true;
  }

  async listAll(): Promise<Service[]> {
    return readDataFile<Service[]>(this.filename);
  }
}

export class JSONBookingRepository implements IBookingRepository {
  private filename = 'bookings.json';

  async getById(id: string): Promise<Booking | null> {
    const bookings = readDataFile<Booking[]>(this.filename);
    return bookings.find((b) => b.id === id) || null;
  }

  async create(booking: Booking): Promise<Booking> {
    const bookings = readDataFile<Booking[]>(this.filename);
    bookings.push(booking);
    writeDataFile(this.filename, bookings);
    return booking;
  }

  async update(id: string, updatedFields: Partial<Booking>): Promise<Booking> {
    const bookings = readDataFile<Booking[]>(this.filename);
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Booking with ID ${id} not found`);
    }
    const updatedBooking = { ...bookings[index], ...updatedFields };
    bookings[index] = updatedBooking;
    writeDataFile(this.filename, bookings);
    return updatedBooking;
  }

  async listAll(filters?: {
    userId?: string;
    roomId?: string;
    serviceId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Booking[]> {
    let bookings = readDataFile<Booking[]>(this.filename);

    if (filters) {
      if (filters.userId) {
        bookings = bookings.filter((b) => b.userId === filters.userId);
      }
      if (filters.roomId) {
        bookings = bookings.filter((b) => b.roomId === filters.roomId);
      }
      if (filters.serviceId) {
        bookings = bookings.filter((b) => b.serviceId === filters.serviceId);
      }
      if (filters.status) {
        bookings = bookings.filter((b) => b.status === filters.status);
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        bookings = bookings.filter((b) => new Date(b.startDateTime).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        bookings = bookings.filter((b) => new Date(b.endDateTime).getTime() <= end);
      }
    }

    return bookings;
  }
}

export class JSONSettingsRepository implements ISettingsRepository {
  private filename = 'settings.json';

  async getSettings(): Promise<SystemSettings> {
    return readDataFile<SystemSettings>(this.filename);
  }

  async updateSettings(updatedFields: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...updatedFields,
      globalPolicies: {
        ...current.globalPolicies,
        ...updatedFields.globalPolicies
      },
      updatedAt: new Date().toISOString()
    } as SystemSettings;
    writeDataFile(this.filename, updated);
    return updated;
  }
}
