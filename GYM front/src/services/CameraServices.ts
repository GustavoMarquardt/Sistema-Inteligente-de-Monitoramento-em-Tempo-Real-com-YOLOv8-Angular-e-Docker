import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import Camera from '../objects/Camera';
import { ConfigService } from '../app/config.service';


@Injectable({
  providedIn: 'root',
})
export class CameraService {

  private baseUrl: string;

  private camerasSubject$: BehaviorSubject<Camera[]> = new BehaviorSubject<Camera[]>([]);
  private camerasObservable$ = this.camerasSubject$.asObservable(); // Observable para ser usado nos componentes

  constructor(private http: HttpClient, private configService: ConfigService) { 
    // Usando o ConfigService para obter a URL base
    this.baseUrl = this.configService.rota;
  }

  // Função para salvar as câmeras, passando o id da academia e as câmeras
  salvarCameras(cameras: Camera[], academiaID: number): Observable<any> {
    // Adiciona o idAcademia a cada câmera antes de enviá-la
    cameras.forEach(camera => {
      camera.idAcademia = academiaID;
    });

    console.log('tentando salvar a camera', cameras);
    return this.http.post(`${this.baseUrl}cameras`, cameras).pipe(
      catchError((error) => {
        console.error('Erro ao salvar câmeras:', error);
        throw new Error('Erro ao salvar câmeras');
      })
    );
  }

  atualizarCameras(cameras: Camera[]): Observable<any> {
    console.log('Atualizando lista de câmeras:', cameras);
    return this.http.put(`${this.baseUrl}camerasListUpdate`, cameras).pipe(
      catchError((error) => {
        console.error('Erro ao atualizar câmeras:', error);
        throw new Error('Erro ao atualizar câmeras');
      })
    );
  }


  salvarCamera(camera: Camera, academiaID: number): Observable<any> {
    // Verifique se os dados são válidos
    if (!camera.z || !camera.fov || !camera.alcance || !camera.x || !camera.y || !camera.rotationY) {
      console.error('Dados da câmera estão incompletos ou inválidos:', camera);
      return throwError('Dados da câmera inválidos.');
    }

    // Adiciona o idAcademia à câmera antes de enviá-la
    camera.idAcademia = academiaID;

    console.log('Tentando salvar a câmera', camera);  // Verifique o valor de camera aqui antes de enviar

    // Faz a requisição para salvar a câmera
    let response = this.http.post(`${this.baseUrl}cameras`, camera).pipe(
      catchError((error) => {
        console.error('Erro ao salvar a câmera:', error);
        throw new Error('Erro ao salvar a câmera');
      })
    );
    console.log(response);
    return response;
  }

  // Função para obter o maior ID de câmera
  getMaxCameraId(): Observable<number | null> {
    return this.http.get<any>(`${this.baseUrl}camerasmaxId`).pipe(
      map(response => response.maxId || 0), // Retorna o maior ID encontrado ou 0
      catchError((error) => {
        console.error('Erro ao buscar o maior id da câmera:', error);
        return [null]; // Retorna null em caso de erro
      })
    );
  }

  // Função para buscar as câmeras
  getCameras(): Observable<Camera[]> {
    return this.http.get<any[]>(`${this.baseUrl}cameras`).pipe(
      map((responseData) => {
        // Mapeia os dados para instâncias de Camera
        const cameras: Camera[] = responseData.map(cameraData => {
          return new Camera(
            cameraData.id,
            cameraData.z,
            cameraData.fov,
            cameraData.alcance,
            cameraData.x,
            cameraData.y,
            cameraData.rotationY,
            cameraData.idAcademia
          );
        });
        this.camerasSubject$.next(cameras); // Atualiza o BehaviorSubject
        console.log('cameras', cameras);
        return cameras; // Retorna as câmeras mapeadas
      }),
      catchError((error) => {
        console.error('Erro ao buscar câmeras:', error);
        return of([]); // Retorna array vazio em caso de erro, usando `of()` para um Observable
      })
    );
  }

  getCamerasByAcademiaId(idAcademia: number): Observable<Camera[]> {
    return this.http.get<any[]>(`${this.baseUrl}cameras/academia/${idAcademia}`).pipe(
      map((responseData) => {
        // Mapeia os dados para instâncias de Camera
        const cameras: Camera[] = responseData.map(cameraData => {
          return new Camera(
            cameraData.id,
            cameraData.z,
            cameraData.fov,
            cameraData.alcance,
            cameraData.x,
            cameraData.y,
            cameraData.rotationY,
            cameraData.idAcademia,
            cameraData.ip_camera,
            cameraData.port,
            cameraData.login_camera,
            cameraData.senha_camera
          );
        });
        this.camerasSubject$.next(cameras); // Atualiza o BehaviorSubject
        console.log('Câmeras de academia', cameras);
        return cameras; // Retorna as câmeras mapeadas
      }),
      catchError((error) => {
        console.error('Erro ao buscar câmeras pela academia:', error);
        return throwError(() => new Error('Erro ao buscar câmeras da academia')); // Propaga o erro
      })
    );
  }

