import { ChangeDetectorRef, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import Camera from '../../objects/Camera';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule, isPlatformBrowser } from '@angular/common';  // Importando a função isPlatformBrowser
import { MatPaginator } from '@angular/material/paginator';
import { CameraService } from '../../services/CameraServices';
import { AcademiaService } from '../../services/AcademiaService';
import { MatIcon, MatIconModule } from '@angular/material/icon';

import { PointsPipe } from '../../objects/points.pipe';
import Objeto from '../../objects/Objeto'
import { Academia } from '../../objects/Academia';
import { coerceStringArray } from '@angular/cdk/coercion';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpClientModule } from '@angular/common/http';  // Certifique-se de que está sendo importado corretamente
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ObjectService } from '../../services/ObjectService'
import { firstValueFrom } from 'rxjs';
import { ProgressBarMode, MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { DivisoesDeTreino } from '../../objects/divisoes_de_treino.enum';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SidebarService } from '../../services/SidebarService';
import { ConfigService } from '../config.service';

type Ponto = {
  x: number;
  y: number;
};


@Component({
  selector: 'app-content4',
  imports: [
    CommonModule,
    HttpClientModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatCardModule,
    MatRadioModule,
    FormsModule,
    MatProgressBarModule,
  ],
  templateUrl: './content4.component.html',
  styleUrl: './content4.component.less'
})
export class Content4Component {
  displayedColumnsCameras: string[] = [
    'id',
    'z',
    'x',
    'y',
    'porcentagemComRoi',  // Coluna para mostrar a porcentagem de ROI
    'actions',
  ];

  displayedColumnsObject: string[] = [
    'id', 'nome_equipamento', 'divisao', 'cameraId', 'x', 'y', 'temRoi', 'delete'
  ]
  ListaDeCampoDeVisaoCamera: { id: number; pontos: Ponto[] }[] = [];
  ListaDeCameras: Camera[] = [];
  ListaDeObjetos: Objeto[] = [];
  ListaDeTodosOsObjetosMapa: Objeto[] = [];
  academia!: Academia;
  ListaDeCamerasCorners: { id: number; pontos: Ponto[] }[] = [];
  dataSourceCameras = new MatTableDataSource(this.ListaDeCameras);
  dataSourceObject = new MatTableDataSource(this.ListaDeObjetos);
  makingROIaparelhoID: number | null = null;
  makingROIcameraID: number | null = null;
  pontos: { x: number; y: number }[] = [];
  ferramentaSelecionada: 'adicionar' | 'remover' = 'adicionar';
  scaleFactor: number = 1;
  academiaId: number | null = null;
  roiPorcentagemComplete: any[] = [];
  mapContainer: HTMLElement | undefined;
  naturalWidth: number = 0; // Largura real da imagem
  naturalHeight: number = 0; // Altura real da imagem
  imageUrl: string = '';  // URL da imagem capturada para exibição
  @ViewChild('mapContainer') mapContainerTamanho!: ElementRef;
  mapWidthPx: number = 0;
  mapHeightPx: number = 0;
  mapWidthMeters: number = 0;
  mapHeightMeters: number = 0;
  listaDeROIsOtherObject: any[] = [];
  private baseUrl: string;
  constructor(
    private cdr: ChangeDetectorRef,
    private cameraService: CameraService,
    private academiaService: AcademiaService,
    private objectService: ObjectService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    
    @Inject(PLATFORM_ID) private platformId: Object, private configService: ConfigService) {
      this.baseUrl = this.configService.rota;
  }

