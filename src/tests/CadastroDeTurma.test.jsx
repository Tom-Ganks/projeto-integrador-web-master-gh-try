import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CadastroDeTurma from '../components/CadastroDeTurma.jsx';
import { supabaseClient } from '../services/supabase.js';

// ✅ mock do Supabase
jest.mock('../services/supabase.js', () => ({
  supabaseClient: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('CadastroDeTurma', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza tela de carregamento inicialmente', async () => {
  // Simulate slow loading
  supabaseClient.from.mockReturnValueOnce({
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: [], error: null }), 50))
    ),
  });

  render(<CadastroDeTurma onNavigateHome={jest.fn()} />);
  expect(screen.getByText('Carregando...')).toBeInTheDocument();
  // Wait for loading to finish
  await waitFor(() => screen.getByText('Cadastro de Turmas'));
});

  test('renderiza título e formulário após carregamento', async () => {
    render(<CadastroDeTurma onNavigateHome={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Cadastro de Turmas')).toBeInTheDocument();
      expect(screen.getByText('Cadastrar Nova Turma')).toBeInTheDocument();
    });
  });

  test('valida campos obrigatórios antes de salvar', async () => {
    render(<CadastroDeTurma onNavigateHome={jest.fn()} />);

    await waitFor(() => screen.getByText('Salvar Turma'));
    fireEvent.click(screen.getByText('Salvar Turma'));

    expect(screen.getByText('Nome da turma é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Selecione um instrutor')).toBeInTheDocument();
    expect(screen.getByText('Selecione um curso')).toBeInTheDocument();
    expect(screen.getByText('Selecione um turno')).toBeInTheDocument();
  });

  test('envia formulário com dados válidos', async () => {
    render(<CadastroDeTurma onNavigateHome={jest.fn()} />);

    await waitFor(() => screen.getByText('Salvar Turma'));

    fireEvent.change(screen.getByPlaceholderText('Digite o nome da turma'), { target: { value: 'Turma A' } });

    // simula selects preenchidos
    fireEvent.change(screen.getByLabelText('Instrutor'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Curso'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Turno'), { target: { value: '1' } });

    fireEvent.click(screen.getByText('Salvar Turma'));

    await waitFor(() => {
      expect(supabaseClient.from).toHaveBeenCalledWith('turma');
    });
  });

  test('aciona modo de edição corretamente', async () => {
    const fakeData = [
      {
        idturma: 1,
        turmanome: 'Turma B',
        instrutores: { idinstrutor: 1, nomeinstrutor: 'João' },
        cursos: { idcurso: 1, nomecurso: 'Informática' },
        turnos: { idturno: 1, turno: 'Matutino' },
      },
    ];

    supabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: fakeData, error: null }),
    });

    render(<CadastroDeTurma onNavigateHome={jest.fn()} />);

    await waitFor(() => screen.getByText('Turma B'));

    fireEvent.click(screen.getByTitle('Editar'));

    expect(screen.getByDisplayValue('Turma B')).toBeInTheDocument();
  });

  test('confirma exclusão de turma', async () => {
    global.confirm = jest.fn(() => true);

    const fakeData = [
      { idturma: 1, turmanome: 'Turma C', instrutores: {}, cursos: {}, turnos: {} },
    ];

    supabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: fakeData, error: null }),
    });

    render(<CadastroDeTurma onNavigateHome={jest.fn()} />);
    await waitFor(() => screen.getByText('Turma C'));

    fireEvent.click(screen.getByTitle('Excluir'));
    await waitFor(() => {
      expect(supabaseClient.from).toHaveBeenCalledWith('turma');
    });
  });

  test('exibe mensagem de erro ao falhar no delete', async () => {
    global.confirm = jest.fn(() => true);

    supabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [{ idturma: 1, turmanome: 'Turma D' }], error: null }),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: new Error('Falha ao excluir') }),
    });

    render(<CadastroDeTurma onNavigateHome={jest.fn()} />);
    await waitFor(() => screen.getByText('Turma D'));

    fireEvent.click(screen.getByTitle('Excluir'));
    await waitFor(() => {
      expect(screen.getByText(/Erro ao excluir turma/i)).toBeInTheDocument();
    });
  });
});