  removeCameraById(idCamera: number) {
    this.http.delete(`${this.baseUrl}cameras/${idCamera}`).subscribe(
      response => {
        console.log('Câmera excluída com sucesso', response);
      },
      error => {
        console.error('Erro ao excluir a câmera', error);
      }
    );
  }

  getRoiPorcentagemByCameras(cameras: Camera[]): Observable<any[]> {
    const camerasIds = cameras.map(camera => camera.id);
    console.log('IDs das câmeras:', camerasIds);
    return this.http.post<any[]>(`${this.baseUrl}calcular-roi-porcentagem`, { camerasIds }).pipe(
      map((responseData) => {
        console.log('Porcentagem de ROI para cada câmera', responseData);
        return responseData; // Retorna a lista de porcentagens
      }),
      catchError((error) => {
        console.error('Erro ao calcular porcentagem de ROI para as câmeras:', error);
        return throwError(() => new Error('Erro ao calcular porcentagem de ROI para as câmeras')); // Propaga o erro
      })
    );
  }

  getRoiComCameraIdAndAparelhoId(cameraId: number, aparelhoId: number): Observable<any> {
    // Altere a URL para refletir a nova rota com query string
    const url = `${this.baseUrl}roisByCameraAndAparelho?idAparelho=${aparelhoId}&cameraId=${cameraId}`;
    
    return this.http.get<any>(url).pipe(
      map((responseData) => {
        console.log('ROI encontrado:', responseData);
        return responseData; // Retorna o ROI encontrado
      }),
      catchError((error) => {
        console.error('Erro ao buscar ROI:', error);
        return throwError(() => new Error('Erro ao buscar ROI')); // Propaga o erro
      })
    );
  }

  getRoisPorCameraId(cameraId: number): Observable<any> {
    // Altere a URL para refletir a nova rota com query string
    const url = `${this.baseUrl}roisByCamera?cameraId=${cameraId}`;
    return this.http.get<any>(url).pipe(
      map((responseData) => {
        console.log('ROI encontrado:', responseData);
        return responseData; // Retorna o ROI encontrado
      }),
      catchError((error) => {
        console.error('Erro ao buscar ROI:', error);
        return throwError(() => new Error('Erro ao buscar ROI')); // Propaga o erro
      })
    );
  }

  getCameraById(cameraId: number): Observable<Camera> {
    return this.http.get<any>(`${this.baseUrl}cameras/${cameraId}`).pipe(
      map((responseData) => {
        const camera = new Camera(
          responseData.id,
          responseData.z,
          responseData.fov,
          responseData.alcance,
          responseData.x,
          responseData.y,
          responseData.rotationY,
          responseData.idAcademia,
          responseData.ip_camera,
          responseData.port,
          responseData.login_camera,
          responseData.senha_camera,
        );
        console.log('Câmera encontrada:', camera);
        return camera; // Retorna a câmera encontrada
      }),
      catchError((error) => {
        console.error('Erro ao buscar câmera:', error);
        return throwError(() => new Error('Erro ao buscar câmera')); // Propaga o erro
      })
    );
  }

  updateCamera(id: number, cameraData: any): Observable<any> {
    console.log('Enviando atualização para a câmera:', {
      id: id,
      dados: cameraData,
    });
  
    return this.http.patch<any>(`${this.baseUrl}cameras/${id}`, cameraData).pipe(
      map((responseData) => {
        console.log('Resposta ao atualizar a câmera:', responseData);
        return responseData;
      }),
      catchError((error) => {
        console.error('Erro ao atualizar a câmera:', error);
        return throwError(() => new Error('Erro ao atualizar a câmera'));
      })
    );
  }

  postRoiPorcentagemByCameras(cameraId: number, aparelhoId: number, pontos: any[]): Observable<any> {
    const payload = {
      cameraId: cameraId,
      idAparelho: aparelhoId,
      pontos: pontos,
    };

    console.log('Enviando dados:', payload);  // Verifique os dados antes de enviar

    return this.http.post<any>(`${this.baseUrl}rois`, payload).pipe(
      map((responseData) => {
        console.log('Resposta ao criar ROI:', responseData);
        return responseData; // Retorna a resposta do servidor
      }),
      catchError((error) => {
        console.error('Erro ao criar ROI:', error);
        return throwError(() => new Error('Erro ao criar ROI')); // Propaga o erro
      })
    );
  }

  // Getter para acessar as câmeras reativas
  get cameras$(): Observable<Camera[]> {
    return this.camerasObservable$;
  }

}
