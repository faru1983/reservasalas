import {
  roomRepository,
  serviceRepository,
  bookingRepository,
  settingsRepository
} from '../repositories/factory';
import { BookingPolicies, Room, Service, Booking } from '@/types';

export function resolveActivePolicies(
  global: BookingPolicies,
  service?: Service | null,
  room?: Room | null
): Required<BookingPolicies> {
  const getVal = <K extends keyof BookingPolicies>(key: K): Required<BookingPolicies>[K] => {
    if (room?.policiesOverride?.[key] !== undefined) {
      return room.policiesOverride[key] as Required<BookingPolicies>[K];
    }
    if (service?.policiesOverride?.[key] !== undefined) {
      return service.policiesOverride[key] as Required<BookingPolicies>[K];
    }
    return global[key] as Required<BookingPolicies>[K];
  };

  return {
    slotDuration: getVal('slotDuration') ?? 15,
    minDuration: getVal('minDuration') ?? 15,
    maxDuration: getVal('maxDuration') ?? 180,
    allowedHoursStart: getVal('allowedHoursStart') ?? '08:00',
    allowedHoursEnd: getVal('allowedHoursEnd') ?? '20:00',
    minAdvanceDays: getVal('minAdvanceDays') ?? 0,
    maxAdvanceDays: getVal('maxAdvanceDays') ?? 30,
    cancelWindowHours: getVal('cancelWindowHours') ?? 24,
    maxActiveBookings: getVal('maxActiveBookings') ?? 5,
    autoConfirm: getVal('autoConfirm') ?? true,
  };
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  policies?: Required<BookingPolicies>;
}

