// src/models/User.js
import { BaseModel } from "./BaseModel.js";
import bcrypt from "bcrypt";

export class User extends BaseModel {
  constructor(db, { id = null, username = null, email = null, password = null } = {}) {
    super(db);
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password; // hashed
  }

  static async findByUsername(db, username) {
    if (!username) return null;
    const row = await db.getAsync("SELECT * FROM users WHERE username = ?", [username]);
    if (!row) return null;
    return new User(db, row);
  }

  static async findById(db, id) {
    if (!id) return null;
    const row = await db.getAsync("SELECT * FROM users WHERE id = ?", [id]);
    if (!row) return null;
    return new User(db, row);
  }

  // valida e seta a senha hasheada
  async setPassword(plain) {
    if (!plain || typeof plain !== "string" || plain.length < 6) {
      throw new Error("Senha inválida (mínimo 6 caracteres)");
    }
    this.password = await bcrypt.hash(plain, 10);
  }

  // retorna booleano — trata caso não haja senha setada
  async verifyPassword(plain) {
    if (!this.password) return false;
    return bcrypt.compare(plain, this.password);
  }

  // salva um novo usuário (lança em caso de erro)
  async save() {
    try {
      const res = await this.db.runAsync(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [this.username, this.email, this.password]
      );
      this.id = res.lastID;
      return this.id;
    } catch (err) {
      // intercepta conflito de unicidade e lança erro legível
      if (err && err.code === "SQLITE_CONSTRAINT") {
        throw new Error("Usuário ou email já existem");
      }
      throw err;
    }
  }

  // atualiza campos (útil se precisar alterar email/nome etc)
  async update(fields = {}) {
    const patches = [];
    const params = [];
    if (fields.username) {
      patches.push("username = ?");
      params.push(fields.username);
      this.username = fields.username;
    }
    if (fields.email) {
      patches.push("email = ?");
      params.push(fields.email);
      this.email = fields.email;
    }
    if (fields.password) {
      await this.setPassword(fields.password);
      patches.push("password = ?");
      params.push(this.password);
    }
    if (!patches.length) return this;

    params.push(this.id);
    const sql = `UPDATE users SET ${patches.join(", ")} WHERE id = ?`;
    await this.db.runAsync(sql, params);
    return this;
  }

  // JSON safe (não inclui password)
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email
    };
  }
}
