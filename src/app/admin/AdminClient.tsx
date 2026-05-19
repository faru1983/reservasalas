'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  Edit,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Settings,
  DollarSign,
  TrendingUp,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  AlertCircle,
  Home,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
  Sliders,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { Booking, Room, Service, SystemSettings, SpecialDate, UserRole } from '@/types';

interface AdminClientProps {
  adminSession: { userId: string; name: string; email: string; role: string };
  initialBookings: Booking[];
  initialRooms: Room[];
  initialServices: Service[];
  initialSettings: SystemSettings;
  initialUsers: any[];
}

export default function AdminClient({
  adminSession,
  initialBookings,
  initialRooms,
  initialServices,
  initialSettings,
  initialUsers
}: AdminClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bookings' | 'rooms' | 'services' | 'calendar' | 'users' | 'stats'>('stats');

  // Core system states
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [users, setUsers] = useState<any[]>(initialUsers);

  // loading and operational alerts
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // STATS Tab states
  const [statsStartDate, setStatsStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [statsEndDate, setStatsEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // ROOM CRUD state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('10');
  const [roomImage, setRoomImage] = useState('');
  const [roomActive, setRoomActive] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);

  // SERVICE CRUD state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceBlock, setServiceBlock] = useState('60');
  const [serviceColor, setServiceColor] = useState('indigo');
  const [serviceActive, setServiceActive] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // CALENDAR Tab states
  const [newSpecialDate, setNewSpecialDate] = useState('');
  const [newSpecialLabel, setNewSpecialLabel] = useState('');
  const [newSpecialBlocked, setNewSpecialBlocked] = useState(true);
  const [newSpecialStart, setNewSpecialStart] = useState('08:00');
  const [newSpecialEnd, setNewSpecialEnd] = useState('20:00');

  // USER CRUD state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserPhone, setEditingUserPhone] = useState('');
  const [editingUserRole, setEditingUserRole] = useState<UserRole>('user');
  const [showUserModal, setShowUserModal] = useState(false);

  // Load stats dynamically when date filters change
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/stats?startDate=${statsStartDate}&endDate=${statsEndDate}`);
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [statsStartDate, statsEndDate]);

  // General data sync helpers
  const syncBookings = async () => {
    const res = await fetch('/api/bookings');
    if (res.ok) setBookings(await res.json());
  };
  const syncRooms = async () => {
    const res = await fetch('/api/rooms');
    if (res.ok) setRooms(await res.json());
  };
  const syncServices = async () => {
    const res = await fetch('/api/services');
    if (res.ok) setServices(await res.json());
  };
  const syncUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
  };

  const triggerToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 4500);
    }
  };

  // BOOKING Actions
  const handleUpdateBookingStatus = async (id: string, newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        triggerToast('error', data.error || 'No se pudo actualizar la reserva.');
      } else {
        triggerToast('success', `Reserva ${newStatus === 'confirmed' ? 'confirmada' : 'cancelada'} correctamente.`);
        await syncBookings();
        fetchStats();
      }
    } catch {
      triggerToast('error', 'Error al comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // ROOM CRUD Actions
  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomName(room.name);
      setRoomDesc(room.description);
      setRoomCapacity(String(room.capacity));
      setRoomImage(room.imageUrl || '');
      setRoomActive(room.isActive);
    } else {
      setEditingRoom(null);
      setRoomName('');
      setRoomDesc('');
      setRoomCapacity('10');
      setRoomImage('');
      setRoomActive(true);
    }
    setShowRoomModal(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingRoom;
      const endpoint = isEdit ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          description: roomDesc,
          capacity: Number(roomCapacity),
          imageUrl: roomImage,
          isActive: roomActive
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast('error', data.error || 'No se pudo guardar la sala.');
      } else {
        triggerToast('success', `Sala ${isEdit ? 'actualizada' : 'creada'} correctamente.`);
        setShowRoomModal(false);
        await syncRooms();
      }
    } catch {
      triggerToast('error', 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta sala?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('success', 'Sala eliminada correctamente.');
        await syncRooms();
      } else {
        triggerToast('error', 'No se pudo eliminar la sala.');
      }
    } catch {
      triggerToast('error', 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  // SERVICE CRUD Actions
  const handleOpenServiceModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
      setServiceDesc(service.description);
      setServiceBlock(String(service.durationBlock));
      setServiceColor(service.color);
      setServiceActive(service.isActive);
    } else {
      setEditingService(null);
      setServiceName('');
      setServiceDesc('');
      setServiceBlock('60');
      setServiceColor('indigo');
      setServiceActive(true);
    }
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingService;
      const endpoint = isEdit ? `/api/services/${editingService.id}` : '/api/services';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName,
          description: serviceDesc,
          durationBlock: Number(serviceBlock),
          color: serviceColor,
          isActive: serviceActive
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast('error', data.error || 'No se pudo guardar el servicio.');
      } else {
        triggerToast('success', `Servicio ${isEdit ? 'actualizado' : 'creado'} correctamente.`);
        setShowServiceModal(false);
        await syncServices();
      }
    } catch {
      triggerToast('error', 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('success', 'Servicio eliminado correctamente.');
        await syncServices();
      } else {
        triggerToast('error', 'No se pudo eliminar el servicio.');
      }
    } catch {
      triggerToast('error', 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  // CALENDAR & SETTINGS Actions
  const handleSaveGlobalPolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          globalPolicies: settings.globalPolicies
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast('error', data.error || 'No se pudieron actualizar las políticas globales.');
      } else {
        triggerToast('success', 'Políticas globales guardadas con éxito.');
        setSettings(data);
      }
    } catch {
      triggerToast('error', 'Error de comunicación.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecialDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialDate || !newSpecialLabel) {
      triggerToast('error', 'Indique fecha y descripción.');
      return;
    }

    setLoading(true);
    try {
      const entry: SpecialDate = {
        date: newSpecialDate,
        label: newSpecialLabel,
        isBlocked: newSpecialBlocked,
        allowedHoursStart: newSpecialBlocked ? undefined : newSpecialStart,
        allowedHoursEnd: newSpecialBlocked ? undefined : newSpecialEnd
      };

      const updatedSpecialDates = [...(settings.specialDates || []), entry];

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialDates: updatedSpecialDates
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast('error', data.error || 'No se pudo añadir la fecha especial.');
      } else {
        triggerToast('success', 'Fecha operativa guardada correctamente.');
        setSettings(data);
        setNewSpecialDate('');
        setNewSpecialLabel('');
      }
    } catch {
      triggerToast('error', 'Error de comunicación.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpecialDate = async (dateStr: string) => {
    setLoading(true);
    try {
      const filtered = settings.specialDates.filter((d) => d.date !== dateStr);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialDates: filtered
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast('success', 'Fecha eliminada de la agenda operativa.');
        setSettings(data);
      }
    } catch {
      triggerToast('error', 'Error.');
    } finally {
      setLoading(false);
    }
  };

  // USER Actions
  const handleOpenUserModal = (user: any) => {
    setEditingUser(user);
    setEditingUserName(user.name);
    setEditingUserPhone(user.phone || '');
    setEditingUserRole(user.role);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUserName,
          phone: editingUserPhone,
          role: editingUserRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast('error', data.error || 'No se pudo actualizar el usuario.');
      } else {
        triggerToast('success', 'Usuario actualizado correctamente.');
        setShowUserModal(false);
        await syncUsers();
      }
    } catch {
      triggerToast('error', 'Error de servidor.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const formatFriendlyDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const formatFriendlyTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* 1. Drift space backgrounds */}
      <div className="premium-grid-overlay animate-grid-pan" />
      <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-950/10 blur-[130px] animate-drift-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-950/10 blur-[130px] animate-drift-medium pointer-events-none" />

      {/* Global Toast Alert */}
      {successMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-950/90 border border-emerald-800 text-emerald-300 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 z-50 text-xs font-bold animate-slide-up">
          <CheckCircle className="w-5 h-5 text-emerald-400 animate-scale-up" /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-5 right-5 bg-red-950/90 border border-red-800 text-red-300 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 z-50 text-xs font-bold animate-slide-up">
          <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" /> {errorMessage}
        </div>
      )}

      {/* Admin Navbar */}
      <header className="border-b border-slate-900/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight">
              Reserva<span className="text-indigo-400">Flow</span>
            </span>
            <span className="text-slate-800">|</span>
            <span className="text-[10px] bg-emerald-950 border border-emerald-800/80 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Panel Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden md:inline">
              Administrador: <span className="text-slate-200 font-bold">{adminSession.name}</span>
            </span>
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-white py-2 px-3 border border-slate-800 bg-slate-900/40 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Home className="w-4 h-4" /> Inicio
            </Link>
            <button
              onClick={logout}
              className="text-xs font-bold text-slate-400 hover:text-white py-2 px-3 border border-slate-800 bg-slate-900/40 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col lg:flex-row gap-8 z-10">
        
        {/* Admin Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="premium-glass-card rounded-3xl p-4 space-y-2">
            <span className="block px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Administrar</span>

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Estadísticas
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Calendar className="w-4 h-4" /> Reservas
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'rooms' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Home className="w-4 h-4" /> Salas (CRUD)
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'services' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Sliders className="w-4 h-4" /> Servicios (CRUD)
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Políticas y Calendario
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Users className="w-4 h-4" /> Usuarios
            </button>
          </div>
        </aside>

        {/* Dashboard Panels */}
        <main className="flex-grow min-w-0">

          {activeTab === 'stats' && (
            /* ================= STATS TAB ================= */
            <div className="space-y-8 animate-scale-up">
              {/* Date Filter Bar */}
              <div className="premium-glass-card rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Analítica Operativa</h3>
                  <p className="text-slate-500 text-[11px] font-semibold mt-0.5">Audita las métricas de agenda del sistema en tiempo real.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={statsStartDate}
                    onChange={(e) => setStatsStartDate(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <span className="text-slate-600 text-xs font-bold">a</span>
                  <input
                    type="date"
                    value={statsEndDate}
                    onChange={(e) => setStatsEndDate(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {loadingStats || !statsData ? (
                <div className="text-center py-20 premium-glass-card rounded-3xl">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-3" />
                  <span className="text-slate-400 text-xs font-semibold">Consolidando registros de agenda...</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="premium-glass-card rounded-2xl p-5 relative overflow-hidden hover:scale-[1.03] duration-300">
                      <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-2">Total Reservas</span>
                      <span className="block text-3xl font-black text-white">{statsData.totalBookings}</span>
                      <div className="absolute right-3 bottom-3 text-indigo-500/10"><Calendar className="w-12 h-12" /></div>
                    </div>
                    <div className="premium-glass-card rounded-2xl p-5 relative overflow-hidden hover:scale-[1.03] duration-300">
                      <span className="block text-[10px] text-emerald-500 uppercase font-black tracking-wider mb-2">Confirmadas</span>
                      <span className="block text-3xl font-black text-emerald-400">{statsData.statusCounts.confirmed}</span>
                      <div className="absolute right-3 bottom-3 text-emerald-500/10"><CheckCircle className="w-12 h-12" /></div>
                    </div>
                    <div className="premium-glass-card rounded-2xl p-5 relative overflow-hidden hover:scale-[1.03] duration-300">
                      <span className="block text-[10px] text-amber-500 uppercase font-black tracking-wider mb-2">Pendientes</span>
                      <span className="block text-3xl font-black text-amber-400">{statsData.statusCounts.pending}</span>
                      <div className="absolute right-3 bottom-3 text-amber-500/10"><Clock className="w-12 h-12" /></div>
                    </div>
                    <div className="premium-glass-card rounded-2xl p-5 relative overflow-hidden hover:scale-[1.03] duration-300">
                      <span className="block text-[10px] text-rose-500 uppercase font-black tracking-wider mb-2">Canceladas</span>
                      <span className="block text-3xl font-black text-rose-400">{statsData.statusCounts.cancelled}</span>
                      <div className="absolute right-3 bottom-3 text-rose-500/10"><XCircle className="w-12 h-12" /></div>
                    </div>
                  </div>

                  {/* Core Visual Breakdown Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Occupancy Rooms */}
                    <div className="premium-glass-card rounded-3xl p-6">
                      <h4 className="text-sm font-black text-white mb-4 uppercase tracking-wider text-slate-400">Ocupación por Sala</h4>
                      {statsData.topRooms.length === 0 ? (
                        <p className="text-slate-500 text-xs italic">No hay reservas registradas.</p>
                      ) : (
                        <div className="space-y-4">
                          {statsData.topRooms.map((room: any, index: number) => {
                            const maxVal = statsData.topRooms[0]?.count || 1;
                            const percentage = Math.round((room.count / maxVal) * 100);
                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-300">{room.name}</span>
                                  <span className="text-white">{room.count} reservas</span>
                                </div>
                                <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-900/60 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-full rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Top Services */}
                    <div className="premium-glass-card rounded-3xl p-6">
                      <h4 className="text-sm font-black text-white mb-4 uppercase tracking-wider text-slate-400">Reservas por Servicio</h4>
                      {statsData.topServices.length === 0 ? (
                        <p className="text-slate-500 text-xs italic">No hay registros.</p>
                      ) : (
                        <div className="space-y-4">
                          {statsData.topServices.map((srv: any, index: number) => {
                            const maxVal = statsData.topServices[0]?.count || 1;
                            const percentage = Math.round((srv.count / maxVal) * 100);
                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-300">{srv.name}</span>
                                  <span className="text-white">{srv.count} agendas</span>
                                </div>
                                <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-900/60 overflow-hidden">
                                  <div
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Peak Hours distribution map */}
                  <div className="premium-glass-card rounded-3xl p-6">
                    <h4 className="text-sm font-black text-white mb-4 uppercase tracking-wider text-slate-400">Distribución Horaria</h4>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center">
                      {statsData.peakHours.slice().sort((a: any, b: any) => a.hour - b.hour).map((ph: any, i: number) => {
                        if (ph.hour < 8 || ph.hour > 20) return null;
                        const maxCount = Math.max(...statsData.peakHours.map((h: any) => h.count), 1);
                        const heightPercentage = (ph.count / maxCount) * 100;
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 bg-slate-950/40 border border-slate-900/60 p-2 rounded-xl">
                            <div className="h-16 w-full flex items-end justify-center bg-slate-950 rounded-lg overflow-hidden">
                              <div
                                className="bg-indigo-600 w-3 rounded-t-sm"
                                style={{ height: `${Math.max(heightPercentage, 4)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-white leading-tight">{ph.count}</span>
                            <span className="text-[9px] text-slate-500 font-bold">{String(ph.hour).padStart(2, '0')}:00</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            /* ================= BOOKINGS MANAGER TAB ================= */
            <div className="space-y-6 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-2.5">
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Control de Reservas</h3>
                  <p className="text-slate-500 text-[11px] font-semibold mt-0.5">Audita, confirma y cancela agendas del sistema en tiempo real.</p>
                </div>
                <button
                  onClick={syncBookings}
                  disabled={loading}
                  className="p-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-12 premium-glass-card rounded-3xl">
                  <p className="text-slate-500 text-xs font-semibold">No existen reservas guardadas en el sistema.</p>
                </div>
              ) : (
                <div className="premium-glass-card rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-900/40 text-slate-400 font-bold border-b border-slate-900/60">
                          <th className="p-4">Usuario</th>
                          <th className="p-4">Sala</th>
                          <th className="p-4">Servicio</th>
                          <th className="p-4">Fecha y Hora</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-900/20">
                            <td className="p-4 space-y-0.5">
                              <div className="font-bold text-white">{b.userName || 'Usuario Demo'}</div>
                              <div className="text-[10px] text-slate-500 font-mono leading-tight">{b.userEmail}</div>
                            </td>
                            <td className="p-4 font-semibold text-slate-200">{b.roomName}</td>
                            <td className="p-4 text-slate-300 font-semibold">{b.serviceName}</td>
                            <td className="p-4 space-y-0.5 font-semibold text-slate-400">
                              <div>{formatFriendlyDate(b.startDateTime)}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{formatFriendlyTime(b.startDateTime)} - {formatFriendlyTime(b.endDateTime)} hs</div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : b.status === 'pending'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-red-950 text-red-400 border border-red-900/40'
                              }`}>
                                {b.status === 'confirmed' ? 'Confirmada' : b.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center gap-2">
                                {b.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                    className="py-1.5 px-3 bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 rounded-xl text-[10px] font-bold text-emerald-300 transition-all cursor-pointer"
                                  >
                                    Confirmar
                                  </button>
                                )}
                                {b.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                    className="py-1.5 px-3 bg-red-950 hover:bg-red-900/50 border border-red-900 rounded-xl text-[10px] font-bold text-red-300 transition-all cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rooms' && (
            /* ================= SALAS CRUD TAB ================= */
            <div className="space-y-6 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-2.5">
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Salas de Reunión</h3>
                  <p className="text-slate-500 text-[11px] font-semibold mt-0.5">Controla las salas, configurando capacidades y overrides de reglas locales.</p>
                </div>
                <button
                  onClick={() => handleOpenRoomModal()}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Agregar Sala
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="premium-glass-card rounded-3xl p-5 flex flex-col justify-between group/room">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-white leading-tight group-hover/room:text-indigo-400 transition-colors">{room.name}</h4>
                          <span className="text-[10px] text-slate-500 font-bold">Capacidad: {room.capacity} personas</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          room.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}>
                          {room.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">{room.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-900/60 mt-4 flex justify-end gap-2.5">
                      <button
                        onClick={() => handleOpenRoomModal(room)}
                        className="py-1.5 px-3 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="py-1.5 px-3 border border-red-950/20 hover:bg-red-950/40 hover:border-red-900 rounded-xl text-xs font-semibold text-red-400 flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            /* ================= SERVICIOS CRUD TAB ================= */
            <div className="space-y-6 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-2.5">
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Servicios / Actividades</h3>
                  <p className="text-slate-500 text-[11px] font-semibold mt-0.5">Configura tipos de sesión y duraciones de bloque operativo.</p>
                </div>
                <button
                  onClick={() => handleOpenServiceModal()}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Agregar Servicio
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((srv) => (
                  <div key={srv.id} className="premium-glass-card rounded-3xl p-5 flex flex-col justify-between group/service">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-white leading-tight group-hover/service:text-indigo-400 transition-colors">{srv.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-500 font-bold">Bloque: {srv.durationBlock} min</span>
                            <span className="text-slate-800 text-xs">•</span>
                            <span className={`inline-block w-2 h-2 rounded-full bg-${srv.color}-500`} />
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{srv.color}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          srv.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}>
                          {srv.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">{srv.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-900/60 mt-4 flex justify-end gap-2.5">
                      <button
                        onClick={() => handleOpenServiceModal(srv)}
                        className="py-1.5 px-3 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteService(srv.id)}
                        className="py-1.5 px-3 border border-red-950/20 hover:bg-red-950/40 hover:border-red-900 rounded-xl text-xs font-semibold text-red-400 flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            /* ================= CONFIGURATION & POLICIES TAB ================= */
            <div className="space-y-8 animate-scale-up">
              {/* Form 1: Global policies */}
              <div className="premium-glass-card rounded-3xl p-6">
                <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  Políticas de Reserva Globales
                </h3>
                <p className="text-slate-500 text-[11px] font-semibold mb-6">Alineación del motor del motor de reservas a nivel organizativo general.</p>

                <form onSubmit={handleSaveGlobalPolicies} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Bloque por Defecto (min)</label>
                      <select
                        value={settings.globalPolicies.slotDuration}
                        onChange={(e) => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, slotDuration: Number(e.target.value) }
                        })}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="15">15 Minutos</option>
                        <option value="30">30 Minutos</option>
                        <option value="60">60 Minutos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duración Mínima (min)</label>
                      <input
                        type="number"
                        value={settings.globalPolicies.minDuration}
                        onChange={(e) => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, minDuration: Number(e.target.value) }
                        })}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Inicio Operativo (HH:MM)</label>
                      <input
                        type="text"
                        value={settings.globalPolicies.allowedHoursStart}
                        onChange={(e) => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, allowedHoursStart: e.target.value }
                        })}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fin Operativo (HH:MM)</label>
                      <input
                        type="text"
                        value={settings.globalPolicies.allowedHoursEnd}
                        onChange={(e) => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, allowedHoursEnd: e.target.value }
                        })}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Anticipación Mínima (Días)</label>
                      <input
                        type="number"
                        value={settings.globalPolicies.minAdvanceDays}
                        onChange={(e) => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, minAdvanceDays: Number(e.target.value) }
                        })}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Anticipación Máxima (Días)</label>
                      <input
                        type="number"
                        value={settings.globalPolicies.maxAdvanceDays}
                        onChange={(e) => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, maxAdvanceDays: Number(e.target.value) }
                        })}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Límite Cancelación (Horas)</label>
                      <input
                        type="number"
                        value={settings.globalPolicies.cancelWindowHours}
                        onChange={(e) => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, cancelWindowHours: Number(e.target.value) }
                        })}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-900/60 pt-4 mt-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Máximo Reservas Activas por Cuenta</label>
                      <input
                        type="number"
                        value={settings.globalPolicies.maxActiveBookings}
                        onChange={(e) => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, maxActiveBookings: Number(e.target.value) }
                        })}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => setSettings({
                          ...settings,
                          globalPolicies: { ...settings.globalPolicies, autoConfirm: !settings.globalPolicies.autoConfirm }
                        })}
                        className="text-indigo-500 focus:outline-none"
                      >
                        {settings.globalPolicies.autoConfirm ? (
                          <ToggleRight className="w-10 h-10" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-700" />
                        )}
                      </button>
                      <div>
                        <span className="block text-xs font-bold text-white">Confirmación Automática</span>
                        <span className="block text-[9px] text-slate-500 leading-tight">Al desactivar, las reservas se guardan pendientes de auditoría.</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                    >
                      {loading ? 'Guardando...' : 'Guardar Políticas'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Special Dates and Holidays Override */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to Add Special Date */}
                <div className="premium-glass-card rounded-3xl p-5 lg:col-span-1">
                  <h4 className="text-sm font-black text-white mb-2">Añadir Fecha Especial</h4>
                  <p className="text-slate-500 text-[10px] mb-4 font-semibold leading-normal">Fija cierres festivos excepcionales en el calendario operativo.</p>

                  <form onSubmit={handleAddSpecialDate} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-550 mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={newSpecialDate}
                        onChange={(e) => setNewSpecialDate(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-555 mb-1">Descripción / Motivo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Feriado"
                        value={newSpecialLabel}
                        onChange={(e) => setNewSpecialLabel(e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="blocked-chk"
                          checked={newSpecialBlocked}
                          onChange={(e) => setNewSpecialBlocked(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <label htmlFor="blocked-chk" className="text-xs font-semibold text-slate-300 cursor-pointer">Bloquear día (cerrado)</label>
                      </div>

                      {!newSpecialBlocked && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">Inicio Especial</label>
                            <input
                              type="text"
                              value={newSpecialStart}
                              onChange={(e) => setNewSpecialStart(e.target.value)}
                              className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-200 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">Fin Especial</label>
                            <input
                              type="text"
                              value={newSpecialEnd}
                              onChange={(e) => setNewSpecialEnd(e.target.value)}
                              className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-200 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Agregar Excepción
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of Special Dates */}
                <div className="premium-glass-card rounded-3xl p-5 lg:col-span-2 space-y-4">
                  <h4 className="text-sm font-black text-white leading-tight uppercase tracking-wider text-slate-400">Agenda de Excepciones Activas</h4>
                  {settings.specialDates.length === 0 ? (
                    <p className="text-slate-500 text-xs italic">No existen excepciones temporales definidas en la agenda.</p>
                  ) : (
                    <div className="border border-slate-900/60 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900/40 text-slate-400 font-bold border-b border-slate-900/60">
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Motivo</th>
                            <th className="p-3">Condición</th>
                            <th className="p-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/40">
                          {settings.specialDates.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/20">
                              <td className="p-3 font-bold text-white">{item.date}</td>
                              <td className="p-3 text-slate-300 font-semibold">{item.label}</td>
                              <td className="p-3">
                                {item.isBlocked ? (
                                  <span className="text-red-400 font-bold bg-red-950/60 border border-red-950/80 px-2 py-0.5 rounded-full text-[9px] uppercase">Bloqueado</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-950/80 px-2 py-0.5 rounded-full text-[9px] uppercase">
                                    {item.allowedHoursStart} - {item.allowedHoursEnd} hs
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => handleDeleteSpecialDate(item.date)}
                                    className="p-1.5 border border-red-950/20 hover:border-red-900 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === 'users' && (
            /* ================= USER MANAGEMENT TAB ================= */
            <div className="space-y-6 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-2.5">
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Usuarios del Sistema</h3>
                  <p className="text-slate-500 text-[11px] font-semibold mt-0.5">Administra privilegios jerárquicos y datos de contacto.</p>
                </div>
                <button
                  onClick={syncUsers}
                  disabled={loading}
                  className="p-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-800 rounded-xl text-slate-400"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="premium-glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900/40 text-slate-400 font-bold border-b border-slate-900/60">
                      <th className="p-4">Nombre completo</th>
                      <th className="p-4">Correo electrónico</th>
                      <th className="p-4">Teléfono</th>
                      <th className="p-4">Rol</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/20">
                        <td className="p-4 font-bold text-white">{user.name}</td>
                        <td className="p-4 text-slate-300 font-semibold">{user.email}</td>
                        <td className="p-4 text-slate-450 font-semibold">{user.phone || 'No registrado'}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-indigo-950 text-indigo-400 border border-indigo-900'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenUserModal(user)}
                              className="py-1.5 px-3 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: ROOM FORM */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowRoomModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-xl transition-colors"
            >
              Cerrar
            </button>

            <div className="mb-6">
              <h4 className="text-base font-black text-white mb-1">{editingRoom ? 'Editar Sala' : 'Añadir Sala'}</h4>
              <p className="text-slate-500 text-xs font-semibold">Completa los campos obligatorios para registrar la sala.</p>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre de Sala *</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ej. Sala Alfa"
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Capacidad *</label>
                  <input
                    type="number"
                    required
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div className="pt-6 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="room-active-chk"
                    checked={roomActive}
                    onChange={(e) => setRoomActive(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <label htmlFor="room-active-chk" className="text-xs font-semibold text-slate-350 cursor-pointer">Sala Activa</label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descripción</label>
                <textarea
                  rows={2}
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  placeholder="Televisor, proyector..."
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">URL de Imagen</label>
                <input
                  type="text"
                  value={roomImage}
                  onChange={(e) => setRoomImage(e.target.value)}
                  placeholder="https://..."
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="py-2 px-4 border border-slate-800 hover:bg-slate-950 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SERVICE FORM */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowServiceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-xl transition-colors"
            >
              Cerrar
            </button>

            <div className="mb-6">
              <h4 className="text-base font-black text-white mb-1">{editingService ? 'Editar Servicio' : 'Añadir Servicio'}</h4>
              <p className="text-slate-500 text-xs font-semibold">Define los bloques en los que se dividirá la agenda.</p>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ej. Soporte"
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duración Bloque *</label>
                  <select
                    value={serviceBlock}
                    onChange={(e) => setServiceBlock(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="15">15 Minutos</option>
                    <option value="30">30 Minutos</option>
                    <option value="45">45 Minutos</option>
                    <option value="60">60 Minutos (1h)</option>
                  </select>
                </div>
                <div className="pt-6 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="srv-active-chk"
                    checked={serviceActive}
                    onChange={(e) => setServiceActive(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <label htmlFor="srv-active-chk" className="text-xs font-semibold text-slate-350 cursor-pointer">Servicio Activo</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Color Etiqueta (UI) *</label>
                  <select
                    value={serviceColor}
                    onChange={(e) => setServiceColor(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="indigo">Índigo (Azul)</option>
                    <option value="emerald">Esmeralda (Verde)</option>
                    <option value="amber">Ámbar (Naranja)</option>
                    <option value="rose">Rosa (Rojo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descripción</label>
                <textarea
                  rows={2}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Detalles sobre el alcance..."
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="py-2 px-4 border border-slate-800 hover:bg-slate-950 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: USER FORM */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-xl transition-colors"
            >
              Cerrar
            </button>

            <div className="mb-6">
              <h4 className="text-base font-black text-white mb-1">Editar Cuenta</h4>
              <p className="text-slate-500 text-xs font-semibold">Administra privilegios jerárquicos de forma segura.</p>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  disabled
                  value={editingUser?.email || ''}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-slate-500 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editingUserName}
                  onChange={(e) => setEditingUserName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={editingUserPhone}
                  onChange={(e) => setEditingUserPhone(e.target.value)}
                  placeholder="+569..."
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rol Jerárquico *</label>
                <select
                  value={editingUserRole}
                  onChange={(e) => setEditingUserRole(e.target.value as UserRole)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="user">Usuario Estándar</option>
                  <option value="admin">Administrador del Sistema</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="py-2 px-4 border border-slate-800 hover:bg-slate-950 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/60 py-8 text-center text-xs text-slate-500 mt-auto relative z-10">
        <p>© 2026 ReservaFlow. Panel Administrativo. MVP premium construido bajo estándares de UI modernos.</p>
      </footer>
    </div>
  );
}
