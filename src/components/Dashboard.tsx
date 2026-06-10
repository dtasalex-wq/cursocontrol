/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { Aluno, Turma, Frequencia, Pagamento, Transacao } from '../types';
import { motion } from 'motion/react';

interface EventoComemorativo {
  dia: number;
  mes: number; // 0-indexed (5 = Junho)
  titulo: string;
  tipo: 'feriado' | 'escolar' | 'comemorativo';
  descricao: string;
}

const DATAS_COMEMORATIVAS: EventoComemorativo[] = [
  { dia: 1, mes: 0, titulo: 'Ano Novo', tipo: 'feriado', descricao: 'Confraternização Universal (Ano Novo)' },
  { dia: 25, mes: 0, titulo: 'Dia da Bossa Nova', tipo: 'comemorativo', descricao: 'Homenagem à música brasileira e cultura e tecnologia escolar' },
  { dia: 15, mes: 1, titulo: 'Dia da Informática na Escola', tipo: 'escolar', descricao: 'Palestras sobre programação, robótica e inclusão digital' },
  { dia: 8, mes: 2, titulo: 'Dia Internacional da Mulher', tipo: 'comemorativo', descricao: 'Debates sobre direitos, inclusão de mulheres na TI e conquistas sociais' },
  { dia: 21, mes: 3, titulo: 'Tiradentes', tipo: 'feriado', descricao: 'Feriado Nacional Cívico em homenagem a Tiradentes' },
  { dia: 1, mes: 4, titulo: 'Dia do Trabalhador', tipo: 'feriado', descricao: 'Feriado Nacional do Dia do Trabalho' },
  { dia: 5, mes: 5, titulo: 'Dia do Meio Ambiente', tipo: 'comemorativo', descricao: 'Atividades educativas sobre sustentabilidade e descarte de eletrônicos' },
  { dia: 12, mes: 5, titulo: 'Dia dos Namorados', tipo: 'comemorativo', descricao: 'Celebração nacional do afeto e das relações interpessoais' },
  { dia: 24, mes: 5, titulo: 'Festa Junina / São João', tipo: 'escolar', descricao: 'Oficinas culturais, quadrilha e comidas típicas na escola de informática' },
  { dia: 27, mes: 5, titulo: 'Feira de Softwares da Escola', tipo: 'escolar', descricao: 'Mostra integrada de softwares e web apps construídos pelos alunos' },
  { dia: 9, mes: 6, titulo: 'Revolução Constitucionalista', tipo: 'feriado', descricao: 'Data cívico-histórica e feriado estadual regulamentado' },
  { dia: 11, mes: 7, titulo: 'Dia do Estudante', tipo: 'escolar', descricao: 'Gincana especial de programação, robótica e recreação escolar' },
  { dia: 7, mes: 8, titulo: 'Independência do Brasil', tipo: 'feriado', descricao: 'Feriado Nacional de celebração da Independência' },
  { dia: 12, mes: 9, titulo: 'Dia das Crianças', tipo: 'feriado', descricao: 'Nossa Senhora Aparecida (Feriado Nacional) e data folclórica' },
  { dia: 15, mes: 9, titulo: 'Dia do Professor', tipo: 'escolar', descricao: 'Homenagem especial aos docentes das turmas e instrutores de laboratório' },
  { dia: 2, mes: 10, titulo: 'Finados', tipo: 'feriado', descricao: 'Feriado Nacional de ressonância e memória' },
  { dia: 15, mes: 10, titulo: 'Proclamação da República', tipo: 'feriado', descricao: 'Feriado Nacional cívico' },
  { dia: 20, mes: 10, titulo: 'Dia da Consciência Negra', tipo: 'feriado', descricao: 'Debates sobre inclusão social e resgate histórico' },
  { dia: 25, mes: 11, titulo: 'Natal', tipo: 'feriado', descricao: 'Celebração do Feriado de Natal em família' }
];

