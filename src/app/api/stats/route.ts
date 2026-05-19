import { NextRequest, NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import { bookingRepository } from '@/lib/repositories/factory';

export async function GET(req: NextRequest) {
  try {
    const session = checkRole(req, ['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Load bookings based on optional date filters
    const bookings = await bookingRepository.listAll({
      startDate,
      endDate
    });

    const totalBookings = bookings.length;

    // 1. Bookings by Status
    const statusCounts = {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      no_show: 0
    };

    // 2. Bookings by Room
    const roomCounts: { [key: string]: { name: string; count: number } } = {};

    // 3. Bookings by Service
    const serviceCounts: { [key: string]: { name: string; count: number; color: string } } = {};

    // 4. Peak Hours (hour of day 0-23)
    const hourCounts: { [key: number]: number } = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;

    // 5. Bookings by Day (YYYY-MM-DD)
    const dayCounts: { [key: string]: number } = {};

    // Process all bookings in a single pass
    bookings.forEach((b) => {
      // Status
      if (b.status in statusCounts) {
        statusCounts[b.status as keyof typeof statusCounts]++;
      }

      // Room
      if (!roomCounts[b.roomId]) {
        roomCounts[b.roomId] = { name: b.roomName || 'Sala Desconocida', count: 0 };
      }
      roomCounts[b.roomId].count++;

      // Service
      if (!serviceCounts[b.serviceId]) {
        // Find service color or fallback
        serviceCounts[b.serviceId] = {
          name: b.serviceName || 'Servicio Desconocido',
          count: 0,
          color: 'indigo'
        };
      }
      serviceCounts[b.serviceId].count++;

      // Peak Hours
      const startHour = new Date(b.startDateTime).getHours();
      hourCounts[startHour] = (hourCounts[startHour] || 0) + 1;

      // Day period (YYYY-MM-DD)
      const dayStr = b.startDateTime.split('T')[0];
      dayCounts[dayStr] = (dayCounts[dayStr] || 0) + 1;
    });

    // Formatting statistics for consumption
    const topRooms = Object.values(roomCounts).sort((a, b) => b.count - a.count);
    const topServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count);

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count);

    const timeline = Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalBookings,
      statusCounts,
      topRooms,
      topServices,
      peakHours,
      timeline
    });
  } catch (error) {
    console.error('Error generating statistics:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar las estadísticas.' },
      { status: 500 }
    );
  }
}
