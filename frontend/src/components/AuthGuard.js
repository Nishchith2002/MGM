



// src/components/AuthGuard.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { canAccessPage } from '../config/userRoles';

const AuthGuard = () => {
  const location = useLocation();
  const storedUser = localStorage.getItem('user');

  // Check if user is logged in
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(storedUser);
  const username = user.username;

  // Check if user has permission to access this page
  if (!canAccessPage(username, location.pathname)) {
    console.warn(`User ${username} tried to access unauthorized page: ${location.pathname}`);
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        textAlign: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          You don't have permission to access this page.
        </p>
        <a href="/Home" style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#0056A8',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Go to Home
        </a>
      </div>
    );
  }

  return <Outlet />;
};

export default AuthGuard;