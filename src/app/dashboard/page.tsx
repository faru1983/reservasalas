import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import {
  bookingRepository,
  roomRepository,
  serviceRepository
} from '@/lib/repositories/factory';
import DashboardClient from './DashboardClient';

export const revalidate = 0; // Disable dynamic caching

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch only this user's bookings
  const bookings = await bookingRepository.listAll({
    userId: session.userId
  });

  const rooms = await roomRepository.listAll();
  const services = await serviceRepository.listAll();

  // Filter only active rooms and services for new bookings
  const activeRooms = rooms.filter((r) => r.isActive);
  const activeServices = services.filter((s) => s.isActive);

  // Sort bookings: new ones first
  bookings.sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

  return (
    <DashboardClient
      userSession={session}
      userBookings={bookings}
      activeRooms={activeRooms}
      activeServices={activeServices}
    />
  );
}
