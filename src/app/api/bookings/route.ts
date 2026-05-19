import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  bookingRepository,
  roomRepository,
  serviceRepository,
  userRepository,
  settingsRepository
} from '@/lib/repositories/factory';
import { validateBooking, resolveActivePolicies } from '@/lib/policies';
import { Booking, BookingStatus } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicie sesión.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || undefined;
    const serviceId = searchParams.get('serviceId') || undefined;
    const status = (searchParams.get('status') as BookingStatus) || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    let targetUserId: string | undefined = undefined;

    // Security: Only admins can view others' bookings. Users are forced to their own userId.
    if (session.role === 'admin') {
      targetUserId = searchParams.get('userId') || undefined;
    } else {
      targetUserId = session.userId;
    }

    const bookings = await bookingRepository.listAll({
      userId: targetUserId,
      roomId,
      serviceId,
      status,
      startDate,
      endDate
    });

    // Sort bookings by date descending for quick display
    bookings.sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al obtener las reservas.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicie sesión.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { roomId, serviceId, startDateTime, endDateTime, notes } = body;

    if (!roomId || !serviceId || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (roomId, serviceId, startDateTime, endDateTime).' },
        { status: 400 }
      );
    }

    // Security: standard users can only reserve for themselves.
    // Admins can override and book on behalf of another user if specified.
    let bookingUserId = session.userId;
    if (session.role === 'admin' && body.userId) {
      bookingUserId = body.userId;
    }

    // 1. Run centralized validation policy checks
    const validation = await validateBooking({
      userId: bookingUserId,
      userRole: session.role,
      roomId,
      serviceId,
      startDateTime,
      endDateTime
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'La reserva infringe las políticas vigentes.' },
        { status: 400 }
      );
    }

    // 2. Fetch dependencies to denormalize and ensure fast read loads
    const [room, service, targetUser, settings] = await Promise.all([
      roomRepository.getById(roomId),
      serviceRepository.getById(serviceId),
      userRepository.getById(bookingUserId),
      settingsRepository.getSettings()
    ]);

    if (!room || !service || !targetUser) {
      return NextResponse.json(
        { error: 'Error al relacionar los datos de sala, servicio o usuario.' },
        { status: 400 }
      );
    }

    // Resolve policies to check if booking status should be autoConfirmed or pending
    const activePolicies = resolveActivePolicies(settings.globalPolicies, service, room);
    const initialStatus: BookingStatus = activePolicies.autoConfirm ? 'confirmed' : 'pending';

    const newBooking: Booking = {
      id: 'booking_' + Math.random().toString(36).substr(2, 9),
      userId: bookingUserId,
      roomId,
      serviceId,
      startDateTime,
      endDateTime,
      status: initialStatus,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      userEmail: targetUser.email,
      userName: targetUser.name,
      roomName: room.name,
      serviceName: service.name
    };

    const saved = await bookingRepository.create(newBooking);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
