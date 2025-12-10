import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UcsRegistrationForm from '../components/UcsRegistrationForm.jsx';

const mockCursos = [
  { idcurso: 1, nomecurso: 'Programação em Python' },
  { idcurso: 2, nomecurso: 'Desenvolvimento Web' },
];

describe('UcsRegistrationForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza os campos corretamente', async () => {
    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nome')).toBeInTheDocument();
      expect(screen.getByLabelText('Carga Horária')).toBeInTheDocument();
      expect(screen.getByLabelText('Curso')).toBeInTheDocument();
      expect(screen.getByText('💾 Salvar Unidade Curricular')).toBeInTheDocument();
    });
  });

  test('renderiza opções de cursos corretamente', () => {
    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Programação em Python')).toBeInTheDocument();
    expect(screen.getByText('Desenvolvimento Web')).toBeInTheDocument();
  });

  test('valida campos obrigatórios', async () => {
    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByText('💾 Salvar Unidade Curricular');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Nome da UC é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Carga horária é obrigatória')).toBeInTheDocument();
      expect(screen.getByText('Curso é obrigatório')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('valida nome com menos de 3 caracteres', async () => {
    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText('Nome');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'AB' } });
    });

    const submitButton = screen.getByText('💾 Salvar Unidade Curricular');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Nome da UC deve ter pelo menos 3 caracteres')).toBeInTheDocument();
    });
  });

  test('valida carga horária fora do intervalo', async () => {
    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    const hoursInput = screen.getByLabelText('Carga Horária');

    await act(async () => {
      fireEvent.change(hoursInput, { target: { value: '2500' } });
    });

    const submitButton = screen.getByText('💾 Salvar Unidade Curricular');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Carga horária deve estar entre 1 e 2000 horas')).toBeInTheDocument();
    });
  });

  test('submete formulário com dados válidos', async () => {
    mockOnSubmit.mockResolvedValue();

    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova UC' } });
      fireEvent.change(screen.getByLabelText('Carga Horária'), { target: { value: '80' } });
      fireEvent.change(screen.getByLabelText('Curso'), { target: { value: '1' } });
    });

    const submitButton = screen.getByText('💾 Salvar Unidade Curricular');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        nomeuc: 'Nova UC',
        cargahoraria: 80,
        idcurso: 1
      });
    });
  });

  test('exibe mensagem de sucesso após submissão', async () => {
    mockOnSubmit.mockResolvedValue();

    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Banco de Dados' } });
    fireEvent.change(screen.getByLabelText('Carga Horária'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Curso'), { target: { value: '1' } });

    await act(async () => {
      fireEvent.click(screen.getByText('💾 Salvar Unidade Curricular'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Unidade Curricular registrada com sucesso!/i)).toBeInTheDocument();
    });
  });

  test('exibe mensagem de erro em caso de falha', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Erro de conexão'));

    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova UC' } });
      fireEvent.change(screen.getByLabelText('Carga Horária'), { target: { value: '80' } });
      fireEvent.change(screen.getByLabelText('Curso'), { target: { value: '1' } });
    });

    const submitButton = screen.getByText('💾 Salvar Unidade Curricular');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Erro ao registrar UC: Erro de conexão')).toBeInTheDocument();
    });
  });

  test('renderiza formulário em modo de edição', () => {
    const initialData = {
      iduc: 1,
      nomeuc: 'UC Existente',
      cargahoraria: 60,
      idcurso: 2,
    };

    render(
      <UcsRegistrationForm
        cursos={mockCursos}
        onSubmit={mockOnSubmit}
        initialData={initialData}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('UC Existente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    expect(screen.getByText('Desenvolvimento Web')).toBeInTheDocument();
    expect(screen.getByText('💾 Atualizar Unidade Curricular')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  test('chama onCancel ao clicar em cancelar', () => {
    const initialData = {
      iduc: 1,
      nomeuc: 'UC Existente',
      cargahoraria: 60,
      idcurso: 2,
    };

    render(
      <UcsRegistrationForm
        cursos={mockCursos}
        onSubmit={mockOnSubmit}
        initialData={initialData}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('limpa erros ao digitar nos campos', async () => {
    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByText('💾 Salvar Unidade Curricular');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Nome da UC é obrigatório')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('Nome');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Nova UC' } });
    });

    await waitFor(() => {
      expect(screen.queryByText('Nome da UC é obrigatório')).not.toBeInTheDocument();
    });
  });

  test('desabilita botão durante submissão', async () => {
    let resolveSubmit;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });
    mockOnSubmit.mockReturnValue(submitPromise);

    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova UC' } });
      fireEvent.change(screen.getByLabelText('Carga Horária'), { target: { value: '80' } });
      fireEvent.change(screen.getByLabelText('Curso'), { target: { value: '1' } });
    });

    const submitButton = screen.getByText('💾 Salvar Unidade Curricular');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Salvando...')).toBeInTheDocument();
      expect(screen.getByText('Salvando...')).toBeDisabled();
    });

    await act(async () => {
      resolveSubmit();
    });
  });

  test('limpa formulário após submissão bem-sucedida (modo criação)', async () => {
    mockOnSubmit.mockResolvedValue();

    render(<UcsRegistrationForm cursos={mockCursos} onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Banco de Dados' } });
    fireEvent.change(screen.getByLabelText('Carga Horária'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Curso'), { target: { value: '1' } });

    await act(async () => {
      fireEvent.click(screen.getByText('💾 Salvar Unidade Curricular'));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Nome')).toHaveValue('');
      expect(screen.getByLabelText('Carga Horária')).toHaveValue(null); // input number vazio = null
      expect(screen.getByLabelText('Curso')).toHaveValue('');
    });
  });

  test('não limpa formulário em modo de edição', async () => {
    mockOnSubmit.mockResolvedValue();

    const initialData = {
      iduc: 1,
      nomeuc: 'UC Existente',
      cargahoraria: 60,
      idcurso: 2,
    };

    render(
      <UcsRegistrationForm
        cursos={mockCursos}
        onSubmit={mockOnSubmit}
        initialData={initialData}
        onCancel={mockOnCancel}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('💾 Atualizar Unidade Curricular'));
    });

    await waitFor(() => {
      expect(screen.getByText('Unidade Curricular atualizada com sucesso!')).toBeInTheDocument();
      expect(screen.getByDisplayValue('UC Existente')).toBeInTheDocument(); // não limpa
    });
  });
});
