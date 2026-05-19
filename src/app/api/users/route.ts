import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/factory';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const users = await userRepository.listAll();
    // Exclude password hashes for security
    const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al obtener la lista de usuarios.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicie sesión.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, name, phone, notes, role } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'El ID de usuario es requerido.' },
        { status: 400 }
      );
    }

    const isAdmin = session.role === 'admin';
    const isSelf = session.userId === id;

    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: 'No autorizado para modificar este usuario.' },
        { status: 403 }
      );
    }

    const user = await userRepository.getById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado.' },
        { status: 404 }
      );
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (notes !== undefined) updateFields.notes = notes;

    // Security: Only admins can change a user's role
    if (role !== undefined && isAdmin) {
      updateFields.role = role;
    }

    const updated = await userRepository.update(id, updateFields);
    const { passwordHash, ...safeUpdated } = updated;

    return NextResponse.json({
      success: true,
      user: safeUpdated
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
