import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkRole } from '@/lib/auth';
import { serviceRepository } from '@/lib/repositories/factory';
import { Service } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    const services = await serviceRepository.listAll();

    if (session && session.role === 'admin') {
      return NextResponse.json(services);
    } else {
      return NextResponse.json(services.filter((s) => s.isActive));
    }
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al obtener los servicios.' },
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

    const { name, description, durationBlock, color, isActive, policiesOverride } = await req.json();

    if (!name || !durationBlock || !color) {
      return NextResponse.json(
        { error: 'El nombre, la duración del bloque y el color son campos requeridos.' },
        { status: 400 }
      );
    }

    const newService: Service = {
      id: 'service_' + Math.random().toString(36).substr(2, 9),
      name,
      description: description || '',
      durationBlock: Number(durationBlock),
      color,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      policiesOverride: policiesOverride || undefined,
      createdAt: new Date().toISOString()
    };

    await serviceRepository.create(newService);
    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
