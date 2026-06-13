// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StreakUpdateModal } from '@/components/streak/StreakUpdateModal';

afterEach(cleanup);

describe('StreakUpdateModal', () => {
    it('shows a standard streak update with weekly progress', () => {
        render(
            <StreakUpdateModal
                streakCount={7}
                lastActionDate="2026-06-13"
                onClose={vi.fn()}
            />
        );

        expect(screen.getByRole('dialog', { name: '7-Day Streak' })).toBeTruthy();
        expect(screen.getByText('Daily goal complete')).toBeTruthy();
        expect(screen.getByText('6/7 active')).toBeTruthy();
        expect(screen.getByLabelText('Monday: active streak day')).toBeTruthy();
        expect(screen.getByLabelText('Saturday: current streak day')).toBeTruthy();
        expect(screen.getByLabelText('Sunday: upcoming')).toBeTruthy();
        expect(screen.queryByText('Streak protected')).toBeNull();
    });

    it('places a short streak on the actual trailing days of the week', () => {
        render(
            <StreakUpdateModal
                streakCount={3}
                lastActionDate="2026-06-13"
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('3/7 active')).toBeTruthy();
        expect(screen.getByLabelText('Wednesday: inactive')).toBeTruthy();
        expect(screen.getByLabelText('Thursday: active streak day')).toBeTruthy();
        expect(screen.getByLabelText('Friday: active streak day')).toBeTruthy();
        expect(screen.getByLabelText('Saturday: current streak day')).toBeTruthy();
    });

    it('shows the protected state and closes from the primary action', () => {
        const onClose = vi.fn();

        render(
            <StreakUpdateModal
                streakCount={7}
                guardsUsed={1}
                guardsRemaining={2}
                onClose={onClose}
            />
        );

        expect(screen.getByText('Streak protected')).toBeTruthy();
        expect(screen.getByText(/1 guard used. 2 remaining this month/i)).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Keep going' }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('closes when Escape is pressed', () => {
        const onClose = vi.fn();
        render(<StreakUpdateModal streakCount={12} onClose={onClose} />);

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
    });
});