  async ngOnInit(): Promise<void> {
    // Obtém o ID da academia
    this.academiaId = await this.academiaService.getIdAcademiaByLocalStore();
    this.objectService.buscarEquipamentosByAcademiaId(this.academiaId!).subscribe((objetos) => {
      this.ListaDeTodosOsObjetosMapa = objetos;
    });

    const fetchedAcademia = await this.academiaService.fetchAcademiaById(this.academiaId!);
    if (fetchedAcademia) {
      this.academia = fetchedAcademia;
      if (isPlatformBrowser(this.platformId)) {
        this.mapContainer = document.querySelector('.map-container') as HTMLElement;
        this.getMapDimensions();
      }
    } else {
      // Handle the case where academia is null
      console.error('Academia not found');
    }
    // Obtém as câmeras da academia
    await this.cameraService.getCamerasByAcademiaId(this.academiaId!).subscribe((cameras) => {
      this.ListaDeCameras = cameras;

      // Associa a porcentagem de ROI a cada câmera com base no ID
      this.cameraService.getRoiPorcentagemByCameras(this.ListaDeCameras).subscribe((roiPorcentagem) => {
        this.roiPorcentagemComplete = roiPorcentagem;

        // Associa a porcentagem de ROI às câmeras correspondentes
        this.ListaDeCameras.forEach((camera) => {
          const roi = this.roiPorcentagemComplete.find((roiData) => roiData.cameraId === camera.id);
          if (roi) {
            camera.porcentagemComRoi = roi.porcentagemComRoi; // Atribui o valor da porcentagem à câmera
          } else {
            camera.porcentagemComRoi = 0; // Caso não tenha ROI, atribui 0
          }
        });
        this.atualizaCampoCamera();

        // Atualiza o dataSource para refletir as câmeras com as porcentagens de ROI
        this.dataSourceCameras.data = this.ListaDeCameras;
        this.cdr.detectChanges();
      });
    });
  }


  associarPorcentagemROI(): void {
    // Associa a porcentagem de ROI a cada câmera com base no ID
    this.cameraService.getRoiPorcentagemByCameras(this.ListaDeCameras).subscribe((roiPorcentagem) => {
      this.roiPorcentagemComplete = roiPorcentagem;

      // Associa a porcentagem de ROI às câmeras correspondentes
      this.ListaDeCameras.forEach((camera) => {
        const roi = this.roiPorcentagemComplete.find((roiData) => roiData.cameraId === camera.id);
        camera.porcentagemComRoi = roi ? roi.porcentagemComRoi : 0; // Atribui o valor da porcentagem ou 0
      });

      this.atualizarDados();
    });
  }

  atualizarDados(): void {
    // Atualiza o dataSource com a lista de câmeras e suas porcentagens de ROI
    this.dataSourceCameras.data = this.ListaDeCameras;
    this.cdr.detectChanges();
  }



  getMapDimensions(): void {

    this.mapWidthPx = this.academia.width * 2;  // Multiplica por 2 para converter metros para pixels
    this.mapHeightPx = this.academia.height * 2;  // Multiplica por 2 para converter metros para pixels

    // Calcular scaleFactor com base nas dimensões da tela
    const scaleFactor = Math.min(window.innerWidth / this.mapWidthPx, window.innerHeight / this.mapHeightPx);
    this.scaleFactor = scaleFactor;

  }

  atualizaCampoCamera() {
    this.ListaDeCampoDeVisaoCamera = this.ListaDeCameras.map(camera => {
      const visionData = camera.getVisionPointsListWithID();
      return {
        id: visionData.id,
        pontos: visionData.pontos
      };
    });
  }

  obterEquipamentos(): void {
    this.objectService.buscarEquipamentosByAcademiaId(this.academiaId!).subscribe((objetos) => {
      this.ListaDeTodosOsObjetosMapa = objetos;
    });
  }



  selecionarFerramenta(ferramenta: 'adicionar' | 'remover') {
    this.ferramentaSelecionada = ferramenta;
  }

  getPointsForTriangle(campoVisao: { x: number, y: number }[]): string {
    let teste = campoVisao.map(ponto => `${ponto.x * this.scaleFactor},${ponto.y * this.scaleFactor}`).join(' ');
    return teste
  }


