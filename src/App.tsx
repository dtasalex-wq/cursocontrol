/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Aluno, 
  Turma, 
  Frequencia, 
  Pagamento, 
  Transacao,
  Espera,
  Usuario,
  Curso
} from './types';
import { 
  INITIAL_ALUNOS, 
  INITIAL_TURMAS, 
  INITIAL_FREQUENCIAS, 
  INITIAL_PAGAMENTOS, 
  INITIAL_TRANSACOES 
} from './data';

// Import components
import Dashboard from './components/Dashboard';
import Alunos from './components/Alunos';
import Turmas from './components/Turmas';
import FrequenciaView from './components/Frequencia';
import Pagamentos from './components/Pagamentos';
import Financeiro from './components/Financeiro';
import Relatorios from './components/Relatorios';
import ListaEspera from './components/ListaEspera';
import Usuarios from './components/Usuarios';
import Cursos from './components/Cursos';
import { api } from './services/api';

// Navigation icons
import { 
  GraduationCap, 
  Users, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  LayoutDashboard,
  Menu,
  X,
  BookOpen,
  Clock,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// One-time database reset migration
if (!localStorage.getItem('escola_db_reset_v2')) {
  localStorage.removeItem('escola_alunos');
  localStorage.removeItem('escola_turmas');
  localStorage.removeItem('escola_frequencias');
  localStorage.removeItem('escola_pagamentos');
  localStorage.removeItem('escola_transacoes');
  localStorage.removeItem('escola_espera');
  localStorage.setItem('escola_db_reset_v2', 'true');
}

// Migrate user permissions to include the new 'cursos_turmas' tab and foneContato field
if (!localStorage.getItem('escola_usuarios_migrated_v3')) {
  localStorage.removeItem('escola_usuarios');
  localStorage.setItem('escola_usuarios_migrated_v3', 'true');
}

export default function App() {
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<'turmas' | 'cursos'>('cursos');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(true);

  // States
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [frequencias, setFrequencias] = useState<Frequencia[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [espera, setEspera] = useState<Espera[]>([]);
  const [initialAlunoForm, setInitialAlunoForm] = useState<(Partial<Aluno> & { esperaId?: string }) | null>(null);

  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const raw = localStorage.getItem('escola_usuarios');
    if (raw) return JSON.parse(raw);
    return [
      {
        id: 'u_admin',
        nome: 'Roberto Silva',
        foneContato: '(11) 98765-4321',
        cargo: 'Diretor de Ensino',
        permissoes: ['dashboard', 'alunos', 'espera', 'cursos_turmas', 'frequencia', 'pagamentos', 'financeiro', 'relatorios', 'usuarios']
      },
      {
        id: 'u_sec',
        nome: 'Carla Souza',
        foneContato: '(11) 97654-3210',
        cargo: 'Secretária',
        permissoes: ['dashboard', 'alunos', 'espera', 'cursos_turmas', 'relatorios']
      }
    ];
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const raw = localStorage.getItem('escola_active_user_id');
    return raw || 'u_admin';
  });

  const [timbre, setTimbre] = useState<string>(() => {
    return localStorage.getItem('escola_timbre') || '';
  });

  const [contratoModelo, setContratoModelo] = useState<string>(() => {
    const raw = localStorage.getItem('escola_contrato_modelo');
    if (raw) return raw;
    return `<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h2>
<p>Pelo presente instrumento, de um lado a <strong>EduTech Escola de Informática</strong>, e de outro lado o(a) aluno(a) <strong>{{nome_aluno}}</strong>, portador(a) do CPF nº <strong>{{cpf_aluno}}</strong>, residente na cidade de <strong>{{cidade_aluno}}</strong>, têm entre si justo e contratado o seguinte:</p>
<p><strong>Cláusula 1ª:</strong> O objeto deste contrato é a prestação de serviços educacionais na turma <strong>{{nome_turma}}</strong> para o curso de <strong>{{curso_nome}}</strong>.</p>
<p><strong>Cláusula 2ª:</strong> O valor contratado para a prestação dos serviços é de <strong>R$ {{valor_mensalidade}}/mês</strong>, a ser pago no melhor dia escolhido pelo contratante (dia {{dia_pagamento}}).</p>
<p>E por estarem de acordo, assinam o presente contrato.</p>
<br/><br/>
<div style="display: flex; justify-content: space-between; margin-top: 50px;">
  <div>_______________________________________<br/>Assinatura do Aluno / Responsável</div>
  <div>_______________________________________<br/>EduTech Escola de Informática</div>
</div>`;
  });

  useEffect(() => {
    localStorage.setItem('escola_usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    localStorage.setItem('escola_active_user_id', activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    localStorage.setItem('escola_timbre', timbre);
  }, [timbre]);

  useEffect(() => {
    localStorage.setItem('escola_contrato_modelo', contratoModelo);
  }, [contratoModelo]);

  const handleAddUsuario = (user: Omit<Usuario, 'id'>) => {
    api.createUsuario(user)
      .then(newU => setUsuarios(prev => [...prev, newU]))
      .catch(err => alert(`Erro ao cadastrar operador: ${err.message}`));
  };

  const handleUpdateUsuario = (updated: Usuario) => {
    api.updateUsuario(updated)
      .then(newU => setUsuarios(prev => prev.map(u => u.id === newU.id ? newU : u)))
      .catch(err => alert(`Erro ao atualizar operador: ${err.message}`));
  };

  const handleDeleteUsuario = (id: string) => {
    api.deleteUsuario(id)
      .then(() => {
        setUsuarios(prev => prev.filter(u => u.id !== id));
        if (activeUserId === id) {
          setActiveUserId('u_admin');
        }
      })
      .catch(err => alert(`Erro ao excluir operador: ${err.message}`));
  };

  const handleSwitchUser = (userId: string) => {
    setActiveUserId(userId);
    const targetUser = usuarios.find(u => u.id === userId);
    if (targetUser && !targetUser.permissoes.includes(activeTab)) {
      const firstAllowed = targetUser.permissoes[0] || 'dashboard';
      setActiveTab(firstAllowed);
    }
  };


  // Fetch initial database state from backend
  useEffect(() => {
    api.fetchData()
      .then(data => {
        setAlunos(data.alunos);
        setTurmas(data.turmas);
        setCursos(data.cursos);
        setFrequencias(data.frequencias);
        setPagamentos(data.pagamentos);
        setTransacoes(data.transacoes);
        setEspera(data.espera);
        setUsuarios(data.usuarios);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load initial data:', err);
        setLoading(false);
      });
  }, []);


  // ==========================================
  // CALLBACKS: STUDENTS
  // ==========================================
  const handleAddAluno = (alunoData: Omit<Aluno, 'id'>) => {
    api.createAluno(alunoData)
      .then(newA => {
        setAlunos(prev => [...prev, newA]);

        // Automatically emit first tuition payment for the month for the student
        const classObj = turmas.find(t => t.id === alunoData.turmaId);
        const cost = classObj ? classObj.valorMensalidade : 300;
        
        const paymentDay = alunoData.diaPagamento || 10;
        const dueDayStr = String(paymentDay).padStart(2, '0');

        const newPayment: Omit<Pagamento, 'id'> = {
          alunoId: newA.id,
          mesReferencia: 'Junho/2026',
          valor: cost,
          dataVencimento: `2026-06-${dueDayStr}`,
          status: 'Pendente'
        };

        api.createPagamento(newPayment)
          .then(newP => setPagamentos(prev => [newP, ...prev]))
          .catch(err => console.error('Erro ao gerar mensalidade inicial:', err));

        // Check if promoted from waiting list
        if (initialAlunoForm && initialAlunoForm.esperaId) {
          const waitItem = espera.find(i => i.id === initialAlunoForm.esperaId);
          if (waitItem) {
            const updatedWait = { ...waitItem, status: 'Matriculado' as const };
            api.updateEspera(updatedWait)
              .then(res => setEspera(prev => prev.map(i => i.id === res.id ? res : i)))
              .catch(err => console.error('Erro ao atualizar status da lista de espera:', err));
          }
          setInitialAlunoForm(null);
        }
      })
      .catch(err => alert(`Erro ao matricular aluno: ${err.message}`));
  };

  const handleUpdateAluno = (updated: Aluno) => {
    api.updateAluno(updated)
      .then(res => setAlunos(prev => prev.map(a => a.id === res.id ? res : a)))
      .catch(err => alert(`Erro ao atualizar aluno: ${err.message}`));
  };

  const handleDeleteAluno = (id: string) => {
    api.deleteAluno(id)
      .then(() => {
        setAlunos(prev => prev.filter(a => a.id !== id));
        setPagamentos(prev => prev.filter(p => p.alunoId !== id));
      })
      .catch(err => alert(`Erro ao excluir aluno: ${err.message}`));
  };

  // ==========================================
  // CALLBACKS: CURSOS
  // ==========================================
  const handleAddCurso = (cursoData: Omit<Curso, 'id'>) => {
    api.createCurso(cursoData)
      .then(newC => setCursos(prev => [...prev, newC]))
      .catch(err => alert(`Erro ao criar curso: ${err.message}`));
  };

  const handleUpdateCurso = (updated: Curso) => {
    api.updateCurso(updated)
      .then(res => setCursos(prev => prev.map(c => c.id === res.id ? res : c)))
      .catch(err => alert(`Erro ao atualizar curso: ${err.message}`));
  };

  const handleDeleteCurso = (id: string) => {
    api.deleteCurso(id)
      .then(() => setCursos(prev => prev.filter(c => c.id !== id)))
      .catch(err => alert(`Erro ao excluir curso: ${err.message}`));
  };

  // ==========================================
  // CALLBACKS: CLASSES
  // ==========================================
  const handleAddTurma = (turmaData: Omit<Turma, 'id'>) => {
    api.createTurma(turmaData)
      .then(newT => setTurmas(prev => [...prev, newT]))
      .catch(err => alert(`Erro ao criar turma: ${err.message}`));
  };

  const handleUpdateTurma = (updated: Turma) => {
    api.updateTurma(updated)
      .then(res => setTurmas(prev => prev.map(t => t.id === res.id ? res : t)))
      .catch(err => alert(`Erro ao atualizar turma: ${err.message}`));
  };

  const handleDeleteTurma = (id: string) => {
    api.deleteTurma(id)
      .then(() => {
        setTurmas(prev => prev.filter(t => t.id !== id));
        setAlunos(prev => prev.map(a => a.turmaId === id ? { ...a, status: 'Inativo', turmaId: '' } : a));
      })
      .catch(err => alert(`Erro ao excluir turma: ${err.message}`));
  };

  // ==========================================
  // CALLBACKS: ATTENDANCES
  // ==========================================
  const handleSaveFrequencia = (freqData: Omit<Frequencia, 'id'>) => {
    const existing = frequencias.find(f => f.turmaId === freqData.turmaId && f.data === freqData.data);
    if (existing) {
      const updated = { ...existing, ...freqData };
      api.updateFrequencia(updated)
        .then(res => setFrequencias(prev => prev.map(f => f.id === res.id ? res : f)))
        .catch(err => alert(`Erro ao salvar frequência: ${err.message}`));
    } else {
      api.createFrequencia(freqData)
        .then(newF => setFrequencias(prev => [...prev, newF]))
        .catch(err => alert(`Erro ao lançar frequência: ${err.message}`));
    }
  };

  // ==========================================
  // CALLBACKS: PAYMENTS
  // ==========================================
  const handleAddPagamento = (payData: Omit<Pagamento, 'id'>) => {
    api.createPagamento(payData)
      .then(newP => setPagamentos(prev => [newP, ...prev]))
      .catch(err => alert(`Erro ao lançar mensalidade: ${err.message}`));
  };

  const handleBaixarPagamento = (
    id: string, 
    formaPagamento: 'Pix' | 'Cartão' | 'Dinheiro', 
    dataPagamento: string
  ) => {
    const targetPayment = pagamentos.find(p => p.id === id);
    if (!targetPayment) return;

    const updated = {
      ...targetPayment,
      status: 'Pago' as const,
      formaPagamento,
      dataPagamento
    };

    api.updatePagamento(updated)
      .then(res => {
        setPagamentos(prev => prev.map(p => p.id === res.id ? res : p));

        // Restore student status to active if they were default outstanding
        const studentObj = alunos.find(a => a.id === res.alunoId);
        if (studentObj && studentObj.status === 'Inadimplente') {
          api.updateAluno({ ...studentObj, status: 'Ativo' })
            .then(resA => setAlunos(prev => prev.map(a => a.id === resA.id ? resA : a)))
            .catch(err => console.error('Erro ao atualizar status do aluno:', err));
        }

        // Lançar transação de receita
        const desc = studentObj ? `Mensalidade ${res.mesReferencia} - ${studentObj.nome}` : `Mensalidade ${res.mesReferencia}`;
        api.createTransacao({
          tipo: 'Receita',
          categoria: 'Mensalidade',
          descricao: desc,
          valor: res.valor,
          data: dataPagamento,
          status: 'Pago'
        })
          .then(newT => setTransacoes(prev => [newT, ...prev]))
          .catch(err => console.error('Erro ao lançar receita de mensalidade:', err));
      })
      .catch(err => alert(`Erro ao processar baixa de mensalidade: ${err.message}`));
  };

  // ==========================================
  // CALLBACKS: GENERAL LEDGER
  // ==========================================
  const handleAddTransacao = (transData: Omit<Transacao, 'id'>) => {
    api.createTransacao(transData)
      .then(newT => setTransacoes(prev => [newT, ...prev]))
      .catch(err => alert(`Erro ao lançar transação: ${err.message}`));
  };

  const handleDeleteTransacao = (id: string) => {
    api.deleteTransacao(id)
      .then(() => setTransacoes(prev => prev.filter(t => t.id !== id)))
      .catch(err => alert(`Erro ao excluir transação: ${err.message}`));
  };

  // ==========================================
  // CALLBACKS: WAITING LIST (ESPERA)
  // ==========================================
  const handleAddEspera = (itemData: Omit<Espera, 'id' | 'dataRegistro'>) => {
    api.createEspera(itemData)
      .then(newE => setEspera(prev => [newE, ...prev]))
      .catch(err => alert(`Erro ao cadastrar na lista de espera: ${err.message}`));
  };

  const handleUpdateEspera = (updated: Espera) => {
    api.updateEspera(updated)
      .then(res => setEspera(prev => prev.map(item => item.id === res.id ? res : item)))
      .catch(err => alert(`Erro ao atualizar interessado: ${err.message}`));
  };

  const handleDeleteEspera = (id: string) => {
    api.deleteEspera(id)
      .then(() => setEspera(prev => prev.filter(item => item.id !== id)))
      .catch(err => alert(`Erro ao excluir da lista de espera: ${err.message}`));
  };

  const handlePromoteToStudent = (item: Espera) => {
    const matchedTurma = turmas.find(t => t.curso === item.curso || t.nome === item.curso) || turmas[0];
    setInitialAlunoForm({
      nome: item.nome,
      email: item.contato.includes('@') ? item.contato : '',
      telefone: !item.contato.includes('@') ? item.contato : '',
      cidade: item.cidade || '',
      status: 'Ativo',
      turmaId: matchedTurma ? matchedTurma.id : '',
      diaPagamento: 10,
      esperaId: item.id
    });
    setActiveTab('alunos');
  };


  // Side navigation menus list
  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'alunos', label: 'Cadastro Alunos', icon: Users },
    { id: 'espera', label: 'Lista de Espera', icon: Clock },
    { id: 'cursos_turmas', label: 'Cursos e Turmas', icon: GraduationCap },
    { id: 'frequencia', label: 'Frequência / Chamada', icon: CheckCircle },
    { id: 'pagamentos', label: 'Mensalidades', icon: DollarSign },
    { id: 'financeiro', label: 'Financeiro / Fluxo', icon: TrendingUp },
    { id: 'relatorios', label: 'Relatórios Diversos', icon: FileText },
    { id: 'usuarios', label: 'Usuários e Permissões', icon: Shield }
  ];

  const activeUser = usuarios.find(u => u.id === activeUserId) || usuarios[0];
  const allowedTabs = activeUser ? activeUser.permissoes : navItems.map(n => n.id);
  const filteredNavItems = navItems.filter(item => allowedTabs.includes(item.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4 font-sans select-none">
        <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">Carregando Banco de Dados Turso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0A0A] text-[#E5E7EB]" id="main-app-container">
      
      {/* Mobile Header Menu (Hidden on Large layout screen, hidden on A4 prints) */}
      <header className="md:hidden no-print flex items-center justify-between px-5 py-4 bg-[#0D0D0D] text-[#E5E7EB] border-b border-[#222222] shadow-md select-none">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span className="font-bold tracking-tight text-sm">EduTech Escola</span>
        </div>
        <button 
          onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
          className="p-1 hover:bg-[#1A1A1A] rounded text-slate-200 focus:outline-none"
        >
          {isSidebarMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Navigation sidebar (Persistent desktop sidebar, modal mobile slide, hidden on print matches) */}
      <aside className={`no-print shrink-0 md:w-64 bg-[#111111] border-r border-[#222222] text-slate-300 flex flex-col justify-between select-none ${
        isSidebarMobileOpen ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'
      }`}>
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="p-6 mb-4 border-b border-[#222222] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-100 text-sm tracking-tight block uppercase">EduTech</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold font-mono">Secretaria v1.4</span>
              </div>
            </div>
            {isSidebarMobileOpen && (
              <button 
                onClick={() => setIsSidebarMobileOpen(false)}
                className="md:hidden p-1 bg-[#1A1A1A] hover:bg-[#222222] text-slate-300 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Items list */}
          <nav className="px-4 space-y-1">
            {filteredNavItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 select-none ${
                    active 
                      ? 'bg-[#1A1A1A] text-white border border-[#333333]' 
                      : 'hover:bg-[#1A1A1A] hover:text-white text-gray-400 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Corporate small footer signature */}
        <div className="p-5 border-t border-[#222222] text-[10px] text-gray-500 font-mono space-y-1 text-center font-semibold">
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#333333] text-left">
            <p className="text-[9px] text-gray-500 font-bold uppercase mb-2">Usuário Ativo</p>
            <select
              value={activeUserId}
              onChange={(e) => handleSwitchUser(e.target.value)}
              className="w-full bg-[#0A0A0A] text-xs text-gray-300 font-semibold outline-none border border-[#222222] rounded-lg p-1.5 focus:border-indigo-500 cursor-pointer"
            >
              {usuarios.map(u => (
                <option key={u.id} value={u.id} className="bg-[#111111]">{u.nome} ({u.cargo})</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Main workspace container */}
      <main className="flex-1 min-w-0 flex flex-col pt-0 md:pt-0 bg-[#0A0A0A]">
        
        {/* Dynamic route loader with subtle smooth transition animation */}
        <div className="flex-1 p-5 md:p-8 overflow-y-auto w-full mx-auto" id="app-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  alunos={alunos}
                  turmas={turmas}
                  frequencias={frequencias}
                  pagamentos={pagamentos}
                  transacoes={transacoes}
                  onNavigate={(tab) => {
                    if (tab === 'turmas') {
                      setActiveSubTab('turmas');
                      setActiveTab('cursos_turmas');
                    } else if (tab === 'cursos') {
                      setActiveSubTab('cursos');
                      setActiveTab('cursos_turmas');
                    } else {
                      setActiveTab(tab);
                    }
                  }}
                />
              )}

              {activeTab === 'alunos' && (
                <Alunos 
                  alunos={alunos}
                  turmas={turmas}
                  onAddAluno={handleAddAluno}
                  onUpdateAluno={handleUpdateAluno}
                  onDeleteAluno={handleDeleteAluno}
                  initialFormData={initialAlunoForm}
                  clearInitialFormData={() => setInitialAlunoForm(null)}
                  timbre={timbre}
                  contratoModelo={contratoModelo}
                />
              )}

              {activeTab === 'espera' && (
                <ListaEspera 
                  turmas={turmas}
                  espera={espera}
                  onAddEspera={handleAddEspera}
                  onUpdateEspera={handleUpdateEspera}
                  onDeleteEspera={handleDeleteEspera}
                  onPromoteToStudent={handlePromoteToStudent}
                />
              )}

              {activeTab === 'cursos_turmas' && (
                <div className="space-y-6">
                  {/* Top sub-navigation tabs */}
                  <div className="flex gap-2 border-b border-[#222222] pb-px no-print">
                    <button
                      onClick={() => setActiveSubTab('cursos')}
                      className={`px-5 py-2.5 text-xs font-bold transition-all relative cursor-pointer ${
                        activeSubTab === 'cursos' 
                          ? 'text-white border-b-2 border-indigo-500 font-semibold animate-none' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Gerenciar Cursos
                    </button>
                    <button
                      onClick={() => setActiveSubTab('turmas')}
                      className={`px-5 py-2.5 text-xs font-bold transition-all relative cursor-pointer ${
                        activeSubTab === 'turmas' 
                          ? 'text-white border-b-2 border-indigo-500 font-semibold animate-none' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Gerenciar Turmas
                    </button>
                  </div>

                  {/* Render based on sub-tab */}
                  {activeSubTab === 'turmas' ? (
                    <Turmas 
                      turmas={turmas}
                      alunos={alunos}
                      cursos={cursos}
                      onAddTurma={handleAddTurma}
                      onUpdateTurma={handleUpdateTurma}
                      onDeleteTurma={handleDeleteTurma}
                    />
                  ) : (
                    <Cursos 
                      cursos={cursos}
                      onAddCurso={handleAddCurso}
                      onUpdateCurso={handleUpdateCurso}
                      onDeleteCurso={handleDeleteCurso}
                    />
                  )}
                </div>
              )}

              {activeTab === 'frequencia' && (
                <FrequenciaView 
                  alunos={alunos}
                  turmas={turmas}
                  frequencias={frequencias}
                  onSaveFrequencia={handleSaveFrequencia}
                />
              )}

              {activeTab === 'pagamentos' && (
                <Pagamentos 
                  pagamentos={pagamentos}
                  alunos={alunos}
                  turmas={turmas}
                  onAddPagamento={handleAddPagamento}
                  onBaixarPagamento={handleBaixarPagamento}
                />
              )}

              {activeTab === 'financeiro' && (
                <Financeiro 
                  transacoes={transacoes}
                  onAddTransacao={handleAddTransacao}
                  onDeleteTransacao={handleDeleteTransacao}
                />
              )}

              {activeTab === 'relatorios' && (
                <Relatorios 
                  alunos={alunos}
                  turmas={turmas}
                  frequencias={frequencias}
                  pagamentos={pagamentos}
                  transacoes={transacoes}
                  espera={espera}
                  timbre={timbre}
                  contratoModelo={contratoModelo}
                />
              )}

              {activeTab === 'usuarios' && (
                <Usuarios 
                  usuarios={usuarios}
                  activeUserId={activeUserId}
                  onAddUsuario={handleAddUsuario}
                  onUpdateUsuario={handleUpdateUsuario}
                  onDeleteUsuario={handleDeleteUsuario}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}
