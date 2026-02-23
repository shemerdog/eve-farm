// Polyfill localStorage for jsdom environments where it may not be available
if (
    typeof globalThis.localStorage === 'undefined' ||
    typeof globalThis.localStorage.setItem !== 'function'
) {
    const store: Record<string, string> = {}
    globalThis.localStorage = {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            for (const k in store) delete store[k]
        },
        get length() {
            return Object.keys(store).length
        },
        key: (i: number) => Object.keys(store)[i] ?? null,
    }
}

import '@testing-library/jest-dom'
