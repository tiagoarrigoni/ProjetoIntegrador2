// src/services/authService.js
import { User } from "../models/User.js";

export class AuthService {
  constructor(db) {
    this.db = db;
  }

  // Validação mínima e registro seguro
  async register({ username, email, password }) {
    // validação básica no serviço (não confie apenas no front-end)
    if (!username || !email || !password) {
      throw new Error("Campos obrigatórios faltando");
    }
    if (typeof password !== "string" || password.length < 6) {
      throw new Error("Senha deve ter ao menos 6 caracteres");
    }

    // Verifica existência prévia (username ou email)
    const existing = await this.db.getAsync(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existing) throw new Error("Usuário ou email já existem");

    // Cria instância e salva (User.setPassword usa bcrypt internamente)
    const user = new User(this.db, { username, email });

    await user.setPassword(password);

    try {
      await user.save(); // espera que User.save use db.runAsync internamente
      return user;
    } catch (err) {
      // Captura erro de constraint do SQLite (caso concorrência gere inserção duplicada)
      if (err && err.code === "SQLITE_CONSTRAINT") {
        throw new Error("Usuário ou email já existem");
      }
      // Repassa erros inesperados
      throw err;
    }
  }

  async login({ username, password }) {
    if (!username || !password) {
      throw new Error("Campos obrigatórios faltando");
    }

    const user = await User.findByUsername(this.db, username);
    if (!user) throw new Error("Usuário não encontrado");

    const ok = await user.verifyPassword(password);
    if (!ok) throw new Error("Senha incorreta");

    return user;
  }
}
