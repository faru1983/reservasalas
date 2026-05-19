import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  bookingRepository,
  roomRepository,
  serviceRepository,
  settingsRepository
} from '@/lib/repositories/factory';
import { validateBooking, resolveActivePolicies } from '@/lib/policies';
import { BookingStatus } from '@/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicie sesión.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { startDateTime, endDateTime, notes, status } = body;

    const booking = await bookingRepository.getById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'La reserva especificada no existe.' },
        { status: 404 }
      );
    }

    // Security: Only booking owner or admin can update
    const isOwner = booking.userId === session.userId;
    const isAdmin = session.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'No tiene permisos para modificar esta reserva.' },
        { status: 403 }
      );
    }

    // Load dependencies to inspect cancellation window policies
    const [room, service, settings] = await Promise.all([
      roomRepository.getById(booking.roomId),
      serviceRepository.getById(booking.serviceId),
      settingsRepository.getSettings()
    ]);

    const activePolicies = resolveActivePolicies(settings.globalPolicies, service, room);

    // CASE 1: Request is a cancellation or status change
    if (status && status !== booking.status) {
      if (status === 'cancelled') {
        // Enforce cancel window limit for regular users
        if (!isAdmin) {
          const now = new Date();
          const bookingStart = new Date(booking.startDateTime);
          const hoursRemaining = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

          if (hoursRemaining < activePolicies.cancelWindowHours) {
            return NextResponse.json(
              {
                error: `No puedes cancelar la reserva. Las políticas exigen al menos ${activePolicies.cancelWindowHours} horas de anticipación.`
              },
              { status: 400 }
            );
          }
        }

        const updated = await bookingRepository.update(id, { status: 'cancelled' });
        return NextResponse.json(updated);
      }

      // Other status changes (confirmed, pending, no_show) are restricted to admin
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'No autorizado para cambiar el estado de la reserva.' },
          { status: 403 }
        );
      }

      const updated = await bookingRepository.update(id, { status: status as BookingStatus });
      return NextResponse.json(updated);
    }

    // CASE 2: Request is a reschedule (updating dates)
    if (startDateTime && endDateTime) {
      // Enforce cancel/reschedule window limit for regular users
      if (!isAdmin) {
        const now = new Date();
        const bookingStart = new Date(booking.startDateTime);
        const hoursRemaining = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursRemaining < activePolicies.cancelWindowHours) {
          return NextResponse.json(
            {
              error: `No puedes reprogramar la reserva. Las políticas exigen al menos ${activePolicies.cancelWindowHours} horas de anticipación.`
            },
            { status: 400 }
          );
        }
      }

      // Run central policy check, excluding this booking ID from overlap checks
      const validation = await validateBooking({
        userId: booking.userId,
        userRole: isAdmin ? 'admin' : 'user',
        roomId: booking.roomId,
        serviceId: booking.serviceId,
        startDateTime,
        endDateTime,
        excludeBookingId: id
      });

      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'La reprogramación infringe las políticas vigentes.' },
          { status: 400 }
        );
      }

      const updateFields: any = {
        startDateTime,
        endDateTime
      };
      if (notes !== undefined) updateFields.notes = notes;

      const updated = await bookingRepository.update(id, updateFields);
      return NextResponse.json(updated);
    }

    // Only notes update
    if (notes !== undefined) {
      const updated = await bookingRepository.update(id, { notes });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No hay campos válidos para actualizar.' }, { status: 400 });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicie sesión.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const booking = await bookingRepository.getById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'La reserva especificada no existe.' },
        { status: 404 }
      );
    }

    const isOwner = booking.userId === session.userId;
    const isAdmin = session.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'No tiene permisos para cancelar esta reserva.' },
        { status: 403 }
      );
    }

    const [room, service, settings] = await Promise.all([
      roomRepository.getById(booking.roomId),
      serviceRepository.getById(booking.serviceId),
      settingsRepository.getSettings()
    ]);

    const activePolicies = resolveActivePolicies(settings.globalPolicies, service, room);

    // Enforce cancellation window
    if (!isAdmin) {
      const now = new Date();
      const bookingStart = new Date(booking.startDateTime);
      const hoursRemaining = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursRemaining < activePolicies.cancelWindowHours) {
        return NextResponse.json(
          {
            error: `No puedes cancelar la reserva. Las políticas exigen al menos ${activePolicies.cancelWindowHours} horas de anticipación.`
          },
          { status: 400 }
        );
      }
    }

    // In a deletion we actually mark as cancelled for database integrity
    const updated = await bookingRepository.update(id, { status: 'cancelled' });
    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error('Error deleting/cancelling booking:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
