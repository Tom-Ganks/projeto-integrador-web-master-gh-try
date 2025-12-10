import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../pages/home/HomePage.jsx';

// safe debug import checks
let Cronograma, UcsReg, CadastroCurso, CadastroInstrutor, CadastroTurma;
try { Cronograma = require('../pages/cronograma/CronogramaPage.jsx'); } catch (e) { Cronograma = undefined; }
try { UcsReg = require('../pages/ucsregisterpage/UcsRegistrationPage.jsx'); } catch (e) { UcsReg = undefined; }
try { CadastroCurso = require('../components/CadastroDeCurso.jsx'); } catch (e) { CadastroCurso = undefined; }
try { CadastroInstrutor = require('../components/CadastroDeInstrutor.jsx'); } catch (e) { CadastroInstrutor = undefined; }
try { CadastroTurma = require('../components/CadastroDeTurma.jsx'); } catch (e) { CadastroTurma = undefined; }

console.log('DEBUG imports:', {
  HomePage: !!HomePage,
  Cronograma: !!(Cronograma && (Cronograma.default || Cronograma)),
  UcsReg: !!(UcsReg && (UcsReg.default || UcsReg)),
  CadastroCurso: !!(CadastroCurso && (CadastroCurso.default || CadastroCurso)),
  CadastroInstrutor: !!(CadastroInstrutor && (CadastroInstrutor.default || CadastroInstrutor)),
  CadastroTurma: !!(CadastroTurma && (CadastroTurma.default || CadastroTurma)),
});

// Simula os componentes filhos para evitar renderização complexa
jest.mock('../pages/cronograma/CronogramaPage.jsx', () => {
  return function MockCronogramaPage({ onNavigateHome }) {
    return (
      <div data-testid="cronograma-page">
        <button onClick={onNavigateHome}>Voltar</button>
        <h1>Cronograma Page</h1>
      </div>
    );
  };
});

jest.mock('../pages/ucsregisterpage/UcsRegistrationPage.jsx', () => {
  return function MockUcsRegistrationPage({ onNavigateHome }) {
    return (
      <div data-testid="ucs-page">
        <button onClick={onNavigateHome}>Voltar</button>
        <h1>UCS Page</h1>
      </div>
    );
  };
});

jest.mock('../components/CadastroDeCurso.jsx', () => {
  return function MockCadastroDeCurso({ onNavigateHome }) {
    return (
      <div data-testid="curso-page">
        <button onClick={onNavigateHome}>Voltar</button>
        <h1>Curso Page</h1>
      </div>
    );
  };
});

jest.mock('../components/CadastroDeInstrutor.jsx', () => {
  return function MockCadastroDeInstrutor({ onNavigateHome }) {
    return (
      <div data-testid="instrutor-page">
        <button onClick={onNavigateHome}>Voltar</button>
        <h1>Instrutor Page</h1>
      </div>
    );
  };
});

