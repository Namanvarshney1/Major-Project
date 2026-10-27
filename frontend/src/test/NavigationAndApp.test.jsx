import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { AuthProvider } from '../lib/authContext';
import { Sidebar } from '../components/layout/Sidebar';
describe('App Navigation & Protection Gates', () => {
    it('renders LandingPage with official title and call to action', () => {
        render(<BrowserRouter>
        <LandingPage />
      </BrowserRouter>);
        expect(screen.getByText(/practice smarter/i)).toBeInTheDocument();
        expect(screen.getByText(/perform stronger/i)).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /start practising/i }).length).toBeGreaterThan(0);
    });
    it('redirects unauthenticated candidate away from protected route to login', async () => {
        localStorage.removeItem('preppulse_token');
        render(<MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Screen Gate</div>}/>
            <Route path="/dashboard" element={<ProtectedRoute>
                  <div data-testid="protected-content">Secret Cockpit</div>
                </ProtectedRoute>}/>
          </Routes>
        </AuthProvider>
      </MemoryRouter>);
        // Protected route redirects to login screen gate
        expect(await screen.findByText('Login Screen Gate')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
    it('renders all sidebar navigation destinations properly', () => {
        // Set mock token and candidate in localStorage
        localStorage.setItem('preppulse_token', 'mock_jwt_token');
        localStorage.setItem('preppulse_user', JSON.stringify({
            id: '123',
            name: 'Arjun Patel',
            email: 'arjun@example.com',
            profile: { target_role: 'Senior Backend Engineer', target_level: 'Senior IC' }
        }));
        render(<MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </MemoryRouter>);
        expect(screen.getByText('AI Coach')).toBeInTheDocument();
        expect(screen.getByText('Interview DNA')).toBeInTheDocument();
        expect(screen.getByText('Skill Tree')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('Learning Centre')).toBeInTheDocument();
        expect(screen.getByText('Achievements')).toBeInTheDocument();
        expect(screen.getByText('Interview Arena')).toBeInTheDocument();
    });
});