export async function validateBooking(params: {
  userId: string;
  userRole: string;
  roomId: string;
  serviceId: string;
  startDateTime: string;
  endDateTime: string;
  excludeBookingId?: string;
}): Promise<ValidationResult> {
  const { userId, userRole, roomId, serviceId, startDateTime, endDateTime, excludeBookingId } = params;

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Fechas de inicio o fin inválidas.' };
  }

  if (start >= end) {
    return { isValid: false, error: 'La hora de inicio debe ser anterior a la hora de fin.' };
  }

  // 1. Fetch details
  const [room, service, settings] = await Promise.all([
    roomRepository.getById(roomId),
    serviceRepository.getById(serviceId),
    settingsRepository.getSettings()
  ]);

  if (!room || !room.isActive) {
    return { isValid: false, error: 'La sala seleccionada no existe o no está activa.' };
  }

  if (!service || !service.isActive) {
    return { isValid: false, error: 'El servicio seleccionado no existe o no está activo.' };
  }

  // 2. Resolve Active Policies
  const policies = resolveActivePolicies(settings.globalPolicies, service, room);

  // 3. Admin bypass (optional, but let's keep validations strict except maybe limits, though standard validation applies)
  const isUserAdmin = userRole === 'admin';

  // Calculate duration in minutes
  const durationMs = end.getTime() - start.getTime();
  const durationMin = durationMs / (1000 * 60);

  // Duration Min / Max check
  if (durationMin < policies.minDuration) {
    return { isValid: false, error: `La duración mínima es de ${policies.minDuration} minutos.`, policies };
  }

  if (durationMin > policies.maxDuration) {
    return { isValid: false, error: `La duración máxima es de ${policies.maxDuration} minutos.`, policies };
  }

  // Slot duration alignment check
  if (durationMin % policies.slotDuration !== 0) {
    return { isValid: false, error: `La reserva debe ser múltiplo de bloques de ${policies.slotDuration} minutos.`, policies };
  }

  // Start alignment with slotDuration
  const startMinutesSinceMidnight = start.getUTCHours() * 60 + start.getUTCMinutes(); // using UTC or local depending on app convention. Let's check local time of the request.
  // Wait! Let's align using simple minutes alignment from the start hour.
  const startMin = start.getMinutes();
  if (startMin % policies.slotDuration !== 0) {
    return { isValid: false, error: `La hora de inicio debe estar alineada a intervalos de ${policies.slotDuration} minutos.`, policies };
  }

  // 4. Allowed operating hours check
  // Convert times to local or UTC-independent comparison (HH:MM matching)
  const pad = (n: number) => String(n).padStart(2, '0');
  const startLocalTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endLocalTimeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  const startMinVal = parseTimeToMinutes(startLocalTimeStr);
  const endMinVal = parseTimeToMinutes(endLocalTimeStr);
  const allowedStartMin = parseTimeToMinutes(policies.allowedHoursStart);
  const allowedEndMin = parseTimeToMinutes(policies.allowedHoursEnd);

  if (startMinVal < allowedStartMin || endMinVal > allowedEndMin) {
    return {
      isValid: false,
      error: `El horario de reserva permitido es entre las ${policies.allowedHoursStart} y las ${policies.allowedHoursEnd}.`,
      policies
    };
  }

  // 5. Special Dates / Blocked Dates Check
  const dateStr = start.toISOString().split('T')[0]; // YYYY-MM-DD
  const specialDate = settings.specialDates?.find((d) => d.date === dateStr);

  if (specialDate) {
    if (specialDate.isBlocked) {
      return { isValid: false, error: `El día ${dateStr} está cerrado u operativo bloqueado: ${specialDate.label}`, policies };
    }
    if (specialDate.allowedHoursStart && specialDate.allowedHoursEnd) {
      const spStartMin = parseTimeToMinutes(specialDate.allowedHoursStart);
      const spEndMin = parseTimeToMinutes(specialDate.allowedHoursEnd);
      if (startMinVal < spStartMin || endMinVal > spEndMin) {
        return {
          isValid: false,
          error: `Horario especial para hoy (${specialDate.label}): permitido de ${specialDate.allowedHoursStart} a ${specialDate.allowedHoursEnd}.`,
          policies
        };
      }
    }
  }

  // 6. Booking advance window (Admin bypassed)
  if (!isUserAdmin) {
    const now = new Date();
    const minAdvanceDate = new Date(now.getTime() + policies.minAdvanceDays * 24 * 60 * 60 * 1000);
    const maxAdvanceDate = new Date(now.getTime() + policies.maxAdvanceDays * 24 * 60 * 60 * 1000);

    if (start < now) {
      return { isValid: false, error: 'No se pueden hacer reservas en el pasado.', policies };
    }

    if (start < minAdvanceDate) {
      return { isValid: false, error: `Anticipación mínima para reservar es de ${policies.minAdvanceDays} días.`, policies };
    }

    if (start > maxAdvanceDate) {
      return { isValid: false, error: `Anticipación máxima para reservar es de ${policies.maxAdvanceDays} días.`, policies };
    }
  }

  // 7. Max active bookings per user (Admin bypassed)
  if (!isUserAdmin) {
    const activeBookings = await bookingRepository.listAll({
      userId,
      status: 'confirmed' // count only active/confirmed bookings
    });
    const pendingBookings = await bookingRepository.listAll({
      userId,
      status: 'pending'
    });

    const totalActive = activeBookings.length + pendingBookings.length;
    if (totalActive >= policies.maxActiveBookings) {
      return {
        isValid: false,
        error: `Has alcanzado el límite máximo de ${policies.maxActiveBookings} reservas activas/pendientes.`,
        policies
      };
    }
  }

  // 8. Prevent overlaps (Crucial overlap check)
  const roomBookings = await bookingRepository.listAll({
    roomId,
  });

  const overlap = roomBookings.find((b) => {
    if (b.status === 'cancelled' || b.status === 'no_show') return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;

    const bStart = new Date(b.startDateTime).getTime();
    const bEnd = new Date(b.endDateTime).getTime();
    const reqStart = start.getTime();
    const reqEnd = end.getTime();

    // Overlap condition: startA < endB AND endA > startB
    return reqStart < bEnd && reqEnd > bStart;
  });

  if (overlap) {
    return {
      isValid: false,
      error: 'La sala ya se encuentra reservada en el horario solicitado.',
      policies
    };
  }

  return { isValid: true, policies };
}
