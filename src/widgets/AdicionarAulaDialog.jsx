import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, X } from 'lucide-react';
import { supabaseClient } from '../services/supabase.js';
import '../styles/dialogs.css';

const AdicionarAulaDialog = ({ selectedDays, onClose, onAulaAdded }) => {
  const [selectedTurmaId, setSelectedTurmaId] = useState(null);
  const [selectedUcId, setSelectedUcId] = useState(null);
  const [periodo, setPeriodo] = useState('Matutino');
  const [horasAula, setHorasAula] = useState(1);
  const [turmas, setTurmas] = useState([]);
  const [ucs, setUcs] = useState([]);
  const [ucsFiltradas, setUcsFiltradas] = useState([]);
  const [cargaHorariaUc, setCargaHorariaUc] = useState({});
  const [loading, setLoading] = useState(true);

  const periodoConfig = {
    'Matutino': { maxHoras: 4, horario: '08:00-12:00' },
    'Vespertino': { maxHoras: 4, horario: '14:00-18:00' },
    'Noturno': { maxHoras: 3, horario: '19:00-22:00' }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTurmaId) {
      filterUcsByTurma();
    }
  }, [selectedTurmaId, ucs]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadTurmas(),
        loadUcs(),
        loadCargaHoraria()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTurmas = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('turma')
        .select('idturma, turmanome, idcurso')
        .order('turmanome');

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const loadUcs = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('unidades_curriculares')
        .select('iduc, nomeuc, cargahoraria, idcurso')
        .order('nomeuc');

      if (error) throw error;
      setUcs(data || []);
    } catch (error) {
      console.error('Erro ao carregar UCs:', error);
    }
  };

  const loadCargaHoraria = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('unidades_curriculares')
        .select('iduc, cargahoraria');

      if (error) throw error;

      const cargaMap = {};
      data?.forEach(uc => {
        cargaMap[uc.iduc] = uc.cargahoraria || 0;
      });

      setCargaHorariaUc(cargaMap);
    } catch (error) {
      console.error('Erro ao carregar carga horária:', error);
    }
  };

  const filterUcsByTurma = async () => {
    if (!selectedTurmaId) {
      setUcsFiltradas([]);
      return;
    }

    try {
      const turma = turmas.find(t => t.idturma === selectedTurmaId);
      if (!turma) return;

      const filtered = ucs.filter(uc => uc.idcurso === turma.idcurso);
      setUcsFiltradas(filtered);
    } catch (error) {
      console.error('Erro ao filtrar UCs:', error);
    }
  };

  const getCargaHorariaRestante = () => {
    if (!selectedUcId) return 0;
    const cargaAtual = cargaHorariaUc[selectedUcId] || 0;
    const horasAgendando = horasAula * selectedDays.size;
    return cargaAtual - horasAgendando;
  };

  const podeSalvar = () => {
    return selectedTurmaId && selectedUcId && selectedDays.size > 0 && getCargaHorariaRestante() >= 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!podeSalvar()) return;

    const aulaData = {
      idturma: selectedTurmaId,
      iduc: selectedUcId,
      periodo,
      horas: horasAula,
      horario: periodoConfig[periodo].horario,
      dias: selectedDays
    };

    onAulaAdded(aulaData);
  };

  const maxHoras = periodoConfig[periodo]?.maxHoras || 1;

  if (loading) {
    return (
      <div className="dialog-overlay">
        <div className="dialog-content">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
        <div className="dialog-header">
          <h2>Agendar Aulas</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f8ff', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#20b2aa' }}>Dias Selecionados</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {Array.from(selectedDays).map(timestamp => {
                const date = new Date(timestamp);
                return (
                  <span key={timestamp} style={{
                    background: '#20b2aa',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {new Intl.DateTimeFormat('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit'
                    }).format(date)}
                  </span>
                );
              })}
            </div>
            <p style={{ margin: 0, color: '#666' }}>Total de horas a agendar: {horasAula * selectedDays.size}</p>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Users size={16} />
              Turma
            </label>
            <select
              className="form-select"
              value={selectedTurmaId || ''}
              onChange={(e) => {
                setSelectedTurmaId(e.target.value ? parseInt(e.target.value) : null);
                setSelectedUcId(null);
              }}
              required
            >
              <option value="">Selecione uma turma</option>
              {turmas.map(turma => (
                <option key={turma.idturma} value={turma.idturma}>
                  {turma.turmanome}
                </option>
              ))}
            </select>
          </div>

          {selectedTurmaId && (
            <div className="form-group">
              <label className="form-label">
                <BookOpen size={16} />
                Unidade Curricular
              </label>
              <select
                className="form-select"
                value={selectedUcId || ''}
                onChange={(e) => setSelectedUcId(e.target.value ? parseInt(e.target.value) : null)}
                required
              >
                <option value="">Selecione uma UC</option>
                {ucsFiltradas.map(uc => {
                  const cargaRestante = cargaHorariaUc[uc.iduc] || 0;
                  return (
                    <option
                      key={uc.iduc}
                      value={uc.iduc}
                      disabled={cargaRestante < horasAula}
                    >
                      {uc.nomeuc} ({cargaRestante}h restantes)
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {selectedUcId && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} />
                  Período
                </label>
                <select
                  className="form-select"
                  value={periodo}
                  onChange={(e) => {
                    setPeriodo(e.target.value);
                    const newMaxHoras = periodoConfig[e.target.value].maxHoras;
                    if (horasAula > newMaxHoras) {
                      setHorasAula(newMaxHoras);
                    }
                  }}
                >
                  {Object.keys(periodoConfig).map(p => (
                    <option key={p} value={p}>
                      {p} ({periodoConfig[p].horario})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Horas por aula: {horasAula}
                </label>
                <input
                  type="range"
                  min="1"
                  max={maxHoras}
                  value={horasAula}
                  onChange={(e) => setHorasAula(parseInt(e.target.value))}
                  style={{ width: '100%', margin: '8px 0' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                  <span>1h</span>
                  <span>{maxHoras}h</span>
                </div>
              </div>

              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#20b2aa' }}>Resumo do Agendamento</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Período:</span>
                    <strong>{periodo}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Horas por aula:</span>
                    <strong>{horasAula}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total de aulas:</span>
                    <strong>{selectedDays.size}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total de horas:</span>
                    <strong>{horasAula * selectedDays.size}</strong>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: getCargaHorariaRestante() < 0 ? '#f44336' : 'inherit'
                  }}>
                    <span>Carga horária restante:</span>
                    <strong>{getCargaHorariaRestante()} horas</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!podeSalvar()}
            >
              Salvar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdicionarAulaDialog;