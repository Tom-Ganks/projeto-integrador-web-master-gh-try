import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import UcsRegistrationForm from '../../components/UcsRegistrationForm.jsx';
import { supabaseClient } from '../../services/supabase.js';
import '../../styles/forms.css';

const UCSRegistrationPage = ({ onNavigateHome }) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [cursos, setCursos] = useState([]);
  const [ucs, setUcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState('');
  const [editingUc, setEditingUc] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ucToDelete, setUcToDelete] = useState(null);

  useEffect(() => {
    loadCursos();
    loadUcs();
  }, []);

  const loadCursos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('cursos')
        .select('idcurso, nomecurso')
        .order('nomecurso');

      if (error) throw error;
      setCursos(data || []);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  const loadUcs = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('unidades_curriculares')
        .select('iduc, nomeuc, cargahoraria, idcurso, cursos(nomecurso)')
        .order('iduc', { ascending: false });
        
      if (error) throw error;
      setUcs(data || []);
    } catch (error) {
      console.error('Erro ao carregar UCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUCSSubmit = async (ucsData) => {
    try {
      const { error } = await supabaseClient
        .from('unidades_curriculares')
        .insert([{
          nomeuc: ucsData.nomeuc,
          cargahoraria: parseInt(ucsData.cargahoraria),
          idcurso: parseInt(ucsData.idcurso)
        }]);

      if (error) throw error;
      await loadUcs();
    } catch (error) {
      console.error('Erro ao registrar UCS:', error);
      throw error;
    }
  };

  const handleEdit = (uc) => {
    setEditingUc(uc);
    // Scroll to top smoothly when editing
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDelete = (uc) => {
    setUcToDelete(uc);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!ucToDelete) return;

    try {
      const { error } = await supabaseClient
        .from('unidades_curriculares')
        .delete()
        .eq('iduc', ucToDelete.iduc);

      if (error) throw error;

      await loadUcs();
      setShowDeleteDialog(false);
      setUcToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar UC:', error);
      alert('Erro ao deletar UC: ' + error.message);
    }
  };

  const handleEditSubmit = async (ucsData) => {
    try {
      const { error } = await supabaseClient
        .from('unidades_curriculares')
        .update({
          nomeuc: ucsData.nomeuc,
          cargahoraria: parseInt(ucsData.cargahoraria),
          idcurso: parseInt(ucsData.idcurso)
        })
        .eq('iduc', editingUc.iduc);

      if (error) throw error;

      await loadUcs();
      setEditingUc(null);
      setErrorMessage('');
    } catch (error) {
      // Always log an Error object
      const errObj = error instanceof Error ? error : new Error(error?.message || String(error));
      console.error('Erro ao editar UC:', errObj);
      setErrorMessage(`Erro ao editar UC: ${errObj.message}`);
    }
  };

  const filteredUcs = selectedCurso
    ? ucs.filter(uc => uc.cursos?.nomecurso === selectedCurso)
    : ucs;

  if (loading) {
    return (
      <div className="ucs-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ucs-page">
      {/* Header */}
      <div className="ucs-header">
        <button
          className="back-button"
          onClick={onNavigateHome}
          data-testid="arrow-left-icon"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="ucs-title">Unidades Curriculares</h1>
      </div>

      <div className="ucs-content">
        {/* Registration Form */}
        <div className="registration-card">
          <h2 className="form-title">
            {editingUc ? 'Editar Unidade Curricular' : 'Cadastrar Nova Unidade Curricular'}
          </h2>
          {errorMessage && (
            <div className="error-banner">
              {errorMessage}
            </div>
          )}
          <UcsRegistrationForm
            cursos={cursos}
            onSubmit={editingUc ? handleEditSubmit : handleUCSSubmit}
            initialData={editingUc}
            onCancel={editingUc ? () => setEditingUc(null) : null}
          />
        </div>

        {/* List Section */}
        <div className="list-section">
          <h3 className="list-title">Unidades Curriculares Cadastradas</h3>

          <div className="filter-container">
            <select
              className="filter-select"
              value={selectedCurso}
              onChange={(e) => setSelectedCurso(e.target.value)}
            >
              <option value="">Filtrar por curso: Todos os cursos</option>
              {cursos.map(curso => (
                <option key={curso.idcurso} value={curso.nomecurso}>
                  Filtrar por curso: {curso.nomecurso}
                </option>
              ))}
            </select>
          </div>

          <ul className="ucs-list">
            {filteredUcs.map((uc) => (
              <li key={uc.iduc} className="ucs-item">
                <div className="ucs-info">
                  <div className="ucs-name">{uc.nomeuc}</div>
                  <div className="ucs-details">
                    Carga horária: {uc.cargahoraria} horas<br />
                    Curso: {uc.cursos?.nomecurso || 'Sem curso'}
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-edit"
                    title="Editar"
                    onClick={() => handleEdit(uc)}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete"
                    title="Excluir"
                    onClick={() => handleDelete(uc)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Confirmar Exclusão</h2>
            </div>
            <div className="dialog-body">
              <p>Tem certeza que deseja apagar essa UC (Unidade Curricular)?</p>
              <p><strong>{ucToDelete?.nomeuc}</strong></p>
            </div>
            <div className="dialog-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={confirmDelete}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UCSRegistrationPage;