  onImageClick(event: MouseEvent, image: HTMLImageElement) {
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    // Obtenha as dimensões renderizadas da imagem
    const rect = image.getBoundingClientRect();
    const renderedWidth = rect.width;
    const renderedHeight = rect.height;

    // Coordenadas do clique em relação à imagem renderizada
    const xRendered = event.clientX - rect.left;
    const yRendered = event.clientY - rect.top;

    // Converta as coordenadas para a escala da imagem real
    const x = (xRendered / renderedWidth) * naturalWidth;
    const y = (yRendered / renderedHeight) * naturalHeight;

    // Sua lógica de adicionar/remover pontos
    if (this.pontos.length >= 4) {
      if (this.ferramentaSelecionada === 'adicionar') {
        this.snackBar.open('Máximo de 4 pontos atingido!', 'Fechar', {
          duration: 3000,
        });
      } else if (this.ferramentaSelecionada === 'remover') {
        const pontoMaisProximo = this.pontos.reduce((prev, curr) => {
          const distanciaPrev = Math.hypot(prev.x - x, prev.y - y);
          const distanciaCurr = Math.hypot(curr.x - x, curr.y - y);
          return distanciaCurr < distanciaPrev ? curr : prev;
        });

        this.pontos = this.pontos.filter(p => p !== pontoMaisProximo);
        this.snackBar.open('Ponto removido com sucesso!', 'Fechar', {
          duration: 3000,
        });
      }
    } else {
      if (this.ferramentaSelecionada === 'adicionar') {
        this.pontos.push({ x, y });
      } else if (this.ferramentaSelecionada === 'remover') {
        const pontoMaisProximo = this.pontos.reduce((prev, curr) => {
          const distanciaPrev = Math.hypot(prev.x - x, prev.y - y);
          const distanciaCurr = Math.hypot(curr.x - x, curr.y - y);
          return distanciaCurr < distanciaPrev ? curr : prev;
        });
        this.pontos = this.pontos.filter(p => p !== pontoMaisProximo);
      }
    }
  }

  getClipPath(imageRef: HTMLImageElement) {
    if (this.pontos.length === 4) {
      const rect = imageRef.getBoundingClientRect();
      const renderedWidth = rect.width;
      const renderedHeight = rect.height;

      const path = this.pontos.map(p => {
        const xRendered = (p.x / imageRef.naturalWidth) * renderedWidth;
        const yRendered = (p.y / imageRef.naturalHeight) * renderedHeight;
        return `${xRendered}px ${yRendered}px`;
      }).join(', ');

      return `polygon(${path})`;
    }
    return '';
  }



  makeRois(cameraId: number): void {
    // Pegar todos os objetos que tem a cameraId
    this.objectService.buscarEquipamentoPorCameraId(cameraId).subscribe((objetos) => {
      this.ListaDeObjetos = objetos;
      this.dataSourceObject.data = this.ListaDeObjetos;

      // Obter os IDs dos objetos
      let objectIds = this.ListaDeObjetos.map(objeto => objeto.id);

      // Chamar o serviço para verificar se cada objeto tem ROI
      this.objectService.checkRois(objectIds).subscribe((roiStatus) => {
        // Atualizar cada objeto com o status de ROI
        roiStatus.forEach((status) => {
          const objeto = this.ListaDeObjetos.find((obj) => obj.id === status.idAparelho);
          if (objeto) {
            objeto.temRoi = status.temRoi;  // Atualizar o atributo temRoi
          }
        });

        // Atualizar a tabela com os dados atualizados
        this.dataSourceObject.data = [...this.ListaDeObjetos];
      });
    });

    this.buscarROIsPorCamera(cameraId);
    if(cameraId !== this.makingROIcameraID){
      // apagar a lista dataSourceObject e deixar os 2 nulos
      this.dataSourceObject.data = [];
      this.makingROIcameraID = null;
      this.makingROIaparelhoID = null;
    }
  }


  deleteRoi($event: MouseEvent, aparelhoId: number) {
    $event.stopPropagation();
    // se o objeto tem o roi como false, não faz nada
    const objeto = this.ListaDeObjetos.find(obj => obj.id === aparelhoId);
    if (objeto && objeto.temRoi === false) {
      this.snackBar.open('Não existe ROI para deletar', 'Fechar', {
        duration: 3000,
        panelClass: ['mat-toolbar', 'mat-primary'], // Alerta de sucesso
      });
    } else {
      // Exibe uma SnackBar com a opção de confirmação
      const snackBarRef = this.snackBar.open('Deseja realmente excluir o ROI?', 'Confirmar', {
        duration: 0, // A SnackBar ficará visível até o usuário clicar em Confirmar ou Fechar
        panelClass: ['mat-toolbar', 'mat-warn'], // Alerta de aviso
      });

      // Quando o botão 'Confirmar' for pressionado
      snackBarRef.onAction().subscribe(() => {
        // Chama o serviço para excluir o ROI
        this.objectService.deleteRoi(aparelhoId).subscribe(() => {
          // Atualiza o objeto com temRoi = false
          const objeto = this.ListaDeObjetos.find(obj => obj.id === aparelhoId);
          if (objeto) {
            objeto.temRoi = false;
          }
          this.dataSourceObject.data = [...this.ListaDeObjetos];
          this.snackBar.open('ROI deletado com sucesso', 'Fechar', {
            duration: 3000,
            panelClass: ['mat-toolbar', 'mat-primary'], // Alerta de sucesso
          });
          this.pontos = [];
          this.associarPorcentagemROI();
          this.obterEquipamentos()
          this.makeRois(this.makingROIcameraID!);
          console.log('makingROIcameraID', this.makingROIcameraID)
        });
      });
    }
  }

