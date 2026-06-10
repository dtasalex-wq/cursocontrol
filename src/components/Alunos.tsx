/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Aluno, Turma } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  UserPlus, 
  Filter, 
  FileText,
  UserCheck,
  UserX,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Phone,
  User,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlunosProps {
  alunos: Aluno[];
  turmas: Turma[];
  onAddAluno: (aluno: Omit<Aluno, 'id'>) => void;
  onUpdateAluno: (aluno: Aluno) => void;
  onDeleteAluno: (id: string) => void;
  initialFormData?: (Partial<Aluno> & { esperaId?: string }) | null;
  clearInitialFormData?: () => void;
  timbre?: string;
  contratoModelo?: string;
}

export default function Alunos({ 
  alunos, 
  turmas, 
  onAddAluno, 
  onUpdateAluno, 
  onDeleteAluno,
  initialFormData,
  clearInitialFormData,
  timbre,
  contratoModelo
}: AlunosProps) {
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurma, setSelectedTurma] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo' | 'Inadimplente' | 'Aguardando'>('Ativo');
  const [turmaId, setTurmaId] = useState('');
  const [dataMatricula, setDataMatricula] = useState(new Date().toISOString().split('T')[0]);

  // New Fields
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [fone1, setFone1] = useState('');
  const [fone2, setFone2] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [rg, setRg] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [rgResponsavel, setRgResponsavel] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState('');
  const [diaPagamento, setDiaPagamento] = useState<number>(10);

  const [formError, setFormError] = useState('');
  const [expandedAlunoId, setExpandedAlunoId] = useState<string | null>(null);
  const [printContent, setPrintContent] = useState('');

  // Monitor initialFormData to automatically trigger form opening and pre-filling
  useEffect(() => {
    if (initialFormData) {
      setEditingAluno(null);
      setNome(initialFormData.nome || '');
      setEmail(initialFormData.email || '');
      setTelefone(initialFormData.telefone || '');
      setFone1(initialFormData.telefone || '');
      setCidade(initialFormData.cidade || '');
      setTurmaId(initialFormData.turmaId || turmas[0]?.id || '');
      setStatus(initialFormData.status || 'Ativo');
      
      // Reset other form fields
      setCpf('');
      setEndereco('');
      setNumero('');
      setBairro('');
      setFone2('');
      setDataNascimento('');
      setRg('');
      setNomeResponsavel('');
      setRgResponsavel('');
      setCpfResponsavel('');
      setDiaPagamento(10);
      setDataMatricula(new Date().toISOString().split('T')[0]);

      setFormError('');
      setIsFormOpen(true);
      if (clearInitialFormData) {
        clearInitialFormData();
      }
    }
  }, [initialFormData, turmas, clearInitialFormData]);

  // Helper age calculation method
  const getAge = (birthDateString: string): number | null => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString + 'T00:00:00');
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  const calculatedAge = useMemo(() => {
    return getAge(dataNascimento);
  }, [dataNascimento]);

  const handlePrintContract = (a: Aluno) => {
    const matchedTurma = turmas.find(t => t.id === a.turmaId);
    let content = contratoModelo || '';
    
    // Clean template formatting before doing replacements
    // 1. Remove all <span> and </span> tags which split braces and cause weird formatting
    content = content.replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '');
    
    // 2. Fix cases where curly braces are split by spaces or minor tags
    content = content.replace(/\{\s*\{\s*([a-zA-Z0-9_]+)\s*\}\s*\}/g, '{{$1}}');
    
    // 3. Remove all inline image tags from the template so only the uploaded timbre remains
    content = content.replace(/<img[^>]*>/gi, '');
    
    // 4. Remove redundant company header text lines to avoid duplication with uploaded timbre
    content = content
      .replace(/CONEX[ÃA]O\s+DIGITAL/gi, '')
      .replace(/CURSOS,\s+TREINAMENTOS\s+E\s+SERVI[ÇC]OS\s+DE\s+INFORM[ÁA]TICA/gi, '')
      .replace(/CNPJ:\s*60\.967\.129\/0001-03/gi, '')
      .replace(/Rua:\s*Francisco\s+Ferreira\s+Souto,\s*204\s*[\-\–]\s*Sala\s*03/gi, '')
      .replace(/Centro\s*[\-\–]\s*Areia\s*Branca\s*[\-\–]\s*Rio\s*Grande\s*do\s*Norte/gi, '');

    // 5. Clean up any empty HTML paragraphs or headings left behind
    content = content.replace(/<p>\s*(?:<br\/?>|&nbsp;|\s)*<\/p>/gi, '');
    content = content.replace(/<h[1-6]>\s*(?:<br\/?>|&nbsp;|\s)*<\/h[1-6]>/gi, '');
    
    const dataMatr = a.dataMatricula ? new Date(a.dataMatricula + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const dataNasc = a.dataNascimento ? new Date(a.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
    const endCompleto = `${a.endereco || ''}${a.numero ? ', nº ' + a.numero : ''}${a.bairro ? ' - ' + a.bairro : ''}`;

    content = content
      .replace(/\{\{nome_aluno\}\}/g, a.nome)
      .replace(/\{\{email_aluno\}\}/g, a.email || '-')
      .replace(/\{\{telefone_aluno\}\}/g, a.fone1 || a.telefone || '-')
      .replace(/\{\{cpf_aluno\}\}/g, a.cpf || '-')
      .replace(/\{\{rg_aluno\}\}/g, a.rg || '-')
      .replace(/\{\{cidade_aluno\}\}/g, a.cidade || '-')
      .replace(/\{\{data_nascimento\}\}/g, dataNasc)
      .replace(/\{\{endereco_aluno\}\}/g, endCompleto)
      .replace(/\{\{nome_turma\}\}/g, turmasMap[a.turmaId] || '-')
      .replace(/\{\{curso_nome\}\}/g, matchedTurma?.curso || matchedTurma?.nome || '-')
      .replace(/\{\{valor_mensalidade\}\}/g, matchedTurma?.valorMensalidade?.toString() || '0')
      .replace(/\{\{data_matricula\}\}/g, dataMatr)
      .replace(/\{\{responsavel_nome\}\}/g, a.nomeResponsavel || '-')
      .replace(/\{\{responsavel_cpf\}\}/g, a.cpfResponsavel || '-')
      .replace(/\{\{responsavel_rg\}\}/g, a.rgResponsavel || '-')
      .replace(/\{\{dia_pagamento\}\}/g, (a.diaPagamento || 10).toString());

    setPrintContent(content);
    
    // Trigger system print dialog
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Handle open form for adding
  const handleOpenAdd = () => {
    setEditingAluno(null);
    setNome('');
    setEmail('');
    setTelefone('');
    setCpf('');
    setStatus('Ativo');
    // Default to first turma if available
    setTurmaId(turmas[0]?.id || '');
    setDataMatricula(new Date().toISOString().split('T')[0]);

    // Reset new fields
    setEndereco('');
    setNumero('');
    setCidade('');
    setBairro('');
    setFone1('');
    setFone2('');
    setDataNascimento('');
    setRg('');
    setNomeResponsavel('');
    setRgResponsavel('');
    setCpfResponsavel('');
    setDiaPagamento(10);

    setFormError('');
    setIsFormOpen(true);
  };

  // Handle open form for editing
  const handleOpenEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setNome(aluno.nome);
    setEmail(aluno.email);
    setTelefone(aluno.telefone);
    setCpf(aluno.cpf);
    setStatus(aluno.status);
    setTurmaId(aluno.turmaId);
    setDataMatricula(aluno.dataMatricula || new Date().toISOString().split('T')[0]);

    // Set new fields
    setEndereco(aluno.endereco || '');
    setNumero(aluno.numero || '');
    setCidade(aluno.cidade || '');
    setBairro(aluno.bairro || '');
    setFone1(aluno.fone1 || aluno.telefone || '');
    setFone2(aluno.fone2 || '');
    setDataNascimento(aluno.dataNascimento || '');
    setRg(aluno.rg || '');
    setNomeResponsavel(aluno.nomeResponsavel || '');
    setRgResponsavel(aluno.rgResponsavel || '');
    setCpfResponsavel(aluno.cpfResponsavel || '');
    setDiaPagamento(aluno.diaPagamento || 10);

    setFormError('');
    setIsFormOpen(true);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome.trim() || !cpf.trim() || !turmaId) {
      setFormError('Por favor preencha os campos obrigatórios (Nome, CPF e Turma).');
      return;
    }

    const age = getAge(dataNascimento);
    if (age !== null && age < 18) {
      if (!nomeResponsavel.trim() || !rgResponsavel.trim() || !cpfResponsavel.trim()) {
        setFormError('Como o aluno é menor de idade (idade < 18), os campos do responsável legal são obrigatórios.');
        return;
      }
    }

    const alunoData = {
      nome: nome.trim(),
      email: email.trim(),
      telefone: fone1.trim() || telefone.trim(),
      cpf: cpf.trim(),
      status,
      turmaId,
      dataMatricula,

      endereco: endereco.trim(),
      numero: numero.trim(),
      cidade: cidade.trim(),
      bairro: bairro.trim(),
      fone1: fone1.trim(),
      fone2: fone2.trim(),
      dataNascimento: dataNascimento,
      rg: rg.trim(),
      nomeResponsavel: age !== null && age < 18 ? nomeResponsavel.trim() : '',
      rgResponsavel: age !== null && age < 18 ? rgResponsavel.trim() : '',
      cpfResponsavel: age !== null && age < 18 ? cpfResponsavel.trim() : '',
      diaPagamento: Number(diaPagamento) || 10
    };

    if (editingAluno) {
      onUpdateAluno({
        ...alunoData,
        id: editingAluno.id
      });
    } else {
      onAddAluno(alunoData);
    }

    setIsFormOpen(false);
  };

  // Filter students dynamically
  const filteredAlunos = useMemo(() => {
    return alunos.filter(a => {
      const matchesSearch = 
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.cpf.includes(searchTerm);
      
      const matchesTurma = selectedTurma === 'Todas' || a.turmaId === selectedTurma;
      const matchesStatus = selectedStatus === 'Todos' || a.status === selectedStatus;

      return matchesSearch && matchesTurma && matchesStatus;
    });
  }, [alunos, searchTerm, selectedTurma, selectedStatus]);

  // Map of classes for quick name find
  const turmasMap = useMemo(() => {
    const map: Record<string, string> = {};
    turmas.forEach(t => {
      map[t.id] = t.nome;
    });
    return map;
  }, [turmas]);
  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="alunos-module-container">
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white" id="alunos-title">
            Gestão <span className="text-gray-500">/ Alunos</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Cadastre, edite, suspenda e gerencie as matrículas e dados cadastrais.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          id="btn-new-student"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 transition duration-150 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Matricular Aluno</span>
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-[#111111] border border-[#222222] p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 items-center" id="filter-toolbar">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou CPF..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="input-search-student"
            className="w-full text-xs font-medium pl-9 pr-4 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:bg-[#0D0D0D] focus:border-indigo-500 transition"
          />
        </div>

        {/* Filter Turma */}
        <div className="relative">
          <select 
            value={selectedTurma}
            onChange={(e) => setSelectedTurma(e.target.value)}
            id="filter-turma"
            className="w-full text-xs font-semibold pl-4 pr-8 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl appearance-none cursor-pointer focus:bg-[#0D0D0D] focus:border-indigo-500 transition"
          >
            <option value="Todas">Filtrar por Turma: Todas</option>
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
          <Filter className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter Status */}
        <div className="relative">
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            id="filter-status"
            className="w-full text-xs font-semibold pl-4 pr-8 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl appearance-none cursor-pointer focus:bg-[#0D0D0D] focus:border-indigo-500 transition"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Ativo">Ativos e Frequentes</option>
            <option value="Inativo">Trancados/Inativos</option>
            <option value="Inadimplente">Mensalidades em Atraso</option>
            <option value="Aguardando">Aguardando Início</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

      </div>

      {/* Main Student List Layout */}
      <div className="w-full" id="student-list-wrapper">
        
        {/* Table of Students */}
        <div className="w-full bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden" id="student-list-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0D0D0D] border-b border-[#222222] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Estudante</th>
                  <th className="px-5 py-3">CPF & Contato</th>
                  <th className="px-5 py-3">Turma Alocada</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-xs">
                {filteredAlunos.map(a => {
                  const isExpanded = expandedAlunoId === a.id;
                  const age = getAge(a.dataNascimento || '');

                  return (
                    <React.Fragment key={a.id}>
                      <tr className="hover:bg-[#1A1A1A] transition">
                        
                        {/* Aluno main card info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-600/10 text-indigo-400 font-bold flex items-center justify-center">
                              {a.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white">{a.nome}</p>
                              <p className="text-[10px] text-gray-500 font-mono">Matrícula: {new Date(a.dataMatricula).toLocaleDateString('pt-BR')} | Vencto: Dia {a.diaPagamento || 10}</p>
                            </div>
                          </div>
                        </td>

                        {/* CPF and Contact */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-300">{a.fone1 || a.telefone}</p>
                          <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{a.email}</p>
                          <p className="text-[10px] text-gray-500 font-mono font-medium">{a.cpf}</p>
                        </td>

                        {/* Class Name */}
                        <td className="px-5 py-4">
                          <span className="font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 text-[11px] px-2.5 py-1 rounded pb-1">
                            {turmasMap[a.turmaId] || 'Sem turma cadastrada'}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            a.status === 'Inadimplente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            a.status === 'Aguardando' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                            'bg-[#1A1A1A] text-gray-400 border border-[#333333]'
                          }`}>
                            {a.status}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => setExpandedAlunoId(isExpanded ? null : a.id)}
                              className={`p-1 px-1.5 hover:bg-[#1A1A1A] rounded transition ${isExpanded ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                              title="Ver Ficha Completa"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(a)}
                              className="p-1 px-1.5 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-indigo-400 transition"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Tem certeza que dejesa apagar os cadastros de ${a.nome}? Esta ação é irreversível!`)) {
                                  onDeleteAluno(a.id);
                                }
                              }}
                              className="p-1 px-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-450 transition"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>

                      {/* Expanded Panel Drawer section (Ficha do Aluno) */}
                      {isExpanded && (
                        <tr className="bg-[#121212]/40 border-b border-[#222222]">
                          <td colSpan={5} className="p-5 bg-[#0D0D0D]/60">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-300">
                              
                              {/* Address */}
                              <div className="space-y-2 border-r border-[#222222] pr-4">
                                <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase block flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Logradouro Residencial
                                </span>
                                <div className="space-y-1.5 pt-1">
                                  <p className="text-white font-medium">{a.endereco || 'Endereço não preenchido'}{a.numero ? `, nº ${a.numero}` : ''}</p>
                                  <p className="text-gray-450">Bairro: <span className="text-gray-200">{a.bairro || '-'}</span></p>
                                  <p className="text-gray-455">Cidade: <span className="text-gray-200">{a.cidade || '-'}</span></p>
                                </div>
                              </div>

                              {/* Birth date and Docs */}
                              <div className="space-y-2 border-r border-[#222222] pr-4">
                                <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase block flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Nascimento & Documentos
                                </span>
                                <div className="space-y-1 pt-1">
                                  <p className="text-gray-400">Nascimento: <span className="text-white font-mono font-medium">{a.dataNascimento ? new Date(a.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span></p>
                                  <div className="flex items-center gap-1.5 text-gray-400">
                                    <span>Idade:</span>
                                    {age !== null ? (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${age < 18 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                                        {age} anos {age < 18 ? '(Menor de Idade)' : '(Maior de Idade)'}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 italic">Não informada</span>
                                    )}
                                  </div>
                                  <p className="text-gray-400">RG Aluno: <span className="text-white font-mono font-medium">{a.rg || '-'}</span></p>
                                  <p className="text-gray-400">Fones: <span className="text-white font-mono font-medium">{a.fone1 || a.telefone || '-'}</span> {a.fone2 ? <span className="text-gray-500">/ {a.fone2}</span> : ''}</p>
                                  <p className="text-gray-400">Vencimento Mensalidade: <span className="text-indigo-400 font-mono font-bold">Dia {a.diaPagamento || 10}</span></p>
                                </div>
                              </div>

                              {/* Responsible */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase block flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Responsável Legal
                                </span>
                                <div className="pt-1">
                                  {age !== null && age < 18 ? (
                                    <div className="space-y-1 bg-[#1A1A1A]/30 p-3.5 rounded-xl border border-[#222222]/80">
                                      <p className="text-white font-semibold">{a.nomeResponsavel || 'Nome não preenchido'}</p>
                                      <p className="text-gray-400 text-[10px]">RG Resp: <span className="text-gray-200 font-mono">{a.rgResponsavel || '-'}</span></p>
                                      <p className="text-gray-400 text-[10px]">CPF Resp: <span className="text-gray-200 font-mono">{a.cpfResponsavel || '-'}</span></p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic pt-1 flex items-center gap-2">
                                      <Check className="w-4 h-4 text-emerald-500" /> Aluno é maior de idade. Responsável legal isento.
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Print Contract Button */}
                              <div className="col-span-1 md:col-span-3 pt-4 border-t border-[#222222]/60 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handlePrintContract(a)}
                                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/10 cursor-pointer select-none"
                                >
                                  <FileText className="w-4 h-4" />
                                  Emitir Contrato do Aluno
                                </button>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredAlunos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                      Nenhum estudante atende a estes parâmetros de filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Dialog Form - Tela Secundária */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" id="student-form-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-2xl bg-[#111111] border border-[#222222] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans"
            >
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#161616] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/10">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                      {editingAluno ? 'Editar Cadastro de Aluno' : 'Matrícula de Novo Aluno'}
                    </h2>
                    <p className="text-[10px] text-gray-500">Insira as informações gerais para emissão do contrato e turmas.</p>
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
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-left">
                
                {/* Section 1: Dados Pessoais do Aluno */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono border-b border-[#222222] pb-1">1. Dados Pessoais</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Nome Completo do Aluno *</label>
                    <input 
                      type="text" 
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      placeholder="Ex: Pedro Henrique Souza"
                      className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">CPF *</label>
                      <input 
                        type="text" 
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        required
                        placeholder="000.000.000-00"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">RG Aluno</label>
                      <input 
                        type="text" 
                        value={rg}
                        onChange={(e) => setRg(e.target.value)}
                        placeholder="Ex: 55.444.333-2"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Data Nasc. *</label>
                      <input 
                        type="date" 
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        required
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                  </div>

                  {/* Idade Info Box */}
                  <div className="bg-[#1A1A1A] p-3.5 border border-[#222222] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase text-gray-500 block">Idade Calculada</p>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {calculatedAge !== null ? `${calculatedAge} anos` : 'Aguardando data de nascimento...'}
                      </p>
                    </div>
                    {calculatedAge !== null && (
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        calculatedAge < 18 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {calculatedAge < 18 ? '🚨 Aluno Menor de Idade' : '✅ Aluno Maior de Idade'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Section 1.5: Dados do Responsável (Exibido CASO SEJA MENOR < 18) */}
                <AnimatePresence>
                  {calculatedAge !== null && calculatedAge < 18 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 pt-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-450 uppercase tracking-widest font-mono border-b border-amber-500/10 pb-1">
                        <User className="w-4 h-4 text-amber-500" />
                        <span>👥 Responsável Legal</span>
                        <span className="text-[9px] lowercase font-normal text-amber-500 font-sans tracking-normal italic">(obrigatório para menores)</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Nome do Responsável *</label>
                        <input 
                          type="text" 
                          value={nomeResponsavel}
                          onChange={(e) => setNomeResponsavel(e.target.value)}
                          placeholder="Ex: Maria de Souza Santos"
                          required={calculatedAge < 18}
                          className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">RG do Responsável *</label>
                          <input 
                            type="text" 
                            value={rgResponsavel}
                            onChange={(e) => setRgResponsavel(e.target.value)}
                            placeholder="Ex: 44.555.666-x"
                            required={calculatedAge < 18}
                            className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">CPF do Responsável *</label>
                          <input 
                            type="text" 
                            value={cpfResponsavel}
                            onChange={(e) => setCpfResponsavel(e.target.value)}
                            placeholder="Ex: 000.000.000-00"
                            required={calculatedAge < 18}
                            className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Section 2: Endereço do Aluno */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono border-b border-[#222222] pb-1">2. Localização Residencial</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1 sm:col-span-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Endereço / Logradouro</label>
                      <input 
                        type="text" 
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Ex: Avenida Paulista"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Número</label>
                      <input 
                        type="text" 
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="Ex: 1510"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Bairro</label>
                      <input 
                        type="text" 
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Ex: Bela Vista"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Cidade</label>
                      <input 
                        type="text" 
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Contatos e Financeiro */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono border-b border-[#222222] pb-1">3. Dados Acadêmicos & Contato</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">E-mail de Cadastro</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: pedro.souza@email.com"
                      className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Fone 1 (Celular Principal) *</label>
                      <input 
                        type="text" 
                        value={fone1}
                        onChange={(e) => setFone1(e.target.value)}
                        required
                        placeholder="(11) 99999-9999"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Fone 2 (Telefone Fixo / Recado)</label>
                      <input 
                        type="text" 
                        value={fone2}
                        onChange={(e) => setFone2(e.target.value)}
                        placeholder="Ex: (11) 4444-4444"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Alocar à Turma *</label>
                      <select 
                        value={turmaId}
                        onChange={(e) => setTurmaId(e.target.value)}
                        required
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl cursor-pointer focus:border-indigo-500 transition"
                      >
                        <option value="">Selecione uma turma</option>
                        {turmas.map(t => (
                          <option key={t.id} value={t.id}>{t.nome} (R$ {t.valorMensalidade}/mês)</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Data da Matrícula *</label>
                      <input 
                        type="date" 
                        value={dataMatricula}
                        onChange={(e) => setDataMatricula(e.target.value)}
                        required
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#1A1A1A] text-white border border-[#222222] rounded-xl focus:border-indigo-500 focus:bg-[#0D0D0D] transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono tracking-wider">Melhor Dia de Vencimento *</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[5, 10, 15, 20, 30].map(day => (
                        <button
                          type="button"
                          key={day}
                          onClick={() => setDiaPagamento(day)}
                          className={`text-xs font-bold py-2 rounded-xl border text-center transition ${
                            diaPagamento === day 
                              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500 font-bold'
                              : 'bg-[#1A1A1A] text-gray-400 border-[#222222] hover:bg-[#222222]'
                          }`}
                        >
                          Dia {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Status Cadastral *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Ativo', 'Inativo', 'Inadimplente', 'Aguardando'].map(s => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setStatus(s as any)}
                          className={`text-[11px] font-bold py-2 rounded-lg border text-center transition ${
                            status === s 
                              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500'
                              : 'bg-[#1A1A1A] text-gray-400 border-[#222222] hover:bg-[#222222]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
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
                  className="text-xs font-bold px-4 py-2 bg-[#1A1A1A] hover:bg-[#222222] text-gray-300 rounded-xl transition border border-[#222222]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 transition duration-150"
                >
                  {editingAluno ? 'Salvar Edição' : 'Concluir Matrícula'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printing layout element container (only visible on print media) */}
      <div id="print-layout-container" className="hidden print:block p-8">
        {timbre && (
          <div className="w-full flex justify-center mb-6">
            <img src={timbre} alt="Timbre Cabeçalho" className="max-h-24 object-contain" />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: printContent }} className="contract-content" />
      </div>
    </div>
  );
}
