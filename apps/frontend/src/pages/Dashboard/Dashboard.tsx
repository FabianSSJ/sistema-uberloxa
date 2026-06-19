import React from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { CharlieDashboard } from './CharlieDashboard';
import { AdminDashboard } from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.rol === 'SUPERADMIN' || user?.rol === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Por defecto (CHARLIE u otros), muestra el dashboard operativo
  return <CharlieDashboard />;
};

export default Dashboard;
