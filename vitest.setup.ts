import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => {
    const store = (localStorageMock as any).__store || {};
    return store[key] || null;
  },
  setItem: (key: string, value: string) => {
    const store = (localStorageMock as any).__store || {};
    store[key] = value.toString();
    (localStorageMock as any).__store = store;
  },
  removeItem: (key: string) => {
    const store = (localStorageMock as any).__store || {};
    delete store[key];
    (localStorageMock as any).__store = store;
  },
  clear: () => {
    (localStorageMock as any).__store = {};
  },
  key: (index: number) => {
    const store = (localStorageMock as any).__store || {};
    const keys = Object.keys(store);
    return keys[index] || null;
  },
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
