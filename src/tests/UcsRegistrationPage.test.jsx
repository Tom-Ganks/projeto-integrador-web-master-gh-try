import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UcsRegistrationPage from '../pages/ucsregisterpage/UcsRegistrationPage.jsx';
import { supabaseClient } from '../services/supabase.js';

beforeAll(() => {
  global.console.error = jest.fn();
  global.alert = jest.fn();
  global.scrollTo = jest.fn();
  global.window.print = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  console.error.mockClear();
  alert.mockClear();
});

// Mock the supabase client
jest.mock('../services/supabase');

const mockCursos = [
  { idcurso: 1, nomecurso: 'Programação em Python' },
  { idcurso: 2, nomecurso: 'Desenvolvimento Web' }
];

const mockUcs = [
  { 
    iduc: 1, 
    nomeuc: 'Banco de Dados', 
    cargahoraria: 80, 
    cursos: { nomecurso: 'Programação em Python' } 
  },
  { 
    iduc: 2, 
    nomeuc: 'JavaScript Avançado', 
    cargahoraria: 60, 
    cursos: { nomecurso: 'Desenvolvimento Web' } 
  }
];

describe('UcsRegistrationPage', () => {
  const mockOnNavigateHome = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.error.mockClear();
  });

  const setupSuccessfulMocks = () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'cursos') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCursos, error: null }))
          }))
        };
      }
      if (table === 'unidades_curriculares') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockUcs, error: null }))
          })),
          insert: jest.fn(() => Promise.resolve({ data: [{ iduc: 3 }], error: null })),
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: [{ iduc: 1 }], error: null }))
          })),
          delete: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        };
      }
      return { select: jest.fn() };
    });
  };

  test('renderiza página com dados carregados com sucesso', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Unidades Curriculares')).toBeInTheDocument();
      expect(screen.getByText('Cadastrar Nova Unidade Curricular')).toBeInTheDocument();
      expect(screen.getByText('Banco de Dados')).toBeInTheDocument();
      expect(screen.getByText('JavaScript Avançado')).toBeInTheDocument();
    });
  });

  test('exibe estado de carregamento inicialmente', () => {
    setupSuccessfulMocks();
    
    render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  test('navega para home ao clicar no botão voltar', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const backButton = screen.getByTestId('arrow-left-icon').closest('button');
      fireEvent.click(backButton);
      expect(mockOnNavigateHome).toHaveBeenCalledTimes(1);
    });
  });

  test('filtra UCs por curso selecionado', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('Filtrar por curso: Todos os cursos');
      fireEvent.change(filterSelect, { target: { value: 'Programação em Python' } });
      
      expect(screen.getByText('Banco de Dados')).toBeInTheDocument();
      expect(screen.queryByText('JavaScript Avançado')).not.toBeInTheDocument();
    });
  });

  test('abre dialog de confirmação ao clicar em excluir', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const deleteButton = screen.getAllByTitle('Excluir')[0];
      fireEvent.click(deleteButton);
      
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      expect(screen.getByText('Tem certeza que deseja apagar essa UC (Unidade Curricular)?')).toBeInTheDocument();
    });
  });

  test('cancela exclusão ao clicar em cancelar', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const deleteButton = screen.getAllByTitle('Excluir')[0];
      fireEvent.click(deleteButton);
    });

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument();
    });
  });

  test('entra em modo de edição ao clicar em editar', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const editButton = screen.getAllByTitle('Editar')[0];
      fireEvent.click(editButton);
      
      expect(screen.getByText('Editar Unidade Curricular')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Banco de Dados')).toBeInTheDocument();
    });
  });

  test('testa scroll automático ao editar', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const editButton = screen.getAllByTitle('Editar')[0];
      fireEvent.click(editButton);
      
      expect(global.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth'
      });
    });
  });

  test('submete novo UC com sucesso', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nome');
      const hoursInput = screen.getByLabelText('Carga Horária');
      const courseSelect = screen.getByLabelText('Curso');

      fireEvent.change(nameInput, { target: { value: 'Nova UC' } });
      fireEvent.change(hoursInput, { target: { value: '40' } });
      fireEvent.change(courseSelect, { target: { value: '1' } });
    });

    const saveButton = screen.getByText(/Salvar Unidade Curricular/);
    
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(supabaseClient.from).toHaveBeenCalledWith('unidades_curriculares');
    });
  });

  test('confirma exclusão de UC', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const deleteButton = screen.getAllByTitle('Excluir')[0];
      fireEvent.click(deleteButton);
    });

    const confirmButton = screen.getByText('Excluir');
    
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(supabaseClient.from).toHaveBeenCalledWith('unidades_curriculares');
    });
  });

  // Supabase Connection Failure Tests
  test('lida com falha de conexão ao carregar cursos', async () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'cursos') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: null, error: new Error('Falha de conexão com Supabase') }))
          }))
        };
      }
      if (table === 'unidades_curriculares') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        };
      }
      return { select: jest.fn() };
    });

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Erro ao carregar cursos:', expect.any(Error));
      expect(screen.getByText('Selecione um curso')).toBeInTheDocument();
    });
  });

  test('lida com falha de conexão ao carregar UCs', async () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'cursos') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCursos, error: null }))
          }))
        };
      }
      if (table === 'unidades_curriculares') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: null, error: new Error('Falha de conexão com Supabase') }))
          }))
        };
      }
      return { select: jest.fn() };
    });

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Erro ao carregar UCs:', expect.any(Error));
      expect(screen.getByText('Unidades Curriculares Cadastradas')).toBeInTheDocument();
    });
  });

  test('lida com falha de conexão ao salvar UC', async () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'cursos') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCursos, error: null }))
          }))
        };
      }
      if (table === 'unidades_curriculares') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          insert: jest.fn(() => Promise.resolve({ error: new Error('Falha de conexão com Supabase') }))
        };
      }
      return { select: jest.fn() };
    });

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nome');
      const hoursInput = screen.getByLabelText('Carga Horária');
      const courseSelect = screen.getByLabelText('Curso');

      fireEvent.change(nameInput, { target: { value: 'Nova UC' } });
      fireEvent.change(hoursInput, { target: { value: '40' } });
      fireEvent.change(courseSelect, { target: { value: '1' } });
    });

    const saveButton = screen.getByText(/Salvar Unidade Curricular/);
    
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Erro ao registrar UCS:', expect.any(Error));
      expect(screen.getByText(/Erro ao registrar UC:/)).toBeInTheDocument();
    });
  });

  test('lida com falha de conexão ao excluir UC', async () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'cursos') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCursos, error: null }))
          }))
        };
      }
      if (table === 'unidades_curriculares') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockUcs, error: null }))
          })),
          delete: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: new Error('Falha de conexão com Supabase') }))
          }))
        };
      }
      return { select: jest.fn() };
    });

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const deleteButton = screen.getAllByTitle('Excluir')[0];
      fireEvent.click(deleteButton);
    });

    const confirmButton = screen.getByText('Excluir');
    
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Erro ao deletar UC:', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('Erro ao deletar UC: Falha de conexão com Supabase');
    });
  });

  test('lida com falha de conexão ao editar UC', async () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'cursos') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCursos, error: null }))
          }))
        };
      }
      if (table === 'unidades_curriculares') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockUcs, error: null }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: new Error('Falha de conexão com Supabase') }))
          }))
        };
      }
      return { select: jest.fn() };
    });

    await act(async () => {
      render(<UcsRegistrationPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const editButton = screen.getAllByTitle('Editar')[0];
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nome');
      const hoursInput = screen.getByLabelText('Carga Horária');
      const courseSelect = screen.getByLabelText('Curso');

      fireEvent.change(nameInput, { target: { value: 'UC Editada' } });
      fireEvent.change(hoursInput, { target: { value: '100' } });
      fireEvent.change(courseSelect, { target: { value: '2' } });
    });

    const saveButton = screen.getByRole('button', { name: /Unidade Curricular$/ });
    
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Erro ao editar UC:', expect.any(Error));
      expect(screen.getByText(/Erro ao editar UC:/)).toBeInTheDocument();
    });
  });
});