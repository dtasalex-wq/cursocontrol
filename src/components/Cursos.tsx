/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Curso } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  BookOpen, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CursosProps {
  cursos: Curso[];
  onAddCurso: (curso: Omit<Curso, 'id'>) => void;
  onUpdateCurso: (curso: Curso) => void;
  onDeleteCurso: (id: string) => void;
}

export default function Cursos({ 
  cursos, 
  onAddCurso, 
  onUpdateCurso, 
  onDeleteCurso 
}: CursosProps) {
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState<number>(120);
  const [formError, setFormError] = useState('');

  // Handle open modal for new course
  const handleOpenAdd = () => {
    setEditingCurso(null);
    setNome('');
    setCargaHoraria(120);
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle open modal for editing
  const handleOpenEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setNome(curso.nome);
    setCargaHoraria(curso.cargaHoraria);
    setFormError('');
    setIsFormOpen(true);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome.trim()) {
      setFormError('O nome do curso é obrigatório.');
      return;
    }

    if (Number(cargaHoraria) <= 0) {
      setFormError('A carga horária deve ser maior que 0 horas.');
      return;
    }

    const courseData = {
      nome: nome.trim(),
      cargaHoraria: Number(cargaHoraria)
    };

    if (editingCurso) {
      onUpdateCurso({
        ...courseData,
        id: editingCurso.id
      });
    } else {
      onAddCurso(courseData);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 bg-[#0A0A0A] text-[#E5E7EB]" id="cursos-module-container">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-[#222222] gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white mb-1" id="cursos-title">
            Cadastro de <span className="text-indigo-400 font-semibold">Cursos</span>
          </h1>
          <p className="text-xs text-gray-400">Gerencie a grade curricular, cursos ativos e carga horária acadêmica.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          id="btn-new-course"
          className="flex items-center justify-center gap-1.5 px-4.5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition duration-150 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Curso</span>
        </button>
      </div>

      {/* Courses List Table - Full Width */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-xl" id="cursos-table-container">
        {cursos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#181818] border-b border-[#222222] text-[#9CA3AF] uppercase font-bold tracking-wider font-mono">
                  <th className="px-6 py-4">Curso</th>
                  <th className="px-6 py-4">Carga Horária</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {cursos.map((c) => (
                  <tr key={c.id} className="hover:bg-[#161616] transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-xs select-all">{c.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-550 shrink-0" />
                        <span>{c.cargaHoraria} horas</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-400">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="Editar curso"
                          className="p-1.5 bg-[#1B1B1B] hover:bg-[#2A2A2A] rounded-lg text-gray-300 hover:text-white cursor-pointer transition border border-[#282828]"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Excluir o curso "${c.nome}"?`)) {
                              onDeleteCurso(c.id);
                            }
                          }}
                          title="Excluir curso"
                          className="p-1.5 bg-[#1B1B1B] hover:bg-red-500/10 text-gray-450 hover:text-red-400 rounded-lg cursor-pointer transition border border-[#282828]"
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
            <BookOpen className="w-12 h-12 text-indigo-500/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-300">Nenhum curso registrado</p>
            <p className="text-xs text-gray-500 mt-1">Cadastre o primeiro curso no sistema para vincular a turmas.</p>
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
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  {editingCurso ? 'Editar Cadastro de Curso' : 'Cadastrar Novo Curso'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-[#222222] text-gray-400 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-left">
                
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="font-semibold">{formError}</p>
                  </div>
                )}

                {/* Input Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nome do Curso *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Ex: Desenvolvimento Web Fullstack"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition outline-none"
                  />
                </div>

                {/* Input Workload */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Carga Horária (horas) *</label>
                  <input
                    type="number"
                    value={cargaHoraria}
                    onChange={(e) => setCargaHoraria(Number(e.target.value))}
                    required
                    min={1}
                    placeholder="Ex: 120"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-xl text-white focus:border-indigo-500 transition outline-none"
                  />
                </div>

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
                    {editingCurso ? 'Salvar Alterações' : 'Cadastrar Curso'}
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
