import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../services/supabase.js';
import { getFeriadosNacionais } from '../services/feriadosNacionais.js';
import '../styles/print-schedule.css';

const PrintSchedule = ({ turmaId, monthDate, onReady }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduleData();
  }, [turmaId, monthDate]);

  const normalizeDate = (dateString) => {
    // Garante que a data esteja no formato YYYY-MM-DD
    const date = new Date(dateString);
    // Usa UTC para evitar problemas de fuso horário
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadScheduleData = async () => {
    if (!turmaId) {
      setLoading(false);
      return;
    }

    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      // Use o primeiro e último dia do mês corretamente
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // 🔹 1. Buscar turma base
      const { data: turmaData, error: turmaError } = await supabaseClient
        .from('turma')
        .select('idturma, turmanome, idinstrutor, idcurso, idturno')
        .eq('idturma', turmaId)
        .maybeSingle();

      if (turmaError) throw turmaError;

      // 🔹 2. Buscar nomes relacionados
      let instrutorNome = 'N/A';
      let cursoNome = 'N/A';
      let turnoNome = 'N/A';

      if (turmaData?.idinstrutor) {
        const { data: instrutorData } = await supabaseClient
          .from('instrutores')
          .select('nomeinstrutor')
          .eq('idinstrutor', turmaData.idinstrutor)
          .maybeSingle();
        instrutorNome = instrutorData?.nomeinstrutor || 'N/A';
      }

      if (turmaData?.idcurso) {
        const { data: cursoData } = await supabaseClient
          .from('cursos')
          .select('nomecurso')
          .eq('idcurso', turmaData.idcurso)
          .maybeSingle();
        cursoNome = cursoData?.nomecurso || 'N/A';
      }

      if (turmaData?.idturno) {
        const { data: turnoData } = await supabaseClient
          .from('turno')
          .select('turno')
          .eq('idturno', turmaData.idturno)
          .maybeSingle();
        turnoNome = turnoData?.turno || 'N/A';
      }

      // 🔹 3. Aulas
      const { data: aulasData, error: aulasError } = await supabaseClient
        .from('aulas')
        .select(`
          idaula,
          data,
          horario,
          horas,
          status,
          iduc,
          unidades_curriculares(nomeuc)
        `)
        .eq('idturma', turmaId)
        .gte('data', startDate.toISOString().split('T')[0])
        .lte('data', endDate.toISOString().split('T')[0])
        .order('data');

      if (aulasError) throw aulasError;

      // 🔹 4. FERIADOS - CORREÇÃO COMPLETA
      const { data: feriadosMunicipais, error: feriadosError } = await supabaseClient
        .from('feriadosmunicipais')
        .select('data, nome')
        .gte('data', startDate.toISOString().split('T')[0])
        .lte('data', endDate.toISOString().split('T')[0]);

      if (feriadosError) throw feriadosError;

      // 🔹 Feriados Nacionais - CORREÇÃO DO FILTRO
      const feriadosNacionais = getFeriadosNacionais();
      const nacionaisFiltrados = Object.entries(feriadosNacionais)
        .filter(([key]) => {
          const [ano, mes, dia] = key.split('-').map(Number);
          const feriadoDate = new Date(ano, mes - 1, dia); // mes-1 porque é 0-based
          return feriadoDate >= startDate && feriadoDate <= endDate;
        })
        .map(([key, nome]) => ({
          data: key,
          nome,
        }));

      // 🔹 Combinar nacional + municipal
      const feriadosCombinados = [
        ...(feriadosMunicipais || []),
        ...nacionaisFiltrados,
      ];

      // DEBUG: Log para verificar os feriados carregados
      console.log('Feriados carregados:', feriadosCombinados);

      // 🔹 Montagem final
      setScheduleData({
        turma: { 
          ...turmaData, 
          cursoNome, 
          instrutorNome, 
          turnoNome 
        },
        aulas: aulasData || [],
        feriados: feriadosCombinados || [],
        month,
        year,
      });

      if (typeof onReady === 'function') setTimeout(() => onReady(), 500);

    } catch (error) {
      console.error('Erro ao carregar dados para impressão:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const isFeriado = (dateStr) => {
    if (!scheduleData?.feriados) return false;
    
    const normalizedTarget = normalizeDate(dateStr);
    
    return scheduleData.feriados.some(f => {
      const normalizedFeriado = normalizeDate(f.data);
      return normalizedFeriado === normalizedTarget;
    });
  };

  const isSaturday = (day) =>
    new Date(scheduleData.year, scheduleData.month, day).getDay() === 6;

  const isSunday = (day) =>
    new Date(scheduleData.year, scheduleData.month, day).getDay() === 0;

  const getHoursForDay = (day) => {
    if (!scheduleData?.aulas) return null;
    const dateStr = `${scheduleData.year}-${String(scheduleData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const aula = scheduleData.aulas.find(a => a.data === dateStr);
    return aula ? aula.horas : null;
  };

  const getTotalHours = () =>
    scheduleData?.aulas?.reduce((sum, aula) => sum + (aula.horas || 0), 0) || 0;

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  if (loading) return <div style={{ padding: '20px' }}>Carregando dados...</div>;
  if (!scheduleData) return <div style={{ padding: '20px' }}>Selecione uma turma.</div>;

  const daysInMonth = getDaysInMonth(scheduleData.year, scheduleData.month);
  const firstDay = getFirstDayOfMonth(scheduleData.year, scheduleData.month);

  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const dayAbbreviations = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const classHours = scheduleData.aulas
    .map(a => a.unidades_curriculares?.nomeuc)
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="print-schedule-wrapper">
      <div className="print-schedule">
        {/* Cabeçalho */}
        <div className="print-header">
          <div className="logo-section">
            <img src={`${process.env.PUBLIC_URL}/senac.png`} alt="SENAC" className="logo" />
          </div>
          <div className="header-info">
            <h1>SENAC CATALÃO</h1>
            <p><strong>MÊS:</strong> {monthNames[scheduleData.month]} {scheduleData.year}</p>
            <p><strong>CURSO:</strong> {scheduleData.turma?.cursoNome || 'N/A'}</p>
            <p><strong>TURMA:</strong> {scheduleData.turma?.turmanome || 'N/A'}</p>
            <p><strong>TURNO:</strong> {scheduleData.turma?.turnoNome || 'N/A'}</p>
            <p><strong>HORÁRIO:</strong> {Array.from(new Set(scheduleData.aulas?.map(a => a.horario))).join(', ') || 'N/A'}</p>
            <p><strong>INSTRUTOR:</strong> {scheduleData.turma?.instrutorNome || 'N/A'}</p>
          </div>
        </div>

        {/* Título do mês - ESTE É O QUE FICA ACIMA DA TABELA */}
        <h2 className="month-title">{monthNames[scheduleData.month]}</h2>

        {/* Tabela principal */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="uc-column">Unidades Curriculares</th>
                {days.map((day) => {
                  const date = new Date(scheduleData.year, scheduleData.month, day);
                  const dayAbbr = dayAbbreviations[date.getDay()];
                  return (
                    <th key={day} className="day-column-header">
                      <div className="day-abbr">{dayAbbr}</div>
                      <div className="day-num">{day}</div>
                    </th>
                  );
                })}
                <th className="total-column">TOTAL</th>
                <th className="instructor-column">Instrutor</th>
              </tr>
            </thead>
            <tbody>
              {classHours.length > 0 ? classHours.map((ucName) => {
                const total = scheduleData.aulas
                  .filter(a => a.unidades_curriculares?.nomeuc === ucName)
                  .reduce((sum, a) => sum + (a.horas || 0), 0);

                return (
                  <tr key={ucName}>
                    <td className="uc-name">{ucName}</td>
                    {days.map((day) => {
                      const hours = getHoursForDay(day);
                      const dateStr = `${scheduleData.year}-${String(scheduleData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isFer = isFeriado(dateStr);
                      const isSat = isSaturday(day);
                      const isSun = isSunday(day);

                      // DEBUG: Log para verificar cada dia
                      if (isFer) {
                        console.log(`Dia ${day} (${dateStr}) é feriado`);
                      }

                      let cellClass = 'schedule-cell';
                      if (hours) cellClass += ' has-class';

                      if (isFer) {
                        // Se for feriado, sobrescreve o sábado/domingo
                        cellClass += ' feriado';
                      } else {
                        if (isSat) cellClass += ' saturday';
                        if (isSun) cellClass += ' sunday';
                      }

                      return (
                        <td key={`${ucName}-${day}`} className={cellClass}>
                          {hours ? <span className="hours-text">{hours.toFixed(1)}</span> : ''}
                        </td>
                      );
                    })}
                    <td className="total-hours">{total.toFixed(1)}</td>
                    <td className="instructor-name">
                      {scheduleData.turma?.instrutorNome || 'N/A'}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={daysInMonth + 3} style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhuma aula agendada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintSchedule;