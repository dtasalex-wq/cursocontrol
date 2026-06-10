/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataMatricula: string;
  status: 'Ativo' | 'Inativo' | 'Inadimplente' | 'Aguardando';
  turmaId: string; // Vínculo com a Turma
  endereco?: string;
  numero?: string;
  cidade?: string;
  bairro?: string;
  fone1?: string;
  fone2?: string;
  dataNascimento?: string;
  rg?: string;
  nomeResponsavel?: string;
  rgResponsavel?: string;
  cpfResponsavel?: string;
  diaPagamento?: number; // Melhor dia de pagamento (5, 10, 15, 20, 30)
}

export interface Turma {
  id: string;
  nome: string;
  curso: string;
  professor: string;
  horario: string; // Ex: "19:00 - 21:00"
  diasSemana: string[]; // Ex: ["Terça", "Quinta"]
  maxAlunos: number;
  valorMensalidade: number;
  duracaoMeses?: number; // Duração do curso em meses (ex: 6)
  valorMatricula?: number; // Valor de matrícula/taxa de inscrição
  mesesMinistrados?: string[]; // Meses que o curso será ministrado (Ex: ["Janeiro", "Fevereiro"])
  codigo?: string; // Código da turma, ex: "2026.1"
}

export interface Frequencia {
  id: string;
  turmaId: string;
  data: string; // YYYY-MM-DD
  presencas: { alunoId: string; presente: boolean }[];
  aulaMinistrada?: boolean; // Se a aula foi ministrada (true por padrão ou se omitido)
  motivoNaoMinistrada?: string; // Motivo de não ter sido ministrada
  conteudoAplicado?: string; // Breve descrição do conteúdo aplicado
}

export interface Pagamento {
  id: string;
  alunoId: string;
  mesReferencia: string; // Ex: "Junho/2026"
  valor: number;
  dataVencimento: string; // YYYY-MM-DD
  dataPagamento?: string; // YYYY-MM-DD
  status: 'Pago' | 'Pendente' | 'Atrasado';
  formaPagamento?: 'Pix' | 'Cartão' | 'Dinheiro';
}

export interface Transacao {
  id: string;
  tipo: 'Receita' | 'Despesa';
  categoria: string; // Ex: "Mensalidade", "Salário Professor", "Energia", "Internet", "Software", "Aluguel"
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  status: 'Pago' | 'Pendente';
}

export interface Espera {
  id: string;
  nome: string;
  contato: string;
  cidade?: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  curso: string; // Unique course name from registered classes
  dataRegistro: string; // YYYY-MM-DD
  status: 'Pendente' | 'Matriculado' | 'Cancelado';
  observacoes?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email?: string;
  foneContato?: string;
  cargo: string;
  permissoes: string[];
}

export interface Curso {
  id: string;
  nome: string;
  cargaHoraria: number; // in hours, e.g. 120
}


