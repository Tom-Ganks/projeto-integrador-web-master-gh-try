// src/setupTests.js
import '@testing-library/jest-dom';

jest.mock('./services/supabase.js', () => ({
  supabaseClient: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  }
}));

// Mock console methods as jest spies
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Mock window.scrollTo
global.scrollTo = jest.fn();

// Mock window.print
global.print = jest.fn();

// Mock window.alert
global.alert = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  unobserve() { }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  unobserve() { }
};

// Mock do Lucide React
jest.mock('lucide-react', () => ({
  Calendar: jest.fn(({ size }) => <div data-testid="calendar-icon" data-size={size} />),
  Filter: jest.fn(({ size }) => <div data-testid="filter-icon" data-size={size} />),
  Plus: jest.fn(({ size }) => <div data-testid="plus-icon" data-size={size} />),
  Printer: jest.fn(({ size }) => <div data-testid="printer-icon" data-size={size} />),
  Clock: jest.fn(({ size }) => <div data-testid="clock-icon" data-size={size} />),
  Users: jest.fn(({ size }) => <div data-testid="users-icon" data-size={size} />),
  BookOpen: jest.fn(({ size }) => <div data-testid="book-open-icon" data-size={size} />),
  X: jest.fn(({ size }) => <div data-testid="x-icon" data-size={size} />),
  MapPin: jest.fn(({ size }) => <div data-testid="map-pin-icon" data-size={size} />),
  Trash2: jest.fn(({ size }) => <div data-testid="trash-icon" data-size={size} />),
  ArrowLeft: jest.fn(({ size }) => <div data-testid="arrow-left-icon" data-size={size} />),
  Menu: jest.fn(({ size }) => <div data-testid="menu-icon" data-size={size} />),
  Bell: jest.fn(({ size }) => <div data-testid="bell-icon" data-size={size} />),
  GraduationCap: jest.fn(({ size }) => <div data-testid="graduation-cap-icon" data-size={size} />),
  User: jest.fn(({ size }) => <div data-testid="user-icon" data-size={size} />),
  Mail: jest.fn(({ size }) => <div data-testid="mail-icon" data-size={size} />),
  Phone: jest.fn(({ size }) => <div data-testid="phone-icon" data-size={size} />),
  Book: jest.fn(({ size }) => <div data-testid="book-icon" data-size={size} />),
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  console.error.mockClear();
  console.warn.mockClear();
  console.log.mockClear();
  global.scrollTo.mockClear();
  global.print.mockClear();
  global.alert.mockClear();
});