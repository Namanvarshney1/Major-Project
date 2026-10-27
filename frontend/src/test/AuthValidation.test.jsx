import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { AuthProvider } from '../lib/authContext';
describe('Authentication Form Validation & Behavior', () => {
    it('renders login form with fields and demo quick-fill buttons', () => {
        render(<BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>);
        expect(screen.getByText(/sign in to access your calibrated mock arena/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/candidate email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /fill admin/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /fill candidate/i })).toBeInTheDocument();
    });
    it('pre-fills credentials when demo button is clicked', () => {
        render(<BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>);
        const demoBtn = screen.getByRole('button', { name: /fill candidate/i });
        fireEvent.click(demoBtn);
        const emailInput = screen.getByLabelText(/candidate email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        expect(emailInput.value).toBe('arjun.patel@example.com');
        expect(passwordInput.value).toBe('ValidPassword123!');
    });
    it('pre-fills credentials when admin button is clicked', () => {
        render(<BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>);
        const adminBtn = screen.getByRole('button', { name: /fill admin/i });
        fireEvent.click(adminBtn);
        const emailInput = screen.getByLabelText(/candidate email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        expect(emailInput.value).toBe('admin@preppulse.ai');
        expect(passwordInput.value).toBe('AdminPassword123!');
    });
});
