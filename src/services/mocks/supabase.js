// Mock implementation of Supabase client
export const supabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
};

export default supabaseClient;