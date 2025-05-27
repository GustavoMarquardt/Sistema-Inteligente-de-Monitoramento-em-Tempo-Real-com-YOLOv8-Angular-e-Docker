import { DivisoesDeTreino } from "./divisoes_de_treino.enum";
import Objeto from "./Objeto";

export default interface HistoricoAparelho {
    id?: number; // Opcional, gerado automaticamente no banco de dados
    id_equipamento: number; // Deve corresponder ao ID do equipamento
    data_inicio_uso: Date; // Data e hora do início do uso
    data_fim_uso?: Date; // Opcional, será preenchida ao encerrar o uso
    divisao_treino: DivisoesDeTreino
    equipamento:Objeto
  }
  