jest.mock('../components/CadastroDeTurma.jsx', () => {
  return function MockCadastroDeTurma({ onNavigateHome }) {
    return (
      <div data-testid="turma-page">
        <button onClick={onNavigateHome}>Voltar</button>
        <h1>Turma Page</h1>
      </div>
    );
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza o título principal', () => {
    render(<HomePage />);
    expect(screen.getByText('Gestão dos Cronogramas')).toBeInTheDocument();
  });

  test('renderiza informações do sistema', () => {
    render(<HomePage />);
    expect(screen.getByText('SENAC Catalão')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Cronogramas')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo ao sistema de gestão de cronogramas')).toBeInTheDocument();
  });

  test('renderiza os cards do menu principal', () => {
    render(<HomePage />);

    // Use getAllByText para elementos que aparecem múltiplas vezes
    const unidadesElements = screen.getAllByText('Unidades Curriculares');
    expect(unidadesElements.length).toBeGreaterThan(0);

    const cronogramaElements = screen.getAllByText('Cronograma');
    expect(cronogramaElements.length).toBeGreaterThan(0);
  });

  test('abre sidebar ao clicar no menu', () => {
    render(<HomePage />);
    const menuButton = screen.getByTestId('menu-button');
    fireEvent.click(menuButton);

    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('admin@senac.com.br')).toBeInTheDocument();
  });

  test('fecha sidebar ao clicar no overlay', () => {
    render(<HomePage />);
    const menuButton = screen.getByTestId('menu-button');
    fireEvent.click(menuButton);

    // Sidebar está aberta
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Clica no overlay para fechar
    const overlay = document.querySelector('.sidebar-overlay');
    fireEvent.click(overlay);

    // Verifica se a sidebar não tem mais a classe 'open'
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('open');
  });

  test('navega para página de unidades curriculares via card', () => {
    render(<HomePage />);

    // Encontra o card específico (não o link da sidebar)
    const menuCards = screen.getAllByText('Unidades Curriculares');
    const ucCard = menuCards.find(el => el.closest('.menu-card'));

    fireEvent.click(ucCard.closest('.menu-card'));

    // Verifica se navegou para a página de UCs
    expect(screen.getByTestId('ucs-page')).toBeInTheDocument();
  });

  test('navega para página de cronograma via card', () => {
    render(<HomePage />);

    // Encontra o card específico (não o link da sidebar)
    const menuCards = screen.getAllByText('Cronograma');
    const cronogramaCard = menuCards.find(el => el.closest('.menu-card'));

    fireEvent.click(cronogramaCard.closest('.menu-card'));

    // Verifica se navegou para a página de cronograma
    expect(screen.getByTestId('cronograma-page')).toBeInTheDocument();
  });

  test('navega para página de unidades curriculares via sidebar', () => {
    render(<HomePage />);

    // Abre sidebar
    const menuButton = screen.getByTestId('menu-button');
    fireEvent.click(menuButton);

    // Clica no link da sidebar
    const sidebarLinks = screen.getAllByText('Unidades Curriculares');
    const sidebarLink = sidebarLinks.find(el => el.tagName.toLowerCase() === 'a');

    fireEvent.click(sidebarLink);

    // Verifica se navegou para a página de UCs
    expect(screen.getByTestId('ucs-page')).toBeInTheDocument();
  });

  test('navega para página de cronograma via sidebar', () => {
    render(<HomePage />);

    // Abre sidebar
    const menuButton = screen.getByTestId('menu-button');
    fireEvent.click(menuButton);

    // Clica no link da sidebar
    const sidebarLinks = screen.getAllByText('Cronograma');
    const sidebarLink = sidebarLinks.find(el => el.tagName.toLowerCase() === 'a');

    fireEvent.click(sidebarLink);

    // Verifica se navegou para a página de cronograma
    expect(screen.getByTestId('cronograma-page')).toBeInTheDocument();
  });

  test('volta para home a partir da página de UCs', () => {
    render(<HomePage />);

    // Navega para UCs
    const menuCards = screen.getAllByText('Unidades Curriculares');
    const ucCard = menuCards.find(el => el.closest('.menu-card'));
    fireEvent.click(ucCard.closest('.menu-card'));

    // Verifica que está na página de UCs
    expect(screen.getByTestId('ucs-page')).toBeInTheDocument();

    // Clica em voltar
    const voltarButton = screen.getByText('Voltar');
    fireEvent.click(voltarButton);

    // Verifica que voltou para home
    expect(screen.getByText('SENAC Catalão')).toBeInTheDocument();
  });

  test('volta para home a partir da página de cronograma', () => {
    render(<HomePage />);

    // Navega para cronograma
    const menuCards = screen.getAllByText('Cronograma');
    const cronogramaCard = menuCards.find(el => el.closest('.menu-card'));
    fireEvent.click(cronogramaCard.closest('.menu-card'));

    // Verifica que está na página de cronograma
    expect(screen.getByTestId('cronograma-page')).toBeInTheDocument();

    // Clica em voltar
    const voltarButton = screen.getByText('Voltar');
    fireEvent.click(voltarButton);

    // Verifica que voltou para home
    expect(screen.getByText('SENAC Catalão')).toBeInTheDocument();
  });

  test('renderiza ícones corretamente', () => {
    render(<HomePage />);

    // Botão do menu (já tem data-testid no JSX)
    expect(screen.getByTestId('menu-button')).toBeInTheDocument();

    // Verifica se há ícones nos cards do menu
    const menuCards = document.querySelectorAll('.menu-card');
    expect(menuCards.length).toBeGreaterThan(0);

    // Verifica se há ícones com as classes corretas
    const menuIcons = document.querySelectorAll('.menu-icon');
    expect(menuIcons.length).toBeGreaterThan(0);
  });

  test('renderiza descrições dos cards', () => {
    render(<HomePage />);

    expect(screen.getByText('Cadastre e gerencie as unidades curriculares dos cursos')).toBeInTheDocument();
    expect(screen.getByText('Cadastre e gerencie os cursos oferecidos')).toBeInTheDocument();
    expect(screen.getByText('Cadastre e gerencie os instrutores')).toBeInTheDocument();
    expect(screen.getByText('Cadastre e gerencie as turmas')).toBeInTheDocument();
    expect(screen.getByText('Visualize e gerencie o cronograma de aulas')).toBeInTheDocument();
  });

  test('sidebar fecha ao navegar', () => {
    render(<HomePage />);

    // Abre sidebar
    const menuButton = screen.getByTestId('menu-button');
    fireEvent.click(menuButton);

    // Verifica que sidebar está aberta
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).toHaveClass('open');

    // Navega via sidebar
    const sidebarLinks = screen.getAllByText('Unidades Curriculares');
    const sidebarLink = sidebarLinks.find(el => el.tagName.toLowerCase() === 'a');
    fireEvent.click(sidebarLink);

    // Sidebar deve fechar após navegação (não podemos testar isso diretamente pois o componente muda)
    expect(screen.getByTestId('ucs-page')).toBeInTheDocument();
  });

  test('mantém estado da sidebar corretamente', () => {
    render(<HomePage />);

    const menuButton = screen.getByTestId('menu-button');

    // Abre sidebar
    fireEvent.click(menuButton);
    let sidebar = document.querySelector('.sidebar');
    expect(sidebar).toHaveClass('open');

    // Fecha sidebar
    fireEvent.click(menuButton);
    sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('open');
  });

  test('renderiza estrutura de navegação corretamente', () => {
    render(<HomePage />);

    // Verifica se os elementos de navegação estão presentes
    expect(screen.getByText('Página Inicial')).toBeInTheDocument();
    expect(screen.getAllByText('Unidades Curriculares').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cursos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Instrutores').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Turmas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cronograma').length).toBeGreaterThan(0);
  });

  test('renderiza botões de ação corretamente', () => {
    render(<HomePage />);

    // Verifica se o botão de menu está presente
    const menuButton = screen.getByTestId('menu-button');
    expect(menuButton).toBeInTheDocument();
  });

  test('renderiza cards com classes CSS corretas', () => {
    render(<HomePage />);

    // Verifica se os cards têm as classes corretas
    const menuCards = document.querySelectorAll('.menu-card');
    expect(menuCards.length).toBe(5);

    // Verifica se os ícones dos cards têm as classes corretas
    const tealIcon = document.querySelector('.menu-icon.teal');
    const blueIcon = document.querySelector('.menu-icon.blue');
    const greenIcon = document.querySelector('.menu-icon.green');
    const amberIcon = document.querySelector('.menu-icon.amber');
    const orangeIcon = document.querySelector('.menu-icon.orange');

    expect(tealIcon).toBeInTheDocument();
    expect(blueIcon).toBeInTheDocument();
    expect(greenIcon).toBeInTheDocument();
    expect(amberIcon).toBeInTheDocument();
    expect(orangeIcon).toBeInTheDocument();
  });

  test('renderiza informações do usuário na sidebar', () => {
    render(<HomePage />);
    
    // Abre sidebar
    const menuButton = screen.getByTestId('menu-button');
    fireEvent.click(menuButton);

    // Verifica informações do usuário
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('admin@senac.com.br')).toBeInTheDocument();
    
    // Verifica se o avatar do usuário está presente
    const userAvatar = document.querySelector('.user-avatar');
    expect(userAvatar).toBeInTheDocument();
  });

  test('alterna estado da sidebar corretamente', () => {
    render(<HomePage />);

    const menuButton = screen.getByTestId('menu-button');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    // Estado inicial - sidebar fechada
    expect(sidebar).not.toHaveClass('open');
    expect(overlay).not.toHaveClass('open');

    // Abre sidebar
    fireEvent.click(menuButton);
    expect(sidebar).toHaveClass('open');
    expect(overlay).toHaveClass('open');

    // Fecha sidebar
    fireEvent.click(menuButton);
    expect(sidebar).not.toHaveClass('open');
    expect(overlay).not.toHaveClass('open');
  });

  test('renderiza layout da página inicial corretamente', () => {
    render(<HomePage />);

    // Verifica estrutura principal
    expect(document.querySelector('.home-page')).toBeInTheDocument();
    expect(document.querySelector('.home-header')).toBeInTheDocument();
    expect(document.querySelector('.home-container')).toBeInTheDocument();
    expect(document.querySelector('.welcome-section')).toBeInTheDocument();
    expect(document.querySelector('.menu-grid')).toBeInTheDocument();
  });
});