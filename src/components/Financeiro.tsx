/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Transacao } from '../types';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  X, 
  Calendar, 
  Trash2, 
  Search, 
  Filter, 
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface FinanceiroProps {
  transacoes: Transacao[];
  onAddTransacao: (transacao: Omit<Transacao, 'id'>) => void;
  onDeleteTransacao: (id: string) => void;
}

const DESPESA_CATEGORIES = ['Salários', 'Infraestrutura', 'Serviços', 'Software', 'Marketing', 'Material de Escritório', 'Impostos', 'Outros'];

export default function Financeiro({ 
  transacoes, 
  onAddTransacao, 
  onDeleteTransacao 
}: FinanceiroProps) {

  // Filter conditions
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Form Drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tipo, setTipo] = useState<'Receita' | 'Despesa'>('Despesa');
  const [categoria, setCategoria] = useState('Serviços');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState(100);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Pago' | 'Pendente'>('Pago');

  const [formError, setFormError] = useState('');

  // Totals calculations
  const totals = useMemo(() => {
    let receitaConfirmada = 0;
    let receitaPendente = 0;
    let despesaPaga = 0;
    let despesaPendente = 0;

    transacoes.forEach(t => {
      if (t.tipo === 'Receita') {
        if (t.status === 'Pago') receitaConfirmada += t.valor;
        else receitaPendente += t.valor;
      } else {
        if (t.status === 'Pago') despesaPaga += t.valor;
        else despesaPendente += t.valor;
      }
    });

    const saldoReal = receitaConfirmada - despesaPaga;
    const saldoProjetado = (receitaConfirmada + receitaPendente) - (despesaPaga + despesaPendente);

    return { 
      receitaConfirmada, 
      receitaPendente, 
      despesaPaga, 
      despesaPendente, 
      saldoReal, 
      saldoProjetado 
    };
  }, [transacoes]);

  // Handle Form open for custom expense
  const handleOpenAdd = () => {
    setTipo('Despesa');
    setCategoria('Serviços');
    setDescricao('');
    setValor(150);
    setData(new Date().toISOString().split('T')[0]);
    setStatus('Pago');
    setFormError('');
    setIsFormOpen(true);
  };

  // Submit expense/transaction
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!descricao.trim() || !valor || !data || !categoria) {
      setFormError('Preencha os campos obrigatórios da transação.');
      return;
    }

    onAddTransacao({
      tipo,
      categoria,
      descricao: descricao.trim(),
      valor: Number(valor),
      data,
      status
    });

    setIsFormOpen(false);
  };

  // Dynamic filter lists
  const filteredTransacoes = useMemo(() => {
    return transacoes
      .filter(t => {
        const matchesType = typeFilter === 'Todos' || t.tipo === typeFilter;
        const matchesSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.categoria.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [transacoes, typeFilter, searchTerm]);

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="financeiro-module-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white" id="financeiro-title">
            Fluxo <span className="text-gray-500">/ Financeiro</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Monitore as receitas liquidadas de mensalidades em paralelo às saídas operacionais e folha docente.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 transition duration-150 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Nova Despesa</span>
        </button>
      </div>

      {/* Dynamic accounting widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="financeiro-totals-board">
        
        {/* Total Inflows */}
        <div className="bg-[#111111] p-4 rounded-xl border border-[#222222]">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Inflows (Receitas)</span>
          <div className="text-lg font-bold text-emerald-500 mt-1">R$ {totals.receitaConfirmada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-[9px] text-gray-500 mt-1">Lançados: R$ {(totals.receitaConfirmada + totals.receitaPendente).toLocaleString('pt-BR')}</p>
        </div>

        {/* Total Outflows */}
        <div className="bg-[#111111] p-4 rounded-xl border border-[#222222]">
          <span className="text-[10px] font-bold text-rose-455 uppercase tracking-widest font-mono">Outflows (Despesas)</span>
          <div className="text-lg font-bold text-rose-400 mt-1">R$ {totals.despesaPaga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-[9px] text-gray-500 mt-1">Pendentes de Pgto: R$ {totals.despesaPendente.toLocaleString('pt-BR')}</p>
        </div>

        {/* Real Balance today */}
        <div className="bg-[#111111] p-4 rounded-xl border border-[#222222]">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Saldo em Conta Real</span>
          <div className={`text-lg font-bold mt-1 ${totals.saldoReal >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            R$ {totals.saldoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[9px] text-gray-500 mt-1">Saldos efetivos de liquidez</p>
        </div>

        {/* Projected Balance */}
        <div className="bg-[#111111] p-4 rounded-xl border border-[#222222]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Saldo Projetado</span>
          <div className={`text-lg font-bold mt-1 ${totals.saldoProjetado >= 0 ? 'text-white' : 'text-rose-450'}`}>
            R$ {totals.saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[9px] text-gray-500 mt-1">Considerando recebimentos a vencer</p>
        </div>

      </div>

      {/* Advanced query controls */}
      <div className="bg-[#111111] p-4 rounded-2xl border border-[#222222]/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center" id="financeiro-query-toolbar">
        
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Filtrar lançamentos por descrição ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl focus:bg-[#0D0D0D] focus:border-indigo-500 transition text-white"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-xs font-semibold pl-4 pr-8 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl appearance-none cursor-pointer focus:bg-[#0D0D0D] text-white"
          >
            <option value="Todos">Tipo: Ambos</option>
            <option value="Receita">Apenas Receitas (Entradas)</option>
            <option value="Despesa">Apenas Despesas (Saídas)</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-gray-550 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

      </div>

      {/* Left panel is list, right is side panel drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="financeiro-workspace">
        
        {/* Transactions log list */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden" id="financial-ledger-box">
          <div className="p-4 border-b border-[#222222] flex items-center justify-between">
            <span className="text-xs font-bold text-white">Livro Razão / Extrato Escolar</span>
            <span className="text-[10px] text-gray-500 font-medium font-mono">Exibindo {filteredTransacoes.length} lançamentos</span>
          </div>

          <div className="divide-y divide-[#222222] max-h-[480px] overflow-y-auto">
            {filteredTransacoes.map(t => {
              const isReceita = t.tipo === 'Receita';

              return (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isReceita ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                    }`}>
                      {isReceita ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{t.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                        <span className="font-semibold px-1.5 py-0.5 bg-[#1A1A1A] text-gray-400 border border-[#222222] rounded">{t.categoria}</span>
                        <span>•</span>
                        <span>{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <p className={`text-xs font-bold font-mono ${
                        isReceita ? 'text-emerald-450' : 'text-white'
                      }`}>
                        {isReceita ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`text-[9px] font-bold block ${
                        t.status === 'Pago' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {t.status === 'Pago' ? 'Liquidado' : 'A pagar'}
                      </span>
                    </div>

                    {/* Allow deleting admin expense easily, block deleting direct tuition revenues */}
                    {t.categoria !== 'Mensalidade' ? (
                      <button
                        onClick={() => {
                          if (confirm(`Excluir despesa "${t.descricao}"?`)) {
                            onDeleteTransacao(t.id);
                          }
                        }}
                        className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="w-6" /> // spacer
                    )}
                  </div>
                </div>
              );
            })}

            {filteredTransacoes.length === 0 && (
              <div className="text-center py-16 text-gray-500 text-xs">
                Nenhum lançamento financeiro atende a busca atual.
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Expense adding form */}
        <div className="lg:col-span-1" id="financeiro-drawer-pane">
          {isFormOpen ? (
            <div className="bg-[#111111] p-5 rounded-2xl border border-[#222222] space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Efetuar Lançamento de Conta
                </span>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-[#1A1A1A] rounded-full text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Tipo Inbound or Outbound */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sentido Operacional *</label>
                  <div className="flex bg-[#1A1A1A] p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setTipo('Despesa');
                        setCategoria('Serviços');
                      }}
                      className={`flex-1 text-xs py-1.5 font-bold rounded-lg transition text-center ${
                        tipo === 'Despesa' ? 'bg-[#222222] text-white shadow-md' : 'text-gray-500'
                      }`}
                    >
                      Despesa (Saída)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipo('Receita');
                        setCategoria('Outros');
                      }}
                      className={`flex-1 text-xs py-1.5 font-bold rounded-lg transition text-center ${
                        tipo === 'Receita' ? 'bg-[#222222] text-emerald-450 shadow-md' : 'text-gray-500'
                      }`}
                    >
                      Receita (Entrada)
                    </button>
                  </div>
                </div>

                {/* Descricao */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Descrição do Lançamento *</label>
                  <input 
                    type="text" 
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                    maxLength={60}
                    placeholder="Ex: Pagamento conta energia ENEL"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl focus:border-indigo-550 focus:bg-[#0D0D0D] transition text-white"
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Categoria do Custo *</label>
                  {tipo === 'Despesa' ? (
                    <select 
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      required
                      className="w-full text-xs font-bold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl cursor-pointer text-white"
                    >
                      {DESPESA_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <select 
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      required
                      className="w-full text-xs font-bold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl cursor-pointer text-white"
                    >
                      <option value="Serviços Extraordinários">Serviços Extraordinários</option>
                      <option value="Venda de Apostilas">Venda de Apostilas / Licenças</option>
                      <option value="Outros">Outros Ganhos</option>
                    </select>
                  )}
                </div>

                {/* Valor R$ & Data Vencimento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Valor Nominal (R$) *</label>
                    <input 
                      type="number" 
                      value={valor}
                      onChange={(e) => setValor(Number(e.target.value))}
                      required
                      min={0.1}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-550"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Data do Evento *</label>
                    <input 
                      type="date" 
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-550"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Status da Liquidação *</label>
                  <div className="flex gap-2">
                    {['Pago', 'Pendente'].map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setStatus(s as any)}
                        className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg border text-center transition ${
                          status === s 
                            ? 'bg-indigo-600/20 border-indigo-505 text-indigo-400 shadow-lg'
                            : 'bg-[#1A1A1A] border-[#222222] text-gray-400 hover:bg-[#222222]'
                        }`}
                      >
                        {s === 'Pago' ? 'Pago / Consolidado' : 'À pagar (Pendente)'}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="text-[10px] text-red-400 bg-red-400/10 p-2.5 border border-red-500/20 rounded-lg font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 text-xs font-bold py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/15 transition"
                  >
                    Confirmar Lançamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs font-bold px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#222222] text-gray-300 rounded-xl transition border border-[#222222]"
                  >
                    Cancelar
                  </button>
                </div>

              </form>
            </div>
          ) : (
            <div className="bg-[#111111]/30 p-5 rounded-2xl border border-dashed border-[#222222] text-center py-20 space-y-3">
              <TrendingUp className="w-10 h-10 text-gray-650 mx-auto" />
              <div>
                <p className="text-xs font-bold text-gray-300">Contabilidade Administrativa</p>
                <p className="text-[10px] text-gray-500 max-w-[210px] mx-auto mt-1">Grave despesas com folha de pagamento, internet, anúncios, infraestrutura de nuvem, entre outros.</p>
              </div>
              <button 
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-gray-300 font-bold text-[10px] rounded-lg transition"
              >
                <Plus className="w-3 h-3 text-gray-400" />
                Registrar Gasto
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
