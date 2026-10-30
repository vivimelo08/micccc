
import * as SQLite from 'expo-sqlite';

let db;

// ============================================================
// ABRIR BANCO DE DADOS
// ============================================================

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('sunny_health.db');
  }

  return db;
}

// ============================================================
// PEGAR O USUÁRIO ATUALMENTE LOGADO
// ============================================================

export async function getUsuarioLogado() {
  const database = await getDatabase();

  const sessao = await database.getFirstAsync(`
    SELECT usuario_id
    FROM sessao
    WHERE id = 1
    LIMIT 1
  `);

  return sessao?.usuario_id ?? null;
}

// ============================================================
// CRIAR E INICIALIZAR AS TABELAS
// ============================================================

export async function initializeDatabase() {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessao (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      usuario_id INTEGER,
      onboarding_concluido INTEGER DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS questionarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      horas_sono INTEGER,
      qualidade_sono INTEGER,
      despertares INTEGER,
      dificuldade_dormir INTEGER,
      descanso INTEGER,
      refeicoes_dia INTEGER,
      frutas INTEGER,
      verduras INTEGER,
      ultraprocessados INTEGER,
      agua INTEGER,
      humor INTEGER,
      estresse INTEGER,
      relaxamento INTEGER,
      disposicao INTEGER,
      atividade_minutos INTEGER,
      atividade_frequencia INTEGER,
      tipo_sanguineo TEXT,
      fator_rh TEXT,
      tipagem_confirmada TEXT,
      dificuldade_atividades INTEGER,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS medicoes_apollo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      aceleracao_x REAL,
      aceleracao_y REAL,
      aceleracao_z REAL,
      giroscopio_x REAL,
      giroscopio_y REAL,
      giroscopio_z REAL,
      intensidade_sonora REAL,
      recebido_em TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  // Atualiza bancos já existentes sem apagar os dados.
  await adicionarColunaSeNecessario(
    database,
    'questionarios',
    'tipo_sanguineo',
    'TEXT'
  );

  await adicionarColunaSeNecessario(
    database,
    'questionarios',
    'fator_rh',
    'TEXT'
  );

  await adicionarColunaSeNecessario(
    database,
    'questionarios',
    'tipagem_confirmada',
    'TEXT'
  );

  await adicionarColunaSeNecessario(
    database,
    'medicoes_apollo',
    'usuario_id',
    'INTEGER'
  );

  return database;
}

// ============================================================
// ADICIONAR COLUNAS EM BANCOS EXISTENTES
// Não apaga as informações já salvas.
// ============================================================

async function adicionarColunaSeNecessario(
  database,
  tabela,
  coluna,
  tipo
) {
  const colunas = await database.getAllAsync(
    `PRAGMA table_info(${tabela})`
  );

  const existe = colunas.some(
    item => item.name === coluna
  );

  if (!existe) {
    await database.execAsync(
      `ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${tipo}`
    );
  }
}

// ============================================================
// GARANTIR QUE A TABELA DO APOLLO EXISTA
// ============================================================

export async function prepararTabelaApollo() {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS medicoes_apollo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      aceleracao_x REAL,
      aceleracao_y REAL,
      aceleracao_z REAL,
      giroscopio_x REAL,
      giroscopio_y REAL,
      giroscopio_z REAL,
      intensidade_sonora REAL,
      recebido_em TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  await adicionarColunaSeNecessario(
    database,
    'medicoes_apollo',
    'usuario_id',
    'INTEGER'
  );
}

// ============================================================
// SALVAR MEDIÇÃO RECEBIDA PELO BLUETOOTH
// ============================================================

export async function salvarMedicaoApollo(dados) {
  const database = await getDatabase();

  await prepararTabelaApollo();

  const usuarioId = await getUsuarioLogado();

  const recebidoEm =
    dados.recebido_em || new Date().toISOString();

  await database.runAsync(
    `INSERT INTO medicoes_apollo (
      usuario_id,
      aceleracao_x,
      aceleracao_y,
      aceleracao_z,
      giroscopio_x,
      giroscopio_y,
      giroscopio_z,
      intensidade_sonora,
      recebido_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    usuarioId,
    dados.aceleracao_x ?? null,
    dados.aceleracao_y ?? null,
    dados.aceleracao_z ?? null,
    dados.giroscopio_x ?? null,
    dados.giroscopio_y ?? null,
    dados.giroscopio_z ?? null,
    dados.intensidade_sonora ?? null,
    recebidoEm
  );
}

// ============================================================
// BUSCAR A ÚLTIMA MEDIÇÃO DO APOLLO
// ============================================================

export async function buscarUltimaMedicaoApollo() {
  const database = await getDatabase();

  await prepararTabelaApollo();

  const usuarioId = await getUsuarioLogado();

  if (usuarioId == null) {
    return null;
  }

  return await database.getFirstAsync(
    `SELECT *
     FROM medicoes_apollo
     WHERE usuario_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    usuarioId
  );
}

// ============================================================
// BUSCAR HISTÓRICO DE MEDIÇÕES DO USUÁRIO
// ============================================================

export async function buscarHistoricoApollo(limite = 100) {
  const database = await getDatabase();

  await prepararTabelaApollo();

  const usuarioId = await getUsuarioLogado();

  if (usuarioId == null) {
    return [];
  }

  const quantidade = Math.max(
    1,
    Math.min(1000, Math.floor(Number(limite) || 100))
  );

  return await database.getAllAsync(
    `SELECT *
     FROM medicoes_apollo
     WHERE usuario_id = ?
     ORDER BY id DESC
     LIMIT ?`,
    usuarioId,
    quantidade
  );
}


// ============================================================
// BATIMENTOS CARDÍACOS (sensor BLE padrão, serviço 0x180D)
// ============================================================

export async function prepararTabelaCardiaca() {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS medicoes_cardiacas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      bpm INTEGER NOT NULL,
      contato INTEGER,
      recebido_em TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
    CREATE INDEX IF NOT EXISTS idx_cardiaca_usuario
      ON medicoes_cardiacas (usuario_id, id);
  `);
}

export async function salvarBatimento({ bpm, contato, recebido_em }) {
  const database = await getDatabase();

  await prepararTabelaCardiaca();

  const usuarioId = await getUsuarioLogado();

  await database.runAsync(
    `INSERT INTO medicoes_cardiacas (usuario_id, bpm, contato, recebido_em)
     VALUES (?, ?, ?, ?)`,
    usuarioId,
    bpm,
    contato == null ? null : contato ? 1 : 0,
    recebido_em || new Date().toISOString()
  );
}

export async function buscarUltimoBatimento() {
  const database = await getDatabase();

  await prepararTabelaCardiaca();

  const usuarioId = await getUsuarioLogado();

  if (usuarioId == null) return null;

  return await database.getFirstAsync(
    `SELECT * FROM medicoes_cardiacas
     WHERE usuario_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    usuarioId
  );
}

export async function buscarHistoricoBatimentos(limite = 200) {
  const database = await getDatabase();

  await prepararTabelaCardiaca();

  const usuarioId = await getUsuarioLogado();

  if (usuarioId == null) return [];

  const quantidade = Math.max(1, Math.min(2000, Math.floor(Number(limite) || 200)));

  return await database.getAllAsync(
    `SELECT * FROM medicoes_cardiacas
     WHERE usuario_id = ?
     ORDER BY id DESC
     LIMIT ?`,
    usuarioId,
    quantidade
  );
}
