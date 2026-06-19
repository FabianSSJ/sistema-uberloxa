import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  allowedRoles?: string[];
  requiredModule?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles, requiredModule }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />; // Redirigir si no tiene el rol necesario
  }

  if (requiredModule && user.rol !== 'SUPERADMIN') {
    if (!user.modulosPermitidos.includes(requiredModule)) {
      return <Navigate to="/" replace />; // Redirigir si no tiene el módulo permitido
    }
  }

  return <Outlet />;
};
