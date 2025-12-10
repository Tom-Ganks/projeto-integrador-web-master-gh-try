import { useState } from 'react';
import { Calendar, MapPin, X, Plus, Trash2 } from 'lucide-react';
import { supabaseClient } from '../services/supabase.js';


const FeriadosDialog = ({ feriadosNacionais, feriadosMunicipais, onClose, onFeriadoAdded }) => {
  const [feriadosMunicipaisLocal, setFeriadosMunicipaisLocal] = useState(feriadosMunicipais);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeriado, setNewFeriado] = useState({ nome: '', data: '' });
  const [loading, setLoading] = useState(false);

  const handleAddFeriado = async (e) => {
    e.preventDefault();
    if (!newFeriado.nome.trim() || !newFeriado.data) return;

    setLoading(true);
    try {
      const { error } = await supabaseClient
        .from('feriadosmunicipais')
        .insert([{
          nome: newFeriado.nome.trim(),
          data: newFeriado.data
        }]);

      if (error) throw error;

      const date = new Date(newFeriado.data);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      setFeriadosMunicipaisLocal(prev => ({
        ...prev,
        [dateKey]: newFeriado.nome.trim()
      }));

      setNewFeriado({ nome: '', data: '' });
      setShowAddForm(false);
      onFeriadoAdded();
    } catch (error) {
      console.error('Erro ao adicionar feriado:', error);
      alert('Erro ao adicionar feriado: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeriado = async (dateKey, nome) => {
    const date = new Date(parseInt(dateKey.split('-')[0]), parseInt(dateKey.split('-')[1]), parseInt(dateKey.split('-')[2]));
    const formattedDate = date.toISOString().split('T')[0];

    try {
      const { error } = await supabaseClient
        .from('feriadosmunicipais')
        .delete()
        .eq('data', formattedDate)
        .eq('nome', nome);

      if (error) throw error;

      setFeriadosMunicipaisLocal(prev => {
        const updated = { ...prev };
        delete updated[dateKey];
        return updated;
      });

      onFeriadoAdded();
    } catch (error) {
      console.error('Erro ao remover feriado:', error);
      alert('Erro ao remover feriado: ' + error.message);
    }
  };

  const formatDate = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month, day);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content feriados-dialog" role="dialog" aria-labelledby="dialog-title" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 id="dialog-title">Gerenciar Feriados</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="feriados-content">
          <div className="feriados-section">
            <div className="section-header">
              <Calendar size={20} />
              <h3>Feriados Nacionais</h3>
            </div>
            <div className="feriados-list">
              {Object.entries(feriadosNacionais).map(([dateKey, nome]) => (
                <div key={dateKey} className="feriado-item nacional">
                  <div className="feriado-info">
                    <strong>{nome}</strong>
                    <span>{formatDate(dateKey)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="feriados-section">
            <div className="section-header">
              <MapPin size={20} />
              <h3>Feriados Municipais</h3>
              <button
                className="btn-add"
                role="button"
                aria-label="Adicionar feriado municipal"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus size={16} />
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddFeriado} className="add-feriado-form" role="form">
                <input
                  type="text"
                  placeholder="Nome do feriado"
                  value={newFeriado.nome}
                  onChange={(e) => setNewFeriado(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
                <input
                  type="date"
                  value={newFeriado.data}
                  onChange={(e) => setNewFeriado(prev => ({ ...prev, data: e.target.value }))}
                  required
                  data-testid="data-input"
                />
                <div className="form-actions">
                  <button type="button" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}

            <div className="feriados-list">
              {Object.keys(feriadosMunicipaisLocal).length === 0 ? (
                <p className="no-feriados">Nenhum feriado municipal cadastrado</p>
              ) : (
                Object.entries(feriadosMunicipaisLocal).map(([dateKey, nome]) => (
                  <div key={dateKey} className="feriado-item municipal">
                    <div className="feriado-info">
                      <strong>{nome}</strong>
                      <span>{formatDate(dateKey)}</span>
                    </div>
                    <button
                      className="btn-remove"
                      role="button"
                      aria-label={`Remover feriado ${nome}`}
                      onClick={() => handleRemoveFeriado(dateKey, nome)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeriadosDialog;