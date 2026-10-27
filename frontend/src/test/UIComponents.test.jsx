import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
describe('Design System UI Components', () => {
    it('renders Button with primary variant and handles click', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Start Mock</Button>);
        const btn = screen.getByRole('button', { name: /start mock/i });
        expect(btn).toBeInTheDocument();
        fireEvent.click(btn);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
    it('renders disabled Button and prevents click events', () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Disabled Action</Button>);
        const btn = screen.getByRole('button', { name: /disabled action/i });
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
        expect(handleClick).not.toHaveBeenCalled();
    });
    it('renders Badge with custom variants', () => {
        const { rerender } = render(<Badge variant="secondary">Active</Badge>);
        expect(screen.getByText('Active')).toBeInTheDocument();
        rerender(<Badge variant="destructive">Failed</Badge>);
        expect(screen.getByText('Failed')).toBeInTheDocument();
    });
    it('renders Card with header and content', () => {
        render(<Card>
        <CardHeader>
          <CardTitle>Session Telemetry</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Score: 92%</p>
        </CardContent>
      </Card>);
        expect(screen.getByText('Session Telemetry')).toBeInTheDocument();
        expect(screen.getByText('Score: 92%')).toBeInTheDocument();
    });
    it('renders Input and handles text changes', () => {
        const handleChange = vi.fn();
        render(<Input label="Target Role" placeholder="e.g. Backend Engineer" onChange={handleChange}/>);
        expect(screen.getByText('Target Role')).toBeInTheDocument();
        const input = screen.getByPlaceholderText('e.g. Backend Engineer');
        fireEvent.change(input, { target: { value: 'Distributed Systems' } });
        expect(handleChange).toHaveBeenCalled();
    });
});
