// src/server.js (corrigido para usar serviços/rotas POO + banco absoluto)
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import { promisify } from "util";
import sqlite3 from "sqlite3"; // precisamos porque agora carregamos o DB aqui, não no db.js

// services / routes
import { AuthService } from "./services/authService.js";
import { TestService } from "./services/testService.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createTestRouter } from "./routes/testRoutes.js";
import { createInfoRouter } from "./routes/infoRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;


const dbPath = "D:/GitHUB/ProjetoIntegrador2/database.db";

console.log("📌 Usando banco de dados em:", dbPath);

// Criar instância SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ Erro ao conectar ao banco:", err);
  else console.log("✅ Banco SQLite conectado com sucesso!");
});

// Criar wrappers async (getAsync, runAsync, allAsync)
db.getAsync = promisify(db.get).bind(db);
db.allAsync = promisify(db.all).bind(db);
db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this); // contém lastID
    });
  });

// =======================================================
// Criar tabelas
// =======================================================
(async () => {
  try {
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT
      )
    `);

    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        test_type TEXT,
        score INTEGER,
        result_text TEXT,
        created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS user_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        nome_completo TEXT,
        nascimento TEXT,
        peso REAL,
        altura REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log("📌 Tabelas criadas/verificadas com sucesso!");

  } catch (err) {
    console.error("❌ Erro ao criar tabelas:", err);
    process.exit(1);
  }

  // =======================================================
  // Configurar Express
  // =======================================================
  const app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Servir public/ (fica um nível acima de src/)
  app.use(express.static(path.join(__dirname, "../public")));

  // Sessão
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        sameSite: "lax",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dias
      }
    })
  );

  // =======================================================
  // Services (injeção)
  // =======================================================
  const authService = new AuthService(db);
  const testService = new TestService(db);

  // =======================================================
  // Rotas
  // =======================================================
  app.use("/auth", createAuthRouter(authService));
  app.use("/tests", createTestRouter(testService));
  app.use("/info", createInfoRouter(db));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  });

  // =======================================================
  // Inicializar servidor
  // =======================================================
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📂 Banco em uso: ${dbPath}`);
  });

})();
