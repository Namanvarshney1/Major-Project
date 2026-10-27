import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return (<div className="min-h-screen bg-[#fbf9f0] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#1b1c17] border-t-[#c6f26a] animate-spin"></div>
        <span className="font-mono text-xs text-[#767871] uppercase tracking-wider">
          Calibrating PrepPulse Session...
        </span>
      </div>);
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }
    return <>{children}</>;
};
