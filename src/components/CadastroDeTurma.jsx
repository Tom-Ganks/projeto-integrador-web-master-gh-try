import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, BookOpen, Clock, Trash2 } from 'lucide-react';
import { supabaseClient } from '../services/supabase.js';

const CadastroDeTurma = ({ onNavigateHome }) => {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTurma, setEditingTurma] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [filtro, setFiltro] = useState('');

  // listas para selects
  const [instrutores, setInstrutores] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [turnos, setTurnos] = useState([]);

  useEffect(() => {
    loadTurmas();
    loadSelects();
  }, []);

  const loadTurmas = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('turma')
        .select(`
          idturma,
          turmanome,
          instrutores(idinstrutor, nomeinstrutor),
          cursos(idcurso, nomecurso),
          turnos:idturno(idturno, turno)
        `)
        .order('turmanome');

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelects = async () => {
    try {
      const [{ data: instr }, { data: cursosData }, { data: turnosData }] = await Promise.all([
        supabaseClient.from('instrutores').select('idinstrutor, nomeinstrutor').order('nomeinstrutor'),
        supabaseClient.from('cursos').select('idcurso, nomecurso').order('nomecurso'),
        supabaseClient.from('turno').select('idturno, turno').order('turno'),
      ]);

      setInstrutores(instr || []);
      setCursos(cursosData || []);
      setTurnos(turnosData || []);
    } catch (error) {
      console.error('Erro ao carregar selects:', error);
    }
  };

  const handleTurmaSubmit = async (turmaData) => {
    try {
      const { error } = await supabaseClient
        .from('turma')
        .insert([turmaData]);

      if (error) throw error;
      await loadTurmas();
    } catch (error) {
      console.error('Erro ao registrar turma:', error);
      throw error;
    }
  };

  const handleEditSubmit = async (turmaData) => {
    try {
      const { error } = await supabaseClient
        .from('turma')
        .update(turmaData)
        .eq('idturma', editingTurma.idturma);

      if (error) throw error;

      await loadTurmas();
      setEditingTurma(null);
      setErrorMessage('');
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
      setErrorMessage(`Erro ao atualizar turma: ${error.message}`);
    }
  };

  const handleEdit = (turma) => {
    setEditingTurma(turma);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (turma) => {
    if (!window.confirm(`Tem certeza que deseja excluir a turma "${turma.turmanome}"?`)) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('turma')
        .delete()
        .eq('idturma', turma.idturma);

      if (error) throw error;

      await loadTurmas();
      setErrorMessage('');
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
      setErrorMessage(`Erro ao excluir turma: ${error.message}`);
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
      <button className="back-button" onClick={onNavigateHome}>
        <ArrowLeft size={20} />
      </button>
      <h1 className="ucs-title">Cadastro de Turmas</h1>
    </div>

    <div className="ucs-content">
      {/* Show error message if exists */}
      {errorMessage && (
        <div className="error-banner" style={{ color: 'red', marginBottom: '1rem' }}>
          {errorMessage}
        </div>
      )}
      {/* Form */}
      <div className="registration-card">
          <h2 className="form-title">
            {editingTurma ? 'Editar Turma' : 'Cadastrar Nova Turma'}
          </h2>
          <TurmaRegistrationForm
            onSubmit={editingTurma ? handleEditSubmit : handleTurmaSubmit}
            initialData={editingTurma}
            onCancel={editingTurma ? () => setEditingTurma(null) : null}
            instrutores={instrutores}
            cursos={cursos}
            turnos={turnos}
          />
        </div>

        {/* Lista */}
        <div className="list-section">
          <h3 className="list-title">Turmas Cadastradas</h3>

          <div className="filter-section">
            <input
              type="text"
              placeholder="Filtrar por nome da turma..."
              className="form-input"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <ul className="ucs-list">
            {turmas
              .filter((t) => {
                const f = (filtro || '').toLowerCase().trim();
                if (!f) return true;
                return (t.turmanome || '').toLowerCase().includes(f);
              })
              .map((t) => (
                <li key={t.idturma} className="ucs-item">
                  <div className="ucs-info">
                    <div className="ucs-name">{t.turmanome || '—'}</div>
                    <div className="ucs-details">
                      <p><strong>Instrutor:</strong> {t.instrutores?.nomeinstrutor || 'Não informado'}</p>
                      <p><strong>Curso:</strong> {t.cursos?.nomecurso || 'Não informado'}</p>
                      <p><strong>Turno:</strong> {t.turnos?.turno || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button className="btn-edit" title="Editar" onClick={() => handleEdit(t)}>✏️</button>
                    <button className="btn-delete" title="Excluir" onClick={() => handleDelete(t)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* Formulário de Turmas */
const TurmaRegistrationForm = ({ onSubmit, initialData = null, onCancel = null, instrutores, cursos, turnos }) => {
  const [formData, setFormData] = useState({
    turmanome: initialData?.turmanome || '',
    idinstrutor: initialData?.idinstrutor || '',
    idcurso: initialData?.idcurso || '',
    idturno: initialData?.idturno || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        turmanome: initialData.turmanome || '',
        idinstrutor: initialData.instrutores?.idinstrutor || '',
        idcurso: initialData.cursos?.idcurso || '',
        idturno: initialData.turnos?.idturno || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!(formData.turmanome || '').trim()) newErrors.turmanome = 'Nome da turma é obrigatório';
    if (!formData.idinstrutor) newErrors.idinstrutor = 'Selecione um instrutor';
    if (!formData.idcurso) newErrors.idcurso = 'Selecione um curso';
    if (!formData.idturno) newErrors.idturno = 'Selecione um turno';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ turmanome: '', idinstrutor: '', idcurso: '', idturno: '' });
      if (initialData && onCancel) onCancel();
    } catch (error) {
      console.error('Erro ao salvar turma:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="turmanome" className="form-label">
          <Users size={16} /> Nome da Turma
        </label>
        <input
          type="text"
          id="turmanome"
          name="turmanome"
          className={`form-input ${errors.turmanome ? 'error' : ''}`}
          value={formData.turmanome}
          onChange={handleChange}
          placeholder="Digite o nome da turma"
        />
        {errors.turmanome && <div className="error-message">{errors.turmanome}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="idinstrutor" className="form-label">Instrutor</label>
        <select
          id="idinstrutor"
          name="idinstrutor"
          className={`form-input ${errors.idinstrutor ? 'error' : ''}`}
          value={formData.idinstrutor}
          onChange={handleChange}
        >
          <option value="">Selecione...</option>
          {instrutores.map((i) => (
            <option key={i.idinstrutor} value={i.idinstrutor}>
              {i.nomeinstrutor}
            </option>
          ))}
        </select>
        {errors.idinstrutor && <div className="error-message">{errors.idinstrutor}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="idcurso" className="form-label"><BookOpen size={16} /> Curso</label>
        <select
          id="idcurso"
          name="idcurso"
          className={`form-input ${errors.idcurso ? 'error' : ''}`}
          value={formData.idcurso}
          onChange={handleChange}
        >
          <option value="">Selecione...</option>
          {cursos.map((c) => (
            <option key={c.idcurso} value={c.idcurso}>
              {c.nomecurso}
            </option>
          ))}
        </select>
        {errors.idcurso && <div className="error-message">{errors.idcurso}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="idturno" className="form-label"><Clock size={16} /> Turno</label>
        <select
          id="idturno"
          name="idturno"
          className={`form-input ${errors.idturno ? 'error' : ''}`}
          value={formData.idturno}
          onChange={handleChange}
        >
          <option value="">Selecione...</option>
          {turnos.map((t) => (
            <option key={t.idturno} value={t.idturno}>
              {t.turno}
            </option>
          ))}
        </select>
        {errors.idturno && <div className="error-message">{errors.idturno}</div>}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-save" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Turma' : 'Salvar Turma')}
        </button>
      </div>
    </form>
  );
};

export default CadastroDeTurma;
export { TurmaRegistrationForm };