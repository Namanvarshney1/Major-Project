import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { InterviewSetupPage } from '../features/interview/InterviewSetupPage';
describe('Interview Setup Component & Configuration', () => {
    it('renders track selection and configuration options', () => {
        render(<BrowserRouter>
        <InterviewSetupPage />
      </BrowserRouter>);
        expect(screen.getByText(/configure interview session/i)).toBeInTheDocument();
        expect(screen.getByText(/target engineering role/i)).toBeInTheDocument();
        expect(screen.getAllByText(/interview track/i).length).toBeGreaterThan(0);
    });
    it('allows selecting difficulty button and role options', () => {
        render(<BrowserRouter>
        <InterviewSetupPage />
      </BrowserRouter>);
        const comboboxes = screen.getAllByRole('combobox');
        expect(comboboxes.length).toBe(2);
        // Difficulty level button toggle
        const seniorBtn = screen.getByRole('button', { name: /senior/i });
        expect(seniorBtn).toBeInTheDocument();
        fireEvent.click(seniorBtn);
        // Role select
        const roleSelect = comboboxes[0];
        fireEvent.change(roleSelect, {
            target: { value: 'Distributed Systems & Infrastructure Architect' },
        });
        expect(roleSelect.value).toBe('Distributed Systems & Infrastructure Architect');
    });
});
