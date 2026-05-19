import {
  IUserRepository,
  IRoomRepository,
  IServiceRepository,
  IBookingRepository,
  ISettingsRepository
} from '@/types';
import {
  JSONUserRepository,
  JSONRoomRepository,
  JSONServiceRepository,
  JSONBookingRepository,
  JSONSettingsRepository
} from './json';

// To migrate to Supabase:
// 1. Install @supabase/supabase-js
// 2. Import Supabase implementations from './supabase'
// 3. Swap the initializations below:
//
// import {
//   SupabaseUserRepository,
//   SupabaseRoomRepository,
//   SupabaseServiceRepository,
//   SupabaseBookingRepository,
//   SupabaseSettingsRepository
// } from './supabase';

export const userRepository: IUserRepository = new JSONUserRepository();
export const roomRepository: IRoomRepository = new JSONRoomRepository();
export const serviceRepository: IServiceRepository = new JSONServiceRepository();
export const bookingRepository: IBookingRepository = new JSONBookingRepository();
export const settingsRepository: ISettingsRepository = new JSONSettingsRepository();
