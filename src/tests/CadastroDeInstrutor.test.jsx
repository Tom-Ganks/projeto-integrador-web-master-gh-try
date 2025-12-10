import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CadastroDeInstrutor from '../components/CadastroDeInstrutor.jsx';
import { supabaseClient } from '../services/supabase.js';

// ✅ Mock controlado do supabase
jest.mock('../services/supabase.js', () => {
  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error: null }),
  }));

  return { supabaseClient: { from: mockFrom } };
});

describe('CadastroDeInstrutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza cabeçalho corretamente', async () => {
    render(<CadastroDeInstrutor onNavigateHome={jest.fn()} />);
    await waitFor(() =>
      expect(screen.getByText('Cadastro de Instrutores')).toBeInTheDocument()
    );
  });

  test('valida campos obrigatórios', async () => {
    render(<CadastroDeInstrutor onNavigateHome={jest.fn()} />);
    const botao = await screen.findByText(/Salvar Instrutor/i);
    fireEvent.click(botao);

    await waitFor(() => {
      expect(screen.getByText(/Nome é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/Email é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/Telefone é obrigatório/i)).toBeInTheDocument();
    });
  });

  test('insere instrutor corretamente', async () => {
    render(<CadastroDeInstrutor onNavigateHome={jest.fn()} />);
    fireEvent.change(
      await screen.findByPlaceholderText('Digite o nome do instrutor'),
      { target: { value: 'Carlos Silva' } }
    );
    fireEvent.change(screen.getByPlaceholderText('Digite o email'), {
      target: { value: 'carlos@email.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite o telefone'), {
      target: { value: '62999999999' },
    });
    fireEvent.click(screen.getByText(/Salvar Instrutor/i));

    await waitFor(() => {
      expect(supabaseClient.from).toHaveBeenCalledWith('instrutores');
    });
  });

  test('edita instrutor existente', async () => {
    const fakeInstrutores = [
      {
        idinstrutor: 1,
        nomeinstrutor: 'Antigo',
        especializacao: 'TI',
        email: 'a@a.com',
        telefone: '62999999999',
      },
    ];

    supabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: fakeInstrutores, error: null }),
    });

    render(<CadastroDeInstrutor onNavigateHome={jest.fn()} />);
    await waitFor(() => screen.getByText('Antigo'));

    fireEvent.click(screen.getByTitle('Editar'));
    await waitFor(() =>
      expect(screen.getByDisplayValue('Antigo')).toBeInTheDocument()
    );
  });

  test('deleta instrutor com confirmação', async () => {
    const fakeInstrutores = [
      { idinstrutor: 1, nomeinstrutor: 'Carlos', email: 'c@a.com', telefone: '999' },
    ];

    supabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: fakeInstrutores, error: null }),
    });

    render(<CadastroDeInstrutor onNavigateHome={jest.fn()} />);
    await waitFor(() => screen.getByText('Carlos'));

    fireEvent.click(screen.getByTitle('Excluir'));

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    });
  });
});
