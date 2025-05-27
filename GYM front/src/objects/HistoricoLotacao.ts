export default class HistoricoLotacao {
    id: number;
    quantidade_pessoas: number;
    date: Date;

    // Construtor para inicializar os atributos
    constructor(id: number, quantidade_pessoas: number, date: Date) {
        this.id = id;
        this.quantidade_pessoas = quantidade_pessoas;
        this.date = date;
    }
}