import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkRole } from '@/lib/auth';
import { roomRepository } from '@/lib/repositories/factory';
import { Room } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    const rooms = await roomRepository.listAll();

    // If admin is requesting, show all; otherwise, filter only active rooms
    if (session && session.role === 'admin') {
      return NextResponse.json(rooms);
    } else {
      return NextResponse.json(rooms.filter((r) => r.isActive));
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al obtener las salas.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = checkRole(req, ['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const { name, description, capacity, imageUrl, isActive, policiesOverride } = await req.json();

    if (!name || capacity === undefined) {
      return NextResponse.json(
        { error: 'El nombre y la capacidad son campos requeridos.' },
        { status: 400 }
      );
    }

    const newRoom: Room = {
      id: 'room_' + Math.random().toString(36).substr(2, 9),
      name,
      description: description || '',
      capacity: Number(capacity),
      imageUrl: imageUrl || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      policiesOverride: policiesOverride || undefined,
      createdAt: new Date().toISOString()
    };

    await roomRepository.create(newRoom);
    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
