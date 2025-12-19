import React, { useEffect, useState } from 'react';
import { X, Clock, BookOpen, Users, Calendar, Info } from 'lucide-react';
import { supabaseClient } from '../services/supabase';

const AdicionarAulaDialog = ({ selectedDays, onClose, onAulaAdded }) => {
  const [turmas, setTurmas] = useState([]);
  const [ucs, setUcs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    idturma: '',
    iduc: '',
    horaInicio: '',
    horas: 1,
    horario: '',
    status: 'Agendada'
  });

  // =========================
  // LOAD TURMAS
  // =========================
  useEffect(() => {
    const loadTurmas = async () => {
      const { data, error } = await supabaseClient
        .from('turma')
        .select(`
          idturma,
          turmanome,
          idcurso,
          cursos(nomecurso)
        `)
        .order('turmanome');

      if (!error) setTurmas(data || []);
    };

    loadTurmas();
  }, []);

  // =========================
  // LOAD UCs (FILTRADO POR CURSO DA TURMA)
  // =========================
  useEffect(() => {
    const loadUCs = async () => {
      if (!formData.idturma) {
        setUcs([]);
        return;
      }

      const turmaSelecionada = turmas.find(
        t => t.idturma === Number(formData.idturma)
      );

      if (!turmaSelecionada?.idcurso) return;

      const { data, error } = await supabaseClient
        .from('unidades_curriculares')
        .select('iduc, nomeuc, cargahoraria')
        .eq('idcurso', turmaSelecionada.idcurso)
        .order('nomeuc');

      if (!error) setUcs(data || []);
    };

    loadUCs();
  }, [formData.idturma, turmas]);

  // =========================
  // CALCULAR HORÁRIO FINAL
  // =========================
  useEffect(() => {
    if (!formData.horaInicio || !formData.horas) return;

    const [h, m] = formData.horaInicio.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(h, m, 0, 0);

    const fim = new Date(inicio.getTime() + formData.horas * 60 * 60 * 1000);
    const horarioFinal = `${String(fim.getHours()).padStart(2, '0')}:${String(
      fim.getMinutes()
    ).padStart(2, '0')}`;

    setFormData(prev => ({
      ...prev,
      horario: `${formData.horaInicio}-${horarioFinal}`
    }));
  }, [formData.horaInicio, formData.horas]);

  // =========================
  // REGRAS DE HORAS
  // =========================
  const getMaxHoras = () => {
    if (!formData.horaInicio) return 4;
    const h = Number(formData.horaInicio.split(':')[0]);
    return h >= 19 ? 3 : 4;
  };

  const getPeriodoNome = () => {
    if (!formData.horaInicio) return '';
    const h = Number(formData.horaInicio.split(':')[0]);
    if (h >= 19) return 'Noturno';
    if (h >= 14) return 'Vespertino';
    return 'Matutino';
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.idturma || !formData.iduc || !formData.horaInicio) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      await onAulaAdded({
        ...formData,
        dias: selectedDays
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const totalHoras = selectedDays.size * formData.horas;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="adicionar-aula-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog-header">
          <h2>Configuração das Aulas</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Selected Days Info */}
        <div className="selected-days-banner">
          <Calendar size={16} />
          <span>Total de dias a agendar: <strong>{selectedDays.size}</strong></span>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          {/* Turma Field */}
          <div className="form-group">
            <label className="form-label">
              <Users size={16} />
              <span>Turma</span>
              <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={formData.idturma}
              onChange={e =>
                setFormData({
                  ...formData,
                  idturma: e.target.value,
                  iduc: ''
                })
              }
              required
            >
              <option value="">Selecione uma turma</option>
              {turmas.map(t => (
                <option key={t.idturma} value={t.idturma}>
                  {t.cursos?.nomecurso} - {t.turmanome}
                </option>
              ))}
            </select>
          </div>

          {/* Unidade Curricular Field */}
          <div className="form-group">
            <label className="form-label">
              <BookOpen size={16} />
              <span>Unidade Curricular</span>
              <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={formData.iduc}
              onChange={e => setFormData({ ...formData, iduc: e.target.value })}
              disabled={!formData.idturma}
              required
            >
              <option value="">Selecione uma UC</option>
              {ucs.map(uc => (
                <option key={uc.iduc} value={uc.iduc}>
                  {uc.nomeuc} ({uc.cargahoraria}h restantes)
                </option>
              ))}
            </select>
          </div>

          {/* Período Field (Auto-calculated) */}
          {formData.horaInicio && (
            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                <span>Período</span>
              </label>
              <div className="periodo-display">
                <span className="periodo-badge">{getPeriodoNome()}</span>
              </div>
            </div>
          )}

          {/* Hora de Início Field */}
          <div className="form-group">
            <label className="form-label">
              <Clock size={16} />
              <span>Hora de Início</span>
              <span className="required">*</span>
            </label>
            <input
              type="time"
              className="form-input"
              value={formData.horaInicio}
              onChange={e =>
                setFormData({ ...formData, horaInicio: e.target.value })
              }
              required
            />
          </div>

          {/* Horas por Aula Field */}
          <div className="form-group">
            <label className="form-label">
              <span>Horas por aula: <strong>{formData.horas}</strong> (máx {getMaxHoras()}h)</span>
            </label>
            <div className="slider-container">
              <input
                type="range"
                className="form-slider"
                min="1"
                max={getMaxHoras()}
                value={formData.horas}
                onChange={e =>
                  setFormData({ ...formData, horas: Number(e.target.value) })
                }
              />
              <div className="slider-labels">
                <span>1h</span>
                <span>{getMaxHoras()}h</span>
              </div>
            </div>
          </div>

          {/* Horário Calculado */}
          {formData.horario && (
            <div className="horario-calculado">
              <strong>Horário agendado: {formData.horario}</strong>
            </div>
          )}

          {/* Resumo do Agendamento */}
          <div className="resumo-section">
            <div className="resumo-header">
              <Info size={16} />
              <span>Resumo do Agendamento</span>
            </div>
            <div className="resumo-content">
              <div className="resumo-item">
                <span>Período:</span>
                <strong>{getPeriodoNome() || 'N/A'}</strong>
              </div>
              <div className="resumo-item">
                <span>Horário:</span>
                <strong>{formData.horario || 'N/A'}</strong>
              </div>
              <div className="resumo-item">
                <span>Horas por aula:</span>
                <strong>{formData.horas}</strong>
              </div>
              <div className="resumo-item">
                <span>Total de horas:</span>
                <strong>{totalHoras}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || !formData.idturma || !formData.iduc || !formData.horaInicio}
            >
              {loading ? 'Agendando...' : 'Agendar Aulas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdicionarAulaDialog;