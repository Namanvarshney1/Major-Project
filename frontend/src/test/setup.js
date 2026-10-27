import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});
// Mock ResizeObserver for Recharts
globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};
// Mock fetch globally
globalThis.fetch = vi.fn().mockImplementation(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
}));
