import { Injectable } from "@angular/core";
import axios from "axios";
import { Academia } from "../objects/Academia";
import { Observable } from "rxjs";
import { ConfigService } from "../app/config.service";


@Injectable({
    providedIn: 'root', // Isso garante que o serviço será disponibilizado globalmente
})
export class AcademiaService {
  academia: Academia | null = null; // Variável para armazenar a academia
  academiaId: number | null = null; // Variável para armazenar o ID da academia
  private baseUrl: string;

  // Injetando ConfigService para acessar a variável 'rota'
  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.rota;  // Inicializa a baseUrl com o valor fornecido pelo ConfigService
  }

  async carregandoIdAcademia(idUsuario: number): Promise<void> {
    console.log('ID do usuário:', idUsuario);

    try {
      // Usando a baseUrl fornecida pelo ConfigService
      const response = await axios.get(`${this.baseUrl}usuarios/${idUsuario}`);
      const usuario = response.data;
      console.log('Dados do usuário:', usuario);
  
      // Faça o que for necessário com os dados, como armazenar ou exibir
      const academiaID = usuario.academiaID;
      console.log('Academia ID:', academiaID);
      return academiaID;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  }

  async getIdAcademiaByLocalStore(): Promise<number | null> {
    const userString = localStorage.getItem('user');
    console.log('Usuário:', userString);
  
    if (userString) {
      try {
        const parsedUser = JSON.parse(userString); // Converte para objeto
        console.log('ID do usuário:', parsedUser.usuario?.id); // Acessa o campo `id` dentro de `usuario`
        this.academiaId = await this.carregandoIdAcademia(parsedUser.usuario?.id) ?? 0;
        return this.academiaId;
      } catch (error) {
        console.error('Erro ao analisar o JSON do usuário:', error);
        return null;
      }
    } else {
      console.error('Nenhum usuário encontrado no localStorage.');
      return null;
    }
  }

  async getHistoricoLotacaoByAcademiaID(): Promise<any> {
    const userString = localStorage.getItem('user');
  
    if (userString) {
      try {
        const parsedUser = JSON.parse(userString); // Converte para objeto
        
        const idAcademia = parsedUser.usuario?.academiaID;  // Acessa o ID da academia corretamente

        // Verificando se o ID da academia existe
        if (idAcademia) {
          // Fazendo a requisição para a API para obter o histórico de lotação por ID da academia
          const response = await fetch(`${this.baseUrl}lotacaoAcademiasById?idAcademia=${idAcademia}`)
          const data = await response.json();
  
          if (response.ok) {
            // Retorna os dados de histórico da academia
            console.log('Dados de lotação da academia:', data);
            return data;
          } else {
            console.error('Erro ao consultar histórico de lotação para a academia:', data.mensagem);
            return null;
          }
        } else {
          console.error('ID da academia não encontrado.');
          return null;
        }
      } catch (error) {
        console.error('Erro ao analisar o JSON do usuário ou ao fazer a requisição:', error);
        return null;
      }
    } else {
      console.error('Nenhum usuário encontrado no localStorage.');
      return null;
    }
  }

  async fetchAcademiaById(id: number): Promise<Academia | null> {
    try {
      console.log("Buscando academia com ID:", id);
      // Usando a baseUrl fornecida pelo ConfigService
      const response: { data: Academia } = await axios.get<Academia>(`${this.baseUrl}academias/${id}`);
      
      // Filtra os dados para incluir apenas os campos que você deseja
      const { id: academiaId, altura, width, height, nome, ip_publico_academia, port } = response.data;
  
      // Cria um novo objeto com os campos desejados
      const academiaFiltrada: Academia = {
        id: academiaId,
        altura,
        width,
        height,
        nome,
        ip_publico_academia,
        port
      };
      
      this.academia = academiaFiltrada;  // Armazena a academia com os dados filtrados
      console.log("Dados da academia filtrada:", this.academia);
      return this.academia;
    } catch (error) {
      console.error("Erro ao buscar academia:", error);
      return null;
    }
  }

  async createAcademia(academia: Academia): Promise<Academia | null> {
    try {
      // Usando a baseUrl fornecida pelo ConfigService
      const response: { data: Academia } = await axios.post<Academia>(`${this.baseUrl}academias`, academia);
      console.log("Academia criada com sucesso:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar academia:", error);
      return null;
    }
  }

  async getAllAcademias(): Promise<Academia[]> {
    try {
      // Usando a baseUrl fornecida pelo ConfigService
      const response: { data: Academia[] } = await axios.get<Academia[]>(`${this.baseUrl}academias`);
      console.log("Academias encontradas:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar academias:", error);
      return [];
    }
  }

  async atualizaAcademiaIdForUsuarioAdmin(id: number, academiaId: number): Promise<any | null> {
    try {
      // Usando a baseUrl fornecida pelo ConfigService
      const response = await axios.put(`${this.baseUrl}usuarios/${id}/academia`, { academiaID: academiaId });
      console.log("Academia Id atualizado com sucesso", response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar academia:", error);
      return null;
    }
  }

  updateAcademia(id: number, academiaData: any): Observable<any> {
    console.log('Enviando atualização para a academia:', {
      id: id,
      dados: academiaData,
    });

    return new Observable((observer) => {
      // Usando a baseUrl fornecida pelo ConfigService
      axios
        .patch(`${this.baseUrl}/academiaUpdate${id}`, academiaData)
        .then((response) => {
          console.log('Resposta ao atualizar a academia:', response.data);
          observer.next(response.data);
          observer.complete();
        })
        .catch((error) => {
          console.error('Erro ao atualizar a academia:', error);
          observer.error('Erro ao atualizar a academia');
        });
    });
  }
}
