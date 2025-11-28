export class UserInfo {
    #peso;
    #altura;


    constructor({ user_id, nome_completo = null, nascimento = null, peso = null, altura = null } = {}) {
        this.user_id = user_id;
        this.nome_completo = nome_completo;
        this.nascimento = nascimento;
        this.#peso = peso;
        this.#altura = altura;
    }


    get peso() { return this.#peso; }
    set peso(p) {
        if (p <= 0) throw new Error("Peso inválido");
        this.#peso = p;
    }


    get altura() { return this.#altura; }
    set altura(a) {
        if (a <= 0) throw new Error("Altura inválida");
        this.#altura = a;
    }
}