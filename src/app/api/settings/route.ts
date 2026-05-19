import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkRole } from '@/lib/auth';
import { settingsRepository } from '@/lib/repositories/factory';

export async function GET(req: NextRequest) {
  try {
    const settings = await settingsRepository.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al obtener la configuración.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = checkRole(req, ['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await settingsRepository.updateSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
