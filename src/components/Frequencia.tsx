/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Aluno, Turma, Frequencia } from '../types';
import { 
  Calendar, 
  Check, 
  X, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Save, 
  Clock, 
  History,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface FrequenciaProps {
  alunos: Aluno[];
  turmas: Turma[];
  frequencias: Frequencia[];
  onSaveFrequencia: (frequencia: Omit<Frequencia, 'id'>) => void;
}

export default function FrequenciaView({ 
  alunos, 
  turmas, 
  frequencias, 
  onSaveFrequencia 
}: FrequenciaProps) {

  // Selection states
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(turmas[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // List of active students in the selected class
  const classStudents = useMemo(() => {
    return alunos.filter(a => a.turmaId === selectedTurmaId && a.status === 'Ativo');
  }, [alunos, selectedTurmaId]);

  // Check if there is already an existing attendance record for the selected date + class
  const existingRecord = useMemo(() => {
    return frequencias.find(f => f.turmaId === selectedTurmaId && f.data === selectedDate);
  }, [frequencias, selectedTurmaId, selectedDate]);

  // Attendance buffer state (studentId -> boolean representing present/absent)
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [aulaMinistrada, setAulaMinistrada] = useState<boolean>(true);
  const [motivoNaoMinistrada, setMotivoNaoMinistrada] = useState<string>('');
  const [conteudoAplicado, setConteudoAplicado] = useState<string>('');

  // Sync buffer state when class, date, or existing records change
  React.useEffect(() => {
    const map: Record<string, boolean> = {};
    if (existingRecord) {
      existingRecord.presencas.forEach(p => {
        map[p.alunoId] = p.presente;
      });
      setAulaMinistrada(existingRecord.aulaMinistrada !== false);
      setMotivoNaoMinistrada(existingRecord.motivoNaoMinistrada || '');
      setConteudoAplicado(existingRecord.conteudoAplicado || '');
    } else {
      // Default all to true (Presente)
      classStudents.forEach(s => {
        map[s.id] = true;
      });
      setAulaMinistrada(true);
      setMotivoNaoMinistrada('');
      setConteudoAplicado('');
    }
    setPresenceMap(map);
  }, [existingRecord, selectedTurmaId, selectedDate, classStudents.length]);

  // Quick mark actions
  const markAllPresent = () => {
    const map: Record<string, boolean> = {};
    classStudents.forEach(s => {
      map[s.id] = true;
    });
    setPresenceMap(map);
  };

  const markAllAbsent = () => {
    const map: Record<string, boolean> = {};
    classStudents.forEach(s => {
      map[s.id] = false;
    });
    setPresenceMap(map);
  };

  // Toggle single attendance
  const togglePresence = (studentId: string) => {
    setPresenceMap({
      ...presenceMap,
      [studentId]: !presenceMap[studentId]
    });
  };

  // Save submission
  const [successInfo, setSuccessInfo] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSave = () => {
    if (!selectedTurmaId) return;
    setValidationError('');

    if (!aulaMinistrada && !motivoNaoMinistrada.trim()) {
      setValidationError('Por favor, indique o motivo do cancelamento / não aplicação da aula.');
      return;
    }

    if (aulaMinistrada && !conteudoAplicado.trim()) {
      setValidationError('Por favor, descreva brevemente o conteúdo aplicado na aula.');
      return;
    }

    const presencas = aulaMinistrada
      ? classStudents.map(s => ({
          alunoId: s.id,
          presente: presenceMap[s.id] === undefined ? true : presenceMap[s.id]
        }))
      : classStudents.map(s => ({
          alunoId: s.id,
          presente: false
        }));

    onSaveFrequencia({
      turmaId: selectedTurmaId,
      data: selectedDate,
      presencas,
      aulaMinistrada,
      motivoNaoMinistrada: !aulaMinistrada ? motivoNaoMinistrada.trim() : undefined,
      conteudoAplicado: aulaMinistrada ? conteudoAplicado.trim() : undefined
    });

    setSuccessInfo('Chamada gravada e salva com sucesso!');
    setTimeout(() => {
      setSuccessInfo('');
    }, 3000);
  };

  // Class attendance historical log for the selected class
  const attendanceHistory = useMemo(() => {
    return frequencias
      .filter(f => f.turmaId === selectedTurmaId)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [frequencias, selectedTurmaId]);

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="frequencia-module-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white" id="frequencia-title">
            Controle <span className="text-gray-500">/ Frequência</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Realize a chamada diária e visualize as taxas históricas de faltas de cada turma.</p>
        </div>
        {classStudents.length > 0 && aulaMinistrada && (
          <div className="flex gap-2">
            <button 
              onClick={markAllPresent}
              className="px-3 py-1.5 bg-[#111111] hover:bg-[#1A1A1A] text-gray-300 font-bold text-xs rounded-xl border border-[#222222] transition cursor-pointer"
            >
              Marcar Presença Geral
            </button>
            <button 
              onClick={markAllAbsent}
              className="px-3 py-1.5 bg-[#111111] hover:bg-[#1A1A1A] text-gray-300 font-bold text-xs rounded-xl border border-[#222222] transition cursor-pointer"
            >
              Zerar Presenças
            </button>
          </div>
        )}
      </div>

      {/* Select class and date selectors bar */}
      <div className="bg-[#111111] p-5 rounded-2xl border border-[#222222] grid grid-cols-1 md:grid-cols-2 gap-4" id="select-bar-frequencia">
        
        {/* Class select */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Selecione a Turma *</label>
          <select 
            value={selectedTurmaId}
            onChange={(e) => setSelectedTurmaId(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl cursor-pointer text-white focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
          >
            {turmas.map(t => (
              <option key={t.id} value={t.id}>
                {t.nome} - Prof. {t.professor.split(' ').slice(-1)[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Date picker */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Data da Aula *</label>
          <div className="relative">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
            />
            <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

      </div>

      {/* Class Conduct & Syllabus Form Section */}
      <div className="bg-[#111111] p-5 rounded-2xl border border-[#222222] space-y-4" id="class-conduct-details">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#222222]">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-gray-300">Status & Conteúdo da Aula</h3>
          <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
            Diário de Classe
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Status Select: Taught or Canceled */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">A Aula foi realizada / ministrada? *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAulaMinistrada(true);
                  setValidationError('');
                }}
                className={`text-xs font-bold py-2.5 rounded-xl border text-center transition ${
                  aulaMinistrada 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500 font-bold shadow-md shadow-emerald-500/5'
                    : 'bg-[#1A1A1A] text-gray-400 border-[#222222] hover:bg-[#222222]'
                }`}
              >
                Sim (Ministrada)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAulaMinistrada(false);
                  setValidationError('');
                }}
                className={`text-xs font-bold py-2.5 rounded-xl border text-center transition ${
                  !aulaMinistrada 
                    ? 'bg-rose-500/10 text-rose-450 border-rose-500 font-bold shadow-md shadow-rose-500/5'
                    : 'bg-[#1A1A1A] text-gray-400 border-[#222222] hover:bg-[#222222]'
                }`}
              >
                Não (Não Ministrada)
              </button>
            </div>
          </div>

          {/* Conditional inputs */}
          {aulaMinistrada ? (
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Breve Descrição do Conteúdo Aplicado *</label>
              <textarea 
                rows={2}
                value={conteudoAplicado}
                onChange={(e) => setConteudoAplicado(e.target.value)}
                placeholder="Descreva resumidamente os principais tópicos e atividades que foram ensinados nesta aula..."
                className="w-full text-xs font-medium px-3.5 py-2 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 focus:bg-[#0D0D0D] transition placeholder:text-gray-600 resize-none font-sans"
              />
            </div>
          ) : (
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Motivo do Cancelamento / Suspensão *</label>
              <input 
                type="text"
                value={motivoNaoMinistrada}
                onChange={(e) => setMotivoNaoMinistrada(e.target.value)}
                placeholder="Ex: Feriado Nacional, Licença do Professor, Recursos com Problema, Alagamento..."
                className="w-full text-xs font-medium px-3.5 py-3.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 focus:bg-[#0D0D0D] transition placeholder:text-gray-600 font-sans"
              />
              <p className="text-[9px] text-gray-500 italic font-mono mt-1">
                Nota: O preenchimento do conteúdo curricular foi desconsiderado porque a aula não foi aplicada nesta data.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active students roster callback (2 Cols Wide) */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden" id="presence-roster-box">
          <div className="p-4 border-b border-[#222222] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Folha de Frequência</span>
            </div>
            {existingRecord ? (
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded-full font-mono">
                ✏️ Editando Frequência Gravada
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-mono">
                ✨ Nova Lista de Presença
              </span>
            )}
          </div>

          <div className="divide-y divide-[#222222]">
            {!aulaMinistrada ? (
              <div className="text-center py-16 px-6 bg-[#161616]/30 text-gray-400 space-y-3">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
                  <X className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Aula Não Ministrada nesta data</h4>
                  <p className="text-[10px] text-gray-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Você informou que no dia <strong className="text-white font-mono">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong> o curso não teve aula prática/teórica ministrada.
                  </p>
                  {motivoNaoMinistrada && (
                    <div className="inline-block mt-3 px-3 py-1.5 bg-[#1F1416]/50 border border-rose-500/15 rounded-lg text-rose-350 text-[10px] font-semibold text-left">
                      <span className="font-bold font-mono text-[9px] uppercase tracking-wider block text-rose-400">Motivo Cadastrado:</span>
                      "{motivoNaoMinistrada}"
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-550 max-w-xs mx-auto">
                  A frequência manual está suspensa para evitar distorções estatísticas. Todos os alunos receberão falta técnica justificada de forma automática.
                </p>
              </div>
            ) : (
              classStudents.map(s => {
                const matchesPresent = presenceMap[s.id] !== false; // falls back to true

                return (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-gray-300 flex items-center justify-center text-xs font-bold font-mono border border-[#222222]">
                        {s.nome.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{s.nome}</h4>
                        <p className="text-[10px] text-gray-500 font-mono">Ficha: {s.cpf}</p>
                      </div>
                    </div>

                    {/* Present Absent toggle buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => togglePresence(s.id)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition ${
                          matchesPresent 
                            ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-450 shadow-md'
                            : 'bg-[#1A1A1A] border-[#222222] text-gray-500 hover:bg-[#222222]'
                        }`}
                      >
                        Presente
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePresence(s.id)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition ${
                          !matchesPresent 
                            ? 'bg-rose-500/10 border-rose-500/35 text-rose-450 shadow-md'
                            : 'bg-[#1A1A1A] border-[#222222] text-gray-500 hover:bg-[#222222]'
                        }`}
                      >
                        Ausente
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {aulaMinistrada && classStudents.length === 0 && (
              <div className="text-center py-16 text-gray-550">
                <Users className="w-10 h-10 text-gray-700 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-gray-350">Nenhum Aluno Ativo</p>
                <p className="text-[10px] text-gray-500 max-w-sm mx-auto mt-1">Essa turma não possui estudantes ativos cadastrados no momento. Certifique-se de configurar o status do aluno como Ativo no módulo de Alunos.</p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-[#111111]/90 border-t border-[#222222] flex flex-col sm:flex-row items-center sm:justify-between gap-3">
            <span className="text-[11px] text-gray-400 font-medium">
              {aulaMinistrada 
                ? `Resumo da chamada: ${Object.values(presenceMap).filter(v => v !== false).length} Presentes / ${Object.values(presenceMap).filter(v => v === false).length} Ausentes`
                : "Sem chamada de presença (aula não ministrada)"}
            </span>
            
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto justify-end">
              {validationError && (
                <span className="text-[10px] font-bold text-rose-455 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded">
                  ⚠️ {validationError}
                </span>
              )}
              {successInfo && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded animate-pulse">
                  {successInfo}
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/15 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Diário & Chamada</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attendance logs history for the selected class (1 Col Wide) */}
        <div id="attendance-history-logs" className="lg:col-span-1 space-y-4">
          <div className="bg-[#111111] p-5 rounded-2xl border border-[#222222] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#222222] mb-3 text-gray-300">
                <History className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Histórico de Chamadas</h4>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {attendanceHistory.map(h => {
                  const isDelivered = h.aulaMinistrada !== false;
                  const total = h.presencas?.length || 0;
                  const presents = h.presencas ? h.presencas.filter(p => p.presente).length : 0;
                  const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

                  return (
                    <div 
                      key={h.id} 
                      onClick={() => setSelectedDate(h.data)}
                      className="p-3 bg-[#1A1A1A] hover:bg-[#222222] border border-[#222222]/80 rounded-xl cursor-pointer transition flex flex-col gap-1.5"
                      title={isDelivered ? `Carregar chamada para edição. Conteúdo: ${h.conteudoAplicado || 'Não especificado'}` : `Aula não aplicada. Motivo: ${h.motivoNaoMinistrada}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <p className="text-xs font-bold text-white font-mono">
                            {new Date(h.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <div className="text-right">
                          {isDelivered ? (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              rate >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              rate >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-rose-500/10 text-rose-450 border-rose-500/20'
                            }`}>
                              {rate}% Presença
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400 border-rose-500/20 text-right">
                              Sem Aula
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description / metadata details */}
                      <div className="text-[10px] text-gray-500 font-sans pl-5.5 space-y-0.5">
                        {isDelivered ? (
                          <>
                            <p className="capitalize truncate text-[#A3A3A3]">
                              {presents} presentes / {total - presents} ausentes
                            </p>
                            {h.conteudoAplicado && (
                              <p className="text-indigo-400 text-[9px] truncate font-medium">
                                📚 {h.conteudoAplicado}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-rose-400 font-medium truncate">
                              🚫 Cancelada: {h.motivoNaoMinistrada}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {attendanceHistory.length === 0 && (
                  <div className="text-center py-12 text-gray-550 text-[10px]">
                    <History className="w-8 h-8 text-gray-700 mx-auto mb-2 opacity-50" />
                    <span>Nenhuma chamada gravada para esta turma ainda.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guidelines box */}
          <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/15 text-[10px] text-gray-400 leading-relaxed">
            <h5 className="font-bold text-gray-300 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-450" />
              Regras e Diretrizes Importantes
            </h5>
            <p>O ideal é que a chamada seja atualizada diariamente. A taxa média de presença recomendada pela escola é de no mínimo <strong>75%</strong> para a aprovação com certificação.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
