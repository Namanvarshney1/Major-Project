import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { InterviewSetupPage } from '../features/interview/InterviewSetupPage';
import { SUPPORTED_ROLES } from '../features/interview/interviewConfig';

describe('Interview Setup Component & Configuration', () => {
  it('renders target role, round types, and configuration options', () => {
    render(
      <BrowserRouter>
        <InterviewSetupPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/configure interview session/i)).toBeInTheDocument();
    expect(screen.getByText(/target engineering role/i)).toBeInTheDocument();
    expect(screen.getByText(/type of round/i)).toBeInTheDocument();
    
    // Verify all 4 round types are rendered as selectable buttons/cards
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('PI')).toBeInTheDocument();
    expect(screen.getByText('Managerial')).toBeInTheDocument();

    // Verify Number of Questions label and dropdown with 1-10 options (default: 5)
    expect(screen.getByLabelText(/number of questions/i)).toBeInTheDocument();
    const countSelect = screen.getByLabelText(/number of questions/i);
    expect(countSelect.value).toBe('5');
    expect(countSelect.options.length).toBe(10);
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByRole('option', { name: new RegExp(`^${i} Question`, 'i') })).toBeInTheDocument();
    }
  });

  it('allows selecting difficulty button and role options', () => {
    render(
      <BrowserRouter>
        <InterviewSetupPage />
      </BrowserRouter>
    );

    const roleSelect = screen.getAllByRole('combobox')[0];
    expect(roleSelect).toBeInTheDocument();

    // Change role
    fireEvent.change(roleSelect, {
      target: { value: 'Frontend Developer' },
    });
    expect(roleSelect.value).toBe('Frontend Developer');

    // Change question count to 7
    const countSelect = screen.getByLabelText(/number of questions/i);
    fireEvent.change(countSelect, { target: { value: '7' } });
    expect(countSelect.value).toBe('7');

    // Difficulty level button toggle
    const seniorBtn = screen.getByRole('button', { name: /^senior$/i });
    expect(seniorBtn).toBeInTheDocument();
    fireEvent.click(seniorBtn);

    // Switch round type to HR and verify dynamic topic matrix updates
    const hrBtn = screen.getByRole('button', { name: /hr/i });
    fireEvent.click(hrBtn);
    expect(screen.getByText('Self-Introduction')).toBeInTheDocument();
  });
});
