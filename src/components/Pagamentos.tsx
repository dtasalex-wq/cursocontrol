/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Aluno, Pagamento, Turma } from '../types';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X, 
  Plus, 
  BadgeCheck,
  CreditCard,
  Building
} from 'lucide-react';

interface PagamentosProps {
  pagamentos: Pagamento[];
  alunos: Aluno[];
  turmas: Turma[];
  onAddPagamento: (pagamento: Omit<Pagamento, 'id'>) => void;
  onBaixarPagamento: (id: string, formaPagamento: 'Pix' | 'Cartão' | 'Dinheiro', dataPagamento: string) => void;
}

export default function Pagamentos({ 
  pagamentos, 
  alunos, 
  turmas,
  onAddPagamento, 
  onBaixarPagamento 
}: PagamentosProps) {

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [mesFilter, setMesFilter] = useState('Todos');
  const [trackerSearch, setTrackerSearch] = useState('');

  // Detailed student detail view modal
  const [selectedDetailAluno, setSelectedDetailAluno] = useState<Aluno | null>(null);

  // Helper function to calculate student course months
  const getStudentMonths = (s: Aluno) => {
    const enrollParts = s.dataMatricula.split('-');
    const enrollYear = parseInt(enrollParts[0], 10) || 2026;
    const enrollMonth = parseInt(enrollParts[1], 10) || 1;

    const sTurma = turmas.find(t => t.id === s.turmaId);
    const filteredMonths = sTurma?.mesesMinistrados || [];

    const ptMonths = [
      { key: 'Janeiro', label: 'JAN', mIndex: 0 },
      { key: 'Fevereiro', label: 'FEV', mIndex: 1 },
      { key: 'Março', label: 'MAR', mIndex: 2 },
      { key: 'Abril', label: 'ABR', mIndex: 3 },
      { key: 'Maio', label: 'MAI', mIndex: 4 },
      { key: 'Junho', label: 'JUN', mIndex: 5 },
      { key: 'Julho', label: 'JUL', mIndex: 6 },
      { key: 'Agosto', label: 'AGO', mIndex: 7 },
      { key: 'Setembro', label: 'SET', mIndex: 8 },
      { key: 'Outubro', label: 'OUT', mIndex: 9 },
      { key: 'Novembro', label: 'NOV', mIndex: 10 },
      { key: 'Dezembro', label: 'DEZ', mIndex: 11 }
    ];

    const studentMonths: { key: string; label: string; mIndex: number; year: number; isMatricula?: boolean }[] = [];

    // ALWAYS include Matrícula as the first item!
    studentMonths.push({
      key: 'Matrícula',
      label: 'MAT',
      mIndex: -1,
      year: enrollYear,
      isMatricula: true
    });

    // Generate the course months
    if (filteredMonths.length > 0) {
      // Loop up to 12 months starting from enrollment month to capture chosen course months in order
      for (let i = 0; i < 12; i++) {
        const currentMonth0Index = (enrollMonth - 1 + i) % 12;
        const yearOffset = Math.floor((enrollMonth - 1 + i) / 12);
        const targetYear = enrollYear + yearOffset;
        const info = ptMonths[currentMonth0Index];
        
        if (filteredMonths.includes(info.key)) {
          studentMonths.push({
            key: `${info.key}/${targetYear}`,
            label: info.label,
            mIndex: currentMonth0Index,
            year: targetYear
          });
        }
      }
    } else {
      // Fallback if course has no mesesMinistrados set
      const duracao = sTurma?.duracaoMeses || 6;
      for (let i = 0; i < duracao; i++) {
        const currentMonth0Index = (enrollMonth - 1 + i) % 12;
        const yearOffset = Math.floor((enrollMonth - 1 + i) / 12);
        const targetYear = enrollYear + yearOffset;
        
        const info = ptMonths[currentMonth0Index];
        studentMonths.push({
          key: `${info.key}/${targetYear}`,
          label: info.label,
          mIndex: currentMonth0Index,
          year: targetYear
        });
      }
    }
    return studentMonths;
  };

  // Form toggles
  const [isNewPayOpen, setIsNewPayOpen] = useState(false);
  const [isBaixarOpen, setIsBaixarOpen] = useState(false);
  
  // Selected payment to receive (baixar)
  const [selectedPayId, setSelectedPayId] = useState<string | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<'Pix' | 'Cartão' | 'Dinheiro'>('Pix');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);

  // New billing form states
  const [alunoId, setAlunoId] = useState('');
  const [mesReferencia, setMesReferencia] = useState('Junho/2026');
  const [valor, setValor] = useState(300);
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  // Pre-calculate students map
  const alunosMap = useMemo(() => {
    const map: Record<string, Aluno> = {};
    alunos.forEach(a => {
      map[a.id] = a;
    });
    return map;
  }, [alunos]);

  // Unique month filters from payments list
  const mesesDisponiveis = useMemo(() => {
    const set = new Set(pagamentos.map(p => p.mesReferencia));
    return Array.from(set);
  }, [pagamentos]);

  // Filtered payments list
  const filteredPagamentos = useMemo(() => {
    return pagamentos.filter(p => {
      const student = alunosMap[p.alunoId];
      const matchesSearch = student 
        ? student.nome.toLowerCase().includes(searchTerm.toLowerCase()) || student.cpf.includes(searchTerm)
        : false;

      const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
      const matchesMes = mesFilter === 'Todos' || p.mesReferencia === mesFilter;

      return matchesSearch && matchesStatus && matchesMes;
    });
  }, [pagamentos, searchTerm, statusFilter, mesFilter, alunosMap]);

  // Calculated overall values
  const financialTotals = useMemo(() => {
    let pago = 0;
    let pendente = 0;
    let atrasado = 0;

    pagamentos.forEach(p => {
      if (p.status === 'Pago') pago += p.valor;
      else if (p.status === 'Pendente') pendente += p.valor;
      else if (p.status === 'Atrasado') atrasado += p.valor;
    });

    return { pago, pendente, atrasado };
  }, [pagamentos]);

  // Handle Baixar/Receive flow
  const handleOpenBaixar = (id: string, valorPadrao: number) => {
    setSelectedPayId(id);
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setFormaPagamento('Pix');
    setIsBaixarOpen(true);
  };

  const handleBaixarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayId) return;

    onBaixarPagamento(selectedPayId, formaPagamento, dataPagamento);
    setIsBaixarOpen(false);
    setSelectedPayId(null);
  };

  // Create new tuition bill
  const handleCreateBilling = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!alunoId || !mesReferencia || !valor || !dataVencimento) {
      setFormError('Preencha os dados do aluno e cobrança.');
      return;
    }

    // Determine status based on vencimento vs today
    const today = new Date().toISOString().split('T')[0];
    let initialStatus: 'Pendente' | 'Atrasado' = 'Pendente';
    if (dataVencimento < today) {
      initialStatus = 'Atrasado';
    }

    onAddPagamento({
      alunoId,
      mesReferencia,
      valor: Number(valor),
      dataVencimento,
      status: initialStatus
    });

    setIsNewPayOpen(false);
    setAlunoId('');
    setFormError('');
  };

  // Sync tuition cost when student changed in dropdown
  const handleStudentSelectChange = (id: string) => {
    setAlunoId(id);
    const selectedStd = alunos.find(a => a.id === id);
    if (selectedStd) {
      // Find class details to get mensualidade
      const selectedTurma = turmas.find(t => t.id === selectedStd.turmaId);
      setValor(selectedTurma ? selectedTurma.valorMensalidade : 300);

      // Prepopulate vencimento day with the student's preferred payment day
      const paymentDay = selectedStd.diaPagamento || 10;
      const todayStr = new Date().toISOString().split('T')[0];
      const parts = todayStr.split('-'); // [YYYY, MM, DD]
      parts[2] = String(paymentDay).padStart(2, '0');
      setDataVencimento(parts.join('-'));
    }
  };

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="pagamentos-module-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white" id="pagamentos-title">
            Gestão <span className="text-gray-500">/ Mensalidades</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Controle a emissão de boletos/mensalidades, baixas financeiras e devedores atrasados.</p>
        </div>
        <button 
          onClick={() => {
            setFormError('');
            setIsNewPayOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 transition duration-150 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Cobrança Individual</span>
        </button>
      </div>

      {/* Metrics board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="pagamentos-metrics-board">
        <div className="bg-[#111111] p-4 rounded-xl border border-[#222222] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Arrecadado no Mês</span>
            <p className="text-xl font-bold text-emerald-500 mt-1">R$ {financialTotals.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500 opacity-60 shrink-0" />
        </div>
        
        <div className="bg-[#111111] p-4 rounded-xl border border-[#222222] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Esperado à Receber</span>
            <p className="text-xl font-bold text-white mt-1">R$ {financialTotals.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <Clock className="w-8 h-8 text-gray-500 opacity-60 shrink-0" />
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-[#222222] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono">Prejuízo / Em Atraso</span>
            <p className="text-xl font-bold text-rose-400 mt-1">R$ {financialTotals.atrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-500 opacity-60 shrink-0" />
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-[#111111] p-4 rounded-2xl border border-[#222222]/80 grid grid-cols-1 md:grid-cols-4 gap-3 items-center" id="pagamentos-filter-toolbar">
        
        {/* Search student name */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por nome do aluno ou CPF..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl focus:bg-[#0D0D0D] focus:border-indigo-500 transition text-white"
          />
        </div>

        {/* Filter reference month */}
        <div className="relative">
          <select 
            value={mesFilter}
            onChange={(e) => setMesFilter(e.target.value)}
            className="w-full text-xs font-semibold pl-4 pr-8 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl appearance-none cursor-pointer focus:bg-[#0D0D0D] text-white"
          >
            <option value="Todos">Mês de Ref: Todos</option>
            {mesesDisponiveis.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <Filter className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter payment status */}
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs font-semibold pl-4 pr-8 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl appearance-none cursor-pointer focus:bg-[#0D0D0D] text-white"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Pago">Compensado (Pago)</option>
            <option value="Pendente">Em aberto (Pendente)</option>
            <option value="Atrasado">Vencido (Atrasado)</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Main Table + Receiving Form Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="pagamentos-workspace">
        
        {/* Table list of monthly bills - dynamically spans full width if no forms are open */}
        <div className={`${(isNewPayOpen || isBaixarOpen) ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden`} id="pagamentos-list-box">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] border-b border-[#222222] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Aluno / CPF</th>
                  <th className="px-5 py-3">Vencimento</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-xs">
                {filteredPagamentos.map(p => {
                  const student = alunosMap[p.alunoId];
                  
                  return (
                    <tr key={p.id} className="hover:bg-[#1A1A1A] transition">
                      
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailAluno(student || null)}
                          className="font-bold text-indigo-400 hover:text-indigo-300 text-left hover:underline transition focus:outline-none block"
                        >
                          {student?.nome || 'Aluno Removido'}
                        </button>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          CPF: {student?.cpf || '-'}
                          {student?.diaPagamento && (
                            <span className="text-indigo-400 font-bold ml-2 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded font-sans text-[9px]">
                              Dia {student.diaPagamento}
                            </span>
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-gray-400">
                        {new Date(p.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${
                          p.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          p.status === 'Pendente' ? 'bg-gray-500/10 text-gray-400 border border-gray-550/20' :
                          'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                        }`}>
                          {p.status}
                          {p.formaPagamento && <span className="font-normal font-sans ml-1">({p.formaPagamento})</span>}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {p.status !== 'Pago' ? (
                          <button
                            onClick={() => handleOpenBaixar(p.id, p.valor)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-sm shadow-emerald-500/15 transition shrink-0"
                          >
                            Dar Baixa
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-1 px-1">
                            <BadgeCheck className="w-4 h-4 text-emerald-400" />
                            <span>Quitado</span>
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}

                {filteredPagamentos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500">
                      Nenhuma mensalidade encontrada para os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Column Workspace (Form to issue of new custom receipt list / Form to check item off) */}
        {(isNewPayOpen || isBaixarOpen) && (
          <div className="lg:col-span-1" id="pagamentos-control-pane">
            {isNewPayOpen && (
              <div className="bg-[#111111] p-5 rounded-2xl border border-[#222222] shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5 font-mono">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    Emitir Cobrança
                  </span>
                  <button 
                    onClick={() => setIsNewPayOpen(false)}
                    className="p-1 hover:bg-[#1A1A1A] rounded-full text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateBilling} className="space-y-4">
                  
                  {/* Aluno Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Escolha o Estudante *</label>
                    <select 
                      value={alunoId}
                      onChange={(e) => handleStudentSelectChange(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl cursor-pointer text-white focus:border-indigo-500 transition"
                    >
                      <option value="">Selecione o Aluno</option>
                      {alunos.map(a => (
                        <option key={a.id} value={a.id}>{a.nome} (CPF: {a.cpf})</option>
                      ))}
                    </select>
                  </div>

                  {/* Mes Referencia */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Mês de Referência *</label>
                    {(() => {
                      const chosenAluno = alunos.find(a => a.id === alunoId);
                      if (chosenAluno) {
                        const months = getStudentMonths(chosenAluno);
                        return (
                          <select 
                            value={mesReferencia}
                            onChange={(e) => {
                              const selectedKey = e.target.value;
                              setMesReferencia(selectedKey);
                              const clickedMonthObj = months.find(m => m.key === selectedKey);
                              if (clickedMonthObj) {
                                const sTurma = turmas.find(t => t.id === chosenAluno.turmaId);
                                const cost = clickedMonthObj.isMatricula 
                                  ? (sTurma?.valorMatricula ?? 150)
                                  : (sTurma ? sTurma.valorMensalidade : 300);
                                setValor(cost);
                                
                                const paymentDay = chosenAluno.diaPagamento || 10;
                                if (clickedMonthObj.isMatricula) {
                                  setDataVencimento(chosenAluno.dataMatricula || new Date().toISOString().split('T')[0]);
                                } else {
                                  const monthStr = String(clickedMonthObj.mIndex + 1).padStart(2, '0');
                                  setDataVencimento(`${clickedMonthObj.year}-${monthStr}-${String(paymentDay).padStart(2, '0')}`);
                                }
                              }
                            }}
                            required
                            className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl cursor-pointer text-white focus:border-indigo-500 transition"
                          >
                            <option value="">Selecione o Mês / Referência</option>
                            {months.map(m => (
                              <option key={m.key} value={m.key}>
                                {m.isMatricula ? 'Matrícula' : m.key}
                              </option>
                            ))}
                          </select>
                        );
                      }
                      return (
                        <select 
                          disabled
                          required
                          className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-gray-500 cursor-not-allowed transition"
                        >
                          <option value="">Selecione o aluno primeiro</option>
                        </select>
                      );
                    })()}
                  </div>

                  {/* Valor Cobrança */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Valor de Cobrança (R$) *</label>
                    <input 
                      type="number" 
                      value={valor}
                      onChange={(e) => setValor(Number(e.target.value))}
                      required
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Data Vencimento */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Data de Vencimento *</label>
                    <input 
                      type="date" 
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition"
                    />
                  </div>

                  {formError && (
                    <div className="text-[10px] text-red-400 bg-red-400/10 p-2 border border-red-500/20 rounded-lg font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 text-xs font-bold py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/15 transition"
                    >
                      Gerar Parcela
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewPayOpen(false)}
                      className="text-xs font-bold px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#222222] text-gray-300 rounded-xl transition border border-[#222222]"
                    >
                      Cancelar
                    </button>
                  </div>

                </form>
              </div>
            )}

            {isBaixarOpen && selectedPayId && (
              <div className="bg-[#111111] p-5 rounded-2xl border border-[#222222] shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5 font-mono">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Concluir/Dar Baixa
                  </span>
                  <button 
                    onClick={() => {
                      setIsBaixarOpen(false);
                      setSelectedPayId(null);
                    }}
                    className="p-1 hover:bg-[#1A1A1A] rounded-full text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-[#1A1A1A] p-3.5 rounded-xl border border-[#222222] space-y-2">
                  <h5 className="text-xs font-bold text-gray-300">Resumo da Amortização</h5>
                  <div className="text-[11px] leading-relaxed text-gray-400 space-y-1">
                    <p>Aluno: <strong className="text-white">{alunosMap[pagamentos.find(p => p.id === selectedPayId)!.alunoId]?.nome}</strong></p>
                    <p>Referência: <strong className="text-white">{pagamentos.find(p => p.id === selectedPayId)?.mesReferencia}</strong></p>
                    <p>Valor Cobrado: <strong className="text-emerald-400 border-b border-dashed border-[#222222] font-mono">R$ {pagamentos.find(p => p.id === selectedPayId)?.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                  </div>
                </div>

                <form onSubmit={handleBaixarSubmit} className="space-y-4">
                  
                  {/* Payment form type (Pix, Card, cash) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Método de Amortização *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Pix', 'Cartão', 'Dinheiro'] as any).map(method => (
                        <button
                          type="button"
                          key={method}
                          onClick={() => setFormaPagamento(method)}
                          className={`text-xs font-bold py-2 border text-center rounded-xl transition ${
                            formaPagamento === method
                              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400 shadow-md'
                              : 'bg-[#1A1A1A] border-[#222222] text-gray-500 hover:bg-[#222222]'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Receipt date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Data do Processamento *</label>
                    <input 
                      type="date" 
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 text-xs font-bold py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/15 transition"
                    >
                      Confirmar Quitação
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBaixarOpen(false);
                        setSelectedPayId(null);
                      }}
                      className="text-xs font-bold px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#222222] text-gray-300 rounded-xl transition border border-[#222222]"
                    >
                      Desfazer
                    </button>
                  </div>

                </form>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Student Details modal (deep-drive historical info, start date, active months and grade) */}
      {selectedDetailAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" id="student-financial-modal">
            
            {/* Header */}
            <div className="p-6 border-b border-[#222222] flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>{selectedDetailAluno.nome}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    selectedDetailAluno.status === 'Ativo' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                    selectedDetailAluno.status === 'Aguardando' ? 'bg-amber-500/15 text-yellow-500 border border-amber-500/30' :
                    'bg-zinc-500/15 text-zinc-400 border border-[#222222]'
                  }`}>
                    {selectedDetailAluno.status}
                  </span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-6 mt-3 text-xs text-gray-400">
                  <p>CPF: <span className="text-gray-300 font-mono font-semibold">{selectedDetailAluno.cpf}</span></p>
                  
                  {/* Data de início do curso */}
                  <p>Início do Curso: <span className="text-indigo-400 font-bold">
                    {(() => {
                      const parts = selectedDetailAluno.dataMatricula.split('-');
                      if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      }
                      return selectedDetailAluno.dataMatricula;
                    })()}
                  </span></p>
                  
                  <p>Curso/Turma: <span className="text-gray-300">
                    {turmas.find(t => t.id === selectedDetailAluno.turmaId)?.nome || 'Sem Turma'}
                  </span></p>
                  
                  <p>Duração: <span className="text-gray-300 font-semibold">
                    {turmas.find(t => t.id === selectedDetailAluno.turmaId)?.duracaoMeses || 6} meses
                  </span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDetailAluno(null)}
                className="p-1.5 hover:bg-[#1A1A1A] rounded-full text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              
              {/* Part 1: Grade de Mensalidades */}
              <div className="bg-[#151515] p-5 rounded-xl border border-[#222222] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                    Grade de Acompanhamento de Mensalidades (Curso do Aluno)
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold">
                    Duração Total: {turmas.find(t => t.id === selectedDetailAluno.turmaId)?.duracaoMeses || 6} meses
                  </span>
                </div>
                
                {/* Legenda */}
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Legenda: <span className="text-emerald-400 font-bold">Verde</span> (Paga/MAT Ativa), <span className="text-yellow-400 font-bold">Amarelo</span> (A Vencer), <span className="text-rose-400 font-bold">Vermelho</span> (Vencida).
                </p>

                {/* Grid boxes */}
                <div className="flex flex-wrap gap-2 pt-1">
                  
                  {/* Dynamic course months */}
                  {(() => {
                    const studentMonths = getStudentMonths(selectedDetailAluno);
                    const sTurma = turmas.find(t => t.id === selectedDetailAluno.turmaId);
                    
                    return studentMonths.map(m => {
                      const p = pagamentos.find(pay => pay.alunoId === selectedDetailAluno.id && pay.mesReferencia === m.key);
                      
                      let customStyle = '';
                      let tooltipStr = '';

                      if (p) {
                        if (p.status === 'Pago') {
                          customStyle = 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 font-bold hover:bg-emerald-500/25';
                          tooltipStr = `${m.key}: Pago via ${p.formaPagamento || 'Pix'} em ${p.dataPagamento ? new Date(p.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}`;
                        } else if (p.status === 'Atrasado') {
                          customStyle = 'bg-rose-500/15 border-rose-500/35 text-rose-400 font-bold hover:bg-rose-500/25';
                          tooltipStr = `${m.key}: VENCIDO (Vencimento ${new Date(p.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')})`;
                        } else {
                          // Pendente
                          const isPastDue = p.dataVencimento < new Date().toISOString().split('T')[0];
                          if (isPastDue) {
                            customStyle = 'bg-rose-500/15 border-rose-500/35 text-rose-400 font-bold hover:bg-rose-500/25';
                            tooltipStr = `${m.key}: VENCIDO (Vencimento ${new Date(p.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')})`;
                          } else {
                            customStyle = 'bg-amber-500/15 border-amber-500/35 text-yellow-500 font-bold hover:bg-amber-500/25';
                            tooltipStr = `${m.key}: A Vencer em ${new Date(p.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}`;
                          }
                        }
                      } else {
                        const todayObj = new Date();
                        const currentYear = todayObj.getFullYear();
                        const currentMonth = todayObj.getMonth();
                        
                        if (m.isMatricula) {
                          customStyle = 'bg-amber-500/10 border-amber-500/20 text-yellow-600/85 hover:bg-amber-500/20';
                          tooltipStr = `Matrícula: Não cobrada ainda (Clique para lançar)`;
                        } else {
                          const todayAbsolute = currentYear * 12 + currentMonth;
                          const targetAbsolute = m.year * 12 + m.mIndex;

                          if (targetAbsolute >= todayAbsolute) {
                            customStyle = 'bg-amber-500/10 border-amber-500/20 text-yellow-600/85 hover:bg-amber-500/20';
                            tooltipStr = `${m.key}: A vencer (Clique para lançar)`;
                          } else {
                            customStyle = 'bg-rose-500/5 border-rose-950/20 text-rose-400/60 hover:bg-rose-500/10';
                            tooltipStr = `${m.key}: Sem faturamento (Clique para gerar cobrança retroativa)`;
                          }
                        }
                      }

                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            if (p && p.status !== 'Pago') {
                              setSelectedDetailAluno(null); // Close modal to focus on write-off
                              handleOpenBaixar(p.id, p.valor);
                            } else if (!p) {
                              setAlunoId(selectedDetailAluno.id);
                              setMesReferencia(m.key);
                              const cost = m.isMatricula 
                                ? (sTurma?.valorMatricula ?? 150)
                                : (sTurma ? sTurma.valorMensalidade : 300);
                              setValor(cost);
                              const paymentDay = selectedDetailAluno.diaPagamento || 10;
                              if (m.isMatricula) {
                                setDataVencimento(selectedDetailAluno.dataMatricula || new Date().toISOString().split('T')[0]);
                              } else {
                                const monthStr = String(m.mIndex + 1).padStart(2, '0');
                                setDataVencimento(`${m.year}-${monthStr}-${String(paymentDay).padStart(2, '0')}`);
                              }
                              setFormError('');
                              setSelectedDetailAluno(null); // Close modal to focus on creation
                              setIsNewPayOpen(true);
                            }
                          }}
                          className={`min-w-[48px] h-[36px] px-1.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center border transition hover:scale-[1.05] cursor-pointer active:scale-95 ${customStyle}`}
                          title={tooltipStr}
                        >
                          <span>{m.label}</span>
                          <span className="text-[6px] opacity-60 font-mono">{m.isMatricula ? 'Início' : m.year}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Part 2: Tabela de Histórico de Cobranças */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                    Histórico Detalhado (Referência, Vencimento, Valor, Status e Ação)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Cobrar Matrícula Shortcut Button */}
                    {(() => {
                      const hasMatricula = pagamentos.some(pay => pay.alunoId === selectedDetailAluno.id && pay.mesReferencia === 'Matrícula');
                      const sTurma = turmas.find(t => t.id === selectedDetailAluno.turmaId);
                      const matriculaCost = sTurma?.valorMatricula ?? 150;
                      
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setAlunoId(selectedDetailAluno.id);
                            setMesReferencia('Matrícula');
                            setValor(matriculaCost);
                            setDataVencimento(selectedDetailAluno.dataMatricula || new Date().toISOString().split('T')[0]);
                            setFormError('');
                            setSelectedDetailAluno(null); // Close modal
                            setIsNewPayOpen(true); // Open draft box
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition ${
                            hasMatricula 
                              ? 'bg-[#1C1C1C] border border-[#222222] opacity-50 hover:opacity-100' 
                              : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/15'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Cobrar Matrícula (R$ {matriculaCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                        </button>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => {
                        setAlunoId(selectedDetailAluno.id);
                        // Find first valid course month as default
                        const studentMonths = getStudentMonths(selectedDetailAluno);
                        const firstMonthObj = studentMonths.find(m => !m.isMatricula);
                        setMesReferencia(firstMonthObj ? firstMonthObj.key : 'Janeiro/2026');
                        const sTurma = turmas.find(t => t.id === selectedDetailAluno.turmaId);
                        setValor(sTurma ? sTurma.valorMensalidade : 300);
                        const paymentDay = selectedDetailAluno.diaPagamento || 10;
                        if (firstMonthObj) {
                          const monthStr = String(firstMonthObj.mIndex + 1).padStart(2, '0');
                          setDataVencimento(`${firstMonthObj.year}-${monthStr}-${String(paymentDay).padStart(2, '0')}`);
                        } else {
                          setDataVencimento(`2026-01-${String(paymentDay).padStart(2, '0')}`);
                        }
                        setFormError('');
                        setSelectedDetailAluno(null); // Close modal to open draft box
                        setIsNewPayOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Lançar Nova Cobrança Individual</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#151515] border border-[#222222] rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1A1A1A] border-b border-[#222222] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-5 py-3">Referência</th>
                        <th className="px-5 py-3">Vencimento</th>
                        <th className="px-5 py-3">Valor</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222] text-xs">
                      {pagamentos
                        .filter(p => p.alunoId === selectedDetailAluno.id)
                        .map(p => {
                          return (
                            <tr key={p.id} className="hover:bg-[#1C1C1C] transition">
                              <td className="px-5 py-3 font-medium text-gray-300">
                                {p.mesReferencia}
                              </td>
                              <td className="px-5 py-3 font-mono text-gray-400">
                                {new Date(p.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-5 py-3 font-bold text-white">
                                R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${
                                  p.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  p.status === 'Pendente' ? 'bg-gray-500/10 text-gray-400 border border-gray-550/20' :
                                  'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                                }`}>
                                  {p.status}
                                  {p.formaPagamento && <span className="font-normal font-sans ml-1 text-[8px] opacity-80">({p.formaPagamento})</span>}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                {p.status !== 'Pago' ? (
                                  <button
                                    onClick={() => {
                                      setSelectedDetailAluno(null); // Close modal to focus on quitação
                                      handleOpenBaixar(p.id, p.valor);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-sm transition"
                                  >
                                    Dar Baixa
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-1 px-1">
                                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                                    <span>Quitado</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                      {pagamentos.filter(p => p.alunoId === selectedDetailAluno.id).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                            Nenhuma cobrança emitida para este aluno até o momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-gray-400">
                  * Você pode dar baixa nas parcelas diretamente na tabela acima ou clicando nas respectivas caixas de meses correspondentes na grade.
                </p>

              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-[#141414] border-t border-[#222222] flex justify-end">
              <button
                onClick={() => setSelectedDetailAluno(null)}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#222222] text-xs font-bold text-gray-300 rounded-xl transition"
              >
                Fechar Painel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
