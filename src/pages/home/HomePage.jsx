import React, { useState } from 'react';
import CronogramaPage from '../cronograma/CronogramaPage.jsx';
import UCSRegistrationPage from '../ucsregisterpage/UcsRegistrationPage.jsx';
import CadastroDeCurso from '../../components/CadastroDeCurso.jsx';
import CadastroDeInstrutor from '../../components/CadastroDeInstrutor.jsx';
import CadastroDeTurma from '../../components/CadastroDeTurma.jsx';
import { Menu, GraduationCap, User, BookOpen, UserCheck, Users, Calendar } from 'lucide-react';
import '../../styles/home.css';


const HomePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const navigateHome = () => {
    setCurrentPage('home');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'cronograma':
        return <CronogramaPage onNavigateHome={navigateHome} />;
      case 'unidades-curriculares':
        return <UCSRegistrationPage onNavigateHome={navigateHome} />;
      case 'cursos':
        return <CadastroDeCurso onNavigateHome={navigateHome} />;
      case 'instrutores':
        return <CadastroDeInstrutor onNavigateHome={navigateHome} />;
      case 'turmas':
        return <CadastroDeTurma onNavigateHome={navigateHome} />;
      default:
        return <MainHomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="home-page">
      {currentPage === 'home' && (
        <>
          {/* Header */}
          <div className="home-header">
            <div className="header-content">
              <div className="header-title">
                <button className="menu-btn" onClick={toggleSidebar}>
                  <Menu size={24} />
                </button>
                <GraduationCap size={28} />
                <h1>Gestão dos Cronogramas</h1>
              </div>
              <div className="header-actions">
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
          <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <User size={24} />
              <h2>Menu</h2>
            </div>
            <div className="sidebar-content">
              <div className="user-info">
                <div className="user-avatar">
                  <User size={24} />
                </div>
                <div className="user-name">Administrador</div>
                <div className="user-email">admin@senac.com.br</div>
              </div>
              <nav>
                <ul className="nav-menu">
                  <li className="nav-item">
                    <a
                      href="#"
                      className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); navigateTo('home'); }}
                    >
                      <GraduationCap size={20} />
                      Página Inicial
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      href="#"
                      className={`nav-link ${currentPage === 'unidades-curriculares' ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); navigateTo('unidades-curriculares'); }}
                    >
                      <BookOpen size={20} />
                      Unidades Curriculares
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      href="#"
                      className={`nav-link ${currentPage === 'cursos' ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); navigateTo('cursos'); }}
                    >
                      <GraduationCap size={20} />
                      Cursos
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      href="#"
                      className={`nav-link ${currentPage === 'instrutores' ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); navigateTo('instrutores'); }}
                    >
                      <UserCheck size={20} />
                      Instrutores
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      href="#"
                      className={`nav-link ${currentPage === 'turmas' ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); navigateTo('turmas'); }}
                    >
                      <Users size={20} />
                      Turmas
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      href="#"
                      className={`nav-link ${currentPage === 'cronograma' ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); navigateTo('cronograma'); }}
                    >
                      <Calendar size={20} />
                      Cronograma
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      {renderCurrentPage()}
    </div>
  );
};

const MainHomePage = ({ onNavigate }) => {
  return (
    <div className="home-container">
      <div className="welcome-section">
        <div className="logo-container">
          <div className="logo-icon">
            <GraduationCap size={40} />
          </div>
        </div>
        <h1 className="welcome-title">SENAC Catalão</h1>
        <p className="welcome-subtitle">Gestão de Cronogramas</p>
        <div className="welcome-message">
          Bem-vindo ao sistema de gestão de cronogramas
        </div>
      </div>

      <div className="menu-grid">
        <div className="menu-card" onClick={() => onNavigate('unidades-curriculares')}>
          <div className="menu-icon teal">
            <BookOpen size={28} />
          </div>
          <h3 className="menu-title">Unidades Curriculares</h3>
          <p className="menu-description">
            Cadastre e gerencie as unidades curriculares dos cursos
          </p>
        </div>

        <div className="menu-card" onClick={() => onNavigate('cursos')}>
          <div className="menu-icon purple">
            <GraduationCap size={28} />
          </div>
          <h3 className="menu-title">Cursos</h3>
          <p className="menu-description">
            Cadastre e gerencie os cursos oferecidos
          </p>
        </div>

        <div className="menu-card" onClick={() => onNavigate('instrutores')}>
          <div className="menu-icon teal">
            <UserCheck size={28} />
          </div>
          <h3 className="menu-title">Instrutores</h3>
          <p className="menu-description">
            Cadastre e gerencie os instrutores
          </p>
        </div>

        <div className="menu-card" onClick={() => onNavigate('turmas')}>
          <div className="menu-icon purple">
            <Users size={28} />
          </div>
          <h3 className="menu-title">Turmas</h3>
          <p className="menu-description">
            Cadastre e gerencie as turmas
          </p>
        </div>

        <div className="menu-card" onClick={() => onNavigate('cronograma')}>
          <div className="menu-icon orange">
            <Calendar size={28} />
          </div>
          <h3 className="menu-title">Cronograma</h3>
          <p className="menu-description">
            Visualize e gerencie o cronograma de aulas
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;