import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Observable, throwError } from 'rxjs'; 
import { catchError, map } from 'rxjs/operators'; 
import Objeto from '../objects/Objeto'; 
import { tap } from 'rxjs/operators';

import axios from "axios";
import { ConfigService } from '../app/config.service';

@Injectable({
  providedIn: 'root',
})
export class ObjectService {

  constructor(private http: HttpClient, private configService: ConfigService) {} // Injeção do ConfigService

  // Função para cadastrar o equipamento (CREATE)
  cadastrarEquipamento(aparelho: Objeto): Observable<Objeto> {
    const url = `${this.configService.rota}equipamentos`; // Utilizando a URL base configurada
    return this.http.post<Objeto>(url, aparelho).pipe(
      map((response) => response),
      catchError((error) => {
        throw error;
      })
    );
  }

  // Função para buscar todos os equipamentos (READ)
  buscarEquipamentos(): Observable<Objeto[]> {
    const url = `${this.configService.rota}equipamentos`; // URL base com o caminho dos equipamentos
    return this.http.get<Objeto[]>(url).pipe(
      map((response) => response),
      catchError((error) => {
        throw error;
      })
    );
  }

  buscarEquipamentosByAcademiaId(idAcademia: number): Observable<Objeto[]> {
    const url = `${this.configService.rota}equipamentos/academia/${idAcademia}`;
    return this.http.get<Objeto[]>(url).pipe(
      map((response) => response),
      catchError((error) => {
        throw error;
      })
    );
  }

  // Função para buscar um equipamento por ID (READ)
  buscarEquipamentoPorId(id: number): Observable<Objeto> {
    const url = `${this.configService.rota}equipamentos/${id}`;
    return this.http.get<Objeto>(url).pipe(
      map((response) => response),
      catchError((error) => {
        throw error;
      })
    );
  }

  // Função para atualizar o equipamento (UPDATE)
  atualizarEquipamento(id: number, aparelho: Objeto): Observable<Objeto> {
    const url = `${this.configService.rota}equipamentos/${id}`;
    return this.http.put<Objeto>(url, aparelho).pipe(
      map((response) => response),
      catchError((error) => {
        throw error;
      })
    );
  }

  atualizarEquipamentos(aparelhos: Objeto[]): Observable<Objeto[]> {
    console.log('SALVANDO RELAÇÃO');
    const url = `${this.configService.rota}equipamentos`;
    
    return this.http.patch<Objeto[]>(url, aparelhos, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    }).pipe(
      tap((response) => {
        console.log('Resposta da requisição:', response);
      }),
      catchError((error) => {
        console.error('Erro na requisição:', error);
        return throwError(() => new Error('Erro na requisição.'));
      })
    );
  }
  

  async updateAparelhoNovaCameraResponsavel(cameraId: number, aparelhoId: number): Promise<any | null> {
    try {
      console.log('tentando salvar')
      const response = await axios.patch(`${this.configService.rota}equipamentosNovaCameraResponsavel`, {
        cameraId,
        aparelhoId,
      });
      console.log('Equipamento atualizado com nova câmera responsável:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar equipamento:', error.response ? error.response.data : error.message);
      return null;
    }
  }

  // Função para deletar o equipamento (DELETE)
  deletarEquipamentoById(id: number): Observable<void> {
    const url = `${this.configService.rota}equipamentos/${id}`;
    return this.http.delete<void>(url).pipe(
      map(() => {}),
      catchError((error) => {
        throw error;
      })
    );
  }

  buscarEquipamentoPorCameraId(cameraId: number): Observable<Objeto[]> {
    const url = `${this.configService.rota}equipamentos/camera/${cameraId}`;
    return this.http.get<Objeto[]>(url).pipe(
      map((response) => response),
      catchError((error) => {
        throw error;
      })
    );
  }

  checkRois(idsAparelhos: number[]): Observable<any[]> {
    const url = `${this.configService.rota}equipamentos/checkRois`;
    return this.http.post<any[]>(url, { idsAparelhos }).pipe(
      map((response) => response),
      catchError((error) => {
        throw error;
      })
    );
  }

  deleteRoi(aparelhoId: number): Observable<void> {
    const url = `${this.configService.rota}equipamentos/roi/${aparelhoId}`;
    return this.http.delete<void>(url).pipe(
      map(() => {}),
      catchError((error) => {
        console.error('Erro ao deletar ROI:', error);
        throw error;
      })
    );
  }
}
