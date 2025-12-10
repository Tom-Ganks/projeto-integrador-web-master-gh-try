import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Printer, Plus } from 'lucide-react';
import { supabaseClient } from '../../services/supabase.js';
import FeriadosDialog from '../../widgets/FeriadosDialog.jsx';
import AdicionarAulaDialog from '../../widgets/AdicionarAulaDialog.jsx';
import PrintSchedule from '../../components/PrintSchedule.jsx'
import '../../styles/print-schedule.css';
import '../../styles/cronograma.css';


const CronogramaPage = ({ onNavigateHome }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState(new Set());
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState({});
  const [filteredEvents, setFilteredEvents] = useState({});
  const [turmas, setTurmas] = useState([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeriadosDialog, setShowFeriadosDialog] = useState(false);
  const [showAdicionarAulaDialog, setShowAdicionarAulaDialog] = useState(false);
  const [feriadosNacionais, setFeriadosNacionais] = useState({});
  const [feriadosMunicipais, setFeriadosMunicipais] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [aulaToDelete, setAulaToDelete] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [aulaToEdit, setAulaToEdit] = useState(null);
  const [showConflitoDialog, setShowConflitoDialog] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [aulaConflitante, setAulaConflitante] = useState(null);
  const [novaAulaTentada, setNovaAulaTentada] = useState(null);

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  const dayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    aplicarFiltroTurma();
  }, [selectedTurmaId, events]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadTurmas(),
        loadAulas(),
        loadFeriadosNacionais(),
        loadFeriadosMunicipais()
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
        .select('idturma, turmanome, cursos(nomecurso)')
        .order('turmanome');

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const loadAulas = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('aulas')
        .select(`
          idaula, iduc, idturma, data, horario, status, horas,
          unidades_curriculares(nomeuc),
          turma(turmanome)
        `)
        .order('data');

      if (error) throw error;

      const eventsMap = {};
      data?.forEach(aula => {
        const date = new Date(aula.data + 'T00:00:00');
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

        if (!eventsMap[dateKey]) {
          eventsMap[dateKey] = [];
        }
        eventsMap[dateKey].push(aula);
      });

      setEvents(eventsMap);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    }
  };

  const loadFeriadosNacionais = () => {
    const feriados = {};
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year <= currentYear + 4; year++) {
      feriados[`${year}-0-1`] = '🎉 Ano Novo';
      feriados[`${year}-3-21`] = '🎖 Tiradentes';
      feriados[`${year}-4-1`] = '👷 Dia do Trabalho';
      feriados[`${year}-8-7`] = '🇧🇷 Independência do Brasil';
      feriados[`${year}-9-12`] = '🙏 Nossa Senhora Aparecida';
      feriados[`${year}-10-2`] = '🕯 Finados';
      feriados[`${year}-10-15`] = '🏛 Proclamação da República';
      feriados[`${year}-11-25`] = '🎄 Natal';
    }

    setFeriadosNacionais(feriados);
  };

  const loadFeriadosMunicipais = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('feriadosmunicipais')
        .select('data, nome');

      if (error) throw error;

      const feriados = {};
      data?.forEach(feriado => {
        const date = new Date(feriado.data);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        feriados[dateKey] = feriado.nome;
      });

      setFeriadosMunicipais(feriados);
    } catch (error) {
      console.error('Erro ao carregar feriados municipais:', error);
    }
  };

  const aplicarFiltroTurma = () => {
    if (!selectedTurmaId) {
      setFilteredEvents(events);
      return;
    }

    const filtered = {};
    Object.entries(events).forEach(([dateKey, aulas]) => {
      const filteredAulas = aulas.filter(aula => aula.idturma === selectedTurmaId);
      if (filteredAulas.length > 0) {
        filtered[dateKey] = filteredAulas;
      }
    });

    setFilteredEvents(filtered);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isFeriado = (date) => {
    if (!date) return false;
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return feriadosNacionais[dateKey] || feriadosMunicipais[dateKey];
  };

  const isDomingo = (date) => {
    return date && date.getDay() === 0;
  };

  const getEventsForDay = (date) => {
    if (!date) return [];
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return filteredEvents[dateKey] || [];
  };

  const handleDayClick = (date, isCtrlPressed = false) => {
    if (!date) return;

    if (isCtrlPressed) {
      const newSelectedDays = new Set(selectedDays);
      if (newSelectedDays.has(date.getTime())) {
        newSelectedDays.delete(date.getTime());
      } else {
        newSelectedDays.add(date.getTime());
      }
      setSelectedDays(newSelectedDays);
      setSelectedDay(null);
    } else {
      setSelectedDays(new Set());
      setSelectedDay(date);
    }
  };

  const handleAdicionarAula = async (aulaData) => {
    try {
      const aulasParaInserir = Array.from(aulaData.dias)
        .map(d => new Date(d)) // <-- corrige o erro do Ctrl
        .filter(day => {
          const isSunday = day.getDay() === 0;
          const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const isFeriadoDia = feriadosNacionais[dateKey] || feriadosMunicipais[dateKey];
          if (isSunday || isFeriadoDia) return false;
          return true;
        });

      if (aulasParaInserir.length === 0) {
        alert('Não é possível agendar aulas apenas em domingos ou feriados.');
        return;
      }
      // Verifica se já existe aula no mesmo dia/horário e calcula horas usadas
      const verificacoes = await Promise.all(
        aulasParaInserir.map(async (day) => {
          const dataStr = day.toISOString().split('T')[0];

          const { data: aulasExistentes } = await supabaseClient
            .from('aulas')
            .select('idaula, horas, horario, iduc, unidades_curriculares(nomeuc)')
            .eq('idturma', aulaData.idturma)
            .eq('data', dataStr)
            .eq('horario', aulaData.horario);

          // Calcula carga total já usada nesse período
          const horasExistentes = aulasExistentes?.reduce((sum, a) => sum + (a.horas || 0), 0) || 0;

          // Define limite por turno
          const limiteHoras =
            aulaData.horario === '19:00-22:00' ? 3 : 4;

          // Soma das horas existentes + as novas
          const totalHoras = horasExistentes + aulaData.horas;

          // Verifica se ultrapassa o limite
          const ultrapassa = totalHoras > limiteHoras;

          return {
            data: dataStr,
            aulasExistentes,
            horasExistentes,
            limiteHoras,
            ultrapassa
          };
        })
      );

      // Se alguma ultrapassar o limite → abre pop-up com opção de editar
      const conflitos = verificacoes.filter(v => v.ultrapassa);

      if (conflitos.length > 0) {
        const conflito = conflitos[0];
        const aulaConflitante = conflito.aulasExistentes[0];

        setAulaConflitante(aulaConflitante);
        setShowConflitoDialog(true);
        return;
      }

      const aulasParaSalvar = aulasParaInserir.map(day => ({
        iduc: aulaData.iduc,
        idturma: aulaData.idturma,
        data: day.toISOString().split('T')[0],
        horario: aulaData.horario,
        status: 'Agendada',
        horas: aulaData.horas
      }));

      const { error } = await supabaseClient
        .from('aulas')
        .insert(aulasParaSalvar);

      if (error) throw error;

      await loadAulas();
      setSelectedDays(new Set());
      setSelectedDay(null);
      setShowAdicionarAulaDialog(false);
    } catch (error) {
      console.error('Erro ao adicionar aula:', error);
      alert('Erro ao adicionar aula: ' + error.message);
    }
  };


  const handleEditAula = (aula) => {
    setAulaToEdit(aula);
    setShowEditDialog(true);
  };

  const handleDeleteAula = (aula) => {
    setAulaToDelete(aula);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAula = async () => {
    if (!aulaToDelete) return;

    try {
      const { error } = await supabaseClient
        .from('aulas')
        .delete()
        .eq('idaula', aulaToDelete.idaula);

      if (error) throw error;

      await loadAulas();
      setShowDeleteDialog(false);
      setAulaToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar aula:', error);
      alert('Erro ao deletar aula: ' + error.message);
    }
  };

  const handleEditSubmit = async (formData) => {
    if (!aulaToEdit) return;

    try {
      // Atualiza a aula
      const { error } = await supabaseClient
        .from('aulas')
        .update({
          horario: formData.horario,
          horas: formData.horas,
          status: formData.status
        })
        .eq('idaula', aulaToEdit.idaula);

      if (error) throw error;

      // Se a aula for marcada como "Realizada", subtrai as horas da UC
      if (formData.status === 'Realizada') {
        const { data: ucAtual } = await supabaseClient
          .from('unidades_curriculares')
          .select('cargahoraria')
          .eq('iduc', aulaToEdit.iduc)
          .single();

        if (ucAtual && ucAtual.cargahoraria > 0) {
          const novaCarga = Math.max(ucAtual.cargahoraria - formData.horas, 0);
          await supabaseClient
            .from('unidades_curriculares')
            .update({ cargahoraria: novaCarga })
            .eq('iduc', aulaToEdit.iduc);
        }
      }

      await loadAulas();
      setShowEditDialog(false);
      setAulaToEdit(null);
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      alert('Erro ao atualizar aula: ' + error.message);
    }
  };


  if (loading) {
    return (
      <div className="cronograma-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cronograma-page">
      {/* Header */}
      <div className="cronograma-header">
        <div className="cronograma-header-left">
          <button className="back-button" onClick={onNavigateHome}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="cronograma-title">Cronograma de Aulas</h1>
        </div>
        <div className="cronograma-actions">
          <button
            className="action-button"
            onClick={() => setShowFeriadosDialog(true)}
            title="Gerenciar Feriados"
          >
            <Calendar size={20} />
          </button>
          <button
            className="action-button"
            onClick={() => {
              if (!selectedTurmaId) {
                alert('Selecione uma turma antes de imprimir.');
                return;
              }
              setShowPrintView(true);
            }}
            title="Imprimir Cronograma"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <select
          className="filter-dropdown"
          value={selectedTurmaId || ''}
          onChange={(e) => setSelectedTurmaId(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">Todas as Turmas</option>
          {turmas.map(turma => (
            <option key={turma.idturma} value={turma.idturma}>
              {turma.cursos?.nomecurso} - {turma.turmanome}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Container */}
      <div className="calendar-container">
        {/* Calendar Navigation */}
        <div className="calendar-navigation">
          <button
            className="nav-button"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <h2 className="month-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            className="nav-button"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            ›
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className={`day-header ${day === 'domingo' || day === 'sábado' ? 'weekend' : ''}`}>
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {getDaysInMonth(currentDate).map((date, index) => {
            if (!date) {
              return <div key={index} style={{ background: '#f5f5f5' }}></div>;
            }

            const isSelected = selectedDay &&
              date.getTime() === selectedDay.getTime();
            const isMultiSelected = selectedDays.has(date.getTime());
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isFeriadoDay = isFeriado(date);
            const isDomingoDay = isDomingo(date);
            const eventsForDay = getEventsForDay(date);

            return (
              <div
                key={date.getTime()}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''} ${isWeekend ? 'weekend' : ''} ${isFeriadoDay ? 'feriado' : ''}`}
                onClick={(e) => handleDayClick(date, e.ctrlKey)}
              >
                <div className="day-number">{date.getDate()}</div>
                {eventsForDay.length > 0 && (
                  <div className="event-indicators">
                    {eventsForDay.map((event, idx) => (
                      <div key={idx} className="event-dot"></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Day Info */}
        {(selectedDay || selectedDays.size > 0) && (
          <div className="selected-info">
            {selectedDay && (
              <p>
                {new Intl.DateTimeFormat('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).format(selectedDay)}
              </p>
            )}
            {selectedDays.size > 0 && (
              <p>{selectedDays.size} dia(s) selecionado(s)</p>
            )}
            {selectedDay && getEventsForDay(selectedDay).length === 0 && (
              <p>Nenhuma aula agendada</p>
            )}
            {selectedDay && getEventsForDay(selectedDay).length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Aulas do dia:</h4>
                {getEventsForDay(selectedDay).map((aula) => (
                  <div key={aula.idaula} style={{
                    background: '#f8f9fa',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <strong>{aula.unidades_curriculares?.nomeuc}</strong> - {aula.turma?.turmanome}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                      {aula.horario} ({aula.horas}h)
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleEditAula(aula)}
                        style={{
                          background: '#20b2aa',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteAula(aula)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => setShowAdicionarAulaDialog(true)}
        disabled={selectedDays.size === 0 && !selectedDay}
        title="Agendar Aulas"
      >
        <Plus size={24} />
      </button>

      {/* Dialogs */}
      {showFeriadosDialog && (
        <FeriadosDialog
          feriadosNacionais={feriadosNacionais}
          feriadosMunicipais={feriadosMunicipais}
          onClose={() => setShowFeriadosDialog(false)}
          onFeriadoAdded={loadFeriadosMunicipais}
        />
      )}

      {showConflitoDialog && aulaConflitante && (
        <div
          className="dialog-overlay"
          onClick={() => setShowConflitoDialog(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 999999
          }}
        >
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              zIndex: 1000000,
              maxWidth: 560,
              width: '90%',
              padding: 20,
              borderRadius: 10,
              background: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
          >
            <h2 style={{ marginTop: 0, color: '#20b2aa' }}>Limite de horas excedido</h2>
            <p>
              O período já possui uma aula da mesma turma já agendada: <strong>{aulaConflitante.unidades_curriculares?.nomeuc}</strong> ({aulaConflitante.horas}h).
            </p>
            <p>
              O total de horas desse período não pode ultrapassar o limite de {aulaConflitante.horario === '19:00-22:00' ? 3 : 4}h.
            </p>
            <p>Deseja editar a aula existente para liberar parte do horário?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                className="btn-secondary"
                onClick={() => setShowConflitoDialog(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowConflitoDialog(false);
                  setAulaToEdit(aulaConflitante);
                  setShowEditDialog(true);
                }}
              >
                Editar Aula Existente
              </button>
            </div>
          </div>
        </div>
      )}


      {showAdicionarAulaDialog && (
        <AdicionarAulaDialog
          selectedDays={selectedDays.size > 0 ? selectedDays : new Set([selectedDay])}
          onClose={() => setShowAdicionarAulaDialog(false)}
          onAulaAdded={handleAdicionarAula}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Confirmar Exclusão</h2>
            </div>
            <div className="dialog-body">
              <p>Tem certeza que deseja apagar essa aula?</p>
              <p><strong>Aula {aulaToDelete?.idaula}</strong></p>
              <p>Horário: {aulaToDelete?.horario}</p>
              <p>Horas: {aulaToDelete?.horas}h</p>
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
                onClick={confirmDeleteAula}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Aula Dialog */}
      {showEditDialog && aulaToEdit && (
        <div className="dialog-overlay" onClick={() => setShowEditDialog(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Editar Aula</h2>
            </div>
            <div className="dialog-body">
              <EditAulaForm
                aula={aulaToEdit}
                onSubmit={handleEditSubmit}
                onCancel={() => setShowEditDialog(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showPrintView && (
        <div
          className="print-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'white',
            zIndex: 99999,
            overflow: 'auto',
            display: 'block'
          }}
        >
          <button
            onClick={() => setShowPrintView(false)}
            className="no-print"
            style={{
              position: 'fixed',
              top: 10,
              right: 10,
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              zIndex: 100000
            }}
          >
            Fechar
          </button>

          <div style={{ padding: '50px 20px 20px 20px', width: '100%', boxSizing: 'border-box' }}>
            {selectedTurmaId ? (
              <PrintSchedule
                turmaId={selectedTurmaId}
                monthDate={currentDate}
                onReady={() => {
                  requestAnimationFrame(() => {
                    setTimeout(() => {
                      window.print();
                    }, 700);
                  });
                }}
              />
            ) : (
              <div style={{ padding: 24 }}>
                <strong>Selecione uma turma antes de imprimir.</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================
// COMPONENTE DE EDIÇÃO DE AULA
// =========================

const EditAulaForm = ({ aula, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    horario: aula.horario || '',
    horas: aula.horas || 1,
    status: aula.status || 'Agendada'
  });

  const getMaxHoras = () => {
    if (formData.horario === '19:00-22:00') {
      return 3;
    }
    return 4;
  };

  const handleHorasChange = (e) => {
    const value = parseInt(e.target.value);
    const maxHoras = getMaxHoras();
    if (value > maxHoras) {
      alert(`O turno ${formData.horario === '19:00-22:00' ? 'Noturno' : 'Matutino/Vespertino'} permite no máximo ${maxHoras} horas.`);
      return;
    }
    setFormData({ ...formData, horas: value });
  };

  const handleHorarioChange = (e) => {
    const newHorario = e.target.value;
    const maxHoras = newHorario === '19:00-22:00' ? 3 : 4;
    const newHoras = formData.horas > maxHoras ? maxHoras : formData.horas;
    setFormData({ ...formData, horario: newHorario, horas: newHoras });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const maxHoras = getMaxHoras();
    if (formData.horas > maxHoras) {
      alert(`O turno ${formData.horario === '19:00-22:00' ? 'Noturno' : 'Matutino/Vespertino'} permite no máximo ${maxHoras} horas.`);
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Horário:</label>
        <select
          value={formData.horario}
          onChange={handleHorarioChange}
          className="form-select"
        >
          <option value="08:00-12:00">Matutino (08:00-12:00)</option>
          <option value="14:00-18:00">Vespertino (13:00-17:00)</option>
          <option value="19:00-22:00">Noturno (19:00-22:00)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Horas: (máx. {getMaxHoras()}h)</label>
        <input
          id="horas"
          name="horas"
          type="number"
          min="1"
          max={getMaxHoras()}
          value={formData.horas}
          onChange={handleHorasChange}
          onInput={(e) => {
            const max = getMaxHoras();
            const value = parseInt(e.target.value);
            if (value > max) {
              e.target.value = max;
              setFormData({ ...formData, horas: max });
            }
          }}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Status:</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="form-select"
        >
          <option value="Agendada">Agendada</option>
          <option value="Realizada">Realizada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
      </div>

      <div className="dialog-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          Salvar
        </button>
      </div>
    </form>
  );
};

export default CronogramaPage;
