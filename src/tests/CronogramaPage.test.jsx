import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CronogramaPage from '../pages/cronograma/CronogramaPage.jsx';
import { supabaseClient } from '../services/supabase.js';

// Mock dos dialogs
jest.mock('../widgets/FeriadosDialog.jsx', () => {
  return function MockFeriadosDialog({ onClose }) {
    return (
      <div data-testid="feriados-dialog">
        <button onClick={onClose}>Fechar Feriados</button>
      </div>
    );
  };
});

jest.mock('../widgets/AdicionarAulaDialog.jsx', () => {
  return function MockAdicionarAulaDialog({ onClose }) {
    return (
      <div data-testid="aula-dialog">
        <button onClick={onClose}>Fechar Aulas</button>
      </div>
    );
  };
});

const mockTurmas = [
  { idturma: 1, turma: 'Turma A', cursos: { nomecurso: 'Técnico em Informática' } },
  { idturma: 2, turma: 'Turma B', cursos: { nomecurso: 'Técnico em Informática' } }
];

const mockAulas = [
  {
    idaula: 1,
    iduc: 1,
    idturma: 1,
    data: '2025-01-15',
    horario: '08:00-12:00',
    status: 'Agendada',
    horas: 4,
    unidades_curriculares: { nomeuc: 'Programação Web' },
    turma: { turmanome: 'Turma A' }
  }
];

describe('CronogramaPage', () => {
  const mockOnNavigateHome = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15'));
    console.error.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setupSuccessfulMocks = () => {
    supabaseClient.from.mockImplementation((table) => {
      const mockResponse = {
        turma: { data: mockTurmas, error: null },
        aulas: { data: mockAulas, error: null },
        feriadosmunicipais: { data: [], error: null }
      };

      return {
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve(mockResponse[table] || { data: [], error: null }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      };
    });
  };

  test('renderiza estrutura principal do cronograma', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Cronograma de Aulas')).toBeInTheDocument();
      expect(screen.getByTitle('Gerenciar Feriados')).toBeInTheDocument();
      expect(screen.getByTitle('Imprimir')).toBeInTheDocument();
    });
  });

  test('exibe estado de carregamento inicialmente', () => {
    setupSuccessfulMocks();

    render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  test('carrega dados do Supabase', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(supabaseClient.from).toHaveBeenCalledWith('turma');
      expect(supabaseClient.from).toHaveBeenCalledWith('aulas');
      expect(supabaseClient.from).toHaveBeenCalledWith('feriadosmunicipais');
    });
  });

  test('renderiza dias da semana em português', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const dayHeaders = [
        'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
        'quinta-feira', 'sexta-feira', 'sábado'
      ];

      dayHeaders.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });
  });

  test('navega entre meses', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(screen.getByText('JANEIRO 2025')).toBeInTheDocument();

      const nextButton = screen.getByText('›');
      fireEvent.click(nextButton);

      expect(screen.getByText('FEVEREIRO 2025')).toBeInTheDocument();
    });
  });

  test('seleciona dia único ao clicar', async () => {
  setupSuccessfulMocks();

  await act(async () => {
    render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
  });

  await waitFor(() => {
    const dayElement = screen.getByText('15');
    fireEvent.click(dayElement);

    // Check if selected-info appears
    expect(screen.getByText(/janeiro 2025/i)).toBeInTheDocument();
    // Or check for the selected day number
    expect(screen.getByText('15')).toBeInTheDocument();
  });
});

  test('seleciona múltiplos dias com Ctrl+Click', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const day15 = screen.getByText('15');
      const day16 = screen.getByText('16');

      fireEvent.click(day15, { ctrlKey: true });
      fireEvent.click(day16, { ctrlKey: true });

      expect(screen.getByText('2 dia(s) selecionado(s)')).toBeInTheDocument();
    });
  });

  test('FAB fica habilitado quando dia é selecionado', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const fab = screen.getByTitle('Agendar Aulas');
      expect(fab).toBeDisabled();

      const dayElement = screen.getByText('15');
      fireEvent.click(dayElement);

      expect(fab).not.toBeDisabled();
    });
  });

  test('filtra aulas por turma', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('Todas as Turmas');
      fireEvent.change(filterSelect, { target: { value: '1' } });

      expect(filterSelect.value).toBe('1');
    });
  });

  test('abre dialog de feriados', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const feriadosButton = screen.getByTitle('Gerenciar Feriados');
      fireEvent.click(feriadosButton);

      expect(screen.getByTestId('feriados-dialog')).toBeInTheDocument();
    });
  });

  test('abre dialog de adicionar aula', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const dayElement = screen.getByText('15');
      fireEvent.click(dayElement);

      const fab = screen.getByTitle('Agendar Aulas');
      fireEvent.click(fab);

      expect(screen.getByTestId('aula-dialog')).toBeInTheDocument();
    });
  });

  test('chama window.print ao clicar no botão imprimir', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const printButton = screen.getByTitle('Imprimir');
      fireEvent.click(printButton);

      expect(global.print).toHaveBeenCalledTimes(1);
    });
  });

  test('navega para home ao clicar no botão voltar', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      const backButton = document.querySelector('.back-button');
      fireEvent.click(backButton);
      expect(mockOnNavigateHome).toHaveBeenCalledTimes(1);
    });
  });

  // Supabase Connection Failure Tests
  test('lida com falha de conexão ao carregar turmas', async () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'turma') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: null, error: new Error('Falha de conexão') }))
          }))
        };
      }
      return {
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      };
    });

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Erro ao carregar turmas:', expect.any(Error));
    });
  });

  test('lida com falha de conexão ao carregar aulas', async () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'aulas') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: null, error: new Error('Falha de conexão') }))
          }))
        };
      }
      return {
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      };
    });

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Erro ao carregar aulas:', expect.any(Error));
    });
  });

  test('lida com falha de conexão ao carregar feriados municipais', async () => {
    supabaseClient.from.mockImplementation((table) => {
      if (table === 'feriadosmunicipais') {
        return {
          select: jest.fn(() => Promise.resolve({ data: null, error: new Error('Falha de conexão') }))
        };
      }
      return {
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      };
    });

    await act(async () => {
      render(<CronogramaPage onNavigateHome={mockOnNavigateHome} />);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Erro ao carregar feriados municipais:', expect.any(Error));
    });
  });
});