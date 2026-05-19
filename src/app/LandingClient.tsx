'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  User,
  Shield,
  Loader2,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Room, Service, BookingPolicies } from '@/types';

interface LandingClientProps {
  initialRooms: Room[];
  initialServices: Service[];
  globalPolicies: Required<BookingPolicies>;
  session: { userId: string; name: string; email: string; role: string } | null;
}

export default function LandingClient({
  initialRooms,
  initialServices,
  globalPolicies,
  session
}: LandingClientProps) {
  const router = useRouter();

  // Wizard state
  const [selectedRoomId, setSelectedRoomId] = useState(initialRooms[0]?.id || '');
  const [selectedServiceId, setSelectedServiceId] = useState(initialServices[0]?.id || '');
  
  // Date default to tomorrow (so it conforms easily to minAdvance policies)
  const getTomorrowDateStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [bookingDate, setBookingDate] = useState(getTomorrowDateStr());
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const selectedRoom = initialRooms.find((r) => r.id === selectedRoomId);
  const selectedService = initialServices.find((s) => s.id === selectedServiceId);

  // Dynamic values resolved by room override > service override > global
  const activeSlotDuration = selectedRoom?.policiesOverride?.slotDuration 
    || selectedService?.policiesOverride?.slotDuration 
    || globalPolicies.slotDuration;

  const activeMinDuration = selectedRoom?.policiesOverride?.minDuration
    || selectedService?.policiesOverride?.minDuration
    || globalPolicies.minDuration;

  const activeMaxDuration = selectedRoom?.policiesOverride?.maxDuration
    || selectedService?.policiesOverride?.maxDuration
    || globalPolicies.maxDuration;

  const activeHoursStart = selectedRoom?.policiesOverride?.allowedHoursStart
    || selectedService?.policiesOverride?.allowedHoursStart
    || globalPolicies.allowedHoursStart;

  const activeHoursEnd = selectedRoom?.policiesOverride?.allowedHoursEnd
    || selectedService?.policiesOverride?.allowedHoursEnd
    || globalPolicies.allowedHoursEnd;

  // Whenever selected service changes, adjust default duration to service duration block
  useEffect(() => {
    if (selectedService) {
      setDuration(String(selectedService.durationBlock));
    }
  }, [selectedServiceId]);

  // Generate available start times dropdown
  const generateTimeSlots = () => {
    const slots = [];
    const [startH, startM] = activeHoursStart.split(':').map(Number);
    const [endH, endM] = activeHoursEnd.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + Number(duration) <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${pad(h)}:${pad(m)}`;
      slots.push(timeStr);
      currentMinutes += activeSlotDuration;
    }
    return slots;
  };

  // Generate duration choices
  const generateDurations = () => {
    const choices = [];
    const block = selectedService ? selectedService.durationBlock : 15;
    let curr = Math.max(block, activeMinDuration);

    while (curr <= activeMaxDuration) {
      choices.push({
        value: curr,
        label: curr >= 60 ? `${curr / 60}h` : `${curr}m`
      });
      curr += block;
    }
    return choices;
  };

  const handleBookingSubmit = async (e?: React.FormEvent, forceUserId?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Check auth
    if (!session && !forceUserId) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);

    const [startH, startM] = startTime.split(':').map(Number);
    const startDateTime = new Date(`${bookingDate}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`);
    const endDateTime = new Date(startDateTime.getTime() + Number(duration) * 60 * 1000);

    try {
      const payload: any = {
        roomId: selectedRoomId,
        serviceId: selectedServiceId,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        notes
      };

      if (forceUserId) {
        payload.userId = forceUserId;
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo crear la reserva.');
        setLoading(false);
        return;
      }

      setBookingSuccess(data);
      setLoading(false);
    } catch (err) {
      setErrorMsg('Ocurrió un error inesperado al procesar la reserva.');
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyPayload =
        authTab === 'login'
          ? { email: authEmail, password: authPassword }
          : { name: authName, email: authEmail, password: authPassword, phone: authPhone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Error en autenticación.');
        setAuthLoading(false);
        return;
      }

      setShowAuthModal(false);
      setAuthLoading(false);
      
      // Auto trigger booking
      await handleBookingSubmit(undefined, data.user.id);
      router.refresh();
    } catch (err) {
      setAuthError('Ocurrió un error al procesar tu solicitud.');
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  };

  const timeSlots = generateTimeSlots();
  const durationOptions = generateDurations();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* 1. Stunning High-Fidelity Human Styled Animated Mesh Backgrounds */}
      <div className="premium-grid-overlay animate-grid-pan" />
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-900/15 blur-[120px] animate-drift-slow pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-950/20 blur-[130px] animate-drift-medium pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-purple-950/10 blur-[110px] animate-drift-slow pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Calendar className="w-5.5 h-5.5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Reserva<span className="text-indigo-400">Flow</span>
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Hola, <span className="text-slate-200 font-bold">{session.name}</span>
                </span>
                <Link
                  href={session.role === 'admin' ? '/admin' : '/dashboard'}
                  className="inline-flex items-center text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-2.5 px-5 rounded-2xl shadow-lg hover:shadow-indigo-600/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 gap-1.5"
                >
                  <Layers className="w-4 h-4" /> Mi Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-xs sm:text-sm font-bold text-slate-400 hover:text-white py-2 px-3 border border-slate-800 bg-slate-900/40 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs sm:text-sm font-bold text-slate-300 hover:text-white border border-slate-800 bg-slate-900/40 hover:bg-slate-800 py-2.5 px-5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-2.5 px-5 rounded-xl shadow-lg hover:shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 gap-1"
                >
                  Registrarse <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 z-10">
        
        {/* Left Hero Area */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/10 bg-indigo-950/30 text-indigo-400 text-xs font-bold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
            MVP de Reservas Premium & RLS Ready
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
            Espacios que inspiran,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              reservas sin fricción.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
            Agenda salas de reuniones con un motor de políticas que verifica capacidades y solapamientos en tiempo real. Un diseño limpio y robusto listo para migrar a Supabase.
          </p>

          {/* Quick value indicators */}
          <div className="grid grid-cols-3 gap-4 pt-4 max-w-md mx-auto lg:mx-0 text-left">
            <div className="premium-glass-card p-4 rounded-2xl hover:scale-[1.03] transition-transform duration-200">
              <span className="block text-xl sm:text-2xl font-black text-white">100%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Políticas Activas</span>
            </div>
            <div className="premium-glass-card p-4 rounded-2xl hover:scale-[1.03] transition-transform duration-200">
              <span className="block text-xl sm:text-2xl font-black text-white">&lt; 15m</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bloques Flexibles</span>
            </div>
            <div className="premium-glass-card p-4 rounded-2xl hover:scale-[1.03] transition-transform duration-200">
              <span className="block text-xl sm:text-2xl font-black text-white">Ready</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Supabase Postgres</span>
            </div>
          </div>
        </div>

        {/* Right Form Wizard Area */}
        <div className="w-full max-w-lg shrink-0">
          <div className="premium-glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group/wizard">
            {/* Ambient glare on wizard card */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent group-hover/wizard:via-indigo-400/60 transition-all duration-500" />
            
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-950/40 px-2.5 py-1 rounded-full border border-slate-800/40">
                Paso Único
              </span>
            </div>

            {bookingSuccess ? (
              /* Booking Success UI */
              <div className="text-center py-8 space-y-6">
                <div className="inline-flex p-4 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 shadow-xl shadow-emerald-950/40 animate-scale-up">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">¡Reserva Completada!</h3>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto">
                    Tu reserva ha sido registrada correctamente. Puedes verificarla o modificarla desde tu portal personal.
                  </p>
                </div>

                <div className="border border-slate-900 bg-slate-950/80 p-5 rounded-2xl text-left text-xs space-y-2.5 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sala elegida:</span>
                    <span className="text-white font-bold">{selectedRoom?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Servicio solicitado:</span>
                    <span className="text-white font-bold">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha agendada:</span>
                    <span className="text-white font-bold">{bookingDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Horario de uso:</span>
                    <span className="text-white font-bold">{startTime} ({duration} minutos)</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2 mt-2">
                    <span className="text-slate-500">Estado inicial:</span>
                    <span className={`font-black uppercase px-2 py-0.5 rounded-full text-[9px] ${
                      bookingSuccess.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                    }`}>
                      {bookingSuccess.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setBookingSuccess(null);
                      setErrorMsg('');
                    }}
                    className="py-2.5 px-5 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Nueva Reserva
                  </button>
                  <Link
                    href={session?.role === 'admin' ? '/admin' : '/dashboard'}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-indigo-600/20 hover:scale-[1.03] transition-all"
                  >
                    Ir a mi Agenda
                  </Link>
                </div>
              </div>
            ) : (
              /* Booking Form UI */
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white mb-1 flex items-center gap-1.5">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Reserva tu Espacio
                  </h3>
                  <p className="text-slate-500 text-[11px] font-semibold">Completa los detalles para verificar disponibilidad instantánea.</p>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-2xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-xs font-bold text-red-200">{errorMsg}</div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Select Room */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      1. Selecciona la Sala
                    </label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
                    >
                      {initialRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Capacidad: {r.capacity} pers)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Service */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      2. Tipo de Actividad
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
                    >
                      {initialServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Bloques de {s.durationBlock} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Start Hour Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Hora Inicio
                      </label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
                      >
                        {timeSlots.length > 0 ? (
                          timeSlots.map((ts) => (
                            <option key={ts} value={ts}>
                              {ts} hs
                            </option>
                          ))
                        ) : (
                          <option value="09:00">Sin slots disponibles</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Duration Choices */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Duración Estimada
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {durationOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDuration(String(opt.value))}
                          className={`py-2 rounded-xl border text-[11px] font-black tracking-tight hover:scale-[1.05] active:scale-[0.98] transition-all duration-200 ${
                            duration === String(opt.value)
                              ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/30'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes / Description */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Detalles de la reunión
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Motivo de la sesión..."
                      className="block w-full rounded-xl border border-slate-800/80 bg-slate-950 px-3.5 py-2 text-slate-200 placeholder-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        Validando políticas...
                      </>
                    ) : (
                      <>
                        Confirmar Reserva
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Showcase Section */}
      <section className="border-t border-slate-900/60 bg-slate-950/20 py-16 lg:py-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Salas de Trabajo Equipadas
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Espacios corporativos premium equipados con proyector de alta definición, conectividad de fibra óptica y controles acústicos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {initialRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`group rounded-3xl overflow-hidden cursor-pointer premium-glass-card transition-all duration-300 ${
                  selectedRoomId === room.id
                    ? 'border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-indigo-950/40 shadow-2xl scale-[1.02]'
                    : 'hover:scale-[1.01]'
                }`}
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={room.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ease-out"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/40 text-[10px] px-2.5 py-1 rounded-full text-slate-300 font-bold flex items-center gap-1 shadow-md">
                    <Users className="w-3 h-3 text-indigo-400" />
                    Capacidad: {room.capacity}
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {room.name}
                    </h4>
                    {selectedRoomId === room.id && (
                      <span className="p-1 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-400 animate-scale-up">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                    {room.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth/Registration Wizard Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-xl transition-colors"
            >
              Cerrar
            </button>

            {/* Tabs */}
            <div className="flex border-b border-slate-850 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError('');
                }}
                className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                  authTab === 'register' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Crear Cuenta
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError('');
                }}
                className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                  authTab === 'login' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Tengo Cuenta
              </button>
            </div>

            <div>
              <h4 className="text-base font-black text-white mb-1">
                {authTab === 'register' ? 'Regístrate para confirmar' : 'Inicia sesión para confirmar'}
              </h4>
              <p className="text-slate-400 text-[11px] mb-4">
                Necesitamos asociar la reserva a tu usuario para validar políticas operativas y capacidades.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-900/40 rounded-xl flex items-start gap-2.5 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-[11px] font-bold text-red-200">{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authTab === 'register' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none text-xs transition-colors"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono (Opcional)</label>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none text-xs transition-colors"
                      placeholder="+56912345678"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none text-xs transition-colors"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none text-xs transition-colors"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-all cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Procesando...
                    </>
                  ) : authTab === 'register' ? (
                    'Registrarme y Reservar'
                  ) : (
                    'Iniciar Sesión y Reservar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/60 py-8 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 ReservaFlow. Todos los derechos reservados. MVP premium construido bajo estándares de UI modernos.</p>
      </footer>
    </div>
  );
}
