import { Test } from "../models/Test.js";
import { DepressionTest } from "../models/depressionTest.js";


export class TestService {
    constructor(db) {
        this.db = db;
    }


    // Checa se já fez teste do tipo nos últimos 30 dias
    async canSaveTest(userId, testType) {
        const last = await this.db.getAsync(
            "SELECT * FROM test_results WHERE user_id = ? AND test_type = ? ORDER BY created_at DESC LIMIT 1",
            [userId, testType]
        );
        if (!last) return true;
        const lastDate = new Date(last.created_at);
        const diffDays = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 30;
    }


    // Factory de testes — aqui mapeamos tipos para classes
    createTestInstance(testType, db, payload) {
        // Exemplo simples; mapeie conforme necessário
        if (testType === "depression") return new DepressionTest(db, payload);
        return new Test(db, payload);
    }


    async saveTest({ userId, testType, score }) {
        const can = await this.canSaveTest(userId, testType);
        if (!can) throw new Error("Teste feito há menos de 30 dias");


        const instance = this.createTestInstance(testType, this.db, {
            user_id: userId,
            test_type: testType,
            score,
            result_text: null
        });


        instance.result_text = instance.evaluate(); // polimorfismo
        await instance.save();
        return instance;
    }
}