/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';

// Configure dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

let dbInitialized = false;
let dbInitializingPromise: Promise<void> | null = null;

async function ensureDb() {
  if (dbInitialized) return;
  if (!dbInitializingPromise) {
    dbInitializingPromise = initDb().then(() => {
      dbInitialized = true;
    });
  }
  await dbInitializingPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err: any) {
    res.status(500).send(`Database initialization failed: ${err.message}`);
  }
});

// Initialize Turso client (falls back to local SQLite file for easy development)
const dbUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const dbToken = process.env.TURSO_AUTH_TOKEN;

console.log(`Connecting database to: ${dbUrl}`);
const client = createClient({
  url: dbUrl,
  authToken: dbToken
});

// Helper to safely execute SQL queries
async function runQuery(sql: string, args: any[] = []) {
  try {
    return await client.execute({ sql, args });
  } catch (error: any) {
    console.error(`SQL Error: ${error.message} on query: ${sql}`);
    throw error;
  }
}

// Database schema initialization
async function initDb() {
  console.log('Initializing database schema...');

  // 1. Cursos table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS cursos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cargaHoraria INTEGER NOT NULL
    )
  `);

  // 2. Turmas table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS turmas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      curso TEXT NOT NULL,
      professor TEXT NOT NULL,
      horario TEXT NOT NULL,
      diasSemana TEXT NOT NULL, -- JSON stringified array of strings
      maxAlunos INTEGER NOT NULL,
      valorMensalidade REAL NOT NULL,
      duracaoMeses INTEGER,
      valorMatricula REAL,
      mesesMinistrados TEXT, -- JSON stringified array of strings
      codigo TEXT
    )
  `);

  // 3. Alunos table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS alunos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      cpf TEXT,
      dataMatricula TEXT,
      status TEXT NOT NULL,
      turmaId TEXT NOT NULL,
      endereco TEXT,
      numero TEXT,
      cidade TEXT,
      bairro TEXT,
      fone1 TEXT,
      fone2 TEXT,
      dataNascimento TEXT,
      rg TEXT,
      nomeResponsavel TEXT,
      rgResponsavel TEXT,
      cpfResponsavel TEXT,
      diaPagamento INTEGER
    )
  `);

  // 4. Frequencias table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS frequencias (
      id TEXT PRIMARY KEY,
      turmaId TEXT NOT NULL,
      data TEXT NOT NULL,
      presencas TEXT NOT NULL, -- JSON stringified array of objects
      aulaMinistrada INTEGER DEFAULT 1, -- 1 = true, 0 = false
      motivoNaoMinistrada TEXT,
      conteudoAplicado TEXT
    )
  `);

  // 5. Pagamentos table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS pagamentos (
      id TEXT PRIMARY KEY,
      alunoId TEXT NOT NULL,
      mesReferencia TEXT NOT NULL,
      valor REAL NOT NULL,
      dataVencimento TEXT NOT NULL,
      dataPagamento TEXT,
      status TEXT NOT NULL,
      formaPagamento TEXT
    )
  `);

  // 6. Transacoes table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS transacoes (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      categoria TEXT NOT NULL,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  // 7. Espera table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS espera (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      contato TEXT NOT NULL,
      cidade TEXT,
      turno TEXT NOT NULL,
      curso TEXT NOT NULL,
      dataRegistro TEXT NOT NULL,
      status TEXT NOT NULL,
      observacoes TEXT
    )
  `);

  // 8. Usuarios table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT,
      foneContato TEXT,
      cargo TEXT NOT NULL,
      permissoes TEXT NOT NULL, -- JSON stringified array of strings
      login TEXT,
      senha TEXT
    )
  `);

  // Run migrations to add login and senha if missing
  try {
    await runQuery('ALTER TABLE usuarios ADD COLUMN login TEXT');
  } catch (e) {}
  try {
    await runQuery('ALTER TABLE usuarios ADD COLUMN senha TEXT');
  } catch (e) {}

  // Seed default data if database is empty
  const usersCheck = await runQuery('SELECT COUNT(*) as count FROM usuarios');
  if (usersCheck.rows[0]?.count === 0) {
    console.log('Seeding initial database data...');

    // Default users
    await runQuery(`
      INSERT INTO usuarios (id, nome, foneContato, cargo, permissoes, login, senha)
      VALUES 
      ('u_admin', 'Roberto Silva', '(11) 98765-4321', 'Diretor de Ensino', '["dashboard", "alunos", "espera", "cursos_turmas", "frequencia", "pagamentos", "financeiro", "relatorios", "usuarios"]', 'admin', 'admin123'),
      ('u_sec', 'Carla Souza', '(11) 97654-3210', 'Secretária', '["dashboard", "alunos", "espera", "cursos_turmas", "relatorios"]', 'secretaria', 'sec123')
    `);

    // Default courses
    await runQuery(`
      INSERT INTO cursos (id, nome, cargaHoraria)
      VALUES
      ('c_web', 'Desenvolvimento Web Fullstack', 360),
      ('c_python', 'Python Iniciante ao Avançado', 120),
      ('c_info', 'Informática Básica', 60)
    `);
  } else {
    // If not empty, make sure seeded users have default logins if they were null/empty
    await runQuery(`UPDATE usuarios SET login = 'admin', senha = 'admin123' WHERE id = 'u_admin' AND (login IS NULL OR login = '')`);
    await runQuery(`UPDATE usuarios SET login = 'secretaria', senha = 'sec123' WHERE id = 'u_sec' AND (login IS NULL OR login = '')`);
  }

  console.log('Database schema initialization completed.');
}

// ------------------------------------------
// API ENDPOINTS
// ------------------------------------------

// 1. Bulk Fetch
app.get('/api/data', async (req, res) => {
  try {
    const [alunosRes, turmasRes, cursosRes, freqRes, pagRes, transRes, esperaRes, usersRes] = await Promise.all([
      runQuery('SELECT * FROM alunos'),
      runQuery('SELECT * FROM turmas'),
      runQuery('SELECT * FROM cursos'),
      runQuery('SELECT * FROM frequencias'),
      runQuery('SELECT * FROM pagamentos'),
      runQuery('SELECT * FROM transacoes'),
      runQuery('SELECT * FROM espera'),
      runQuery('SELECT id, nome, email, foneContato, cargo, permissoes, login FROM usuarios')
    ]);

    // Parse stringified columns
    const turmas = turmasRes.rows.map((r: any) => ({
      ...r,
      diasSemana: JSON.parse(r.diasSemana),
      mesesMinistrados: r.mesesMinistrados ? JSON.parse(r.mesesMinistrados) : []
    }));

    const frequencias = freqRes.rows.map((r: any) => ({
      ...r,
      presencas: JSON.parse(r.presencas),
      aulaMinistrada: r.aulaMinistrada === 1
    }));

    const usuarios = usersRes.rows.map((r: any) => ({
      ...r,
      permissoes: JSON.parse(r.permissoes)
    }));

    res.json({
      alunos: alunosRes.rows,
      turmas,
      cursos: cursosRes.rows,
      frequencias,
      pagamentos: pagRes.rows,
      transacoes: transRes.rows,
      espera: esperaRes.rows,
      usuarios
    });
  } catch (err: any) {
    res.status(500).send(`Server Error: ${err.message}`);
  }
});

// 2. Alunos CRUD
app.post('/api/alunos', async (req, res) => {
  try {
    const a = req.body;
    const id = a.id || `a_${Date.now().toString(36)}`;
    await runQuery(`
      INSERT INTO alunos (
        id, nome, email, telefone, cpf, dataMatricula, status, turmaId, 
        endereco, numero, cidade, bairro, fone1, fone2, dataNascimento, 
        rg, nomeResponsavel, rgResponsavel, cpfResponsavel, diaPagamento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, a.nome, a.email, a.telefone, a.cpf, a.dataMatricula, a.status, a.turmaId,
      a.endereco, a.numero, a.cidade, a.bairro, a.fone1, a.fone2, a.dataNascimento,
      a.rg, a.nomeResponsavel, a.rgResponsavel, a.cpfResponsavel, a.diaPagamento
    ]);
    res.json({ ...a, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.put('/api/alunos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const a = req.body;
    await runQuery(`
      UPDATE alunos SET 
        nome = ?, email = ?, telefone = ?, cpf = ?, dataMatricula = ?, status = ?, turmaId = ?, 
        endereco = ?, numero = ?, cidade = ?, bairro = ?, fone1 = ?, fone2 = ?, dataNascimento = ?, 
        rg = ?, nomeResponsavel = ?, rgResponsavel = ?, cpfResponsavel = ?, diaPagamento = ?
      WHERE id = ?
    `, [
      a.nome, a.email, a.telefone, a.cpf, a.dataMatricula, a.status, a.turmaId,
      a.endereco, a.numero, a.cidade, a.bairro, a.fone1, a.fone2, a.dataNascimento,
      a.rg, a.nomeResponsavel, a.rgResponsavel, a.cpfResponsavel, a.diaPagamento,
      id
    ]);
    res.json({ ...a, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/alunos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM alunos WHERE id = ?', [id]);
    await runQuery('DELETE FROM pagamentos WHERE alunoId = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 3. Turmas CRUD
app.post('/api/turmas', async (req, res) => {
  try {
    const t = req.body;
    const id = t.id || `t_${Date.now().toString(36)}`;
    await runQuery(`
      INSERT INTO turmas (
        id, nome, curso, professor, horario, diasSemana, maxAlunos, 
        valorMensalidade, duracaoMeses, valorMatricula, mesesMinistrados, codigo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, t.nome, t.curso, t.professor, t.horario, JSON.stringify(t.diasSemana), t.maxAlunos,
      t.valorMensalidade, t.duracaoMeses, t.valorMatricula, JSON.stringify(t.mesesMinistrados), t.codigo
    ]);
    res.json({ ...t, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.put('/api/turmas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const t = req.body;
    await runQuery(`
      UPDATE turmas SET 
        nome = ?, curso = ?, professor = ?, horario = ?, diasSemana = ?, maxAlunos = ?, 
        valorMensalidade = ?, duracaoMeses = ?, valorMatricula = ?, mesesMinistrados = ?, codigo = ?
      WHERE id = ?
    `, [
      t.nome, t.curso, t.professor, t.horario, JSON.stringify(t.diasSemana), t.maxAlunos,
      t.valorMensalidade, t.duracaoMeses, t.valorMatricula, JSON.stringify(t.mesesMinistrados), t.codigo,
      id
    ]);
    res.json({ ...t, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/turmas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM turmas WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 4. Cursos CRUD
app.post('/api/cursos', async (req, res) => {
  try {
    const c = req.body;
    const id = c.id || `c_${Date.now().toString(36)}`;
    await runQuery('INSERT INTO cursos (id, nome, cargaHoraria) VALUES (?, ?, ?)', [
      id, c.nome, c.cargaHoraria
    ]);
    res.json({ ...c, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.put('/api/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const c = req.body;
    await runQuery('UPDATE cursos SET nome = ?, cargaHoraria = ? WHERE id = ?', [
      c.nome, c.cargaHoraria, id
    ]);
    res.json({ ...c, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM cursos WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 5. Frequencias CRUD
app.post('/api/frequencias', async (req, res) => {
  try {
    const f = req.body;
    const id = f.id || `f_${Date.now().toString(36)}`;
    await runQuery(`
      INSERT INTO frequencias (id, turmaId, data, presencas, aulaMinistrada, motivoNaoMinistrada, conteudoAplicado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, f.turmaId, f.data, JSON.stringify(f.presencas), f.aulaMinistrada ? 1 : 0, f.motivoNaoMinistrada, f.conteudoAplicado
    ]);
    res.json({ ...f, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.put('/api/frequencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const f = req.body;
    await runQuery(`
      UPDATE frequencias SET 
        turmaId = ?, data = ?, presencas = ?, aulaMinistrada = ?, motivoNaoMinistrada = ?, conteudoAplicado = ?
      WHERE id = ?
    `, [
      f.turmaId, f.data, JSON.stringify(f.presencas), f.aulaMinistrada ? 1 : 0, f.motivoNaoMinistrada, f.conteudoAplicado,
      id
    ]);
    res.json({ ...f, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 6. Pagamentos CRUD
app.post('/api/pagamentos', async (req, res) => {
  try {
    const p = req.body;
    const id = p.id || `p_${Date.now().toString(36)}`;
    await runQuery(`
      INSERT INTO pagamentos (id, alunoId, mesReferencia, valor, dataVencimento, dataPagamento, status, formaPagamento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, p.alunoId, p.mesReferencia, p.valor, p.dataVencimento, p.dataPagamento, p.status, p.formaPagamento
    ]);
    res.json({ ...p, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.put('/api/pagamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    await runQuery(`
      UPDATE pagamentos SET 
        alunoId = ?, mesReferencia = ?, valor = ?, dataVencimento = ?, dataPagamento = ?, status = ?, formaPagamento = ?
      WHERE id = ?
    `, [
      p.alunoId, p.mesReferencia, p.valor, p.dataVencimento, p.dataPagamento, p.status, p.formaPagamento,
      id
    ]);
    res.json({ ...p, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 7. Transacoes CRUD
app.post('/api/transacoes', async (req, res) => {
  try {
    const t = req.body;
    const id = t.id || `t_${Date.now().toString(36)}`;
    await runQuery(`
      INSERT INTO transacoes (id, tipo, categoria, descricao, valor, data, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, t.tipo, t.categoria, t.descricao, t.valor, t.data, t.status
    ]);
    res.json({ ...t, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM transacoes WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 8. Espera CRUD
app.post('/api/espera', async (req, res) => {
  try {
    const e = req.body;
    const id = e.id || `e_${Date.now().toString(36)}`;
    const dataRegistro = e.dataRegistro || new Date().toISOString().split('T')[0];
    await runQuery(`
      INSERT INTO espera (id, nome, contato, cidade, turno, curso, dataRegistro, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, e.nome, e.contato, e.cidade, e.turno, e.curso, dataRegistro, e.status, e.observacoes
    ]);
    res.json({ ...e, id, dataRegistro });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.put('/api/espera/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const e = req.body;
    await runQuery(`
      UPDATE espera SET 
        nome = ?, contato = ?, cidade = ?, turno = ?, curso = ?, dataRegistro = ?, status = ?, observacoes = ?
      WHERE id = ?
    `, [
      e.nome, e.contato, e.cidade, e.turno, e.curso, e.dataRegistro, e.status, e.observacoes,
      id
    ]);
    res.json({ ...e, id });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/espera/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM espera WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 9. Usuarios CRUD
app.post('/api/usuarios', async (req, res) => {
  try {
    const u = req.body;
    const id = u.id || `u_${Date.now().toString(36)}`;
    await runQuery(`
      INSERT INTO usuarios (id, nome, email, foneContato, cargo, permissoes, login, senha)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, u.nome, u.email, u.foneContato, u.cargo, JSON.stringify(u.permissoes), u.login, u.senha
    ]);
    res.json({ ...u, id, senha: undefined });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const u = req.body;
    if (u.senha && u.senha.trim() !== '') {
      await runQuery(`
        UPDATE usuarios SET 
          nome = ?, email = ?, foneContato = ?, cargo = ?, permissoes = ?, login = ?, senha = ?
        WHERE id = ?
      `, [
        u.nome, u.email, u.foneContato, u.cargo, JSON.stringify(u.permissoes), u.login, u.senha,
        id
      ]);
    } else {
      await runQuery(`
        UPDATE usuarios SET 
          nome = ?, email = ?, foneContato = ?, cargo = ?, permissoes = ?, login = ?
        WHERE id = ?
      `, [
        u.nome, u.email, u.foneContato, u.cargo, JSON.stringify(u.permissoes), u.login,
        id
      ]);
    }
    res.json({ ...u, id, senha: undefined });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 10. Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check support credentials first (Suporte / SuporteABC, Master / master123)
    if (username === 'Suporte' && password === 'SuporteABC') {
      return res.json({
        success: true,
        user: {
          id: 'u_suporte',
          nome: 'Suporte',
          cargo: 'Suporte',
          permissoes: ['dashboard', 'alunos', 'espera', 'cursos_turmas', 'frequencia', 'pagamentos', 'financeiro', 'relatorios', 'usuarios']
        }
      });
    }

    if (username === 'Master' && password === 'master123') {
      return res.json({
        success: true,
        user: {
          id: 'u_master',
          nome: 'Master',
          cargo: 'Master',
          permissoes: ['dashboard', 'alunos', 'espera', 'cursos_turmas', 'frequencia', 'pagamentos', 'financeiro', 'relatorios', 'usuarios']
        }
      });
    }

    // Check database users
    const result = await runQuery('SELECT id, nome, email, foneContato, cargo, permissoes FROM usuarios WHERE login = ? AND senha = ?', [username, password]);

    if (result.rows.length > 0) {
      const dbUser = result.rows[0];
      return res.json({
        success: true,
        user: {
          ...dbUser,
          permissoes: JSON.parse(dbUser.permissoes as string)
        }
      });
    }

    return res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// ------------------------------------------
// PRODUCTION ROUTING
// ------------------------------------------
// Serve static client bundle in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  // If request is for API routes but matches none, let Express return 404
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Initialize database schema and start listening
const port = process.env.PORT || 3001;
if (!process.env.VERCEL) {
  initDb().then(() => {
    app.listen(port, () => {
      console.log(`Server API listening on port http://localhost:${port}`);
    });
  }).catch(err => {
    console.error('Failed to start server due to database error:', err);
  });
}

export default app;
