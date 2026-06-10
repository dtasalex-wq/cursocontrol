/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Usuario } from '../types';
import { 
  Shield, 
  UserPlus, 
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Phone,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UsuariosProps {
  usuarios: Usuario[];
  activeUserId: string;
  onAddUsuario: (user: Omit<Usuario, 'id'>) => void;
  onUpdateUsuario: (user: Usuario) => void;
  onDeleteUsuario: (id: string) => void;
}

export default function Usuarios({
  usuarios,
  activeUserId,
  onAddUsuario,
  onUpdateUsuario,
  onDeleteUsuario
}: UsuariosProps) {
  
  // User form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [nome, setNome] = useState('');
  const [foneContato, setFoneContato] = useState('');
  const [cargo, setCargo] = useState('Secretário');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'dashboard', 'alunos', 'espera', 'cursos_turmas', 'relatorios'
  ]);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Available modules list
  const availableModules = [
    { id: 'dashboard', label: 'Painel Geral' },
    { id: 'alunos', label: 'Cadastro Alunos' },
    { id: 'espera', label: 'Lista de Espera' },
    { id: 'cursos_turmas', label: 'Cursos e Turmas' },
    { id: 'frequencia', label: 'Frequência / Chamada' },
    { id: 'pagamentos', label: 'Mensalidades' },
    { id: 'financeiro', label: 'Financeiro / Fluxo' },
    { id: 'relatorios', label: 'Relatórios Diversos' },
    { id: 'usuarios', label: 'Usuários e Permissões' }
  ];

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingUser(null);
    setNome('');
    setFoneContato('');
    setCargo('Secretário');
    setSelectedPermissions(['dashboard', 'alunos', 'espera', 'cursos_turmas', 'relatorios']);
    setUserError('');
    setUserSuccess('');
    setIsFormOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (user: Usuario) => {
    setEditingUser(user);
    setNome(user.nome);
    setFoneContato(user.foneContato || '');
    setCargo(user.cargo);
    setSelectedPermissions(user.permissoes || []);
    setUserError('');
    setUserSuccess('');
    setIsFormOpen(true);
  };

  // Add / Edit user submit
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!nome.trim() || !foneContato.trim()) {
      setUserError('Nome e Telefone de Contato são obrigatórios.');
      return;
    }

    if (selectedPermissions.length === 0) {
      setUserError('Selecione ao menos um módulo de acesso permitido.');
      return;
    }

    const userData = {
      nome: nome.trim(),
      foneContato: foneContato.trim(),
      cargo,
      permissoes: selectedPermissions
    };

    if (editingUser) {
      onUpdateUsuario({
        ...userData,
        id: editingUser.id
      });
      alert('Cadastro de profissional editado com sucesso!');
    } else {
      onAddUsuario(userData);
      alert('Novo usuário cadastrado com sucesso! Use o seletor no rodapé do menu lateral para testar.');
    }

    setNome('');
    setFoneContato('');
    setCargo('Secretário');
    setSelectedPermissions(['dashboard', 'alunos', 'espera', 'cursos_turmas', 'relatorios']);
    setIsFormOpen(false);
  };

  // Toggle single permission selection checkbox
  const handleTogglePermission = (modId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(modId)) {
        return prev.filter(p => p !== modId);
      } else {
        return [...prev, modId];
      }
    });
  };

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="usuarios-module">
      
      {/* Module Title & Modal trigger button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-indigo-400" />
            Profissionais & Permissões
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Gerencie os operadores do sistema e configure quais abas e módulos cada um pode acessar.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 transition duration-150 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Profissional</span>
        </button>
      </div>

      {/* Horizontal Layout: Full width table */}
      <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Usuários Cadastrados</h3>
          <p className="text-xs text-gray-500 mt-0.5">Operadores do sistema e suas respectivas permissões de visualização.</p>
        </div>

        <div className="overflow-x-auto border border-[#222222] rounded-xl bg-[#111111]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0D0D0D] border-b border-[#222222] text-[#9CA3AF] uppercase font-bold tracking-wider font-mono">
                <th className="px-5 py-3.5">Nome / Cargo</th>
                <th className="px-5 py-3.5">Telefone de Contato</th>
                <th className="px-5 py-3.5">Módulos de Acesso</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-[#161616] transition">
                  <td className="px-5 py-4">
                    <p className="font-bold text-white text-sm">{u.nome}</p>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider mt-0.5 block">{u.cargo}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-300 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      <span>{u.foneContato || '-'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.permissoes.map(p => {
                        const match = availableModules.find(m => m.id === p);
                        return (
                          <span key={p} className="text-[9px] bg-slate-800 text-gray-300 px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wide">
                            {match ? match.label : p}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 px-3 py-1.5 bg-[#1B1B1B] hover:bg-[#2A2A2A] text-gray-300 hover:text-white rounded-lg text-[10px] font-bold border border-[#282828] transition cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={u.id === activeUserId || u.id === 'u_admin'}
                        onClick={() => {
                          if (window.confirm(`Excluir operador ${u.nome}?`)) {
                            onDeleteUsuario(u.id);
                          }
                        }}
                        title={u.id === activeUserId ? 'Você não pode excluir o usuário atualmente logado' : u.id === 'u_admin' ? 'Não é possível excluir o Administrador primário' : 'Excluir operador'}
                        className="p-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg text-[10px] font-bold border border-red-500/20 hover:border-transparent transition disabled:opacity-30 disabled:hover:bg-red-500/10 disabled:hover:text-red-400 disabled:border-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form - Cadastro de Profissionais */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" id="professional-form-modal">
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
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                      {editingUser ? 'Editar Cadastro de Profissional' : 'Novo Operador / Profissional'}
                    </h2>
                    <p className="text-[10px] text-gray-500">Cadastre pessoas e defina os módulos permitidos de acesso.</p>
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
              <form onSubmit={handleUserSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 text-left">
                
                {userError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="font-semibold">{userError}</p>
                  </div>
                )}

                {/* Form fields arranged horizontally in grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nome do Usuário *</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      placeholder="Ex: João da Silva"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 focus:bg-[#0A0A0A] transition outline-none"
                    />
                  </div>

                  {/* Phone contact field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Telefone / Fone Contato *</label>
                    <input
                      type="text"
                      value={foneContato}
                      onChange={(e) => setFoneContato(e.target.value)}
                      required
                      placeholder="Ex: (11) 98888-8888"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 focus:bg-[#0A0A0A] transition outline-none"
                    />
                  </div>

                  {/* Role selection field */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cargo / Função</label>
                    <select
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 focus:bg-[#0A0A0A] transition outline-none cursor-pointer"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Diretor de Ensino">Diretor de Ensino</option>
                      <option value="Secretário">Secretário</option>
                      <option value="Professor">Professor</option>
                    </select>
                  </div>

                </div>

                {/* Permissions checkboxes list */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Módulos Permitidos de Acesso</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#1A1A1A] p-4 rounded-xl border border-[#222222] max-h-[200px] overflow-y-auto">
                    {availableModules.map(mod => {
                      const checked = selectedPermissions.includes(mod.id);
                      return (
                        <div key={mod.id} className="flex items-center gap-2.5 text-xs py-0.5">
                          <input
                            type="checkbox"
                            id={`perm-${mod.id}`}
                            checked={checked}
                            onChange={() => handleTogglePermission(mod.id)}
                            className="w-4 h-4 accent-indigo-650 rounded cursor-pointer"
                          />
                          <label htmlFor={`perm-${mod.id}`} className="text-gray-300 font-semibold cursor-pointer select-none">
                            {mod.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-[#222222] flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4.5 py-2.5 bg-transparent hover:bg-[#222222] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/10 cursor-pointer"
                  >
                    {editingUser ? 'Salvar Edição' : 'Salvar Cadastro'}
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
