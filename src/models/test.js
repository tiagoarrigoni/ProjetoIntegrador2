import { BaseModel } from "./BaseModel.js";


export class Test extends BaseModel {
    constructor(db, { id = null, user_id = null, test_type = null, score = null, result_text = null, created_at = null } = {}) {
        super(db);
        this.id = id;
        this.user_id = user_id;
        this.test_type = test_type;
        this.score = score;
        this.result_text = result_text;
        this.created_at = created_at;
    }


    // método genérico de avaliação — pode ser sobrescrito
    evaluate() {
        return `Score: ${this.score}`;
    }


    async save() {
        const res = await this.db.runAsync(
            `INSERT INTO test_results (user_id, test_type, score, result_text) VALUES (?, ?, ?, ?)`,
            [this.user_id, this.test_type, this.score, this.result_text]
        );
        this.id = res.lastID;
        const row = await this.db.getAsync("SELECT * FROM test_results WHERE id = ?", [this.id]);
        this.created_at = row.created_at;
        return this;
    }
}