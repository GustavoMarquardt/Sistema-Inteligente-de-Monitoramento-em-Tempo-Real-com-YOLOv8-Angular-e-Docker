// A cada 10 pixels formam 1 metro

import { DivisoesDeTreino } from "./divisoes_de_treino.enum";


class Objeto {
    id: number;
    nome_equipamento:string;
    cameraId: number = -1;
    altura: number;
    largura: number;
    profundidade: number;
    x: number = 0;
    y: number = 0;
    isParede:boolean = false;
    data_aquisicao: Date;
    status: string;
    ocupado:boolean = false
    divisao:DivisoesDeTreino
    temRoi:boolean = false
    constructor(id: number, altura: number, largura: number, profundidade: 
        number, x: number = 0, y: number = 0, cameraId: number = -1, nome_equipamento: string,
        data_aquisicao: Date, status: string, divisao: DivisoesDeTreino) {
        this.id = id;
        this.nome_equipamento = nome_equipamento;
        this.cameraId = cameraId;
        this.altura = altura;
        this.largura = largura;
        this.profundidade = profundidade;
        this.x = x;
        this.y = y;
        this.data_aquisicao = data_aquisicao;
        this.status = status;
        this.divisao = divisao;
    }
}

export default Objeto;