'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  Edit2,
  CalendarCheck,
  ShieldAlert,
  Loader2,
  LogOut,
  MapPin,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Home,
  ArrowRight
} from 'lucide-react';
import { Booking, Room, Service, BookingStatus } from '@/types';

interface DashboardClientProps {
  userSession: { userId: string; name: string; email: string; role: string };
  userBookings: Booking[];
  activeRooms: Room[];
  activeServices: Service[];
}

export default function DashboardClient({
  userSession,
  userBookings,
  activeRooms,
  activeServices
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bookings' | 'new_booking' | 'profile'>('bookings');
  
  // Bookings list state
  const [bookings, setBookings] = useState<Booking[]>(userBookings);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [actionError, setActionError] = useState('');

  // Reschedule state
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newDuration, setNewDuration] = useState('60');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // New booking form state (embedded inside dashboard)
  const [newRoomId, setNewRoomId] = useState(activeRooms[0]?.id || '');
  const [newServiceId, setNewServiceId] = useState(activeServices[0]?.id || '');
  const [newBookingDate, setNewBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newDurationMin, setNewDurationMin] = useState('60');
  const [newNotes, setNewNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Profile Form state
  const [profileName, setProfileName] = useState(userSession.name);
  const [profilePhone, setProfilePhone] = useState('');
  const [profileNotes, setProfileNotes] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Fetch full details of profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setProfileName(data.user.name);
            setProfilePhone(data.user.phone || '');
            setProfileNotes(data.user.notes || '');
          }
        }
      } catch (err) {
        console.error('Failed to load profile details');
      }
    }
    fetchProfile();
  }, []);

  const refreshBookings = async () => {
    setLoadingBookings(true);
    setActionError('');
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        setActionError('No se pudieron recargar las reservas.');
      }
    } catch {
      setActionError('Error de red al recargar.');
    } finally {
      setLoadingBookings(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    setActionError('');
    setLoadingBookings(true);

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'No se pudo cancelar la reserva.');
        setLoadingBookings(false);
        return;
      }

      await refreshBookings();
    } catch {
      setActionError('Ocurrió un error inesperado al procesar la cancelación.');
      setLoadingBookings(false);
    }
  };

  const handleRescheduleOpen = (booking: Booking) => {
    setReschedulingBooking(booking);
    const start = new Date(booking.startDateTime);
    setNewDate(booking.startDateTime.split('T')[0]);
    const pad = (n: number) => String(n).padStart(2, '0');
    setNewTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
    
    const durationMs = new Date(booking.endDateTime).getTime() - start.getTime();
    setNewDuration(String(durationMs / (1000 * 60)));
    setRescheduleError('');
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingBooking) return;
    setRescheduleError('');
    setRescheduleLoading(true);

    const [h, m] = newTime.split(':').map(Number);
    const startDateTime = new Date(`${newDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    const endDateTime = new Date(startDateTime.getTime() + Number(newDuration) * 60 * 1000);

    try {
      const res = await fetch(`/api/bookings/${reschedulingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setRescheduleError(data.error || 'Ocurrió un error al reprogramar.');
        setRescheduleLoading(false);
        return;
      }

      setReschedulingBooking(null);
      setRescheduleLoading(false);
      await refreshBookings();
    } catch {
      setRescheduleError('Error de servidor al reprogramar la reserva.');
      setRescheduleLoading(false);
    }
  };

  const handleNewBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setActionError('');
    
    const [h, m] = newStartTime.split(':').map(Number);
    const startDateTime = new Date(`${newBookingDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    const endDateTime = new Date(startDateTime.getTime() + Number(newDurationMin) * 60 * 1000);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: newRoomId,
          serviceId: newServiceId,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          notes: newNotes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'Error al validar las políticas de reserva.');
        setFormLoading(false);
        return;
      }

      setFormSuccess(true);
      setFormLoading(false);
      setNewNotes('');
      await refreshBookings();
      setTimeout(() => {
        setFormSuccess(false);
        setActiveTab('bookings');
      }, 2000);
    } catch {
      setActionError('Ocurrió un error al enviar la reserva.');
      setFormLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    setProfileError('');

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userSession.userId,
          name: profileName,
          phone: profilePhone,
          notes: profileNotes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileError(data.error || 'No se pudo actualizar el perfil.');
        setProfileLoading(false);
        return;
      }

      setProfileSuccess(true);
      setProfileLoading(false);
      router.refresh();
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError('Error inesperado al guardar.');
      setProfileLoading(false);
    }
  };

  const nowTime = new Date().getTime();
  const activeBookings = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'no_show' && new Date(b.startDateTime).getTime() >= nowTime
  );
  
  const historyBookings = bookings.filter(
    (b) => b.status === 'cancelled' || b.status === 'no_show' || new Date(b.startDateTime).getTime() < nowTime
  );

  const formatFriendlyDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFriendlyTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* Dynamic human-designed mesh overlay */}
      <div className="premium-grid-overlay animate-grid-pan" />
      <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px] animate-drift-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-950/10 blur-[130px] animate-drift-medium pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-45">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight hidden sm:inline">
              Reserva<span className="text-indigo-400">Flow</span>
            </span>
            <span className="text-slate-800 mx-2 hidden sm:inline">|</span>
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Portal Usuario
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-white py-2 px-3 border border-slate-800 bg-slate-900/40 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Home className="w-4 h-4" /> Inicio
            </Link>
            <button
              onClick={logout}
              className="text-xs font-bold text-slate-400 hover:text-white py-2 px-3 border border-slate-800 bg-slate-900/40 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col lg:flex-row gap-8 z-10">
        
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="premium-glass-card rounded-3xl p-5 space-y-2">
            <div className="p-3 border-b border-slate-850 mb-3">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Identidad</span>
              <span className="block text-sm font-black text-white leading-tight truncate">{profileName}</span>
              <span className="block text-[11px] text-slate-400 truncate mt-0.5">{userSession.email}</span>
            </div>

            <button
              onClick={() => {
                setActiveTab('bookings');
                setActionError('');
              }}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                activeTab === 'bookings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" /> Mis Reservas
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'bookings' ? 'bg-indigo-700 text-white' : 'bg-slate-950 border border-slate-850 text-slate-400'
              }`}>
                {activeBookings.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('new_booking');
                setActionError('');
              }}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                activeTab === 'new_booking'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nueva Reserva
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-55" />
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                setActionError('');
              }}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" /> Mi Perfil
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-55" />
            </button>
          </div>
        </aside>

        {/* Dashboard Dynamic Area */}
        <main className="flex-1 min-w-0">
          
          {actionError && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-900/40 rounded-2xl flex items-start gap-3 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs font-bold text-red-200">{actionError}</div>
            </div>
          )}

          {activeTab === 'bookings' && (
            /* TAB 1: BOOKINGS LISTING */
            <div className="space-y-8 animate-scale-up">
              {/* Active Section */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-900/60 pb-2">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-indigo-400" />
                    Reservas Activas
                  </h3>
                  <button
                    onClick={refreshBookings}
                    disabled={loadingBookings}
                    className="p-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingBookings ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingBookings && bookings.length === 0 ? (
                  <div className="text-center py-12 premium-glass-card rounded-3xl">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                    <span className="text-slate-400 text-xs font-semibold">Sincronizando agenda...</span>
                  </div>
                ) : activeBookings.length === 0 ? (
                  <div className="text-center py-12 premium-glass-card border-dashed border-slate-800/80 rounded-3xl space-y-4">
                    <p className="text-slate-500 text-xs font-semibold">No posees reservas programadas en este momento.</p>
                    <button
                      onClick={() => setActiveTab('new_booking')}
                      className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg transition-all"
                    >
                      Agendar Ahora
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeBookings.map((b) => (
                      <div
                        key={b.id}
                        className="premium-glass-card rounded-2xl p-5 flex flex-col justify-between group/card relative"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-950/80 border border-slate-800/50 text-indigo-400 mb-1.5">
                                {b.serviceName}
                              </span>
                              <h4 className="text-sm font-black text-white leading-tight group-hover/card:text-indigo-400 transition-colors">{b.roomName}</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              b.status === 'confirmed' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                            }`}>
                              {b.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 space-y-1.5 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>{formatFriendlyDate(b.startDateTime)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{formatFriendlyTime(b.startDateTime)} hs - {formatFriendlyTime(b.endDateTime)} hs</span>
                            </div>
                          </div>

                          {b.notes && (
                            <p className="text-[11px] text-slate-500 italic line-clamp-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60 leading-normal">
                              "{b.notes}"
                            </p>
                          )}
                        </div>

                        <div className="pt-3.5 border-t border-slate-900/60 flex justify-between gap-3 mt-4">
                          <button
                            onClick={() => handleRescheduleOpen(b)}
                            className="flex-1 py-2 px-3 border border-slate-800 hover:bg-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all"
                          >
                            <Edit2 className="w-3 h-3" /> Reprogramar
                          </button>
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="flex-1 py-2 px-3 border border-red-950/20 hover:bg-red-950/40 hover:border-red-900 rounded-xl text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center justify-center gap-1 transition-all"
                          >
                            <Trash2 className="w-3 h-3" /> Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History Section */}
              <div>
                <h3 className="text-base font-black text-white border-b border-slate-900/60 pb-2 mb-4">
                  Historial de Reuniones
                </h3>

                {historyBookings.length === 0 ? (
                  <p className="text-slate-500 text-xs italic py-2">No se encuentran agendas antiguas en el registro.</p>
                ) : (
                  <div className="premium-glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900/40 text-slate-400 font-bold border-b border-slate-900/60">
                            <th className="p-4">Sala</th>
                            <th className="p-4">Servicio</th>
                            <th className="p-4">Fecha y Horario</th>
                            <th className="p-4">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/40">
                          {historyBookings.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-900/20">
                              <td className="p-4 font-bold text-white">{b.roomName}</td>
                              <td className="p-4 text-slate-300 font-semibold">{b.serviceName}</td>
                              <td className="p-4 text-slate-400 font-semibold space-y-0.5">
                                <div>{formatFriendlyDate(b.startDateTime)}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {formatFriendlyTime(b.startDateTime)} - {formatFriendlyTime(b.endDateTime)} hs
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  b.status === 'cancelled'
                                    ? 'bg-red-950/80 text-red-400 border border-red-900/30'
                                    : b.status === 'no_show'
                                    ? 'bg-slate-900/80 text-slate-400 border border-slate-800'
                                    : 'bg-slate-950 text-slate-500 border border-slate-850'
                                }`}>
                                  {b.status === 'cancelled' ? 'Cancelada' : b.status === 'no_show' ? 'Ausente' : 'Finalizada'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'new_booking' && (
            /* TAB 2: CREATE BOOKING WIZARD */
            <div className="premium-glass-card rounded-3xl p-6 sm:p-8 max-w-2xl animate-scale-up">
              <h3 className="text-lg font-black text-white mb-1">Nueva Reserva</h3>
              <p className="text-slate-400 text-xs font-semibold mb-6">Agenda salas validando en tiempo real las políticas organizacionales.</p>

              {formSuccess ? (
                <div className="text-center py-10 space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-black text-white">¡Reserva Registrada Exitosamente!</h4>
                  <p className="text-slate-400 text-xs font-semibold">Sincronizando panel principal...</p>
                </div>
              ) : (
                <form onSubmit={handleNewBooking} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sala de Reunión</label>
                      <select
                        value={newRoomId}
                        onChange={(e) => setNewRoomId(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      >
                        {activeRooms.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Servicio o Actividad</label>
                      <select
                        value={newServiceId}
                        onChange={(e) => setNewServiceId(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      >
                        {activeServices.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.durationBlock} min)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fecha</label>
                      <input
                        type="date"
                        value={newBookingDate}
                        onChange={(e) => setNewBookingDate(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hora de Inicio</label>
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duración (Minutos)</label>
                    <select
                      value={newDurationMin}
                      onChange={(e) => setNewDurationMin(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      <option value="15">15 Minutos</option>
                      <option value="30">30 Minutos</option>
                      <option value="45">45 Minutos</option>
                      <option value="60">1 Hora (60 min)</option>
                      <option value="90">1.5 Horas (90 min)</option>
                      <option value="120">2 Horas (120 min)</option>
                      <option value="180">3 Horas (180 min)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Notas de Reunión</label>
                    <textarea
                      rows={2}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Motivo de la reunión..."
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookings')}
                      className="py-2 px-4 border border-slate-800 hover:bg-slate-950 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        'Agendar Reserva'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            /* TAB 3: PROFILE SETTINGS */
            <div className="premium-glass-card rounded-3xl p-6 sm:p-8 max-w-xl animate-scale-up">
              <h3 className="text-lg font-black text-white mb-1">Mi Perfil</h3>
              <p className="text-slate-400 text-xs font-semibold mb-6">Actualiza tu información personal y detalles de contacto corporativo.</p>

              {profileSuccess && (
                <div className="mb-4 p-4 bg-emerald-950/40 border border-emerald-900 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-scale-up" />
                  Perfil actualizado con éxito.
                </div>
              )}

              {profileError && (
                <div className="mb-4 p-4 bg-red-950/40 border border-red-950 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Correo Electrónico (Solo Lectura)</label>
                  <input
                    type="email"
                    disabled
                    value={userSession.email}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/30 px-3.5 py-2.5 text-slate-500 text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Teléfono Móvil</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+56912345678"
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Detalles Adicionales</label>
                  <textarea
                    rows={2}
                    value={profileNotes}
                    onChange={(e) => setProfileNotes(e.target.value)}
                    placeholder="Departamento, cargo, bio..."
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {profileLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* Reschedule Modal */}
      {reschedulingBooking && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setReschedulingBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-xl transition-colors"
            >
              Cerrar
            </button>

            <div className="mb-6">
              <h4 className="text-base font-black text-white mb-1">Reprogramar Reserva</h4>
              <p className="text-slate-400 text-xs font-semibold">
                Modifica el día u horario de tu reserva en <span className="text-white font-bold">{reschedulingBooking.roomName}</span>.
              </p>
            </div>

            {rescheduleError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-xl flex items-start gap-2.5 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs font-bold text-red-200">{rescheduleError}</span>
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nueva Fecha</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hora de Inicio</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duración</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="15">15 Minutos</option>
                    <option value="30">30 Minutos</option>
                    <option value="45">45 Minutos</option>
                    <option value="60">60 Minutos (1h)</option>
                    <option value="90">90 Minutos</option>
                    <option value="120">120 Minutos (2h)</option>
                    <option value="180">180 Minutos (3h)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReschedulingBooking(null)}
                  className="py-2 px-4 border border-slate-800 hover:bg-slate-950 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {rescheduleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reprogramando...
                    </>
                  ) : (
                    'Confirmar Cambio'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/60 py-8 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 ReservaFlow. Dashboard del Usuario. MVP premium construido bajo estándares de UI modernos.</p>
      </footer>
    </div>
  );
}