interface DashboardProps {
  alunos: Aluno[];
  turmas: Turma[];
  frequencias: Frequencia[];
  pagamentos: Pagamento[];
  transacoes: Transacao[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ 
  alunos, 
  turmas, 
  frequencias, 
  pagamentos, 
  transacoes, 
  onNavigate 
}: DashboardProps) {

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date(2026, 5, 9)); // Default to June 2026 (matching today's date)
  const [selectedDayEvent, setSelectedDayEvent] = useState<any | null>(null);

  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => {
      const year = prev.getFullYear();
      const month = prev.getMonth();
      const newMonth = month === 0 ? 11 : month - 1;
      const newYear = month === 0 ? year - 1 : year;
      return new Date(newYear, newMonth, 1);
    });
    setSelectedDayEvent(null);
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => {
      const year = prev.getFullYear();
      const month = prev.getMonth();
      const newMonth = month === 11 ? 0 : month + 1;
      const newYear = month === 11 ? year + 1 : year;
      return new Date(newYear, newMonth, 1);
    });
    setSelectedDayEvent(null);
  };

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calculate metrics
  const activeAlunos = useMemo(() => alunos.filter(a => a.status === 'Ativo').length, [alunos]);
  const totalTurmas = useMemo(() => turmas.length, [turmas]);

  // Attendance metrics
  const attendanceRate = useMemo(() => {
    if (frequencias.length === 0) return 100;
    let totalPossivel = 0;
    let totalPresente = 0;
    frequencias.forEach(f => {
      f.presencas.forEach(p => {
        totalPossivel++;
        if (p.presente) totalPresente++;
      });
    });
    return totalPossivel > 0 ? Math.round((totalPresente / totalPossivel) * 100) : 100;
  }, [frequencias]);

  // Financial metrics
  const totalReceitas = useMemo(() => {
    return transacoes
      .filter(t => t.tipo === 'Receita' && t.status === 'Pago')
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [transacoes]);

  const totalDespesas = useMemo(() => {
    return transacoes
      .filter(t => t.tipo === 'Despesa' && t.status === 'Pago')
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [transacoes]);

  const saldoLiquido = useMemo(() => totalReceitas - totalDespesas, [totalReceitas, totalDespesas]);

  // Payment statuses
  const statusPagamentos = useMemo(() => {
    const counts = { Pago: 0, Pendente: 0, Atrasado: 0 };
    pagamentos.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [pagamentos]);

  // Low attendance alerts (under 75%)
  const lowAttendanceAlunos = useMemo(() => {
    if (frequencias.length === 0) return [];
    
    const studentStats: Record<string, { total: number; presencas: number }> = {};
    frequencias.forEach(f => {
      f.presencas.forEach(p => {
        if (!studentStats[p.alunoId]) {
          studentStats[p.alunoId] = { total: 0, presencas: 0 };
        }
        studentStats[p.alunoId].total++;
        if (p.presente) {
          studentStats[p.alunoId].presencas++;
        }
      });
    });

    const alerts: { id: string; nome: string; taxa: number; turmaNome: string }[] = [];
    Object.keys(studentStats).forEach(alunoId => {
      const stats = studentStats[alunoId];
      const taxa = Math.round((stats.presencas / stats.total) * 100);
      if (taxa < 75) {
        const student = alunos.find(a => a.id === alunoId);
        if (student && student.status === 'Ativo') {
          const classObj = turmas.find(t => t.id === student.turmaId);
          alerts.push({
            id: alunoId,
            nome: student.nome,
            taxa,
            turmaNome: classObj?.nome || 'Nenhuma'
          });
        }
      }
    });

    return alerts;
  }, [frequencias, alunos, turmas]);

  // Overdue payments alerts
  const overduePayments = useMemo(() => {
    return pagamentos
      .filter(p => p.status === 'Atrasado')
      .map(p => {
        const student = alunos.find(a => a.id === p.alunoId);
        return {
          id: p.id,
          alunoNome: student?.nome || 'Aluno Desconhecido',
          mes: p.mesReferencia,
          valor: p.valor,
          vencimento: p.dataVencimento
        };
      });
  }, [pagamentos, alunos]);

  // Calendar-specific calculations
  const calMonth = currentCalendarDate.getMonth();
  const calYear = currentCalendarDate.getFullYear();

  // Get days in current month
  const numDays = useMemo(() => new Date(calYear, calMonth + 1, 0).getDate(), [calYear, calMonth]);
  // Get first day of current month index (Sunday=0, Monday=1, etc)
  const firstDayOfWeek = useMemo(() => new Date(calYear, calMonth, 1).getDay(), [calYear, calMonth]);

  // Create grid cells (empty slots + actual days)
  const dayCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= numDays; d++) {
      cells.push(d);
    }
    return cells;
  }, [firstDayOfWeek, numDays]);

  const activeMonthEvents = useMemo(() => {
    return DATAS_COMEMORATIVAS.filter(evt => evt.mes === calMonth);
  }, [calMonth]);

  const getEventForDay = (day: number | null) => {
    if (day === null) return null;
    return activeMonthEvents.find(evt => evt.dia === day);
  };

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="dashboard-container">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white" id="welcome-title">
            Gestão <span className="text-gray-500">/ Visão Geral</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Visão geral e monitoramento das atividades de informática hoje.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-[#111111] border border-[#222222] px-3 py-1.5 rounded-lg text-gray-400 self-start md:self-auto">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Fuso: UTC-3 | {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Grid boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Alunos Ativos */}
        <div 
          onClick={() => onNavigate('alunos')} 
          id="card-active-students"
          className="bg-[#111111] border border-[#222222] p-6 rounded-2xl cursor-pointer hover:bg-[#1A1A1A] hover:border-[#333333] transition duration-200 hover:-translate-y-0.5 flex items-start justify-between"
        >
          <div className="space-y-2">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">Alunos Ativos</span>
            <div className="text-3xl font-light tracking-tight text-white">{activeAlunos}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Matrículas em alta</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Turmas Ativas */}
        <div 
          onClick={() => onNavigate('turmas')} 
          id="card-active-classes"
          className="bg-[#111111] border border-[#222222] p-6 rounded-2xl cursor-pointer hover:bg-[#1A1A1A] hover:border-[#333333] transition duration-200 hover:-translate-y-0.5 flex items-start justify-between"
        >
          <div className="space-y-2">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">Turmas em Curso</span>
            <div className="text-3xl font-light tracking-tight text-white">{totalTurmas}</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{alunos.length} matriculados</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Taxa de Presença */}
        <div 
          onClick={() => onNavigate('frequencia')} 
          id="card-attendance-rate"
          className="bg-[#111111] border border-[#222222] p-6 rounded-2xl cursor-pointer hover:bg-[#1A1A1A] hover:border-[#333333] transition duration-200 hover:-translate-y-0.5 flex items-start justify-between"
        >
          <div className="space-y-2">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">Taxa de Presença</span>
            <div className="text-3xl font-light tracking-tight text-white">{attendanceRate}%</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Frequência saudável</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Calendar & Quick Actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="calendar-and-shortcuts-area">
        
        {/* Left Column: Calendar with commemorative dates in highlight */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#222222] p-6 rounded-2xl flex flex-col justify-between" id="calendar-box">
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#222222] gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white">Datas Comemorativas & Eventos</h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Calendário letivo integrado com feriados e datas comemorativas em destaque.</p>
              </div>
              
              <div className="flex items-center gap-2 bg-[#181818] px-3 py-1.5 border border-[#222222] rounded-xl self-start md:self-auto">
                <button 
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:text-white text-gray-400 hover:bg-[#252525] rounded transition cursor-pointer"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-white min-w-[100px] text-center uppercase tracking-wide">
                  {mesesNomes[calMonth]} {calYear}
                </span>
                <button 
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:text-white text-gray-400 hover:bg-[#252525] rounded transition cursor-pointer"
                  title="Próximo Mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Calendar Grid Section */}
              <div className="md:col-span-7 space-y-3">
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                    <span key={i} className="text-[9px] font-bold text-gray-500 py-1 uppercase">{day}</span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {dayCells.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }

                    const event = getEventForDay(day);
                    const isSelected = selectedDayEvent?.dia === day && selectedDayEvent?.mes === calMonth;
                    const isToday = calYear === 2026 && calMonth === 5 && day === 9; // Today is June 9, 2026!

                    let borderStyle = 'border-transparent';
                    let bgStyle = 'bg-[#151515] hover:bg-[#202020] text-gray-300';
                    let textStyle = '';

                    if (event) {
                      if (event.tipo === 'feriado') {
                        bgStyle = 'bg-rose-500/10 hover:bg-rose-500/20';
                        borderStyle = 'border-rose-500/30';
                        textStyle = 'text-rose-400 font-bold';
                      } else if (event.tipo === 'escolar') {
                        bgStyle = 'bg-indigo-500/10 hover:bg-indigo-500/20';
                        borderStyle = 'border-indigo-500/30';
                        textStyle = 'text-indigo-400 font-bold';
                      } else { // comemorativo
                        bgStyle = 'bg-amber-500/10 hover:bg-amber-500/20';
                        borderStyle = 'border-amber-500/30';
                        textStyle = 'text-amber-400 font-bold';
                      }
                    }

                    if (isToday) {
                      borderStyle = 'border-indigo-500 ring-1 ring-indigo-500/50';
                    }

                    if (isSelected) {
                      bgStyle = event?.tipo === 'feriado' 
                        ? 'bg-rose-500/30 text-rose-300' 
                        : event?.tipo === 'escolar' 
                        ? 'bg-indigo-500/30 text-indigo-300' 
                        : 'bg-amber-500/30 text-amber-300';
                    }

                    return (
                      <button
                        type="button"
                        key={`day-${day}`}
                        onClick={() => setSelectedDayEvent(event || { dia: day, mes: calMonth, titulo: 'Dia Comum', tipo: 'letivo', descricao: 'Dia letivo normal na escola de informática.' })}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs border transition cursor-pointer relative ${bgStyle} ${borderStyle} ${textStyle}`}
                      >
                        <span className="font-semibold">{day}</span>
                        {event && (
                          <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                            event.tipo === 'feriado' 
                              ? 'bg-rose-500' 
                              : event.tipo === 'escolar' 
                              ? 'bg-indigo-500' 
                              : 'bg-amber-500'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Info Panel */}
              <div className="md:col-span-5 bg-[#141414] border border-[#222222]/60 rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                {selectedDayEvent && selectedDayEvent.mes === calMonth ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono border ${
                        selectedDayEvent.tipo === 'feriado'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : selectedDayEvent.tipo === 'escolar'
                          ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                          : selectedDayEvent.tipo === 'comemorativo'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-[#1C1C1C] border-[#2E2E2E] text-gray-400'
                      }`}>
                        {selectedDayEvent.tipo}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold font-mono">
                        {selectedDayEvent.dia} de {mesesNomes[calMonth]}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white leading-normal">{selectedDayEvent.titulo}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{selectedDayEvent.descricao}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Eventos de {mesesNomes[calMonth]}</h3>
                    {activeMonthEvents.length > 0 ? (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {activeMonthEvents.map(evt => (
                          <div 
                            key={evt.dia} 
                            onClick={() => setSelectedDayEvent(evt)}
                            className="p-2.5 bg-[#1A1A1A] hover:bg-[#222222] border border-[#252525] rounded-xl transition cursor-pointer text-left space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-300 font-bold font-mono">{evt.dia} de {mesesNomes[calMonth]}</span>
                              <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${
                                evt.tipo === 'feriado' ? 'text-rose-400' : evt.tipo === 'escolar' ? 'text-indigo-400' : 'text-amber-400'
                              }`}>{evt.tipo}</span>
                            </div>
                            <p className="text-xs text-gray-200 mt-0.5 truncate font-medium">{evt.titulo}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic py-4 text-center">Nenhum evento registrado para este mês.</p>
                    )}
                  </div>
                )}

                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider pt-2 border-t border-[#222222]/60 flex items-center justify-between mt-4">
                  <span>Toque em um dia destacado</span>
                  {selectedDayEvent && selectedDayEvent.mes === calMonth && (
                    <button 
                      type="button"
                      onClick={() => setSelectedDayEvent(null)}
                      className="text-indigo-400 hover:underline cursor-pointer"
                    >
                      Ver Todos
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions Shortcuts Column */}
        <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl flex flex-col justify-between" id="shortcuts-box">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 animate-pulse">Ações Rápidas</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <button 
                type="button"
                onClick={() => onNavigate('alunos')}
                className="flex items-center justify-between p-3.5 bg-[#1A1A1A] hover:bg-[#222222] rounded-xl border border-[#333333] text-left transition text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
              >
                <span>Cadastrar Novo Aluno</span>
                <Users className="w-4 h-4 text-gray-500" />
              </button>
              <button 
                type="button"
                onClick={() => onNavigate('turmas')}
                className="flex items-center justify-between p-3.5 bg-[#1A1A1A] hover:bg-[#222222] rounded-xl border border-[#333333] text-left transition text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
              >
                <span>Criar Nova Turma</span>
                <GraduationCap className="w-4 h-4 text-gray-500" />
              </button>
              <button 
                type="button"
                onClick={() => onNavigate('frequencia')}
                className="flex items-center justify-between p-3.5 bg-[#1A1A1A] hover:bg-[#222222] rounded-xl border border-[#333333] text-left transition text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
              >
                <span>Lançar Frequência Hoje</span>
                <CheckCircle className="w-4 h-4 text-gray-500" />
              </button>
              <button 
                type="button"
                onClick={() => onNavigate('pagamentos')}
                className="flex items-center justify-between p-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-left transition text-xs font-bold text-white shadow-lg shadow-indigo-500/15 cursor-pointer"
              >
                <span>Receber Mensalidade</span>
                <DollarSign className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#222222]">
            <span className="text-[10px] text-gray-500 font-medium">Dica: Utilize os módulos no menu superior para cadastros complexos.</span>
          </div>
        </div>

      </div>

      {/* Row 2: Monthly Fees alongside Administration Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="alerts-and-billing-area">
        
        {/* Left Column: Alerts & Critical Status List */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#222222] p-6 rounded-2xl flex flex-col justify-between" id="critical-alerts-box">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <h3 className="text-sm font-semibold text-white">Alertas Administrativos</h3>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-semibold font-mono border border-amber-500/20">
                {lowAttendanceAlunos.length + overduePayments.length} Pendências
              </span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {/* Low Attendance Alerts */}
              {lowAttendanceAlunos.map(a => (
                <div key={`alert-att-${a.id}`} className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/20 hover:bg-red-500/10 transition duration-150">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">Alerta de Evasão / Frequência Baixa</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      O estudante <span className="font-medium text-gray-200">{a.nome}</span> ({a.turmaNome}) está com apenas <span className="font-bold text-red-400">{a.taxa}%</span> de presença.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onNavigate('frequencia')}
                    className="text-[11px] text-red-400 hover:underline font-bold whitespace-nowrap self-center font-mono flex items-center gap-0.5 cursor-pointer"
                  >
                    Ver Frequência <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Overdue Payments Alerts */}
              {overduePayments.map(p => (
                <div key={`alert-pay-${p.id}`} className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 hover:bg-amber-500/10 transition duration-150">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">Mensalidade em Atraso</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="font-medium text-gray-200">{p.alunoNome}</span> deve a parcela de <span className="font-bold text-amber-400">{p.mes}</span> (Venceu em: {new Date(p.vencimento).toLocaleDateString('pt-BR')}) no valor de <span className="font-semibold text-gray-300">R$ {p.valor}</span>.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onNavigate('pagamentos')}
                    className="text-[11px] text-amber-400 hover:underline font-bold whitespace-nowrap self-center font-mono flex items-center gap-0.5 cursor-pointer"
                  >
                    Cobrar <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {lowAttendanceAlunos.length === 0 && overduePayments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-55" />
                  <p className="text-xs font-medium text-gray-400">Tudo sob controle!</p>
                  <p className="text-[10px] text-gray-500 mt-1">Nenhuma inadimplência crítica ou alerta de evasão registrado no momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Billing statistics (Status Cobranças) */}
        <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl flex flex-col justify-between" id="billing-status-panel">
          <div>
            <h2 className="text-sm font-semibold text-white">Mensalidades do Mês</h2>
            <p className="text-xs text-gray-500 mt-0.5">Distribuição do adimplemento dos alunos neste mês de referência.</p>
          </div>

          <div className="my-6 flex justify-center items-center relative">
            {/* Draw a gorgeous SVG Donut diagram with pure coordinates */}
            <svg className="w-36 h-36" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.915" fill="none" stroke="#222222" strokeWidth="6" />
              
              {/* Segments calculation */}
              {(() => {
                const total = statusPagamentos.Pago + statusPagamentos.Pendente + statusPagamentos.Atrasado || 1;
                const pPago = (statusPagamentos.Pago / total) * 100;
                const pPendente = (statusPagamentos.Pendente / total) * 100;
                const pAtrasado = (statusPagamentos.Atrasado / total) * 100;

                const offset1 = 100;
                const offset2 = offset1 - pPago;
                const offset3 = offset2 - pPendente;

                return (
                  <>
                    {/* Pago */}
                    {pPago > 0 && (
                      <circle 
                        cx="21" cy="21" r="15.915" fill="none" 
                        stroke="#10b981" strokeWidth="6.2" 
                        strokeDasharray={`${pPago} ${100 - pPago}`} 
                        strokeDashoffset={offset1} 
                      />
                    )}
                    {/* Pendente */}
                    {pPendente > 0 && (
                      <circle 
                        cx="21" cy="21" r="15.915" fill="none" 
                        stroke="#64748b" strokeWidth="6.1" 
                        strokeDasharray={`${pPendente} ${100 - pPendente}`} 
                        strokeDashoffset={offset2} 
                      />
                    )}
                    {/* Atrasado */}
                    {pAtrasado > 0 && (
                      <circle 
                        cx="21" cy="21" r="15.915" fill="none" 
                        stroke="#f43f5e" strokeWidth="6.3" 
                        strokeDasharray={`${pAtrasado} ${100 - pAtrasado}`} 
                        strokeDashoffset={offset3} 
                      />
                    )}
                  </>
                );
              })()}
            </svg>

            {/* Total display in center of donut */}
            <div className="absolute text-center">
              <span className="text-[10px] text-gray-500 block uppercase font-medium">Cobranças</span>
              <span className="text-xl font-bold text-white">{pagamentos.length}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                <span className="text-emerald-400 font-medium">Pagas</span>
              </div>
              <span className="font-bold text-emerald-400">{statusPagamentos.Pago}</span>
            </div>
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-gray-500/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500 block" />
                <span className="text-gray-400 font-medium">Pendentes</span>
              </div>
              <span className="font-bold text-gray-300">{statusPagamentos.Pendente}</span>
            </div>
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-rose-500/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
                <span className="text-rose-400 font-medium">Atrasadas (Devedores)</span>
              </div>
              <span className="font-bold text-rose-400">{statusPagamentos.Atrasado}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
