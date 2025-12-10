import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Book } from 'lucide-react';
import { supabaseClient } from '../services/supabase.js';
import formatphone from '../utils/formatphone.js';

const CadastroDeInstrutor = ({ onNavigateHome }) => {
  const [instrutores, setInstrutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInstrutor, setEditingInstrutor] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [instrutorToDelete, setInstrutorToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    loadInstrutores();
  }, []);

  const loadInstrutores = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('instrutores')
        .select('idinstrutor, nomeinstrutor, especializacao, email, telefone')
        .order('nomeinstrutor');

      if (error) throw error;
      setInstrutores(data || []);
    } catch (error) {
      console.error('Erro ao carregar instrutores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstrutorSubmit = async (instrutorData) => {
    try {
      const { error } = await supabaseClient
        .from('instrutores')
        .insert([instrutorData]);
      if (error) throw error;
      await loadInstrutores();
    } catch (error) {
      console.error('Erro ao registrar instrutor:', error);
      throw error;
    }
  };

  const handleEdit = (instrutor) => {
    setEditingInstrutor(instrutor);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (instrutor) => {
    setInstrutorToDelete(instrutor);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!instrutorToDelete) return;
    try {
      const { error } = await supabaseClient
        .from('instrutores')
        .delete()
        .eq('idinstrutor', instrutorToDelete.idinstrutor);
      if (error) throw error;

      await loadInstrutores();
      setShowDeleteDialog(false);
      setInstrutorToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar instrutor:', error);
      alert('Erro ao deletar instrutor: ' + error.message);
    }
  };

  const handleEditSubmit = async (instrutorData) => {
    try {
      const { error } = await supabaseClient
        .from('instrutores')
        .update(instrutorData)
        .eq('idinstrutor', editingInstrutor.idinstrutor);
      if (error) throw error;

      await loadInstrutores();
      setEditingInstrutor(null);
      setErrorMessage('');
    } catch (error) {
      console.error('Erro ao atualizar instrutor:', error);
      setErrorMessage(`Erro ao atualizar instrutor: ${error.message}`);
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
        <h1 className="ucs-title">Cadastro de Instrutores</h1>
      </div>

      <div className="ucs-content">
        {/* Registration Form */}
        <div className="registration-card">
          <h2 className="form-title">
            {editingInstrutor ? 'Editar Instrutor' : 'Cadastrar Novo Instrutor'}
          </h2>
          <InstrutorRegistrationForm
            onSubmit={editingInstrutor ? handleEditSubmit : handleInstrutorSubmit}
            initialData={editingInstrutor}
            onCancel={editingInstrutor ? () => setEditingInstrutor(null) : null}
          />
        </div>

        {/* List Section */}
        <div className="list-section">
          <h3 className="list-title">Instrutores Cadastrados</h3>

          {/* Campo de filtro */}
          <div className="filter-section">
            <input
              type="text"
              placeholder="Filtrar por nome do instrutor..."
              className="form-input"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <ul className="ucs-list">
            {instrutores
              .filter((i) => (filtro ? (i.nomeinstrutor || '').toLowerCase().includes(filtro.toLowerCase()) : true))
              .map((i) => (
                <li key={i.idinstrutor} className="ucs-item">
                  <div className="ucs-info">
                    <div className="ucs-name">{i.nomeinstrutor || '—'}</div>
                    <div className="ucs-details">
                      <p><strong>Especialização:</strong> {i.especializacao || 'Não informada'}</p>
                      <p><strong>Email:</strong> {i.email || 'Não informado'}</p>
                      <p>
                        <strong>Telefone:</strong> {i.telefone ? formatphone(String(i.telefone)) : 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button className="btn-edit" title="Editar" onClick={() => handleEdit(i)}>✏️</button>
                    <button className="btn-delete" title="Excluir" onClick={() => handleDelete(i)}>🗑️</button>
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
              <p>Tem certeza que deseja apagar esse instrutor?</p>
              <p><strong>{instrutorToDelete?.nomeinstrutor}</strong></p>
            </div>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteDialog(false)}>Cancelar</button>
              <button className="btn-danger" onClick={confirmDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Formulário de Instrutores */
const InstrutorRegistrationForm = ({ onSubmit, initialData = null, onCancel = null }) => {
  const [formData, setFormData] = useState({
    nomeinstrutor: initialData?.nomeinstrutor || '',
    especializacao: initialData?.especializacao || '',
    email: initialData?.email || '',
    telefone: initialData?.telefone || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomeinstrutor: initialData.nomeinstrutor || '',
        especializacao: initialData.especializacao || '',
        email: initialData.email || '',
        telefone: initialData.telefone || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nomeinstrutor.trim()) newErrors.nomeinstrutor = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ nomeinstrutor: '', especializacao: '', email: '', telefone: '' });
      if (initialData && onCancel) onCancel();
    } catch (error) {
      console.error('Erro ao salvar instrutor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="nomeinstrutor" className="form-label"><User size={16} /> Nome</label>
        <input
          type="text"
          id="nomeinstrutor"
          name="nomeinstrutor"
          className={`form-input ${errors.nomeinstrutor ? 'error' : ''}`}
          value={formData.nomeinstrutor}
          onChange={handleChange}
          placeholder="Digite o nome do instrutor"
        />
        {errors.nomeinstrutor && <div className="error-message">{errors.nomeinstrutor}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="especializacao" className="form-label"><Book size={16} /> Especialização</label>
        <input
          type="text"
          id="especializacao"
          name="especializacao"
          className="form-input"
          value={formData.especializacao}
          onChange={handleChange}
          placeholder="Digite a especialização"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label"><Mail size={16} /> Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-input ${errors.email ? 'error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          placeholder="Digite o email"
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="telefone" className="form-label"><Phone size={16} /> Telefone</label>
        <input
          type="tel"
          id="telefone"
          name="telefone"
          className={`form-input ${errors.telefone ? 'error' : ''}`}
          value={formatphone(formData.telefone)}
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/\D/g, '');
            if (onlyNums.length <= 11) handleChange({ target: { name: 'telefone', value: onlyNums } });
          }}
          placeholder="Digite o telefone"
          maxLength={15}
        />
        {errors.telefone && <div className="error-message">{errors.telefone}</div>}
      </div>

      <div className="form-actions">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="btn-save" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Instrutor' : 'Salvar Instrutor')}
        </button>
      </div>
    </form>
  );
};

export default CadastroDeInstrutor;
export { InstrutorRegistrationForm };