import { fireEvent, render, screen } from '@testing-library/react';
import CadastroDeCurso from '../components/CadastroDeCurso';
import { CursoRegistrationForm } from '../components/CadastroDeCurso';
import { supabaseClient } from '../services/supabase';

test('renderiza inputs de Nome do Curso e Carga Horária do Curso', () => {
  render(<CadastroDeCurso onNavigateHome={() => {}} />);

  expect(screen.getByLabelText(/Nome do Curso/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Carga Horária/i)).toBeInTheDocument();
});

test('chama onSubmit com dados corretos ao cadastrar novo curso', () => {
  const handleSubmit = jest.fn();
  render(<CursoRegistrationForm onSubmit={handleSubmit} />);

  fireEvent.change(screen.getByLabelText(/Nome do Curso/i), { target: { value: 'Java' } });
  fireEvent.change(screen.getByLabelText(/Carga Horária/i), { target: { value: 1300 } });

  fireEvent.click(screen.getByTestId('btn-save'));

  expect(handleSubmit).toHaveBeenCalledWith({
    nomecurso: 'Java',
    cargahoraria: 1300,
  });
});

test('atualiza curso existente mantendo valores não alterados', () => {
  const handleSubmit = jest.fn();
  const cursoExistente = {
    nomecurso: 'Java',
    cargahoraria: 1300,
  };

  render(<CursoRegistrationForm onSubmit={handleSubmit} initialData={cursoExistente} />);

  fireEvent.change(screen.getByLabelText(/Nome do Curso/i), { target: { value: 'Técnico em Informática' } });
  fireEvent.click(screen.getByTestId('btn-save'));

  expect(handleSubmit).toHaveBeenCalledWith({
    nomecurso: 'Técnico em Informática',
    cargahoraria: 1300, // mantém o valor original se não mudar
  });
});

test('valida que os campos obrigatórios foram preenchidos', () => {
  const handleSubmit = jest.fn();
  render(<CursoRegistrationForm onSubmit={handleSubmit} />);

  fireEvent.click(screen.getByTestId('btn-save'));

  expect(screen.getByText(/Nome do curso é obrigatório/i)).toBeInTheDocument();
  expect(screen.getByText(/Carga horária é obrigatória/i)).toBeInTheDocument();

  expect(handleSubmit).not.toHaveBeenCalled();
});

test('exibe mensagem quando não há cursos cadastrados', async () => {
  // Mock específico para este teste
  supabaseClient.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [], error: null })
    })
  });

  render(<CadastroDeCurso onNavigateHome={() => {}} />);

  // Aguarde o carregamento e verifique se não há itens na lista
  await screen.findByTestId('cadastro-de-curso');
  const listItems = screen.queryAllByRole('listitem');
  expect(listItems).toHaveLength(0);
});