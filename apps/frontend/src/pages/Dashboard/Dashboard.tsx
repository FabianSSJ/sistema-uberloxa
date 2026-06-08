import { Car, Users, Clock, TrendingUp, Plus } from 'lucide-react';
import { useState } from 'react';

import { useClientes } from '../../features/clientes/hooks/useClientes';

const Dashboard = () => {
  const { data: clientes = [] } = useClientes();

  // Placeholder stats for now, except clients which is real
  const stats = {
    totalUnits: 0,
    totalClients: clientes.length,
    totalRides: 0,
    todayRides: 0
  };

  const rides: any[] = [];

  const quickActionButtonStyle = (color: string) => ({
    padding: '12px 20px',
    background: '#ffffff',
    border: `1px solid ${color}30`,
    borderRadius: '8px',
    color: color,
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  });

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      <h2 className="text-[28px] mb-[30px] text-gray-800 font-bold">Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-10">
        {[
          { label: 'Total Unidades', value: stats.totalUnits, icon: Car, color: 'text-amber-600', bg: 'bg-amber-600/10' },
          { label: 'Total Clientes', value: stats.totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-600/10' },
          { label: 'Total Carreras', value: stats.totalRides, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-600/10' },
          { label: 'Carreras Hoy', value: stats.todayRides, icon: Clock, color: 'text-red-600', bg: 'bg-red-600/10' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg p-[25px] border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="m-0 text-sm text-gray-600 mb-2 font-medium">{stat.label}</p>
                <h3 className={`m-0 text-[36px] font-bold ${stat.color}`}>{stat.value}</h3>
              </div>
              <div className={`w-[50px] h-[50px] ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="text-[22px] mb-5 text-gray-800 font-bold">Acciones Rápidas</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[15px]">
        <button style={quickActionButtonStyle('#16a34a')} className="hover:bg-green-50">
          <Plus size={20} />
          Registrar Carrera
        </button>
        <button style={quickActionButtonStyle('#d97706')} className="hover:bg-amber-50">
          <Car size={20} />
          Agregar Unidad
        </button>
        <button style={quickActionButtonStyle('#2563eb')} className="hover:bg-blue-50">
          <Users size={20} />
          Agregar Cliente
        </button>
      </div>

      {/* Recent Rides */}
      {rides.length > 0 && (
        <>
          <h3 className="text-[22px] mt-10 mb-5 text-gray-800 font-bold">Últimas Carreras</h3>
          <div className="grid gap-[15px]">
            {rides.slice(0, 5).map((ride: any, idx: number) => (
              <div key={idx} className="bg-white rounded-lg p-5 border border-gray-200 transition-all duration-200 shadow-sm hover:bg-gray-50">
                <div className="flex justify-between items-center flex-wrap gap-[15px]">
                  <div>
                    <div className="text-[18px] font-bold text-gray-800">Unidad {ride.unitNumber} - {ride.driverName}</div>
                    <div className="text-gray-700 mt-[5px]">Cliente: {ride.clientName} ({ride.clientCode})</div>
                    <div className="text-gray-500 text-sm mt-[3px]">📍 {ride.clientAddress}</div>
                  </div>
                  <div className="text-right text-gray-500 text-sm">
                    <div className="font-medium">{ride.date}</div>
                    <div className="text-amber-600 font-bold mt-[2px]">{ride.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
