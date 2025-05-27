// A cada 10 pixels formam 1 metro


class Aparelho {
    id: number;
    cameraId: number = 0;
    altura: number;
    largura: number;
    profundidade: number;
    x: number = 0;
    y: number = 0;
    

    constructor(id: number, altura: number, largura: number, profundidade: number, x: number = 0, y: number = 0, cameraId: number = 0) {
        this.id = id;
        this.cameraId = cameraId;
        this.altura = altura;
        this.largura = largura;
        this.profundidade = profundidade;
        this.x = x;
        this.y = y;
    }
}

export default Aparelho;