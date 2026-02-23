// Polyfill localStorage for jsdom environments where it may not be available
if (
    typeof globalThis.localStorage === 'undefined' ||
    typeof globalThis.localStorage.setItem !== 'function'
) {
    const store: Record<string, string> = {}
    globalThis.localStorage = {
        getItem: (key: string): string | null => store[key] ?? null,
        setItem: (key: string, value: string): void => {
            store[key] = value
        },
        removeItem: (key: string): void => {
            delete store[key]
        },
        clear: (): void => {
            for (const k in store) delete store[k]
        },
        get length(): number {
            return Object.keys(store).length
        },
        key: (i: number): string | null => Object.keys(store)[i] ?? null,
    }
}

import '@testing-library/jest-dom'
