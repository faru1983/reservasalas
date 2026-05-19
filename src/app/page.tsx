import {
  roomRepository,
  serviceRepository,
  settingsRepository
} from '@/lib/repositories/factory';
import { getServerSession } from '@/lib/auth';
import LandingClient from './LandingClient';

export const revalidate = 0; // Disable static caching so it always loads fresh data

export default async function LandingPage() {
  // Load data directly on the server for instant rendering
  const [rooms, services, settings, session] = await Promise.all([
    roomRepository.listAll(),
    serviceRepository.listAll(),
    settingsRepository.getSettings(),
    getServerSession()
  ]);

  const activeRooms = rooms.filter((r) => r.isActive);
  const activeServices = services.filter((s) => s.isActive);

  return (
    <LandingClient
      initialRooms={activeRooms}
      initialServices={activeServices}
      globalPolicies={settings.globalPolicies}
      session={session}
    />
  );
}
