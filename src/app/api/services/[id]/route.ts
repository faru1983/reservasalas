import { NextRequest, NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import { serviceRepository } from '@/lib/repositories/factory';

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

    const service = await serviceRepository.getById(id);
    if (!service) {
      return NextResponse.json(
        { error: 'El servicio especificado no existe.' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.durationBlock !== undefined) updateData.durationBlock = Number(body.durationBlock);
    if (body.color !== undefined) updateData.color = body.color;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.policiesOverride !== undefined) updateData.policiesOverride = body.policiesOverride;

    const updated = await serviceRepository.update(id, updateData);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating service:', error);
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
    const service = await serviceRepository.getById(id);
    if (!service) {
      return NextResponse.json(
        { error: 'El servicio especificado no existe.' },
        { status: 404 }
      );
    }

    await serviceRepository.delete(id);
    return NextResponse.json({ success: true, message: 'Servicio eliminado correctamente.' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
