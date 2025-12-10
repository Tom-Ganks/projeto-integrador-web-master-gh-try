import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeriadosDialog from '../widgets/FeriadosDialog.jsx';
import { supabaseClient } from '../services/supabase.js';

jest.mock('../services/supabase.js', () => ({
  supabaseClient: {
    from: jest.fn(() => ({
      insert: jest.fn(),
      delete: jest.fn(() => ({ eq: jest.fn() }))
    }))
  }
}));

// Mock data
const mockFeriadosNacionais = {
  '2025-0-1': '🎉 Ano Novo',
  '2025-11-25': '🎄 Natal',
  '2025-3-21': '🎖 Tiradentes'
};

const mockFeriadosMunicipais = {
  '2025-5-15': 'Festa da Cidade',
  '2025-7-20': 'Aniversário da Cidade'
};

describe('FeriadosDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnFeriadoAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza dialog com título e seções principais', () => {
    render(
      <FeriadosDialog
        feriadosNacionais={mockFeriadosNacionais}
        feriadosMunicipais={mockFeriadosMunicipais}
        onClose={mockOnClose}
        onFeriadoAdded={mockOnFeriadoAdded}
      />
    );

    expect(screen.getByText('Gerenciar Feriados')).toBeInTheDocument();
    expect(screen.getByText('Feriados Nacionais')).toBeInTheDocument();
    expect(screen.getByText('Feriados Municipais')).toBeInTheDocument();
  });

  test('adiciona feriado municipal com sucesso', async () => {
    supabaseClient.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null })
    });

    render(
      <FeriadosDialog
        feriadosNacionais={mockFeriadosNacionais}
        feriadosMunicipais={{}}
        onClose={mockOnClose}
        onFeriadoAdded={mockOnFeriadoAdded}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Adicionar feriado municipal/i }));

    fireEvent.change(screen.getByPlaceholderText('Nome do feriado'), {
      target: { value: 'Dia do Teste' }
    });
    fireEvent.change(screen.getByTestId('data-input'), {
      target: { value: '2025-08-15' }
    });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(mockOnFeriadoAdded).toHaveBeenCalled();
      expect(screen.queryByPlaceholderText('Nome do feriado')).not.toBeInTheDocument();
    });
  });

  test('exibe erro ao falhar em adicionar feriado', async () => {
    const error = new Error('Falha no insert');
    supabaseClient.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error })
    });

    jest.spyOn(window, 'alert').mockImplementation(() => { });

    render(
      <FeriadosDialog
        feriadosNacionais={mockFeriadosNacionais}
        feriadosMunicipais={{}}
        onClose={mockOnClose}
        onFeriadoAdded={mockOnFeriadoAdded}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Adicionar feriado municipal/i }));
    fireEvent.change(screen.getByPlaceholderText('Nome do feriado'), {
      target: { value: 'Feriado Bugado' }
    });
    fireEvent.change(screen.getByTestId('data-input'), {
      target: { value: '2025-09-10' }
    });

    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao adicionar feriado'));
    });
  });

  test('remove feriado municipal com sucesso', async () => {
    supabaseClient.from.mockReturnValue({
      delete: jest.fn(() => ({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      }))
    });

    render(
      <FeriadosDialog
        feriadosNacionais={mockFeriadosNacionais}
        feriadosMunicipais={{ '2025-5-15': 'Festa da Cidade' }}
        onClose={mockOnClose}
        onFeriadoAdded={mockOnFeriadoAdded}
      />
    );

    const removeButton = screen.getByRole('button', { name: /Remover feriado Festa da Cidade/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockOnFeriadoAdded).toHaveBeenCalled();
    });
  });

  test('exibe erro ao falhar em remover feriado', async () => {
    const error = new Error('Falha no delete');
    supabaseClient.from.mockReturnValue({
      delete: jest.fn(() => ({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error })
        })
      }))
    });

    jest.spyOn(window, 'alert').mockImplementation(() => { });

    render(
      <FeriadosDialog
        feriadosNacionais={mockFeriadosNacionais}
        feriadosMunicipais={{ '2025-5-15': 'Festa da Cidade' }}
        onClose={mockOnClose}
        onFeriadoAdded={mockOnFeriadoAdded}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Remover feriado Festa da Cidade/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao remover feriado'));
    });
  });
test('mostra estado de loading ao salvar', async () => {
  // Sobrepondo o mock para simular delay
  let resolveInsert;
  const insertPromise = new Promise(res => { resolveInsert = res; });
  supabaseClient.from.mockReturnValue({
    insert: jest.fn(() => insertPromise)
  });

  render(
    <FeriadosDialog
      feriadosNacionais={mockFeriadosNacionais}
      feriadosMunicipais={{}}
      onClose={mockOnClose}
      onFeriadoAdded={mockOnFeriadoAdded}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /Adicionar feriado municipal/i }));
  fireEvent.change(screen.getByPlaceholderText('Nome do feriado'), {
    target: { value: 'Dia em Espera' }
  });
  fireEvent.change(screen.getByTestId('data-input'), {
    target: { value: '2025-12-01' }
  });

  fireEvent.click(screen.getByText('Salvar'));

  // Esperar que o estado de loading seja mostrado
  expect(await screen.findByText('Salvando...')).toBeInTheDocument();

  // Resolver a promessa para simular o fim do loading
  act(() => resolveInsert({ error: null }));

  await waitFor(() => {
    expect(mockOnFeriadoAdded).toHaveBeenCalled();
  });
  });
});