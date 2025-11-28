import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import { promisify } from "util";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../database.db");


export function createDb() {
const db = new sqlite3.Database(dbPath, (err) => {
if (err) console.error("Erro ao abrir DB:", err);
});


// Promisify helpers
db.getAsync = promisify(db.get).bind(db);
db.runAsync = function (sql, params = []) {
return new Promise((res, rej) => {
db.run(sql, params, function (err) {
if (err) return rej(err);
res(this);
});
});
};
db.allAsync = promisify(db.all).bind(db);


return db;
}