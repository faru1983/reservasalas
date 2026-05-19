import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import {
  bookingRepository,
  roomRepository,
  serviceRepository,
  settingsRepository,
  userRepository
} from '@/lib/repositories/factory';

export const revalidate = 0; // Disable dynamic caching

export default async function AdminPage() {
  const session = await getServerSession();

  // Security: strict server check of auth and role
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    redirect('/dashboard');
  }

  // Load all system data to fuel the management tabs
  const [bookings, rooms, services, settings, users] = await Promise.all([
    bookingRepository.listAll(),
    roomRepository.listAll(),
    serviceRepository.listAll(),
    settingsRepository.getSettings(),
    userRepository.listAll()
  ]);

  // Exclude password hashes on the server before sending to the client
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);

  // Sort bookings newest first by default
  bookings.sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

  // Import AdminClient dynamically or directly
  const AdminClient = (await import('./AdminClient')).default;

  return (
    <AdminClient
      adminSession={session}
      initialBookings={bookings}
      initialRooms={rooms}
      initialServices={services}
      initialSettings={settings}
      initialUsers={safeUsers}
    />
  );
}
