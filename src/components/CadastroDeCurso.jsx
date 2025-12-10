import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { supabaseClient } from '../services/supabase.js';

const CadastroDeCurso = ({ onNavigateHome }) => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCurso, setEditingCurso] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cursoToDelete, setCursoToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [filtro, setFiltro] = useState('');


  useEffect(() => {
    loadCursos();
  }, []);

  const loadCursos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('cursos')
        .select('idcurso, nomecurso, cargahoraria')
        .order('nomecurso');

      if (error) throw error;
      setCursos(data || []);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCursoSubmit = async (cursoData) => {
    try {
      const { error } = await supabaseClient
        .from('cursos')
        .insert([{
          nomecurso: cursoData.nomecurso,
          cargahoraria: parseInt(cursoData.cargahoraria)
        }]);

      if (error) throw error;
      await loadCursos();
    } catch (error) {
      console.error('Erro ao registrar curso:', error);
      throw error;
    }
  };

  const handleEdit = (curso) => {
    setEditingCurso(curso);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (curso) => {
    setCursoToDelete(curso);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!cursoToDelete) return;

    try {
      const { error } = await supabaseClient
        .from('cursos')
        .delete()
        .eq('idcurso', cursoToDelete.idcurso);

      if (error) throw error;

      await loadCursos();
      setShowDeleteDialog(false);
      setCursoToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      alert('Erro ao deletar curso: ' + error.message);
    }
  };

  const handleEditSubmit = async (cursoData) => {
    try {
      const { error } = await supabaseClient
        .from('cursos')
        .update({
          nomecurso: cursoData.nomecurso,
          cargahoraria: parseInt(cursoData.cargahoraria)
        })
        .eq('idcurso', editingCurso.idcurso);

      if (error) throw error;

      await loadCursos();
      setEditingCurso(null);
      setErrorMessage('');
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      setErrorMessage(`Erro ao atualizar curso: ${error.message}`);
    }
  };

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
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="ucs-title">Cadastro de Cursos</h1>
      </div>

      <div className="ucs-content">
        {/* Registration Form */}
        <div className="registration-card">
          <h2 className="form-title">
            {editingCurso ? 'Editar Curso' : 'Cadastrar Novo Curso'}
          </h2>
          <CursoRegistrationForm
            onSubmit={editingCurso ? handleEditSubmit : handleCursoSubmit}
            initialData={editingCurso}
            onCancel={editingCurso ? () => setEditingCurso(null) : null}
          />
        </div>

        {/* List Section */}
<div className="list-section">
  <h3 className="list-title">Cursos Cadastrados</h3>

  {/* Campo de filtro */}
  <div className="filter-section">
    <input
      type="text"
      placeholder="Filtrar por nome do curso..."
      className="form-input"
      data-testid="cadastro-de-curso"
      value={filtro}
      onChange={(e) => setFiltro(e.target.value)}
    />
  </div>

  <ul className="ucs-list">
    {cursos
      .filter((curso) =>
        curso.nomecurso.toLowerCase().includes(filtro.toLowerCase())
      )
      .map((curso) => (
        <li key={curso.idcurso} className="ucs-item">
          <div className="ucs-info">
            <div className="ucs-name">{curso.nomecurso}</div>
            <div className="ucs-details">
              {curso.cargahoraria ? (
                <>Carga horária: {curso.cargahoraria} horas</>
              ) : (
                <>Sem carga horária definida</>
              )}
            </div>
          </div>
          <div className="action-buttons">
            <button
              className="btn-edit"
              title="Editar"
              onClick={() => handleEdit(curso)}
            >
              ✏️
            </button>
            <button
              className="btn-delete"
              title="Excluir"
              onClick={() => handleDelete(curso)}
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
              <p>Tem certeza que deseja apagar esse curso?</p>
              <p><strong>{cursoToDelete?.nomecurso}</strong></p>
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

/* Formulário de Cursos */
const CursoRegistrationForm = ({ onSubmit, initialData = null, onCancel = null }) => {
  const [formData, setFormData] = useState({
    nomecurso: initialData?.nomecurso || '',
    cargahoraria: initialData?.cargahoraria?.toString() || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomecurso: initialData.nomecurso || '',
        cargahoraria: initialData.cargahoraria?.toString() || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nomecurso.trim()) {
      newErrors.nomecurso = 'Nome do curso é obrigatório';
    } else if (formData.nomecurso.length < 3) {
      newErrors.nomecurso = 'O nome do curso deve ter pelo menos 3 caracteres';
    }
    if (!formData.cargahoraria) {
      newErrors.cargahoraria = 'Carga horária é obrigatória';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        nomecurso: formData.nomecurso,
        cargahoraria: parseInt(formData.cargahoraria)
      });
      if (!initialData) {
        setFormData({ nomecurso: '', cargahoraria: '' });
      }
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="nomecurso" className="form-label">
          <BookOpen size={16} /> Nome do Curso
        </label>
        <input
          type="text"
          id="nomecurso"
          name="nomecurso"
          data-testid="input-nomecurso"
          className={`form-input ${errors.nomecurso ? 'error' : ''}`}
          value={formData.nomecurso}
          onChange={handleChange}
          placeholder="Digite o nome do curso"
        />
        {errors.nomecurso && <div className="error-message">{errors.nomecurso}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="cargahoraria" className="form-label">
          <Clock size={16} /> Carga Horária
        </label>
        <input
          type="number"
          id="cargahoraria"
          name="cargahoraria"
          data-testid="input-cargahoraria"
          className={`form-input ${errors.cargahoraria ? 'error' : ''}`}
          value={formData.cargahoraria}
          onChange={handleChange}
          placeholder="Digite a carga horária total"
        />
        {errors.cargahoraria && <div className="error-message">{errors.cargahoraria}</div>}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-save" data-testid="btn-save" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Curso' : 'Salvar Curso')}
        </button>
      </div>
    </form>
  );
};

export default CadastroDeCurso;
export { CursoRegistrationForm };