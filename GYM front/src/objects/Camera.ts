export default class Camera {
  [x: string]: any;
  id: number;
  z: number;
  fov: number;
  alcance: number;
  x: number;
  y: number;
  rotationY: number;
  idAcademia:number;
  ip_camera: string ='';
  port: number = 0;
  login_camera: string = '';
  senha_camera: string = '';
  porcentagemComRoi: number = 0;
  constructor(
    id: number,
    z: number,
    fov: number,
    alcance: number,
    x: number,
    y: number,
    rotationY: number = 0,
    idAcademia: number = 0,
    ip_camera: string = '',
    port: number = 0,
    login_camera: string = '',
    senha_camera: string = '',
  ) {
    this.id = id;
    this.z = z;
    this.fov = fov;
    this.alcance = alcance;
    this.x = x;
    this.y = y;
    this.rotationY = rotationY;
    this.idAcademia = idAcademia
    this.ip_camera = ip_camera;
    this.port = port;
    this.login_camera = login_camera;
    this.senha_camera = senha_camera;
  }

  // Corrige os cálculos da visão da câmera para trabalhar com o sistema anti-horário
  getVisionPoints() {
    // Ajuste para trabalhar com a rotação da câmera corretamente
    const angleLeft = this.rotationY - this.fov / 2;  // Ângulo à esquerda da visão
    const angleRight = this.rotationY + this.fov / 2; // Ângulo à direita da visão

    // O cálculo das coordenadas considera a rotação para a esquerda e direita com base nos ângulos
    const leftX = Math.round(this.x + this.alcance * Math.cos(this.degreesToRadians(angleLeft)));
    const leftY = Math.round(this.y + this.alcance * Math.sin(this.degreesToRadians(angleLeft)));

    const rightX = Math.round(this.x + this.alcance * Math.cos(this.degreesToRadians(angleRight)));
    const rightY = Math.round(this.y + this.alcance * Math.sin(this.degreesToRadians(angleRight)));

    const id = this.id;
    // Retorna os pontos que formam a visão da câmera
    const points = [
      { x: this.x, y: this.y },       // Ponto central (posição da câmera)
      { x: leftX, y: leftY },         // Ponto à esquerda
      { x: rightX, y: rightY }        // Ponto à direita
    ];
    // console.log('Points', points);
    return points;
  }

  calcularDistancia(aparelho: any): number {
    return Math.sqrt(Math.pow(this.x - aparelho.x, 2) + Math.pow(this.y - aparelho.y, 2));
  }

  rotateCamera() {
    // A rotação será aplicada com base na propriedade rotationY (em graus)
    const radian = this.rotationY * (Math.PI / 180); // Converter para radianos
    
    // Rotacionar as coordenadas da câmera com base no ângulo
    const xNovo = this.x * Math.cos(radian) - this.y * Math.sin(radian);
    const yNovo = this.x * Math.sin(radian) + this.y * Math.cos(radian);
    
    // Atualizar as coordenadas da câmera após a rotação
    this.x = xNovo;
    this.y = yNovo;
  }

  // Corrige os cálculos da visão da câmera para trabalhar com o sistema anti-horário
  getVisionPointsListWithID() {
    // Ajuste para trabalhar com a rotação da câmera corretamente
    const angleLeft = this.rotationY - this.fov / 2;  // Ângulo à esquerda da visão
    const angleRight = this.rotationY + this.fov / 2; // Ângulo à direita da visão

    // O cálculo das coordenadas considera a rotação para a esquerda e direita com base nos ângulos
    const leftX = Math.round(this.x + this.alcance * Math.cos(this.degreesToRadians(angleLeft)));
    const leftY = Math.round(this.y + this.alcance * Math.sin(this.degreesToRadians(angleLeft)));

    const rightX = Math.round(this.x + this.alcance * Math.cos(this.degreesToRadians(angleRight)));
    const rightY = Math.round(this.y + this.alcance * Math.sin(this.degreesToRadians(angleRight)));

    return {
      id: this.id,
      pontos: [
        { x: this.x, y: this.y },       // Ponto central (posição da câmera)
        { x: leftX, y: leftY },         // Ponto à esquerda
        { x: rightX, y: rightY }        // Ponto à direita
      ]
    };
  }


  // Converte os graus para radianos
  private degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }
}
