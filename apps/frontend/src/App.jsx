import React, { useState, useEffect } from 'react';
import { Car, Users, MapPin, Plus, Edit2, Trash2, CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react';

const TaxiManagementSystem = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [units, setUnits] = useState([]);
  const [clients, setClients] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Modal states
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showRideModal, setShowRideModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  // Form states
  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    driverName: '',
    brand: '',
    plate: '',
    color: '',
    model: ''
  });

  const [clientForm, setClientForm] = useState({
    code: '',
    name: '',
    address: '',
    reference: '',
    mapsLink: ''
  });

  const [rideForm, setRideForm] = useState({
    unitNumber: '',
    clientCode: ''
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const unitsResult = await window.storage.get('taxi-units');
      const clientsResult = await window.storage.get('taxi-clients');
      const ridesResult = await window.storage.get('taxi-rides');

      if (unitsResult) setUnits(JSON.parse(unitsResult.value));
      if (clientsResult) setClients(JSON.parse(clientsResult.value));
      if (ridesResult) setRides(JSON.parse(ridesResult.value));
    } catch (error) {
      console.log('First time loading, no data yet');
    }
    setLoading(false);
  };

  const saveUnits = async (newUnits) => {
    await window.storage.set('taxi-units', JSON.stringify(newUnits));
    setUnits(newUnits);
  };

  const saveClients = async (newClients) => {
    await window.storage.set('taxi-clients', JSON.stringify(newClients));
    setClients(newClients);
  };

  const saveRides = async (newRides) => {
    await window.storage.set('taxi-rides', JSON.stringify(newRides));
    setRides(newRides);
  };

  const showNotif = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Unit operations
  const handleAddUnit = async () => {
    if (!unitForm.unitNumber || !unitForm.driverName || !unitForm.plate) {
      showNotif('Por favor completa los campos requeridos');
      return;
    }

    const newUnit = {
      id: Date.now(),
      ...unitForm,
      createdAt: new Date().toISOString()
    };

    await saveUnits([...units, newUnit]);
    setUnitForm({ unitNumber: '', driverName: '', brand: '', plate: '', color: '', model: '' });
    setShowUnitModal(false);
    showNotif('¡Unidad agregada exitosamente!');
  };

  const handleEditUnit = async () => {
    const updatedUnits = units.map(u => 
      u.id === editingUnit.id ? { ...unitForm, id: editingUnit.id, createdAt: editingUnit.createdAt } : u
    );
    await saveUnits(updatedUnits);
    setEditingUnit(null);
    setUnitForm({ unitNumber: '', driverName: '', brand: '', plate: '', color: '', model: '' });
    setShowUnitModal(false);
    showNotif('¡Unidad actualizada!');
  };

  const handleDeleteUnit = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta unidad?')) {
      await saveUnits(units.filter(u => u.id !== id));
      showNotif('Unidad eliminada');
    }
  };

  // Client operations
  const handleAddClient = async () => {
    if (!clientForm.code || !clientForm.name || !clientForm.address) {
      showNotif('Por favor completa los campos requeridos');
      return;
    }

    const newClient = {
      id: Date.now(),
      ...clientForm,
      createdAt: new Date().toISOString()
    };

    await saveClients([...clients, newClient]);
    setClientForm({ code: '', name: '', address: '', reference: '', mapsLink: '' });
    setShowClientModal(false);
    showNotif('¡Cliente agregado exitosamente!');
  };

  const handleEditClient = async () => {
    const updatedClients = clients.map(c => 
      c.id === editingClient.id ? { ...clientForm, id: editingClient.id, createdAt: editingClient.createdAt } : c
    );
    await saveClients(updatedClients);
    setEditingClient(null);
    setClientForm({ code: '', name: '', address: '', reference: '', mapsLink: '' });
    setShowClientModal(false);
    showNotif('¡Cliente actualizado!');
  };

  const handleDeleteClient = async (id) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      await saveClients(clients.filter(c => c.id !== id));
      showNotif('Cliente eliminado');
    }
  };

  // Ride operations
  const handleRegisterRide = async () => {
    if (!rideForm.unitNumber || !rideForm.clientCode) {
      showNotif('Selecciona una unidad y un cliente');
      return;
    }

    const unit = units.find(u => u.unitNumber === rideForm.unitNumber);
    const client = clients.find(c => c.code === rideForm.clientCode);

    if (!unit || !client) {
      showNotif('Unidad o cliente no encontrado');
      return;
    }

    const newRide = {
      id: Date.now(),
      unitNumber: rideForm.unitNumber,
      driverName: unit.driverName,
      clientCode: rideForm.clientCode,
      clientName: client.name,
      clientAddress: client.address,
      clientReference: client.reference,
      mapsLink: client.mapsLink,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('es-EC'),
      time: new Date().toLocaleTimeString('es-EC')
    };

    await saveRides([newRide, ...rides]);
    setRideForm({ unitNumber: '', clientCode: '' });
    setShowRideModal(false);
    showNotif('¡Carrera registrada exitosamente!');
  };

  // Stats
  const stats = {
    totalUnits: units.length,
    totalClients: clients.length,
    totalRides: rides.length,
    todayRides: rides.filter(r => r.date === new Date().toLocaleDateString('es-EC')).length
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ fontSize: '24px', color: '#1f2937', fontWeight: 'bold' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      fontFamily: "'Inter', sans-serif",
      color: '#1f2937'
    }}>
      {/* Animated Background Effect - Disabled for simpler standard look */}
      <div style={{ display: 'none' }} />

      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        padding: '20px 40px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: '#16a34a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Car size={28} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                Sistema UberLoxa
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>Sistema de Gestión Integral</p>
            </div>
          </div>
          <div style={{ fontSize: '16px', color: '#4b5563', fontWeight: '500' }}>
            {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        position: 'relative',
        zIndex: 10,
        padding: '20px 40px',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'dashboard', icon: Activity, label: 'Dashboard' },
          { id: 'units', icon: Car, label: 'Unidades' },
          { id: 'clients', icon: Users, label: 'Clientes' },
          { id: 'rides', icon: Clock, label: 'Carreras' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{
              padding: '10px 20px',
              background: activeView === item.id 
                ? '#1e293b' 
                : '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: activeView === item.id ? '#ffffff' : '#374151',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              if (activeView !== item.id) {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== item.id) {
                e.currentTarget.style.background = '#ffffff';
              }
            }}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={{ position: 'relative', zIndex: 10, padding: '20px 40px', paddingBottom: '60px' }}>
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '30px', color: '#1f2937', fontWeight: 'bold' }}>Dashboard</h2>
            
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {[
                { label: 'Total Unidades', value: stats.totalUnits, icon: Car, color: '#d97706' },
                { label: 'Total Clientes', value: stats.totalClients, icon: Users, color: '#2563eb' },
                { label: 'Total Carreras', value: stats.totalRides, icon: TrendingUp, color: '#16a34a' },
                { label: 'Carreras Hoy', value: stats.todayRides, icon: Clock, color: '#dc2626' }
              ].map((stat, idx) => (
                <div key={idx} style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '25px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: '500' }}>{stat.label}</p>
                      <h3 style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: stat.color }}>{stat.value}</h3>
                    </div>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: `${stat.color}15`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <stat.icon size={24} color={stat.color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <h3 style={{ fontSize: '22px', marginBottom: '20px', color: '#1f2937', fontWeight: 'bold' }}>Acciones Rápidas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <button onClick={() => { setShowRideModal(true); setRideForm({ unitNumber: '', clientCode: '' }); }} style={quickActionButtonStyle('#16a34a')}>
                <Plus size={20} />
                Registrar Carrera
              </button>
              <button onClick={() => { setShowUnitModal(true); setEditingUnit(null); setUnitForm({ unitNumber: '', driverName: '', brand: '', plate: '', color: '', model: '' }); }} style={quickActionButtonStyle('#d97706')}>
                <Car size={20} />
                Agregar Unidad
              </button>
              <button onClick={() => { setShowClientModal(true); setEditingClient(null); setClientForm({ code: '', name: '', address: '', reference: '', mapsLink: '' }); }} style={quickActionButtonStyle('#2563eb')}>
                <Users size={20} />
                Agregar Cliente
              </button>
            </div>

            {/* Recent Rides */}
            {rides.length > 0 && (
              <>
                <h3 style={{ fontSize: '22px', marginTop: '40px', marginBottom: '20px', color: '#1f2937', fontWeight: 'bold' }}>Últimas Carreras</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {rides.slice(0, 5).map((ride, idx) => (
                    <div key={ride.id} style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '20px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Unidad {ride.unitNumber} - {ride.driverName}</div>
                          <div style={{ color: '#374151', marginTop: '5px' }}>Cliente: {ride.clientName} ({ride.clientCode})</div>
                          <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '3px' }}>📍 {ride.clientAddress}</div>
                        </div>
                        <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>
                          <div style={{ fontWeight: '500' }}>{ride.date}</div>
                          <div style={{ color: '#d97706', fontWeight: 'bold', marginTop: '2px' }}>{ride.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Units View */}
        {activeView === 'units' && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ fontSize: '28px', color: '#1f2937', margin: 0, fontWeight: 'bold' }}>Gestión de Unidades</h2>
              <button onClick={() => { setShowUnitModal(true); setEditingUnit(null); setUnitForm({ unitNumber: '', driverName: '', brand: '', plate: '', color: '', model: '' }); }} style={{
                padding: '10px 20px',
                background: '#f59e0b',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}>
                <Plus size={20} />
                Nueva Unidad
              </button>
            </div>

            {units.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <Car size={64} style={{ margin: '0 auto', marginBottom: '20px', opacity: 0.5 }} />
                <p style={{ fontSize: '18px' }}>No hay unidades registradas</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {units.map((unit, idx) => (
                  <div key={unit.id} style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '25px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: '#f59e0b',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffffff'
                      }}>
                        {unit.unitNumber}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => {
                          setEditingUnit(unit);
                          setUnitForm({ ...unit });
                          setShowUnitModal(true);
                        }} style={iconButtonStyle('#2563eb')}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteUnit(unit.id)} style={iconButtonStyle('#dc2626')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>{unit.driverName}</div>
                      <div style={{ color: '#4b5563', fontSize: '14px' }}>{unit.brand} {unit.model}</div>
                    </div>
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                        <div><span style={{ color: '#6b7280' }}>Placa:</span> <span style={{ color: '#b45309', fontWeight: 'bold' }}>{unit.plate}</span></div>
                        <div><span style={{ color: '#6b7280' }}>Color:</span> <span style={{ color: '#1f2937' }}>{unit.color || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clients View */}
        {activeView === 'clients' && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ fontSize: '28px', color: '#1f2937', margin: 0, fontWeight: 'bold' }}>Gestión de Clientes</h2>
              <button onClick={() => { setShowClientModal(true); setEditingClient(null); setClientForm({ code: '', name: '', address: '', reference: '', mapsLink: '' }); }} style={{
                padding: '10px 20px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>
                <Plus size={20} />
                Nuevo Cliente
              </button>
            </div>

            {clients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <Users size={64} style={{ margin: '0 auto', marginBottom: '20px', opacity: 0.5 }} />
                <p style={{ fontSize: '18px' }}>No hay clientes registrados</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {clients.map((client, idx) => (
                  <div key={client.id} style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{
                            padding: '6px 12px',
                            background: '#2563eb',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#ffffff'
                          }}>
                            {client.code}
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{client.name}</div>
                        </div>
                        <div style={{ color: '#374151', marginBottom: '6px' }}>
                          📍 {client.address}
                        </div>
                        {client.reference && (
                          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>
                            📝 {client.reference}
                          </div>
                        )}
                        {client.mapsLink && (
                          <a href={client.mapsLink} target="_blank" rel="noopener noreferrer" style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '500',
                            transition: 'color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                          onMouseLeave={(e) => e.target.style.color = '#2563eb'}>
                            <MapPin size={14} />
                            Ver en Google Maps
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => {
                          setEditingClient(client);
                          setClientForm({ ...client });
                          setShowClientModal(true);
                        }} style={iconButtonStyle('#2563eb')}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteClient(client.id)} style={iconButtonStyle('#dc2626')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rides View */}
        {activeView === 'rides' && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ fontSize: '28px', color: '#1f2937', margin: 0, fontWeight: 'bold' }}>Historial de Carreras</h2>
              <button onClick={() => { setShowRideModal(true); setRideForm({ unitNumber: '', clientCode: '' }); }} style={{
                padding: '10px 20px',
                background: '#16a34a',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}>
                <Plus size={20} />
                Registrar Carrera
              </button>
            </div>

            {rides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <Clock size={64} style={{ margin: '0 auto', marginBottom: '20px', opacity: 0.5 }} />
                <p style={{ fontSize: '18px' }}>No hay carreras registradas</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {rides.map((ride, idx) => (
                  <div key={ride.id} style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '20px', alignItems: 'center' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: '#16a34a',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#ffffff'
                      }}>
                        {ride.unitNumber}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
                          {ride.driverName}
                        </div>
                        <div style={{ color: '#059669', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                          Cliente: {ride.clientName} ({ride.clientCode})
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '14px' }}>
                          📍 {ride.clientAddress}
                        </div>
                        {ride.clientReference && (
                          <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                            📝 {ride.clientReference}
                          </div>
                        )}
                        {ride.mapsLink && (
                          <a href={ride.mapsLink} target="_blank" rel="noopener noreferrer" style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginTop: '6px',
                            fontWeight: '500',
                            transition: 'color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                          onMouseLeave={(e) => e.target.style.color = '#2563eb'}>
                            <MapPin size={12} />
                            Abrir en Maps
                          </a>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>
                        <div style={{ marginBottom: '4px' }}>{ride.date}</div>
                        <div style={{ color: '#b45309', fontWeight: 'bold' }}>{ride.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Unit Modal */}
      {showUnitModal && (
        <Modal onClose={() => { setShowUnitModal(false); setEditingUnit(null); }}>
          <h3 style={{ fontSize: '22px', marginBottom: '25px', color: '#1f2937', fontWeight: 'bold' }}>
            {editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}
          </h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <Input label="Número de Unidad *" value={unitForm.unitNumber} onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })} placeholder="101" />
            <Input label="Nombre del Conductor *" value={unitForm.driverName} onChange={(e) => setUnitForm({ ...unitForm, driverName: e.target.value })} placeholder="Juan Pérez" />
            <Input label="Marca del Vehículo" value={unitForm.brand} onChange={(e) => setUnitForm({ ...unitForm, brand: e.target.value })} placeholder="Toyota" />
            <Input label="Modelo" value={unitForm.model} onChange={(e) => setUnitForm({ ...unitForm, model: e.target.value })} placeholder="Corolla 2020" />
            <Input label="Placa *" value={unitForm.plate} onChange={(e) => setUnitForm({ ...unitForm, plate: e.target.value.toUpperCase() })} placeholder="ABC-1234" />
            <Input label="Color" value={unitForm.color} onChange={(e) => setUnitForm({ ...unitForm, color: e.target.value })} placeholder="Blanco" />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
            <button onClick={editingUnit ? handleEditUnit : handleAddUnit} style={{
              flex: 1,
              padding: '12px',
              background: '#f59e0b',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}>
              {editingUnit ? 'Actualizar' : 'Agregar'}
            </button>
            <button onClick={() => { setShowUnitModal(false); setEditingUnit(null); }} style={{
              flex: 1,
              padding: '12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#374151',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* Client Modal */}
      {showClientModal && (
        <Modal onClose={() => { setShowClientModal(false); setEditingClient(null); }}>
          <h3 style={{ fontSize: '22px', marginBottom: '25px', color: '#1f2937', fontWeight: 'bold' }}>
            {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <Input label="Código Cliente *" value={clientForm.code} onChange={(e) => setClientForm({ ...clientForm, code: e.target.value.toUpperCase() })} placeholder="CLI001" />
            <Input label="Nombre Completo *" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} placeholder="María González" />
            <Input label="Dirección *" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} placeholder="Av. Principal #123" />
            <Input label="Referencia" value={clientForm.reference} onChange={(e) => setClientForm({ ...clientForm, reference: e.target.value })} placeholder="Frente al parque central" />
            <Input label="Link Google Maps" value={clientForm.mapsLink} onChange={(e) => setClientForm({ ...clientForm, mapsLink: e.target.value })} placeholder="https://maps.google.com/..." />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
            <button onClick={editingClient ? handleEditClient : handleAddClient} style={{
              flex: 1,
              padding: '12px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>
              {editingClient ? 'Actualizar' : 'Agregar'}
            </button>
            <button onClick={() => { setShowClientModal(false); setEditingClient(null); }} style={{
              flex: 1,
              padding: '12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#374151',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* Ride Modal */}
      {showRideModal && (
        <Modal onClose={() => setShowRideModal(false)}>
          <h3 style={{ fontSize: '22px', marginBottom: '25px', color: '#1f2937', fontWeight: 'bold' }}>
            Registrar Nueva Carrera
          </h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                Seleccionar Unidad *
              </label>
              <select value={rideForm.unitNumber} onChange={(e) => setRideForm({ ...rideForm, unitNumber: e.target.value })} style={{
                width: '100%',
                padding: '12px',
                background: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                color: '#1f2937',
                fontSize: '16px',
                cursor: 'pointer'
              }}>
                <option value="">-- Seleccionar --</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.unitNumber}>
                    Unidad {unit.unitNumber} - {unit.driverName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                Seleccionar Cliente *
              </label>
              <select value={rideForm.clientCode} onChange={(e) => setRideForm({ ...rideForm, clientCode: e.target.value })} style={{
                width: '100%',
                padding: '12px',
                background: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                color: '#1f2937',
                fontSize: '16px',
                cursor: 'pointer'
              }}>
                <option value="">-- Seleccionar --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.code}>
                    {client.code} - {client.name}
                  </option>
                ))}
              </select>
            </div>
            {rideForm.clientCode && clients.find(c => c.code === rideForm.clientCode) && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '15px',
                marginTop: '10px'
              }}>
                <div style={{ fontSize: '14px', color: '#1e3a8a' }}>
                  <div style={{ marginBottom: '5px', fontWeight: '500' }}>
                    📍 {clients.find(c => c.code === rideForm.clientCode).address}
                  </div>
                  {clients.find(c => c.code === rideForm.clientCode).reference && (
                    <div style={{ color: '#1e40af' }}>
                      📝 {clients.find(c => c.code === rideForm.clientCode).reference}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
            <button onClick={handleRegisterRide} style={{
              flex: 1,
              padding: '12px',
              background: '#16a34a',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}>
              Registrar Carrera
            </button>
            <button onClick={() => setShowRideModal(false)} style={{
              flex: 1,
              padding: '12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#374151',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* Notification */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#10b981',
          color: '#ffffff',
          padding: '16px 24px',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          animation: 'slideInFromRight 0.5s ease-out'
        }}>
          <CheckCircle size={24} />
          <span style={{ fontWeight: 'bold' }}>{notificationMessage}</span>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from { 
            opacity: 0;
            transform: translateX(30px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInLeft {
          from { 
            opacity: 0;
            transform: translateX(-30px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        select option {
          background: #ffffff;
          color: #1f2937;
        }
      `}</style>
    </div>
  );
};

// Helper Components
const Modal = ({ children, onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.3s ease-out'
  }}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: '#ffffff',
      borderRadius: '8px',
      padding: '30px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid #e5e7eb',
      animation: 'scaleIn 0.3s ease-out'
    }}>
      {children}
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
      {label}
    </label>
    <input {...props} style={{
      width: '100%',
      padding: '12px',
      background: '#ffffff',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      color: '#1f2937',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#2563eb';
      e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#d1d5db';
      e.target.style.boxShadow = 'none';
    }} />
  </div>
);

const quickActionButtonStyle = (color) => ({
  padding: '16px',
  background: color,
  border: 'none',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  transition: 'all 0.2s ease'
});

const iconButtonStyle = (color) => ({
  width: '36px',
  height: '36px',
  background: `${color}10`,
  border: `1px solid ${color}25`,
  borderRadius: '6px',
  color: color,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease'
});

export default TaxiManagementSystem;