  onRowClick(aparelhoId: number, cameraId: number): void {
    console.log('onRowClick', aparelhoId, 'com a camera', cameraId);
    this.makingROIaparelhoID = aparelhoId;
    this.makingROIcameraID = cameraId;
    this.pontos = [];
    this.possuiROI(aparelhoId, cameraId);
    this.buscarROIsPorCamera(cameraId);
    this.busca_foto(cameraId);
  }

  async busca_foto(cameraId: number) {
    this.cameraService.getCameraById(cameraId).subscribe((camera) => {
      console.log('Dados da câmera:', camera);
  
      // Limpar a imagem anterior
      this.imageUrl = ''; 
  
      // Montando a URL com parâmetros de consulta usando this.configService.rota
      const cameraUrl = `${this.configService.rota}frameFromCamera?login_camera=${encodeURIComponent(camera.login_camera)}&senha_camera=${encodeURIComponent(camera.senha_camera)}&ip_camera=${encodeURIComponent(camera.ip_camera)}&port=${encodeURIComponent(camera.port)}`;
      console.log('URL', cameraUrl);
  
      // Fazendo a requisição ao backend para pegar o frame da câmera
      this.http.get(cameraUrl, { responseType: 'blob' })
        .subscribe((imageBlob: Blob) => {
          // Criando um URL de imagem a partir do blob
          this.imageUrl = URL.createObjectURL(imageBlob);
          console.log('URL da imagem:', this.imageUrl);
        }, (error) => {
          console.error('Erro ao capturar o frame da câmera:', error);
        });
    });
  }
  
  
  

  possuiROI(aparelhoId: number, cameraId: number): void {
    this.cameraService.getRoiComCameraIdAndAparelhoId(cameraId, aparelhoId).subscribe((roi) => {
      // Verifique se a resposta possui a chave 'pontos' e se é uma string JSON
      if (roi && roi.pontos) {
        try {
          // Tenta parsear a string JSON para um array
          this.pontos = JSON.parse(roi.pontos);  // Converte a string para um array de objetos
          this.snackBar.open('ROI encontrado', 'Fechar', {
            duration: 3000,
            panelClass: ['mat-toolbar', 'mat-primary'], // Alerta de sucesso
          });
        } catch (error) {
          console.error('Erro ao fazer parse dos pontos:', error);
          this.snackBar.open('Erro ao processar os pontos', 'Fechar', {
            duration: 3000,
            panelClass: ['mat-toolbar', 'mat-warn'], // Alerta de erro
          });
        }
      } else {
        this.pontos = [];  // Se não encontrar ROI ou se os pontos não forem válidos, defina como array vazio
        this.snackBar.open('Nenhum ROI encontrado', 'Fechar', {
          duration: 3000,
          panelClass: ['mat-toolbar', 'mat-warn'], // Alerta de erro
        });
      }
    });
  }


