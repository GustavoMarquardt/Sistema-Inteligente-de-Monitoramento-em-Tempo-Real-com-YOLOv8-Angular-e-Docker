import { DivisoesDeTreino } from "./divisoes_de_treino.enum";

export default class ModeloPessoa {
    matricula: number;
    grupo_muscular: DivisoesDeTreino;
    treinou_hoje: boolean;
    quantidadeAparelhos: number;
    aparelhosUsados: number[] = [];
    horaChegada: number // Agora inclui a hora de chegada
    constructor(matricula: number, grupo_muscular: DivisoesDeTreino, treinou_hoje: boolean, quantidadeAparelhos: number, horaChegada: number) {
        this.matricula = matricula;
        this.grupo_muscular = grupo_muscular;
        this.treinou_hoje = treinou_hoje;
        this.quantidadeAparelhos = quantidadeAparelhos;
        this.horaChegada = horaChegada
    }

    // Método para marcar o treino como feito hoje
    treinar(): void {
        if (!this.treinou_hoje) {
            this.treinou_hoje = true;
            console.log(`Pessoa com matrícula ${this.matricula} treinou hoje.`);
        } else {
            console.log(`Pessoa com matrícula ${this.matricula} já treinou hoje.`);
        }
    }
}
