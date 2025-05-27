export class Academia {
  id: number;
  altura: number;
  width: number;  // X
  height: number; // Y
  nome: string;
  ip_publico_academia: string;
  port: number;
  telefone?: string;  // Torna o campo telefone opcional
  constructor(id: number, altura: number, width: number, height: number, nome: string, ip_academia: string, port: number, telefone?: string) {
    this.id = id;
    this.altura = altura;
    this.width = width;
    this.height = height;
    this.nome = nome;
    this.ip_publico_academia = ip_academia;
    this.port = port;
    this.telefone = telefone || '';  // Se telefone não for passado, usa uma string vazia
  }
}