  // Função adicional para buscar todos os ROIs de uma câmera
  buscarROIsPorCamera(cameraId: number): void {
    this.cameraService.getRoisPorCameraId(cameraId).subscribe((rois) => {
      if (rois && Array.isArray(rois)) {
        try {
          // Mapeia os ROIs para garantir que os pontos sejam processados corretamente
          this.listaDeROIsOtherObject = rois.map((roi) => {
            if (roi.pontos) {
              try {
                // Verifica se "pontos" é uma string antes de aplicar JSON.parse
                if (typeof roi.pontos === 'string') {
                  return {
                    ...roi,
                    pontos: JSON.parse(roi.pontos) // Converte os pontos para um array de objetos
                  };
                } else if (Array.isArray(roi.pontos)) {
                  return { ...roi, pontos: roi.pontos }; // Já é um array, apenas retorna
                } else {
                  console.error('Formato inesperado para pontos', roi.pontos);
                  return { ...roi, pontos: [] }; // Caso tenha outro formato inesperado
                }
              } catch (error) {
                console.error('Erro ao fazer parse dos pontos de um ROI:', error);
                return { ...roi, pontos: [] }; // Retorna ROI com pontos vazios em caso de erro
              }
            }
            return { ...roi, pontos: [] }; // Retorna ROI com pontos vazios se não houver pontos
          });
          
          // Mensagem de sucesso ou erro
          if (this.listaDeROIsOtherObject.length > 0) {
            this.snackBar.open('ROIs carregados com sucesso', 'Fechar', {
              duration: 3000,
              panelClass: ['mat-toolbar', 'mat-primary'], // Alerta de sucesso
            });
          } else {
            this.snackBar.open('Nenhum ROI encontrado para a câmera', 'Fechar', {
              duration: 3000,
              panelClass: ['mat-toolbar', 'mat-warn'], // Alerta de erro
            });
          }
  
        } catch (error) {
          console.error('Erro ao processar os ROIs:', error);
          this.listaDeROIsOtherObject = []; // Limpa a lista em caso de erro
          this.snackBar.open('Erro ao carregar os ROIs', 'Fechar', {
            duration: 3000,
            panelClass: ['mat-toolbar', 'mat-warn'], // Alerta de erro
          });
        }
      } else {
        this.listaDeROIsOtherObject = []; // Limpa a lista caso a resposta não seja válida
        this.snackBar.open('Nenhum ROI encontrado para a câmera', 'Fechar', {
          duration: 3000,
          panelClass: ['mat-toolbar', 'mat-warn'], // Alerta de erro
        });
      }
    });
  
    console.log('Lista de ROIs antes da transformação:', this.listaDeROIsOtherObject);
  
    // Mapeia os ROIs após a transformação
    this.listaDeROIsOtherObject = this.listaDeROIsOtherObject.map((roi) => {
      // Verifica se "pontos" é uma string antes de aplicar JSON.parse
      const pontos = typeof roi.pontos === 'string' ? JSON.parse(roi.pontos) : roi.pontos;
  
      return {
        ...roi,
        pontos, // Certifica-se de que "pontos" é um array
      };
    });
  
    console.log('Lista de ROIs após a transformação:', this.listaDeROIsOtherObject);
  }
  

  getClipPathFromROI(roi: any[], imageRef: HTMLImageElement): string {
    const scaledPoints = roi.map((ponto) => {
      const x = (ponto.x / imageRef.naturalWidth) * imageRef.clientWidth;
      const y = (ponto.y / imageRef.naturalHeight) * imageRef.clientHeight;
      return `${x}px ${y}px`;
    });
  
    return `polygon(${scaledPoints.join(', ')})`;
  }


  confirmarPontos() {
    if (this.makingROIcameraID !== null && this.makingROIaparelhoID !== null) {
      console.log('4 pontos confirmados:', this.pontos);
      console.log('onRowClick', this.makingROIaparelhoID, 'com a camera', this.makingROIcameraID);

      this.cameraService.postRoiPorcentagemByCameras(this.makingROIcameraID, this.makingROIaparelhoID, this.pontos).subscribe(() => {
        this.snackBar.open('ROI criado com sucesso', 'Fechar', {
          duration: 3000,
          panelClass: ['mat-toolbar', 'mat-primary'], // Alerta de sucesso
        });
      });
      this.associarPorcentagemROI();
      this.obterEquipamentos();
      this.makeRois(this.makingROIcameraID!);
    } else {
      this.snackBar.open('Erro: ID da câmera ou aparelho não definido', 'Fechar', {
        duration: 3000,
        panelClass: ['mat-toolbar', 'mat-warn'], // Alerta de erro
      });
    }
  }



}
