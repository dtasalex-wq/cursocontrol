/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Espera, Turma } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  Phone, 
  Clock, 
  BookOpen, 
  User, 
  Filter,
  CheckCircle,
  HelpCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ListaEsperaProps {
  turmas: Turma[];
  espera: Espera[];
  onAddEspera: (item: Omit<Espera, 'id' | 'dataRegistro'>) => void;
  onUpdateEspera: (item: Espera) => void;
  onDeleteEspera: (id: string) => void;
  onPromoteToStudent?: (item: Espera) => void; 
}

export default function ListaEspera({
  turmas,
  espera,
  onAddEspera,
  onUpdateEspera,
  onDeleteEspera,
  onPromoteToStudent
}: ListaEsperaProps) {

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [turnoFilter, setTurnoFilter] = useState<string>('Todos');
  const [cursoFilter, setCursoFilter] = useState<string>('Todos');

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Espera | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [cidade, setCidade] = useState('');
  const [turno, setTurno] = useState<'Manhã' | 'Tarde' | 'Noite'>('Noite');
  const [curso, setCurso] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Matriculado' | 'Cancelado'>('Pendente');

  const [formError, setFormError] = useState('');

  // Get unique courses from registered turmas
  const uniqueCursos = useMemo(() => {
    const nomes = new Set<string>();
    turmas.forEach(t => {
      if (t.curso) nomes.add(t.curso);
      if (t.nome) nomes.add(t.nome);
    });
    // Add default fallbacks if no courses are registered
    if (nomes.size === 0) {
      nomes.add('Desenvolvimento Web Fullstack');
      nomes.add('Python Iniciante ao Avançado');
      nomes.add('Informática Básica');
    }
    return Array.from(nomes);
  }, [turmas]);

  // Handle open modal for new entry
  const handleOpenAdd = () => {
    setEditingItem(null);
    setNome('');
    setContato('');
    setCidade('');
    setTurno('Noite');
    setCurso(uniqueCursos[0] || '');
    setStatus('Pendente');
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle open modal for editing
  const handleOpenEdit = (item: Espera) => {
    setEditingItem(item);
    setNome(item.nome);
    setContato(item.contato);
    setCidade(item.cidade || '');
    setTurno(item.turno);
    setCurso(item.curso);
    setStatus(item.status);
    setFormError('');
    setIsFormOpen(true);
  };

  // Submit form handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome.trim()) {
      setFormError('O nome do interessado é obrigatório.');
      return;
    }
    if (!contato.trim()) {
      setFormError('O telefone de contato é obrigatório.');
      return;
    }
    if (contato.includes('@')) {
      setFormError('Por favor, insira apenas o telefone de contato (números), sem o e-mail.');
      return;
    }
    if (!cidade.trim()) {
      setFormError('A cidade é obrigatória.');
      return;
    }
    if (!curso) {
      setFormError('Selecione uma turma de interesse.');
      return;
    }

    if (editingItem) {
      onUpdateEspera({
        ...editingItem,
        nome: nome.trim(),
        contato: contato.trim(),
        cidade: cidade.trim(),
        turno,
        curso,
        status
      });
    } else {
      onAddEspera({
        nome: nome.trim(),
        contato: contato.trim(),
        cidade: cidade.trim(),
        turno,
        curso,
        status: 'Pendente'
      });
    }

    setIsFormOpen(false);
  };

  // Filter and search computation
  const filteredEspera = useMemo(() => {
    return espera.filter(item => {
      const matchSearch = 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contato.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.cidade && item.cidade.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = statusFilter === 'Todos' || item.status === statusFilter;
      const matchTurno = turnoFilter === 'Todos' || item.turno === turnoFilter;
      const matchCurso = cursoFilter === 'Todos' || item.curso === cursoFilter;

      return matchSearch && matchStatus && matchTurno && matchCurso;
    });
  }, [espera, searchTerm, statusFilter, turnoFilter, cursoFilter]);

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="lista-espera-view">
      
      {/* Header section with description and Register action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-400" />
            Lista de Espera
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Faça a coleta, gestão e conversão de pessoas interessadas em ingressar nas turmas da escola.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          id="btn-add-espera"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer transition"
        >
          <Plus className="w-4 h-4" />
          Adicionar Interessado
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="espera-stats-row">
        <div className="bg-[#111111] border border-[#222222] p-4 rounded-xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Geral</span>
          <span className="text-2xl font-light text-white block mt-1">{espera.length}</span>
        </div>
        <div className="bg-[#111111] border border-[#222222] p-4 rounded-xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pendentes</span>
          <span className="text-2xl font-light text-amber-400 block mt-1">
            {espera.filter(i => i.status === 'Pendente').length}
          </span>
        </div>
        <div className="bg-[#111111] border border-[#222222] p-4 rounded-xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Matriculados/Convertidos</span>
          <span className="text-2xl font-light text-emerald-400 block mt-1">
            {espera.filter(i => i.status === 'Matriculado').length}
          </span>
        </div>
        <div className="bg-[#111111] border border-[#222222] p-4 rounded-xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Taxa de Conversão</span>
          <span className="text-2xl font-light text-indigo-400 block mt-1">
            {espera.length > 0 
              ? `${Math.round((espera.filter(i => i.status === 'Matriculado').length / espera.length) * 100)}%` 
              : '0%'
            }
          </span>
        </div>
      </div>

      {/* Search and Filters box */}
      <div className="bg-[#111111] border border-[#222222] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search input */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, contato ou cidade..."
            className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-[#161616] border border-[#222222] rounded-xl text-white placeholder-gray-500 focus:border-indigo-500/80 outline-none transition"
          />
        </div>

        {/* Filters panel */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#161616] px-3 py-1 border border-[#222222] rounded-xl">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-semibold py-1 pr-1.5"
            >
              <option value="Todos" className="bg-[#111111]">Todos</option>
              <option value="Pendente" className="bg-[#111111]">Pendente</option>
              <option value="Matriculado" className="bg-[#111111]">Matriculado</option>
              <option value="Cancelado" className="bg-[#111111]">Cancelado</option>
            </select>
          </div>

          {/* Turno Filter */}
          <div className="flex items-center gap-1.5 bg-[#161616] px-3 py-1 border border-[#222222] rounded-xl">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Turno</span>
            <select
              value={turnoFilter}
              onChange={(e) => setTurnoFilter(e.target.value)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-semibold py-1 pr-1.5"
            >
              <option value="Todos" className="bg-[#111111]">Todos</option>
              <option value="Manhã" className="bg-[#111111]">Manhã</option>
              <option value="Tarde" className="bg-[#111111]">Tarde</option>
              <option value="Noite" className="bg-[#111111]">Noite</option>
            </select>
          </div>

          {/* Curso Filter */}
          <div className="flex items-center gap-1.5 bg-[#161616] px-3 py-1 border border-[#222222] rounded-xl">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Turma</span>
            <select
              value={cursoFilter}
              onChange={(e) => setCursoFilter(e.target.value)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-semibold py-1 pr-1.5 max-w-[150px] truncate"
            >
              <option value="Todos" className="bg-[#111111]">Todas as turmas</option>
              {uniqueCursos.map(c => (
                <option key={c} value={c} className="bg-[#111111]" title={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden" id="espera-table-container">
        {filteredEspera.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#181818] border-b border-[#222222] text-[#9CA3AF] uppercase font-bold tracking-wider font-mono">
                  <th className="px-6 py-4">Interessado</th>
                  <th className="px-6 py-4">Turma Desejada</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Cidade</th>
                  <th className="px-6 py-4">Turno</th>
                  <th className="px-6 py-4">Data Registro</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredEspera.map((item) => (
                  <tr key={item.id} className="hover:bg-[#161616] transition duration-150">
                    {/* Name / Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                          {item.nome.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-xs">{item.nome}</p>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="px-6 py-4 font-semibold text-gray-200">
                      {item.curso}
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 font-mono text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{item.contato}</span>
                      </div>
                    </td>

                    {/* Cidade */}
                    <td className="px-6 py-4 font-semibold text-gray-300">
                      {item.cidade || '-'}
                    </td>

                    {/* Shift */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded-md font-mono ${
                        item.turno === 'Manhã' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : item.turno === 'Tarde' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {item.turno}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="px-6 py-4 font-mono text-gray-400">
                      {new Date(item.dataRegistro).toLocaleDateString('pt-BR')}
                    </td>

                    {/* Status Badge / Matricula Button */}
                    <td className="px-6 py-4 text-center">
                      {item.status === 'Pendente' && onPromoteToStudent ? (
                        <button
                          type="button"
                          onClick={() => onPromoteToStudent(item)}
                          title="Clique para iniciar matrícula"
                          className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black px-2.5 py-1 rounded-md border font-mono bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-[#F59E0B] hover:text-[#0A0A0A] hover:border-transparent transition cursor-pointer font-bold shadow-sm shadow-amber-500/5 select-none"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                          Matricular
                        </button>
                      ) : (
                        <span className={`inline-block text-[10px] uppercase font-black px-2.5 py-1 rounded-md border font-mono ${
                          item.status === 'Matriculado'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </td>

                    {/* Actions column */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-400">

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Editar cadastro"
                          className="p-1.5 bg-[#1B1B1B] hover:bg-[#2A2A2A] rounded-lg text-gray-300 hover:text-white cursor-pointer transition border border-[#282828]"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Excluir ${item.nome} da lista de espera?`)) {
                              onDeleteEspera(item.id);
                            }
                          }}
                          title="Excluir cadastro"
                          className="p-1.5 bg-[#1B1B1B] hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg cursor-pointer transition border border-[#282828]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Clock className="w-12 h-12 text-indigo-500/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-300">Nenhum registro encontrado</p>
            <p className="text-xs text-gray-500 mt-1">Experimente remover seus filtros de pesquisa ou cadastrar uma nova pessoa</p>
          </div>
        )}
      </div>

      {/* Form Dialog Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] border border-[#222222] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  {editingItem ? 'Editar Cadastro de Interesse' : 'Novo Interessado (Espera)'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-[#222222] text-gray-400 hover:text-white rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="font-semibold">{formError}</p>
                  </div>
                )}

                {/* Input Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nome do Interessado *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Ex: Ana Maria da Silva"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition outline-none"
                  />
                </div>

                {/* Input Contact */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Telefone de Contato *</label>
                  <input
                    type="text"
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    required
                    placeholder="Ex: (11) 98888-7777"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition outline-none"
                  />
                </div>

                {/* Input Cidade */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Cidade *</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    required
                    placeholder="Ex: São Paulo"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Turno */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Turno de Preferência *</label>
                    <select
                      value={turno}
                      onChange={(e) => setTurno(e.target.value as any)}
                      required
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition outline-none"
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                    </select>
                  </div>

                  {/* Select Curso Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Turma Pretendida *</label>
                    <select
                      value={curso}
                      onChange={(e) => setCurso(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition outline-none"
                    >
                      {uniqueCursos.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Field: ONLY if editingItem */}
                {editingItem && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Status do Atendimento</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition outline-none"
                    >
                      <option value="Pendente">Pendente (Aguardando Retorno)</option>
                      <option value="Matriculado">Matriculado (Convertor a Aluno)</option>
                      <option value="Cancelado">Cancelado / Desistiu</option>
                    </select>
                  </div>
                )}



                {/* Form Buttons Actions */}
                <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer transition"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Cadastrar na Lista'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
