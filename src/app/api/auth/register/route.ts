import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { userRepository } from '@/lib/repositories/factory';
import { hashPassword, signJwt, AUTH_COOKIE_NAME } from '@/lib/auth';
import { User } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'El nombre, correo y contraseña son requeridos.' },
        { status: 400 }
      );
    }

    // Check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato de correo no es válido.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const existingUser = await userRepository.getByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado.' },
        { status: 400 }
      );
    }

    // Create user
    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      role: 'user', // default role
      createdAt: new Date().toISOString(),
      phone: phone || undefined
    };

    await userRepository.create(newUser);

    // Auto-login
    const token = signJwt({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}
