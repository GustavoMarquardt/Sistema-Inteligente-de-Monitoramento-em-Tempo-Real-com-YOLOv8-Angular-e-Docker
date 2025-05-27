import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import HistoricoAparelho from '../objects/HistoricoAparelho';
import { ConfigService } from '../app/config.service';


@Injectable({
  providedIn: 'root',
})
export class HistoricoAparelhoService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.rota  // Utilizando a URL da configuração
  }

  // Função para registrar o início do uso do aparelho
  registrarInicioUso(historico: Partial<HistoricoAparelho>): Observable<HistoricoAparelho> {
    return this.http.post<HistoricoAparelho>(`${this.baseUrl}inicio`, historico).pipe(
      map((response) => response),
      catchError((error) => {
        return throwError(() => new Error('Erro ao registrar início do uso.'));
      })
    );
  }

  // Função para finalizar o uso do aparelho
  finalizarUso(idAparelho: number, dataFim: Date): Observable<HistoricoAparelho> {
    const url = `${this.baseUrl}fim`;
    const body = { id_equipamento: idAparelho, data_fim_uso: dataFim };

    return this.http.patch<HistoricoAparelho>(url, body).pipe(
      map((response) => response),
      catchError((error) => {
        return throwError(() => new Error('Erro ao finalizar uso do aparelho.'));
      })
    );
  }

  async buscarHistoricosPorIds(ids: number[]): Promise<HistoricoAparelho[]> {
    try {
      const response = await firstValueFrom(this.http.post<HistoricoAparelho[]>(`${this.baseUrl}historico_equipamento_uso/byIds`, { ids }));
      return response;
    } catch (err) {
      throw err;
    }
  }

  async buscarHistoricosPorIdsDiaAtual(ids: number[]): Promise<HistoricoAparelho[]> {
    try {
      const response = await firstValueFrom(this.http.post<HistoricoAparelho[]>(`${this.baseUrl}historico_equipamento_uso/byIds`, { ids }));
      return response;
    } catch (err) {
      throw err;
    }
  }

  verificarRegistroAtivo(aparelhoId: number): Observable<{ ativo: boolean }> {
    const url = `${this.baseUrl}ativo/${aparelhoId}`;
    return this.http.get<{ ativo: boolean }>(url).pipe(
      map((response) => response),
      catchError((error) => {
        return of({ ativo: false });
      })
    );
  }

  // Função para buscar histórico por ID do aparelho
  buscarHistoricoPorAparelho(aparelhoId: number): Observable<HistoricoAparelho[]> {
    return this.http.get<HistoricoAparelho[]>(`${this.baseUrl}aparelho/${aparelhoId}`).pipe(
      map((response) => response),
      catchError((error) => {
        return throwError(() => new Error('Erro ao buscar histórico.'));
      })
    );
  }

  buscarTodosHistoricos(): Observable<HistoricoAparelho[]> {
    return this.http.get<HistoricoAparelho[]>(`${this.baseUrl}historico_equipamento_uso`, {
      headers: new HttpHeaders().set('Content-Type', 'application/json'),
    }).pipe(
      map((response) => response),
      catchError((error) => {
        return throwError(() => new Error('Erro ao buscar todos os históricos.'));
      })
    );
  }
  
}
