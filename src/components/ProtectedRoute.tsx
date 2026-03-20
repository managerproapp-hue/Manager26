import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';

interface ProtectedRouteProps {
  allowedProfiles: Profile[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedProfiles, children }) => {
  const { currentUser, selectedProfile } = useAuth();

  if (!currentUser) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (!selectedProfile || !allowedProfiles.includes(selectedProfile)) {
    console.log('ProtectedRoute - Invalid profile, redirecting to selector');
    return <Navigate to="/select-profile" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};