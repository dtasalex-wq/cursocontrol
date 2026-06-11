/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Aluno, Turma, Curso, Frequencia, Pagamento, Transacao, Espera, Usuario } from '../types';

export interface DataPayload {
  alunos: Aluno[];
  turmas: Turma[];
  cursos: Curso[];
  frequencias: Frequencia[];
  pagamentos: Pagamento[];
  transacoes: Transacao[];
  espera: Espera[];
  usuarios: Usuario[];
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Bulk fetch
  fetchData: () => request<DataPayload>('/api/data'),

  // Alunos CRUD
  createAluno: (aluno: Omit<Aluno, 'id'>) => 
    request<Aluno>('/api/alunos', { method: 'POST', body: JSON.stringify(aluno) }),
  updateAluno: (aluno: Aluno) => 
    request<Aluno>(`/api/alunos/${aluno.id}`, { method: 'PUT', body: JSON.stringify(aluno) }),
  deleteAluno: (id: string) => 
    request<{ success: boolean }>(`/api/alunos/${id}`, { method: 'DELETE' }),

  // Turmas CRUD
  createTurma: (turma: Omit<Turma, 'id'>) => 
    request<Turma>('/api/turmas', { method: 'POST', body: JSON.stringify(turma) }),
  updateTurma: (turma: Turma) => 
    request<Turma>(`/api/turmas/${turma.id}`, { method: 'PUT', body: JSON.stringify(turma) }),
  deleteTurma: (id: string) => 
    request<{ success: boolean }>(`/api/turmas/${id}`, { method: 'DELETE' }),

  // Cursos CRUD
  createCurso: (curso: Omit<Curso, 'id'>) => 
    request<Curso>('/api/cursos', { method: 'POST', body: JSON.stringify(curso) }),
  updateCurso: (curso: Curso) => 
    request<Curso>(`/api/cursos/${curso.id}`, { method: 'PUT', body: JSON.stringify(curso) }),
  deleteCurso: (id: string) => 
    request<{ success: boolean }>(`/api/cursos/${id}`, { method: 'DELETE' }),

  // Frequencias CRUD
  createFrequencia: (frequencia: Omit<Frequencia, 'id'>) => 
    request<Frequencia>('/api/frequencias', { method: 'POST', body: JSON.stringify(frequencia) }),
  updateFrequencia: (frequencia: Frequencia) => 
    request<Frequencia>(`/api/frequencias/${frequencia.id}`, { method: 'PUT', body: JSON.stringify(frequencia) }),

  // Pagamentos CRUD
  createPagamento: (pagamento: Omit<Pagamento, 'id'>) => 
    request<Pagamento>('/api/pagamentos', { method: 'POST', body: JSON.stringify(pagamento) }),
  updatePagamento: (pagamento: Pagamento) => 
    request<Pagamento>(`/api/pagamentos/${pagamento.id}`, { method: 'PUT', body: JSON.stringify(pagamento) }),

  // Transacoes CRUD
  createTransacao: (transacao: Omit<Transacao, 'id'>) => 
    request<Transacao>('/api/transacoes', { method: 'POST', body: JSON.stringify(transacao) }),
  deleteTransacao: (id: string) => 
    request<{ success: boolean }>(`/api/transacoes/${id}`, { method: 'DELETE' }),

  // Espera CRUD
  createEspera: (espera: Omit<Espera, 'id' | 'dataRegistro'>) => 
    request<Espera>('/api/espera', { method: 'POST', body: JSON.stringify(espera) }),
  updateEspera: (espera: Espera) => 
    request<Espera>(`/api/espera/${espera.id}`, { method: 'PUT', body: JSON.stringify(espera) }),
  deleteEspera: (id: string) => 
    request<{ success: boolean }>(`/api/espera/${id}`, { method: 'DELETE' }),

  // Usuarios CRUD
  createUsuario: (usuario: Omit<Usuario, 'id'>) => 
    request<Usuario>('/api/usuarios', { method: 'POST', body: JSON.stringify(usuario) }),
  updateUsuario: (usuario: Usuario) => 
    request<Usuario>(`/api/usuarios/${usuario.id}`, { method: 'PUT', body: JSON.stringify(usuario) }),
  deleteUsuario: (id: string) => 
    request<{ success: boolean }>(`/api/usuarios/${id}`, { method: 'DELETE' }),

  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ success: boolean; user: Usuario }>('/api/login', { method: 'POST', body: JSON.stringify(credentials) })
};
