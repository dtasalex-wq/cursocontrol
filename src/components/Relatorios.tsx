/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Aluno, Turma, Frequencia, Pagamento, Transacao, Espera } from '../types';
import { 
  FileText, 
  Printer, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Layers, 
  Users, 
  Calendar,
  Building,
  Activity,
  Search,
  Eye,
  X
} from 'lucide-react';

interface RelatoriosProps {
  alunos: Aluno[];
  turmas: Turma[];
  frequencias: Frequencia[];
  pagamentos: Pagamento[];
  transacoes: Transacao[];
  espera: Espera[];
  timbre?: string;
  contratoModelo?: string;
}

export default function Relatorios({ 
  alunos, 
  turmas, 
  frequencias, 
  pagamentos, 
  transacoes,
  espera,
  timbre,
  contratoModelo
}: RelatoriosProps) {

  // Selected report category
  const [activeReport, setActiveReport] = useState<'financeiro' | 'frequencia' | 'turmas' | 'alunos_turma' | ''>('');

  // Selected class for class report
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('');

  // View filter for student list: enrolled, waitlist, or both
  const [filtroLista, setFiltroLista] = useState<'alunos' | 'espera' | 'ambos'>('ambos');

  // Math mappings
  const alunosMap = useMemo(() => {
    const map: Record<string, Aluno> = {};
    alunos.forEach(a => { map[a.id] = a; });
    return map;
  }, [alunos]);

  const turmasMap = useMemo(() => {
    const map: Record<string, Turma> = {};
    turmas.forEach(t => { map[t.id] = t; });
    return map;
  }, [turmas]);

  // ==========================================
  // CALCULATIONS: FINANCIAL REPORT
  // ==========================================
  const financeReportData = useMemo(() => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    const despesasPorCategoria: Record<string, number> = {};
    const receitasPorMetodo: Record<string, number> = { Pix: 0, Cartão: 0, Dinheiro: 0 };

    transacoes.forEach(t => {
      if (t.status === 'Pago') {
        if (t.tipo === 'Receita') {
          totalReceitas += t.valor;
        } else {
          totalDespesas += t.valor;
          despesasPorCategoria[t.categoria] = (despesasPorCategoria[t.categoria] || 0) + t.valor;
        }
      }
    });

    // Extract payment forms used by students
    pagamentos
      .filter(p => p.status === 'Pago' && p.formaPagamento)
      .forEach(p => {
        const metodo = p.formaPagamento || 'Pix';
        receitasPorMetodo[metodo] = (receitasPorMetodo[metodo] || 0) + p.valor;
      });

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido: totalReceitas - totalDespesas,
      despesasPorCategoria,
      receitasPorMetodo
    };
  }, [transacoes, pagamentos]);

  // ==========================================
  // CALCULATIONS: ATTENDANCE & EVASION RISK
  // ==========================================
  const attendanceReportData = useMemo(() => {
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

    const activeAlunos = alunos.filter(a => a.status === 'Ativo');
    const evasionRiskList: { id: string; nome: string; cpf: string; telefone: string; taxa: number; turmaNome: string }[] = [];
    const regularList: { id: string; nome: string; taxa: number; turmaNome: string }[] = [];

    activeAlunos.forEach(a => {
      const stats = studentStats[a.id];
      const taxa = stats && stats.total > 0 ? Math.round((stats.presencas / stats.total) * 100) : 100;
      const turma = turmasMap[a.turmaId];

      const recordItem = {
        id: a.id,
        nome: a.nome,
        taxa,
        turmaNome: turma?.nome || 'Sem Turma'
      };

      if (taxa < 75) {
        evasionRiskList.push({
          ...recordItem,
          cpf: a.cpf,
          telefone: a.telefone
        });
      } else {
        regularList.push(recordItem);
      }
    });

    return {
      evasionRiskList: evasionRiskList.sort((a, b) => a.taxa - b.taxa),
      regularList: regularList.sort((a, b) => b.taxa - a.taxa)
    };
  }, [frequencias, alunos, turmasMap]);

  // ==========================================
  // CALCULATIONS: CLASSES OCCUPANCY
  // ==========================================
  const turmasReportData = useMemo(() => {
    return turmas.map(t => {
      const activeEnrolled = alunos.filter(a => a.turmaId === t.id && a.status === 'Ativo').length;
      const pendingEnrolled = alunos.filter(a => a.turmaId === t.id && a.status === 'Inadimplente').length;
      const vacantSeats = Math.max(t.maxAlunos - (activeEnrolled + pendingEnrolled), 0);
      const occupancyRate = Math.min(Math.round(((activeEnrolled + pendingEnrolled) / t.maxAlunos) * 100), 100);

      return {
        id: t.id,
        nome: t.nome,
        curso: t.curso,
        professor: t.professor,
        mensalidade: t.valorMensalidade,
        capacidade: t.maxAlunos,
        matriculasAtivas: activeEnrolled,
        matriculasAtraso: pendingEnrolled,
        vagasRestantes: vacantSeats,
        taxaOcupacao: occupancyRate
      };
    });
  }, [turmas, alunos]);

  // ==========================================
  // CALCULATIONS: STUDENTS BY CLASS REPORT
  // ==========================================
  const activeTurmaId = selectedTurmaId || (turmas.length > 0 ? turmas[0].id : '');
  const selectedTurma = turmas.find(t => t.id === activeTurmaId);

  const enrolledStudents = useMemo(() => {
    if (!activeTurmaId) return [];
    return alunos.filter(a => a.turmaId === activeTurmaId);
  }, [alunos, activeTurmaId]);

  const waitlistedStudents = useMemo(() => {
    if (!selectedTurma) return [];
    return espera.filter(item => 
      item.status === 'Pendente' && 
      (item.curso.toLowerCase() === selectedTurma.curso.toLowerCase() || 
       item.curso.toLowerCase() === selectedTurma.nome.toLowerCase())
    );
  }, [espera, selectedTurma]);

  // Handler to call window print on the selected report A4 CSS container
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="relatorios-module-container">
      
      {/* Header, hidden on A4 prints */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-[#222222] gap-4 no-print">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white" id="relatorios-title">
            Relatórios <span className="text-gray-500">/ Estatísticas</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Exporte auditorias financeiras, riscos de evasão por faltas e taxas de ocupação.</p>
        </div>
        {activeReport && (
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#111111] border border-[#222222] hover:bg-[#1A1A1A] text-white rounded-xl text-xs font-bold shadow-xs transition duration-150 self-start sm:self-auto cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório (A4)</span>
          </button>
        )}
      </div>


          {/* Tabs Menu, hidden on prints too */}
          <div className="flex bg-[#111111] p-1.5 rounded-2xl border border-[#222222] no-print" id="reports-nav-tabs">
        <button
          onClick={() => setActiveReport('financeiro')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
            activeReport === 'financeiro' 
              ? 'bg-[#1A1A1A] text-white shadow-md border border-[#222222]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Contábil / Financeiro</span>
        </button>
        <button
          onClick={() => setActiveReport('frequencia')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
            activeReport === 'frequencia' 
              ? 'bg-[#1A1A1A] text-white shadow-md border border-[#222222]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Frequência e Alerta de Evasão</span>
        </button>
        <button
          onClick={() => setActiveReport('turmas')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
            activeReport === 'turmas' 
              ? 'bg-[#1A1A1A] text-white shadow-md border border-[#222222]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ocupação das Turmas</span>
        </button>
        <button
          onClick={() => setActiveReport('alunos_turma')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
            activeReport === 'alunos_turma' 
              ? 'bg-[#1A1A1A] text-white shadow-md border border-[#222222]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alunos por Turma</span>
        </button>
      </div>

      {activeReport ? (
        /* Printable Area - framed cleanly with proper margin margins */
        <div className="bg-[#111111] p-6 md:p-8 rounded-2xl border border-[#222222] shadow-xs" id="printable-report-sheet">
        
        {/* Document Header - will repeat or look formal on prints */}
        <div className="flex items-center justify-between border-b-2 border-[#222222] pb-5 mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Escola de Informática e Inovação</h2>
            <p className="text-[10px] text-gray-500 font-mono">CNPJ: 12.345.678/0001-99 | Sistema de Secretaria Escolar</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-300 bg-[#1A1A1A] px-2.5 py-1 rounded border border-[#222222] font-mono">
              GERADO EM UTC | {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* -------------------------------------------------------------
            REPORT: FINANCIAL STATEMENT
            ------------------------------------------------------------- */}
        {activeReport === 'financeiro' && (
          <div className="space-y-6" id="fin-report-body">
            <div className="border-b border-[#222222] pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-indigo-400" />
                D-01 Balance de Caixa e Arrecadações de Matrículas
              </h3>
              <p className="text-xs text-gray-450 mt-1">Visão consolidada das receitas provenientes das parcelas quitadas por estudantes e despesas pagas.</p>
            </div>

            {/* Financial indicators block */}
            <div className="grid grid-cols-3 gap-4 bg-[#1A1A1A] p-4 rounded-xl border border-[#222222]">
              <div className="p-2 bg-[#111111] rounded-lg text-center border border-[#222222]">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Receitas Consolidadas</span>
                <p className="text-base font-black text-emerald-400 mt-1">R$ {financeReportData.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-[#111111] rounded-lg text-center border border-[#222222]">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Despesas Consolidadas</span>
                <p className="text-base font-black text-rose-455 mt-1">R$ {financeReportData.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-[#111111] rounded-lg text-center border border-[#222222]">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Saldo Consolidado</span>
                <p className={`text-base font-black mt-1 ${financeReportData.saldoLiquido >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                  R$ {financeReportData.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              {/* Left Column: Spending Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide border-b border-[#222222] pb-1">Despesas Operacionais por Área</h4>
                <div className="space-y-2">
                  {Object.entries(financeReportData.despesasPorCategoria).map(([cat, val]) => (
                    <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-[#222222]/50 pb-1">
                      <span className="text-gray-400 font-semibold">{cat}</span>
                      <span className="font-bold text-white">R$ {Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  {Object.keys(financeReportData.despesasPorCategoria).length === 0 && (
                    <p className="text-xs text-gray-500 py-4 text-center">Nenhum custo operacional registrado.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Receipt Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide border-b border-[#222222] pb-1">Métodos de Pagamento (Mensalidades Recorrentes)</h4>
                <div className="space-y-2">
                  {Object.entries(financeReportData.receitasPorMetodo).map(([met, val]) => (
                    <div key={met} className="flex items-center justify-between text-xs py-1 border-b border-[#222222]/50 pb-1">
                      <span className="text-gray-400 font-semibold">{met}</span>
                      <span className="font-bold text-white">R$ {Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            REPORT: ATTENDANCE & DROPOUT / EVASION ALERTS
            ------------------------------------------------------------- */}
        {activeReport === 'frequencia' && (
          <div className="space-y-6" id="att-report-body">
            <div className="border-b border-[#222222] pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 col-span-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                D-02 Auditoria de Absenteísmo e Alerta de Evasão Escolar
              </h3>
              <p className="text-xs text-gray-455 mt-1">Estudantes com presença global cumulativa inferior a <strong>75%</strong>, sob risco de reprovação ou trancamento automático.</p>
            </div>

            {/* Critical alarm list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-rose-500/10">
                ⚠️ Alunos Sob Risco Crítico (Frequência Média Baixa)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-rose-950/10 border-b border-[#222222] text-[10px] font-bold text-rose-400 uppercase">
                      <th className="px-4 py-2 text-gray-400 uppercase">Nome do Aluno</th>
                      <th className="px-4 py-2 text-gray-400 uppercase">Turma</th>
                      <th className="px-4 py-2 text-gray-400 uppercase">Contato</th>
                      <th className="px-4 py-2 text-right text-gray-400 uppercase">Taxa Presenças</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] mt-1">
                    {attendanceReportData.evasionRiskList.map(item => (
                      <tr key={item.id} className="hover:bg-rose-500/5 transition">
                        <td className="px-4 py-2.5 font-bold text-white">{item.nome}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-300">{item.turmaNome}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-450">{item.telefone}</td>
                        <td className="px-4 py-2.5 text-right font-black text-rose-400 font-mono">{item.taxa}%</td>
                      </tr>
                    ))}
                    {attendanceReportData.evasionRiskList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Nenhum estudante ativo abaixo de 75% de frequência. Parabéns!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regular student rates */}
            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-emerald-555/10">
                ✅ Estudantes Regulares conforme Recomendação Escolar
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-emerald-950/10 border-b border-[#222222] text-[10px] font-bold text-emerald-450 uppercase">
                      <th className="px-4 py-2 text-gray-400 uppercase">Nome do Aluno</th>
                      <th className="px-4 py-2 text-gray-400 uppercase">Turma</th>
                      <th className="px-4 py-2 text-right text-gray-400 uppercase">Taxa Presenças</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {attendanceReportData.regularList.map(item => (
                      <tr key={item.id} className="hover:bg-emerald-500/5 transition">
                        <td className="px-4 py-2.5 font-bold text-white">{item.nome}</td>
                        <td className="px-4 py-2.5 text-gray-350">{item.turmaNome}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-400 font-mono">{item.taxa}%</td>
                      </tr>
                    ))}
                    {attendanceReportData.regularList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                          Nenhum estudante regular calculado no momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            REPORT: CLASSES OCCUPANCY
            ------------------------------------------------------------- */}
        {activeReport === 'turmas' && (
          <div className="space-y-6" id="classes-report-body">
            <div className="border-b border-[#222222] pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 col-span-2">
                <Layers className="w-4.5 h-4.5 text-gray-300" />
                D-03 Demonstrativo de Ocupação por Turma
              </h3>
              <p className="text-xs text-gray-455 mt-1">Sumário do total de alunos matriculados ativos vs. vagas no laboratório de informática.</p>
            </div>

            <div className="space-y-5">
              {turmasReportData.map(t => (
                <div key={t.id} className="p-4 bg-[#1A1A1A] border border-[#222222] rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">{t.nome}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Docente: {t.professor} | Vínculo: {t.curso}</p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded font-mono">
                        R$ {t.mensalidade}/mês
                      </span>
                    </div>
                  </div>

                  {/* Progress bar and details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    
                    {/* Visual details */}
                    <div className="md:col-span-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-350 font-semibold">
                        <span>Percentual de Ocupação Escolar</span>
                        <span>{t.matriculasAtivas + t.matriculasAtraso} de {t.capacidade} Vagas ({t.taxaOcupacao}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#222222] rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-indigo-600 rounded-l" 
                          style={{ width: `${Math.round((t.matriculasAtivas / t.capacidade) * 100)}%` }}
                          title={`${t.matriculasAtivas} Alunos Ativos`}
                        />
                        <div 
                          className="h-full bg-amber-500" 
                          style={{ width: `${Math.round((t.matriculasAtraso / t.capacidade) * 100)}%` }}
                          title={`${t.matriculasAtraso} Alunos em Atraso`}
                        />
                      </div>
                    </div>

                    {/* Numeric stats list */}
                    <div className="md:col-span-1 bg-[#111111] p-2.5 rounded-lg border border-[#222222] flex flex-col justify-center text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Ativos:</span>
                        <span className="font-bold text-white">{t.matriculasAtivas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Pendência:</span>
                        <span className="font-bold text-amber-400">{t.matriculasAtraso}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#222222]/80 pt-1 mt-1">
                        <span className="text-gray-400">Disponível:</span>
                        <span className="font-bold text-indigo-400 font-mono">{t.vagasRestantes} Vagas</span>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            REPORT: STUDENTS BY CLASS & WAITLIST
            ------------------------------------------------------------- */}
        {activeReport === 'alunos_turma' && (
          <div className="space-y-6" id="alunos-turma-report-body">
            <div className="border-b border-[#222222] pb-4 space-y-4 no-print">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 md:whitespace-nowrap">
                  <Users className="w-4.5 h-4.5 text-indigo-400" />
                  D-04 Relatório Geral de Alunos e Fila de Espera por Turma
                </h3>
                <p className="text-xs text-gray-400 mt-1">Selecione uma turma para listar todos os alunos vinculados e os candidatos em fila de espera.</p>
              </div>

              {/* Class Selector & View Mode & PDF Print */}
              <div className="flex flex-wrap items-center gap-2.5 bg-[#161616]/40 p-3 rounded-xl border border-[#222222] w-fit">
                <select
                  value={activeTurmaId}
                  onChange={(e) => setSelectedTurmaId(e.target.value)}
                  className="text-xs px-4 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="">Selecione uma Turma...</option>
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.curso})</option>
                  ))}
                </select>

                {selectedTurma && (
                  <>
                    <select
                      value={filtroLista}
                      onChange={(e) => setFiltroLista(e.target.value as 'alunos' | 'espera' | 'ambos')}
                      className="text-xs px-4 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="ambos">Exibir Ambos (Matriculados + Fila)</option>
                      <option value="alunos">Apenas Alunos Matriculados</option>
                      <option value="espera">Apenas Fila de Espera</option>
                    </select>

                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-700 rounded-xl text-xs font-bold transition duration-150 cursor-pointer whitespace-nowrap"
                      title="Imprimir ou Salvar como PDF"
                    >
                      <Printer className="w-4 h-4" />
                      <span>PDF / Imprimir</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {selectedTurma ? (
              <div className="space-y-6">
                {/* Turma summary header */}
                <div className="p-4 bg-[#1A1A1A] border border-[#222222] rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Turma</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{selectedTurma.nome}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Curso</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{selectedTurma.curso}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Professor</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{selectedTurma.professor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Horário / Dias</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{selectedTurma.horario} - {selectedTurma.diasSemana.join(', ')}</span>
                  </div>
                </div>

                {/* Enrolled Students list */}
                {(filtroLista === 'alunos' || filtroLista === 'ambos') && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-indigo-500/10">
                    👥 Alunos Matriculados ({enrolledStudents.length})
                  </h4>
                  <div className="overflow-x-auto border border-[#222222] rounded-xl bg-[#111111]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#181818] border-b border-[#222222] text-[10px] font-bold text-gray-400 uppercase font-mono">
                          <th className="px-4 py-2.5">Nome do Aluno</th>
                          <th className="px-4 py-2.5">E-mail</th>
                          <th className="px-4 py-2.5">Telefone</th>
                          <th className="px-4 py-2.5">CPF</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222]">
                        {enrolledStudents.map(a => (
                          <tr key={a.id} className="hover:bg-[#1A1A1A]/40 transition">
                            <td className="px-4 py-3 font-bold text-white">{a.nome}</td>
                            <td className="px-4 py-3 font-mono text-gray-400">{a.email || '-'}</td>
                            <td className="px-4 py-3 font-mono text-gray-400">{a.telefone || '-'}</td>
                            <td className="px-4 py-3 font-mono text-gray-400">{a.cpf || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                                a.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                a.status === 'Inadimplente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                a.status === 'Aguardando' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {enrolledStudents.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                              Nenhum aluno matriculado nesta turma.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* Waiting List (Fila de Espera) */}
                {(filtroLista === 'espera' || filtroLista === 'ambos') && (
                  <div className="space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-amber-500/10">
                    ⏳ Candidatos na Fila de Espera ({waitlistedStudents.length})
                  </h4>
                  <div className="overflow-x-auto border border-[#222222] rounded-xl bg-[#111111]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#181818] border-b border-[#222222] text-[10px] font-bold text-gray-400 uppercase font-mono">
                          <th className="px-4 py-2.5">Nome do Candidato</th>
                          <th className="px-4 py-2.5">Contato</th>
                          <th className="px-4 py-2.5">Turno</th>
                          <th className="px-4 py-2.5">Data de Registro</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222]">
                        {waitlistedStudents.map(item => (
                          <tr key={item.id} className="hover:bg-[#1A1A1A]/40 transition">
                            <td className="px-4 py-3 font-bold text-white">{item.nome}</td>
                            <td className="px-4 py-3 font-mono text-gray-300">{item.contato}</td>
                            <td className="px-4 py-3 font-semibold text-gray-400">{item.turno}</td>
                            <td className="px-4 py-3 font-mono text-gray-400">
                              {item.dataRegistro ? new Date(item.dataRegistro + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {waitlistedStudents.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                              Nenhum candidato aguardando vaga para esta turma.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1A1A1A]/20 border border-[#222222] rounded-xl">
                <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500 italic">Por favor, selecione uma turma acima para carregar o relatório.</p>
              </div>
            )}
          </div>
        )}

          {/* Closing corporate details block */}
          <div className="mt-12 pt-6 border-t border-[#222222] text-center space-y-1 text-[9px] text-gray-550 font-mono leading-relaxed">
            <p>© 2026 Sistema Integrado de Informática Escolar. Todos os dados fiscais e acadêmicos acima são sigilosos.</p>
            <p>Auditoria realizada e assinada digitalmente de forma automática pela secretaria de ensino.</p>
          </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-[#111111] border border-[#222222] rounded-2xl p-8 max-w-lg mx-auto mt-6 no-print">
          <FileText className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Selecione um Relatório</h3>
          <p className="text-xs text-gray-500 mt-2">Clique em um dos botões no topo para visualizar os dados do relatório correspondente.</p>
        </div>
      )}

    </div>
  );
}
