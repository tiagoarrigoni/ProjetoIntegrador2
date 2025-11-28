import { Test } from "./Test.js";


export class DepressionTest extends Test {
    evaluate() {
        const s = this.score;
        if (s >= 20) return "Alta probabilidade de depressão";
        if (s >= 10) return "Risco moderado";
        return "Baixo risco";
    }
}