import { NextRequest, NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import { roomRepository } from '@/lib/repositories/factory';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = checkRole(req, ['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const room = await roomRepository.getById(id);
    if (!room) {
      return NextResponse.json(
        { error: 'La sala especificada no existe.' },
        { status: 404 }
      );
    }

    // Keep data types safe
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.policiesOverride !== undefined) updateData.policiesOverride = body.policiesOverride;

    const updated = await roomRepository.update(id, updateData);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating room:', error);
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
    const session = checkRole(req, ['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const room = await roomRepository.getById(id);
    if (!room) {
      return NextResponse.json(
        { error: 'La sala especificada no existe.' },
        { status: 404 }
      );
    }

    await roomRepository.delete(id);
    return NextResponse.json({ success: true, message: 'Sala eliminada correctamente.' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
