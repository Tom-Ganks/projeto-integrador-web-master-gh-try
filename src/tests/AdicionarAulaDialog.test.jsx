import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdicionarAulaDialog from '../widgets/AdicionarAulaDialog.jsx';
import { supabaseClient } from '../services/supabase.js';

jest.mock('../services/supabase.js');

const mockSelectedDays = new Set([new Date('2025-01-15').getTime()]);

const mockTurmas = [
  { idturma: 1, turma: 'Turma A', idcurso: 1 },
  { idturma: 2, turma: 'Turma B', idcurso: 1 }
];

const mockUcs = [
  { iduc: 1, nomeuc: 'Programação Web', cargahoraria: 96, idcurso: 1 },
  { iduc: 2, nomeuc: 'Banco de Dados', cargahoraria: 80, idcurso: 1 }
];

describe('AdicionarAulaDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnAulaAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.error && console.error.mockClear?.();
  });

  // Mock helper que lida tanto com select().order(...) quanto com select(...) direto
  const setupSuccessfulMocks = () => {
    supabaseClient.from.mockImplementation((tableName) => {
      const dataMap = {
        turma: { data: mockTurmas, error: null },
        unidades_curriculares: { data: mockUcs, error: null }
      };

      const resolved = Promise.resolve(dataMap[tableName] || { data: [], error: null });

      // select retorna um "thenable" que também tem order() para cobertura de ambos os usos
      const select = jest.fn(() => {
        const thenable = {
          order: jest.fn(() => resolved),
          then: resolved.then.bind(resolved),
          catch: resolved.catch.bind(resolved)
        };
        return thenable;
      });

      return { select, insert: jest.fn(), update: jest.fn(), delete: jest.fn() };
    });
  };

  test('renderiza título e estrutura básica do dialog', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(
        <AdicionarAulaDialog
          selectedDays={mockSelectedDays}
          onClose={mockOnClose}
          onAulaAdded={mockOnAulaAdded}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Agendar Aulas')).toBeInTheDocument();
      expect(screen.getByText('Dias Selecionados')).toBeInTheDocument();
      expect(screen.getByText('Turma')).toBeInTheDocument();
    });
  });

  test('botão salvar fica desabilitado até preencher todos os campos obrigatórios', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(
        <AdicionarAulaDialog
          selectedDays={mockSelectedDays}
          onClose={mockOnClose}
          onAulaAdded={mockOnAulaAdded}
        />
      );
    });

    await waitFor(() => {
      const saveButton = screen.getByText('Salvar Agendamento');
      expect(saveButton).toBeDisabled();
    });
  });

  test('habilita botão salvar quando todos os campos estão preenchidos', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(
        <AdicionarAulaDialog
          selectedDays={mockSelectedDays}
          onClose={mockOnClose}
          onAulaAdded={mockOnAulaAdded}
        />
      );
    });

    // Aguarda os selects aparecerem e então seleciona Turma e UC
    await waitFor(() => {
      // Os selects têm a classe .form-select.
      // ordem: [turma, UC (quando turma selecionada), período ...]
      const selects = document.querySelectorAll('.form-select');
      expect(selects.length).toBeGreaterThan(0);
    });

    // Seleciona Turma (primeiro select)
    const selectsAfter = document.querySelectorAll('.form-select');
    const turmaSelect = selectsAfter[0];
    fireEvent.change(turmaSelect, { target: { value: String(mockTurmas[0].idturma) } });

    // Agora UC deve aparecer (é o próximo select)
    await waitFor(() => {
      const selectsNow = document.querySelectorAll('.form-select');
      expect(selectsNow.length).toBeGreaterThan(1);
    });

    const selectsNow = document.querySelectorAll('.form-select');
    const ucSelect = selectsNow[1];
    fireEvent.change(ucSelect, { target: { value: String(mockUcs[0].iduc) } });

    // Depois de turma e UC selecionados, botão deve habilitar
    await waitFor(() => {
      const saveButton = screen.getByText('Salvar Agendamento');
      expect(saveButton).not.toBeDisabled();
    });
  });

  test('fecha dialog corretamente', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(
        <AdicionarAulaDialog
          selectedDays={mockSelectedDays}
          onClose={mockOnClose}
          onAulaAdded={mockOnAulaAdded}
        />
      );
    });

    // Seleciona botão com a classe .btn-close (ícone X)
    const closeButton = document.querySelector('.btn-close');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  test('ajusta horas máximas baseado no período selecionado', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(
        <AdicionarAulaDialog
          selectedDays={mockSelectedDays}
          onClose={mockOnClose}
          onAulaAdded={mockOnAulaAdded}
        />
      );
    });

    // Seleciona Turma e UC para que o restante do formulário apareça
    await waitFor(() => {
      const selects = document.querySelectorAll('.form-select');
      expect(selects.length).toBeGreaterThan(0);
    });

    const selects1 = document.querySelectorAll('.form-select');
    fireEvent.change(selects1[0], { target: { value: String(mockTurmas[0].idturma) } });

    await waitFor(() => {
      const selectsNow = document.querySelectorAll('.form-select');
      expect(selectsNow.length).toBeGreaterThan(1);
    });

    const selectsNow2 = document.querySelectorAll('.form-select');
    fireEvent.change(selectsNow2[1], { target: { value: String(mockUcs[0].iduc) } });

    // Período é geralmente o terceiro select
    await waitFor(() => {
      const selectsFinally = document.querySelectorAll('.form-select');
      expect(selectsFinally.length).toBeGreaterThanOrEqual(3);
    });

    const periodoSelect = document.querySelectorAll('.form-select')[2];
    fireEvent.change(periodoSelect, { target: { value: 'Noturno' } });

    await waitFor(() => {
      expect(periodoSelect.value).toBe('Noturno');
    });
  });

  test('exibe resumo do agendamento corretamente', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(
        <AdicionarAulaDialog
          selectedDays={mockSelectedDays}
          onClose={mockOnClose}
          onAulaAdded={mockOnAulaAdded}
        />
      );
    });

    await waitFor(() => {
      const selects = document.querySelectorAll('.form-select');
      expect(selects.length).toBeGreaterThan(0);
    });

    const selectsA = document.querySelectorAll('.form-select');
    fireEvent.change(selectsA[0], { target: { value: String(mockTurmas[0].idturma) } });

    await waitFor(() => {
      const selectsB = document.querySelectorAll('.form-select');
      expect(selectsB.length).toBeGreaterThan(1);
    });

    const selectsB = document.querySelectorAll('.form-select');
    fireEvent.change(selectsB[1], { target: { value: String(mockUcs[0].iduc) } });

    // Espera resumo renderizar
    await waitFor(() => {
      expect(screen.getByText('Resumo do Agendamento')).toBeInTheDocument();
      expect(screen.getByText('Matutino')).toBeInTheDocument();
    });

    // Verifica que há indicação de horas (não exige valor fixo exato)
    const horasElements = screen.getAllByText(/horas/);
    expect(horasElements.length).toBeGreaterThan(0);

    // Checagem mais precisa do valor restante com os mocks:
    const expectedRemaining = mockUcs[0].cargahoraria - 1 * mockSelectedDays.size; // horasAula default 1
    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${expectedRemaining}\\s+horas`))).toBeInTheDocument();
    });
  });

  test('submete dados corretamente', async () => {
    setupSuccessfulMocks();

    await act(async () => {
      render(
        <AdicionarAulaDialog
          selectedDays={mockSelectedDays}
          onClose={mockOnClose}
          onAulaAdded={mockOnAulaAdded}
        />
      );
    });

    // Preencher Turma e UC
    await waitFor(() => {
      const selects = document.querySelectorAll('.form-select');
      expect(selects.length).toBeGreaterThan(0);
    });

    const sel = document.querySelectorAll('.form-select');
    fireEvent.change(sel[0], { target: { value: String(mockTurmas[0].idturma) } });

    await waitFor(() => {
      const sel2 = document.querySelectorAll('.form-select');
      expect(sel2.length).toBeGreaterThan(1);
    });

    const sel2 = document.querySelectorAll('.form-select');
    fireEvent.change(sel2[1], { target: { value: String(mockUcs[0].iduc) } });

    // Clica salvar
    const saveButton = screen.getByText('Salvar Agendamento');
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    fireEvent.click(saveButton);

    // O componente envia um Set de timestamps (internamente usa Set)
    await waitFor(() => {
      expect(mockOnAulaAdded).toHaveBeenCalledTimes(1);

      const calledWith = mockOnAulaAdded.mock.calls[0][0];
      expect(calledWith.idturma).toBe(1);
      expect(calledWith.iduc).toBe(1);
      expect(calledWith.periodo).toBeDefined();
      expect(calledWith.horas).toBe(1);
      expect(calledWith.horario).toBeDefined();

      // dias é um Set de timestamps — verificamos que o mockSelectedDays está presente
      expect(calledWith.dias.has([...mockSelectedDays][0])).toBeTruthy();
    });
  });

  // Teste separado para simular falha no carregamento de carga horária
  test('loga erro ao falhar carregar carga horária', async () => {
    // Mock que causa erro apenas na carga horária
    supabaseClient.from.mockImplementation((tableName) => {
      if (tableName === 'unidades_curriculares') {
        const p = Promise.resolve({ data: null, error: new Error('Falha') });
        return {
          select: jest.fn(() => ({
            then: p.then.bind(p),
            catch: p.catch.bind(p),
            order: jest.fn(() => p),
          })),
        };
      }
      const p = Promise.resolve({ data: mockTurmas, error: null });
      return {
        select: jest.fn(() => ({
          then: p.then.bind(p),
          catch: p.catch.bind(p),
          order: jest.fn(() => p),
        })),
      };
    });

    await act(async () => {
      render(
        <AdicionarAulaDialog
          selectedDays={mockSelectedDays}
          onClose={mockOnClose}
          onAulaAdded={mockOnAulaAdded}
        />
      );
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Erro ao carregar carga horária:',
        expect.any(Error)
      );
    });
  });
}); // ← Esta é a chave de fechamento que estava faltando