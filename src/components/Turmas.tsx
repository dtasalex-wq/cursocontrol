/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Aluno, Turma, Curso } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  BookOpen, 
  Calendar, 
  Users, 
  Clock,
  User,
  DollarSign, 
  GraduationCap, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TurmasProps {
  turmas: Turma[];
  alunos: Aluno[];
  cursos: Curso[];
  onAddTurma: (turma: Omit<Turma, 'id'>) => void;
  onUpdateTurma: (turma: Turma) => void;
  onDeleteTurma: (id: string) => void;
}

const DIAS_SEMANA_OPCOES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES_OPCOES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Turmas({ 
  turmas, 
  alunos, 
  cursos,
  onAddTurma, 
  onUpdateTurma, 
  onDeleteTurma 
}: TurmasProps) {
  
  // Selected course for displaying detailed student roster in collapsible cards
  const [expandedTurmaId, setExpandedTurmaId] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [professor, setProfessor] = useState('');
  const [horario, setHorario] = useState('');
  const [diasSemana, setDiasSemana] = useState<string[]>([]);
  const [maxAlunos, setMaxAlunos] = useState(15);
  const [valorMensalidade, setValorMensalidade] = useState(300);
  const [duracaoMeses, setDuracaoMeses] = useState(6);
  const [mesesMinistrados, setMesesMinistrados] = useState<string[]>([]);
  const [valorMatricula, setValorMatricula] = useState(150);
  const [anoVigente, setAnoVigente] = useState('2026');
  const [quadrimestreVigente, setQuadrimestreVigente] = useState('1');

  const [formError, setFormError] = useState('');

  // Count enrolled active students per course
  const activeAlunoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    alunos.forEach(a => {
      if (a.status === 'Ativo') {
        counts[a.turmaId] = (counts[a.turmaId] || 0) + 1;
      }
    });
    return counts;
  }, [alunos]);

  // Handle opening form for adding a new course
  const handleOpenAdd = () => {
    setEditingTurma(null);
    setNome(cursos[0]?.nome || '');
    setProfessor('');
    setHorario('19:00 - 21:00');
    setDiasSemana([]);
    setMesesMinistrados([]);
    setValorMatricula(150);
    setMaxAlunos(15);
    setValorMensalidade(300);
    setDuracaoMeses(6);
    setAnoVigente('2026');
    setQuadrimestreVigente('1');
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle opening form for editing an existing course
  const handleOpenEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setNome(turma.nome);
    setProfessor(turma.professor);
    setHorario(turma.horario);
    setDiasSemana(turma.diasSemana || []);
    setMesesMinistrados(turma.mesesMinistrados || []);
    setValorMatricula(turma.valorMatricula ?? 150);
    setMaxAlunos(turma.maxAlunos);
    setValorMensalidade(turma.valorMensalidade);
    setDuracaoMeses(turma.duracaoMeses || 6);
    const parts = (turma.codigo || '').split('.');
    setAnoVigente(parts[0] || '2026');
    setQuadrimestreVigente(parts[1] || '1');
    setFormError('');
    setIsFormOpen(true);
  };

  // Toggle day of the week checkbox
  const handleDayToggle = (day: string) => {
    if (diasSemana.includes(day)) {
      setDiasSemana(diasSemana.filter(d => d !== day));
    } else {
      setDiasSemana([...diasSemana, day]);
    }
  };

  // Toggle month checkbox and update duration in months
  const handleMonthToggle = (month: string) => {
    let updated: string[];
    if (mesesMinistrados.includes(month)) {
      updated = mesesMinistrados.filter(m => m !== month);
    } else {
      updated = [...mesesMinistrados, month];
    }
    setMesesMinistrados(updated);
    setDuracaoMeses(updated.length || 1); // Sync duration in months with selected months count
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (cursos.length === 0) {
      setFormError('Você deve cadastrar ao menos um curso no menu "Cadastro de Cursos" antes de criar uma turma.');
      return;
    }

    if (!nome.trim() || !professor.trim() || !horario.trim() || diasSemana.length === 0) {
      setFormError('Por favor, preencha todos os campos obrigatórios e selecione ao menos um dia da semana.');
      return;
    }

    if (mesesMinistrados.length === 0) {
      setFormError('Por favor, selecione ao menos um mês letivo para a turma.');
      return;
    }

    if (Number(maxAlunos) <= 0) {
      setFormError('O número de vagas deve ser maior que 0.');
      return;
    }

    if (Number(duracaoMeses) <= 0) {
      setFormError('A duração da turma deve ser de no mínimo 1 mês.');
      return;
    }

    if (Number(valorMensalidade) < 0) {
      setFormError('O valor da mensalidade não pode ser negativo.');
      return;
    }

    if (Number(valorMatricula) < 0) {
      setFormError('O valor da matrícula não pode ser negativo.');
      return;
    }

    const courseData = {
      nome: nome.trim(),
      curso: nome.trim(), // Sync both name fields for layout and backwards data compatibility
      professor: professor.trim(),
      horario: horario.trim(),
      diasSemana,
      maxAlunos: Number(maxAlunos),
      duracaoMeses: Number(duracaoMeses),
      valorMensalidade: Number(valorMensalidade),
      valorMatricula: Number(valorMatricula),
      mesesMinistrados,
      codigo: `${anoVigente}.${quadrimestreVigente}`
    };

    if (editingTurma) {
      onUpdateTurma({
        ...courseData,
        id: editingTurma.id
      });
    } else {
      onAddTurma(courseData);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="turmas-module-container">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white mb-1" id="turmas-title">
            Cadastro de <span className="text-indigo-400 font-semibold">Turmas</span>
          </h1>
          <p className="text-xs text-gray-400">Gerencie a grade de ofertas de turmas, horários, capacidade limite, mensalidades e instrutores.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          id="btn-new-course"
          className="flex items-center justify-center gap-1.5 px-4.5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition duration-150 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Turma</span>
        </button>
      </div>

      {/* Main Course List - Extends Full Width */}
      <div className="w-full" id="courses-grid-wrapper">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmas.map(t => {
            const activeEnrolledCount = activeAlunoCounts[t.id] || 0;
            const percentFull = Math.min(Math.round((activeEnrolledCount / t.maxAlunos) * 100), 100);
            const isExpanded = expandedTurmaId === t.id;
            const activeStudentsList = alunos.filter(a => a.turmaId === t.id);

            return (
              <div 
                key={t.id}
                className={`bg-[#111111] p-6 rounded-2xl border transition-all duration-250 ${
                  isExpanded 
                    ? 'md:col-span-2 border-indigo-500 ring-2 ring-indigo-500/5 shadow-2xl' 
                    : 'col-span-1 border-[#222222] hover:border-gray-600'
                }`}
              >
                <div className={`flex flex-col ${isExpanded ? 'md:flex-row gap-6' : 'h-full justify-between'}`}>
                  
                  {/* Left Side: Course Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider font-mono">
                            Informática / Ensino {t.codigo ? `• Cód: ${t.codigo}` : ''}
                          </span>
                          <h3 className="text-base font-bold text-white mt-1 select-all">{t.nome}</h3>
                        </div>
                        <div className="flex gap-1.5 no-print shrink-0">
                          <button 
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 bg-[#1C1C1C] hover:bg-[#252525] rounded-lg text-gray-400 hover:text-indigo-400 transition"
                            title="Editar Turma"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir a turma "${t.nome}"? Os alunos matriculados ficarão sem vínculo de turma.`)) {
                                onDeleteTurma(t.id);
                                if (expandedTurmaId === t.id) setExpandedTurmaId(null);
                              }
                            }}
                            className="p-1.5 bg-[#1C1C1C] hover:bg-rose-500/10 rounded-lg text-gray-500 hover:text-rose-450 transition"
                            title="Excluir Turma"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Instructor/Teacher Card info */}
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <User className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="font-semibold">{t.professor}</span>
                        <span className="text-gray-500 text-[10px] bg-[#1A1A1A] border border-[#222222] px-1.5 py-0.5 rounded-md ml-auto">Instrutor</span>
                      </div>

                      {/* Schedule, Days of Week, and School Months display */}
                      <div className="space-y-3.5 bg-[#181818] p-4 rounded-xl border border-[#222222] text-left">
                        <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-200 border-b border-[#2c2c2c] pb-2.5">
                          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Horário: <strong className="text-white">{t.horario}</strong></span>
                        </div>
                        
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Dias de Aula:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {t.diasSemana.map(d => (
                              <span key={d} className="text-[11px] font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>

                        {t.mesesMinistrados && t.mesesMinistrados.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-[#2c2c2c] mt-2.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Meses Letivos:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {t.mesesMinistrados.map(m => (
                                <span key={m} className="text-[10px] font-bold bg-[#222222] text-slate-200 border border-[#333333] px-2.5 py-1 rounded-lg uppercase font-mono">
                                  {m.substring(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Occupancy and Monthly Tuition rate */}
                    <div className="mt-4 pt-4 border-t border-[#222222]/65 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Ocupação de Vagas</span>
                          <span className={`font-bold font-mono ${percentFull >= 90 ? 'text-rose-400' : 'text-gray-200'}`}>
                            {activeEnrolledCount} / {t.maxAlunos} Alunos ({percentFull}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentFull >= 100 ? 'bg-rose-500' : percentFull >= 80 ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${percentFull}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-gray-400">Duração da Turma:</span>
                        <span className="font-bold text-indigo-300">
                          {t.duracaoMeses || 6} meses
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs py-0.5 border-b border-[#222222]/40 pb-1">
                        <span className="text-gray-450">Taxa de Matrícula:</span>
                        <span className="font-bold text-indigo-400">
                          R$ {(t.valorMatricula ?? 150).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-gray-450">Mensalidade:</span>
                        <span className="font-bold text-white text-sm">
                          R$ {t.valorMensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>



                      {/* Collapsible Student Roster Toggle Button */}
                      <div className="pt-2">
                        <button
                          onClick={() => setExpandedTurmaId(isExpanded ? null : t.id)}
                          className="w-full py-1.5 bg-[#181818] hover:bg-[#202020] border border-[#2a2a2a] rounded-lg transition text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white flex items-center justify-center gap-1.5"
                        >
                          <span>Relação de Alunos ({activeStudentsList.length})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Relação de Alunos Roster */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#222222] pt-4 md:pt-0 md:pl-6 shrink-0 flex flex-col"
                      >
                        <div className="text-left mb-3">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-indigo-400" />
                            Matriculados na Turma
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">Estudantes ativos e inadimplentes cadastrados nesta turma.</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto max-h-[380px] space-y-1.5 pr-1">
                          {activeStudentsList.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2.5 bg-[#161616] border border-[#222222] rounded-xl">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#202020] text-gray-300 font-bold flex items-center justify-center text-[9px]">
                                  {item.nome.charAt(0)}
                                </span>
                                <div>
                                  <p className="text-[11px] font-bold text-white truncate max-w-[140px]">{item.nome}</p>
                                  <p className="text-[9px] text-gray-500 font-mono">{item.fone1 || item.telefone || 'Sem fone'}</p>
                                </div>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                item.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                item.status === 'Inadimplente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                item.status === 'Aguardando' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                'bg-[#1A1A1A] text-gray-400'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          ))}
                          {activeStudentsList.length === 0 && (
                            <div className="text-center py-12 text-gray-500 text-[10px] italic">
                              Nenhum aluno matriculado ainda.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            );
          })}

          {turmas.length === 0 && (
            <div className="col-span-full bg-[#111111]/30 p-12 text-center border border-dashed border-[#222222] rounded-2xl space-y-3">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto opacity-50" />
              <div>
                <p className="text-sm font-semibold text-gray-300">Nenhuma turma registrada</p>
                <p className="text-xs text-gray-500 mt-1">Insira a primeira turma do sistema para matrícula de estudantes.</p>
              </div>
              <button 
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl text-white transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Nova Turma
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog Form - Cadastro/Edição de Turma em Tela Secundária */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto" id="course-form-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-xl bg-[#111111] border border-[#222222] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans"
            >
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#161616] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/10">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                      {editingTurma ? 'Editar Cadastro de Turma' : 'Cadastrar Nova Turma'}
                    </h2>
                    <p className="text-[10px] text-gray-500">Configure as definições gerais de turmas, mensalidades e horários.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-[#222222] rounded-full text-gray-400 transition"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 text-left">
                
                {/* Código da Turma (Ano + Quadrimestre) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ano Letivo (Vigente) *</label>
                    <select
                      value={anoVigente}
                      onChange={(e) => setAnoVigente(e.target.value)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1D1D1D] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition cursor-pointer"
                    >
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quadrimestre *</label>
                    <select
                      value={quadrimestreVigente}
                      onChange={(e) => setQuadrimestreVigente(e.target.value)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1D1D1D] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition cursor-pointer"
                    >
                      <option value="1">1º Quadrimestre (.1)</option>
                      <option value="2">2º Quadrimestre (.2)</option>
                      <option value="3">3º Quadrimestre (.3)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-3 border border-[#222222] rounded-xl text-xs font-mono text-gray-450">
                  Código da Turma Gerado: <strong className="text-indigo-400">{anoVigente}.{quadrimestreVigente}</strong>
                </div>

                {/* 1. Curso da Turma */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Curso de Vínculo *</label>
                  {cursos.length > 0 ? (
                    <select
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1D1D1D] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition cursor-pointer"
                    >
                      {cursos.map(c => (
                        <option key={c.id} value={c.nome}>
                          {c.nome} ({c.cargaHoraria}h)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Nenhum curso cadastrado. Por favor, registre um curso antes de criar turmas.</span>
                    </div>
                  )}
                </div>

                {/* 2. Instrutor */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Instrutor / Professor *</label>
                  <input 
                    type="text" 
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    required
                    placeholder="Ex: Prof. Roberto de Almeida"
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1D1D1D] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                  />
                </div>

                {/* 3. Horário de Aula */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Horário da Aula *</label>
                  <input 
                    type="text" 
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    required
                    placeholder="Ex: Terça e Quinta, das 19:00 - 21:00"
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1D1D1D] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                  />
                </div>

                {/* 4. Dias da Semana checkboxes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dias da Semana de Aula *</label>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {DIAS_SEMANA_OPCOES.map(day => {
                      const active = diasSemana.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => handleDayToggle(day)}
                          className={`text-[10px] font-bold py-2 border text-center rounded-xl transition ${
                            active 
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-semibold' 
                              : 'bg-[#1D1D1D] border-[#222222] text-gray-450 hover:bg-[#252525]'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Meses de Ministração/Aula Grid */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Meses que a Turma será Ministrada *</label>
                  <p className="text-[9px] text-gray-500 italic pb-0.5">As opções escolhidas corresponderão aos meses em que haverá cobrança de mensalidade.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {MESES_OPCOES.map(month => {
                      const active = mesesMinistrados.includes(month);
                      const label = month.substring(0, 3).toUpperCase();
                      return (
                        <button
                          type="button"
                          key={month}
                          onClick={() => handleMonthToggle(month)}
                          className={`text-[10px] font-bold py-2 border text-center rounded-xl transition ${
                            active 
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-semibold shadow-md' 
                              : 'bg-[#1D1D1D] border-[#222222] text-gray-445 hover:bg-[#252525]'
                          }`}
                          title={`Turma ativa no mês de ${month}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Vagas, Duração, Mensalidade e Matrícula */}
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Vagas *</label>
                    <input 
                      type="number" 
                      value={maxAlunos}
                      min={1}
                      required
                      onChange={(e) => setMaxAlunos(Number(e.target.value))}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1D1D1D] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Duração (Meses, auto-calculado) *</label>
                    <input 
                      type="number" 
                      value={duracaoMeses}
                      min={1}
                      required
                      disabled
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#171717] text-gray-500 border border-[#222222] rounded-xl cursor-not-allowed opacity-80"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Valor de Matrícula (R$) *</label>
                    <input 
                      type="number" 
                      value={valorMatricula}
                      min={0}
                      required
                      onChange={(e) => setValorMatricula(Number(e.target.value))}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1D1D1D] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Mensalidade (R$) *</label>
                    <input 
                      type="number" 
                      value={valorMensalidade}
                      min={0}
                      required
                      onChange={(e) => setValorMensalidade(Number(e.target.value))}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1D1D1D] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="text-[10px] text-red-400 bg-red-400/10 p-2.5 border border-red-500/20 rounded-lg font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
              </form>

              {/* Modal Actions Footer */}
              <div className="p-5 border-t border-[#222222] bg-[#161616] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-bold px-4 py-2 bg-[#1C1C1C] hover:bg-[#252525] text-gray-300 rounded-xl transition border border-[#222222]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 transition duration-150"
                >
                  {editingTurma ? 'Salvar Edição' : 'Cadastrar Turma'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
