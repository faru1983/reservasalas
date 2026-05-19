/**
 * Supabase Repositories Stub
 * 
 * To switch to Supabase:
 * 1. Implement this file using `@supabase/supabase-js`.
 * 2. Update `src/lib/repositories/factory.ts` to export these classes instead of the JSON ones.
 * 3. Make sure to define the Row Level Security (RLS) policies on your Supabase tables.
 */

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

// Example: import { supabase } from '@/lib/supabaseClient';

export class SupabaseUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    // const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    // return data || null;
    throw new Error('SupabaseUserRepository not implemented yet.');
  }

  async getByEmail(email: string): Promise<User | null> {
    throw new Error('SupabaseUserRepository not implemented yet.');
  }

  async create(user: User): Promise<User> {
    throw new Error('SupabaseUserRepository not implemented yet.');
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    throw new Error('SupabaseUserRepository not implemented yet.');
  }

  async listAll(): Promise<User[]> {
    throw new Error('SupabaseUserRepository not implemented yet.');
  }
}

export class SupabaseRoomRepository implements IRoomRepository {
  async getById(id: string): Promise<Room | null> {
    throw new Error('SupabaseRoomRepository not implemented yet.');
  }

  async create(room: Room): Promise<Room> {
    throw new Error('SupabaseRoomRepository not implemented yet.');
  }

  async update(id: string, room: Partial<Room>): Promise<Room> {
    throw new Error('SupabaseRoomRepository not implemented yet.');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('SupabaseRoomRepository not implemented yet.');
  }

  async listAll(): Promise<Room[]> {
    throw new Error('SupabaseRoomRepository not implemented yet.');
  }
}

export class SupabaseServiceRepository implements IServiceRepository {
  async getById(id: string): Promise<Service | null> {
    throw new Error('SupabaseServiceRepository not implemented yet.');
  }

  async create(service: Service): Promise<Service> {
    throw new Error('SupabaseServiceRepository not implemented yet.');
  }

  async update(id: string, service: Partial<Service>): Promise<Service> {
    throw new Error('SupabaseServiceRepository not implemented yet.');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('SupabaseServiceRepository not implemented yet.');
  }

  async listAll(): Promise<Service[]> {
    throw new Error('SupabaseServiceRepository not implemented yet.');
  }
}

export class SupabaseBookingRepository implements IBookingRepository {
  async getById(id: string): Promise<Booking | null> {
    throw new Error('SupabaseBookingRepository not implemented yet.');
  }

  async create(booking: Booking): Promise<Booking> {
    throw new Error('SupabaseBookingRepository not implemented yet.');
  }

  async update(id: string, booking: Partial<Booking>): Promise<Booking> {
    throw new Error('SupabaseBookingRepository not implemented yet.');
  }

  async listAll(filters?: any): Promise<Booking[]> {
    throw new Error('SupabaseBookingRepository not implemented yet.');
  }
}

export class SupabaseSettingsRepository implements ISettingsRepository {
  async getSettings(): Promise<SystemSettings> {
    throw new Error('SupabaseSettingsRepository not implemented yet.');
  }

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    throw new Error('SupabaseSettingsRepository not implemented yet.');
  }
}
