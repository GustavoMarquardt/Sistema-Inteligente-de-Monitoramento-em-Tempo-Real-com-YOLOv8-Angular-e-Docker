import { Component, OnInit, HostListener, AfterViewInit, PLATFORM_ID, Inject, ViewChild, ElementRef, Injectable, importProvidersFrom, NgZone } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import Camera from '../../objects/Camera';  // Importando a classe Camera
import { PointsPipe } from '../../objects/points.pipe';
import { isPlatformBrowser } from '@angular/common';  // Importando a função isPlatformBrowser
import { CommonModule } from '@angular/common'; // Importando o CommonModule
import Objeto from '../../objects/Objeto'
import { ChangeDetectorRef } from '@angular/core';
import { Academia } from '../../objects/Academia';
import { coerceStringArray } from '@angular/cdk/coercion';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AcademiaService } from "../../services/AcademiaService"
import { CameraService } from '../../services/CameraServices';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';  // Certifique-se de que está sendo importado corretamente
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
import { MatDialog } from '@angular/material/dialog';
import { CameraDialogComponent } from '../camera-dialog/camera-dialog.component';

interface PontoSvg {
  cx: number;
  cy: number;
  r: number;
}

// Tipo para um ponto com coordenadas x e y
type Ponto = {
  x: number;
  y: number;
};

type PontoId = {
  id: number;
  corners: Ponto[];
};


// Tipo para um polígono de sombra com um id e uma lista de 4 pontos
type PoligonoSombra = {
  idParelho: number;
  idCamera: number;
  pontos: Ponto[]; // Lista de pontos, deve ter exatamente 4 pontos
};


@Component({
  selector: 'app-content2',
  templateUrl: './content2.component.html',
  styleUrls: ['./content2.component.less'],
  standalone: true,
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

  ]
})

@Injectable({
  providedIn: 'root', // Importante para injeção global
})



export class Content2Component implements OnInit, AfterViewInit {
  @ViewChild('paginatorAparelho') paginatorAparelho!: MatPaginator;
  @ViewChild('paginatorCamera') paginatorCamera!: MatPaginator;
  editandoCamera: number | undefined = undefined;
  camera: Camera | undefined;
  scaleFactor: number = 1;
  isDragging: boolean = false;
  offsetX: number = 0;
  offsetY: number = 0;
  isDraggingAparelho: boolean = false;
  offsetXAparelho: number = 0;
  offsetYAparelho: number = 0;
  aparelhoCorners: { x: number, y: number }[] = [];
  cameraCorners: { x: number, y: number, id: number }[] = [];
  visaoCameraCorners: { x: number, y: number }[] = [];
  pontosLimitesDeVisaoDaCamera: { x: number, y: number, id: number }[] = [];

  mapContainer: HTMLElement | undefined;
  mode: ProgressBarMode = 'determinate';
  bufferValue = 10;
  aparelho: Objeto | undefined;
  academia!: Academia;
  divisoesCorpo = Object.values(DivisoesDeTreino); // Converte enum para lista
  @ViewChild('mapContainer') mapContainerTamanho!: ElementRef;

  mapWidthPx: number = 0;
  mapHeightPx: number = 0;
  mapWidthMeters: number = 0;
  mapHeightMeters: number = 0

  shadow: { pontos: { x: number; y: number; }[] } | { x: number; y: number; largura: number; altura: number } | null = null;

  academiaId: number = 0;
  shadowClipPath: string = '';
  cameraVisionLines: { x: number; y: number }[] = [];
  linhasCameraEncontroPontosAparelho: { x: number; y: number }[] = [];
  linhasCameraEncontroPontosAparelhoEstendidas: { primeiro: { x: number, y: number }, ultimo: { x: number, y: number }, id: number }[] = [];
  linhasComAltura: { primeiro: { x: number, y: number }, ultimo: { x: number, y: number }, id: number }[] = [];
  pontoCorrespondente: { x: number, y: number } | null = null;
  linhasEstendidas: { primeiro: { x: number, y: number }, ultimo: { x: number, y: number }, id: number, cameraOrigem: number }[] = [];
  pontosDeSombras: { x: number, y: number, id: number }[] = [];
  linhaDeSombra: { primeiro: { x: number, y: number }, ultimo: { x: number, y: number } } | null = null;


  ListaDeAparelhos: Objeto[] = [];
  ListaDeCornersAparelhos: { id: number; corners: { x: number; y: number }[] }[] = [];
  aparelhoEmMovimento: Objeto | null = null;  // Definição da propriedade
  ListalinhasCameraEncontroPontosAparelho: { id: number, cameraId: number, primeiro: { x: number, y: number }, ultimo: { x: number, y: number }, cameraVisao: { x: number, y: number } }[] = [];
  listaPoligonos: PoligonoSombra[] = [];
  listaPorjecao: { id: number, primeiro: { x: number, y: number }, ultimo: { x: number, y: number }, cameraOrigem: number }[] = [];
  isDataLoaded: boolean = false;

  ListaDeCameras: Camera[] = [];
  ListaDeCamerasCorners: { id: number; pontos: Ponto[] }[] = [];
  ListaDeCampoDeVisaoCamera: { id: number; pontos: Ponto[] }[] = [];
  ListapontosLimitesDeVisaoDaCamera: PontoId[] = [];
  ListaVisaoBloqueada: { idCamera: number, idAparelho: number }[] = []
  toleranceSombra: number = 10;
  pontosPoligonoSombra: { id: number, pontos: { x: number, y: number }[] }[] = [];
  quantTeste: number = 0;
  precisaMaisCamera: boolean = false;

  displayedColumnsCameras: string[] = [
    'id',
    'z',
    'x',
    'y',
    'rede',
    'actions',
  ];
  dataSourceCameras = new MatTableDataSource(this.ListaDeCameras);
  cameraForm: FormGroup;


  displayedColumnsAparelhos: string[] = [
    'id', 'nome_equipamento', 'divisao', 'cameraId', 'x', 'y', 'actions'
  ]
  dataSourceAparelhos = new MatTableDataSource(this.ListaDeAparelhos);

  totalItemsAparelho = this.ListaDeAparelhos.length;
  totalItemsCameras = this.ListaDeCameras.length;
  aparelhoForm: FormGroup;
  typerCamera: FormGroup
  progressoCameras: number = 0;
  mostrarProgresso: boolean = false;
  permissoes: string[] = [];  // Armazena as permissões
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef, private fb: FormBuilder
    , private academiaService: AcademiaService,
    private cameraService: CameraService, private snackBar: MatSnackBar,
    private objectService: ObjectService,
    private ngZone: NgZone,
    private sidebarService: SidebarService,
    private dialog: MatDialog
  ) {
    this.aparelhoForm = this.fb.group({
      nome_equipamento: [null, Validators.required],
      cameraId: [-1, Validators.required],
      altura: [null, Validators.required],
      largura: [null, Validators.required],
      profundidade: [null, Validators.required],
      x: [null, Validators.required],
      y: [null, Validators.required],
      isParede: [false], // Valor padrão: false
      status: 'livre',
      data_aquisicao: [null, Validators.required],
      divisao: ['', Validators.required], // Novo campo para divisão
      ocupado: false
    });

    this.editandoCamera = undefined;

    this.cameraForm = this.fb.group({
      z: ['', Validators.required],
      fov: ['', Validators.required],
      alcance: ['', Validators.required],
      x: ['', Validators.required],
      y: ['', Validators.required],
      rotationY: ['', Validators.required]
    });

    this.typerCamera = this.fb.group({
      fov: [null, Validators.required],
      altura: [null, Validators.required],
      alcance: [null, Validators.required],
    })

  }

  onSliderChange(): void {
    if (this.editandoCamera) {
      this.atualizaCampoCamera()
      this.getVisionPointsForAllCameras();
      this.drawLoopFromAparelhos();
    }
  }

  // Objeto que controla se cada aparelho está sendo editado
  isEditing: { [key: number]: boolean } = {};

  // Alterna entre os modos de edição e visualização
  toggleEdit(aparelho: any): void {
    // só deixar dar toggle se tiver permissão nivel 1
    let permissao = this.getNivelAcesso()
    if (Number(permissao) === 1) {
      this.isEditing[aparelho.id] = !this.isEditing[aparelho.id];
    }
  }

  // Função chamada quando o valor do select é alterado
  onCameraSelect(event: any, aparelho: any): void {
    console.log('Câmera selecionada:', event.value);
  }

  // Salva as alterações e sai do modo de edição
  saveCamera(aparelho: any): void {
    console.log('Câmera salva:', aparelho.cameraId, aparelho.id);
    this.objectService.updateAparelhoNovaCameraResponsavel(aparelho.cameraId, aparelho.id)
    this.isEditing[aparelho.id] = false; // Sai do modo de edição
  }

  // Cancela a edição e retorna ao estado original
  cancelEdit(aparelho: any): void {
    this.isEditing[aparelho.id] = false; // Sai do modo de edição sem salvar
  }

  getCameraInfo(value: number): void {
    // Verifica se editandoCamera está definida
    if (this.editandoCamera) {
      console.log('Valor:', value);
      console.log('Câmera sendo editada:', this.editandoCamera);
      // Encontra a câmera na ListaDeCameras com o mesmo id de editandoCamera
      const camera = this.ListaDeCameras.find(camera => camera.id === this.editandoCamera);

      // Se a câmera for encontrada, atualiza o valor de rotationY
      if (camera) {
        camera.rotationY = value;
        console.log(camera)
      }
    }
  }

  // A função formatLabel agora usa a arrow function para garantir o contexto
  formatLabel = (value: number): string => {
    if (value <= 360 && value >= 0) {
      this.getCameraInfo(value)
      return Math.round(value) + '°';
    }

    return `${value}`;
  }


  todosAparelhosComCamera = () => {
    return this.ListaDeAparelhos.every(aparelho => aparelho.cameraId !== -1 && aparelho.cameraId !== 0);
  };

  deleteCameraById(id: number): void {
    // Lógica para excluir a câmera pelo ID
    this.cameraService.removeCameraById(id)
    this.dataSourceCameras.data = this.dataSourceCameras.data.filter(camera => camera.id !== id);
    this.snackBar.open('Camera deletada com sucesso.', 'Fechar', {
      duration: 3000, // A mensagem será fechada após 3 segundos
      panelClass: ['mat-toolbar', 'mat-warn'], // Personalize o estilo do alerta
    });
    // Exemplo de log
    this.cdr.detectChanges();
    console.log(`Camera com ID ${id} foi excluída.`);
  }

  deleteAparelhoById(id: number) {
    if (id !== undefined && id !== null) {
      console.log('Excluindo aparelho com ID:', id);
      // Chame sua API para excluir o aparelho com o ID
      this.objectService.deletarEquipamentoById(id).subscribe(response => {
        // Sucesso ao excluir
        console.log('Aparelho excluído com sucesso');
        this.dataSourceAparelhos.data = this.dataSourceAparelhos.data.filter(aparelho => aparelho.id !== id);
        this.snackBar.open('Aparelho deletado com sucesso.', 'Fechar', {
          duration: 3000, // A mensagem será fechada após 3 segundos
          panelClass: ['mat-toolbar', 'mat-warn'], // Personalize o estilo do alerta
        });
      }, error => {
        // Trate erros se a exclusão falhar
        console.error('Erro ao excluir aparelho:', error);
      });
    } else {
      console.error('ID do aparelho não encontrado');
    }
  }

  onSubmit() {
    if (this.cameraForm.valid) {
      // Multiplica os valores necessários por 10
      const formData = { ...this.cameraForm.value };
      formData.alcance = formData.alcance * 10;
      formData.x = formData.x * 10;
      formData.y = formData.y * 10;
      formData.rotationY = formData.rotationY * 10;
      formData.z = formData.z * 10;

      console.log('Dados da câmera após transformação:', formData);

      // Verifica se a posição x, y e z do aparelho são menores que as da academia
      if (formData.x > this.academia.width || formData.y > this.academia.height || formData.z > this.academia.altura) {
        // Exibe uma mensagem de erro usando MatSnackBar
        this.snackBar.open('Erro: A posição da câmera (x, y, z) deve ser menor ou igual à da academia.', 'Fechar', {
          duration: 3000, // A mensagem será fechada após 3 segundos
          panelClass: ['mat-toolbar', 'mat-warn'], // Personalize o estilo do alerta
        });
        return; // Impede o envio dos dados
      }

      // Chama o serviço para salvar a câmera com a academia associada
      this.cameraService.salvarCamera(formData, this.academia.id).subscribe({
        next: (response) => {
          // Sucesso: notifica o usuário e fecha o Snackbar
          this.snackBar.open('Câmera salva com sucesso!', 'Fechar', { duration: 3000 });

          // Atualiza a lista de câmeras após salvar
          this.cameraService.getCameras().subscribe(cameras => {
            this.ListaDeCameras = cameras; // Atualiza a lista de câmeras com as câmeras mais recentes
          });
          console.log(this.ListaDeCameras);
          this.camerasAssociadasAcadermia(this.academia.id);

          // Limpa os campos manualmente
          this.cameraForm.setValue({
            z: null,
            fov: null,
            alcance: null,
            x: null,
            y: null,
            rotationY: null
          });

          // Reinicia o estado de validação manualmente
          this.cameraForm.markAsPristine();
          this.cameraForm.markAsUntouched();
          console.log('cameraForm', this.cameraForm)
        },
        error: (error) => {
          // Erro: loga o erro e notifica o usuário
          console.error('Erro ao salvar a câmera:', error);
          this.snackBar.open('Erro ao salvar a câmera.', 'Fechar', { duration: 3000 });
        }
      });
    }
  }


  onSubmitAparelho() {
    if (this.aparelhoForm.valid) {
      const aparelho = this.aparelhoForm.value;
      aparelho.x = aparelho.x * 10; // Supondo que o valor original seja em centímetros
      aparelho.y = aparelho.y * 10;
      aparelho.profundidade = aparelho.profundidade * 10;
      aparelho.largura = aparelho.largura * 10;
      aparelho.altura = aparelho.altura * 10;

      // Verifica se a posição x e y do aparelho são menores que as da academia
      if (aparelho.x > this.academia.width || aparelho.y > this.academia.height) {
        // Exibe uma mensagem de erro usando MatSnackBar
        this.snackBar.open('Erro: A posição do aparelho (x, y) deve ser maior ou igual à da academia.', 'Fechar', {
          duration: 3000, // A mensagem será fechada após 3 segundos
          panelClass: ['mat-toolbar', 'mat-warn'], // Personalize o estilo do alerta
        });
        return; // Impede o envio dos dados
      }

      aparelho.idAcademia = this.academia.id;

      this.objectService.cadastrarEquipamento(aparelho).subscribe({
        next: (response) => {
          this.snackBar.open('Aparelho cadastrado com sucesso!', 'Fechar', {
            duration: 3000,
            panelClass: ['mat-toolbar', 'mat-primary'], // Alerta de sucesso
          });
          this.aparelhosAssociadosAcademia(this.academia.id)
        },
        error: (err) => {
          this.snackBar.open('Erro ao cadastrar aparelho.', 'Fechar', {
            duration: 3000,
            panelClass: ['mat-toolbar', 'mat-warn'], // Alerta de erro
          });
        }
      });
    }
  }


  allowOnlyNumbersAndDot(event: KeyboardEvent) {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
    const inputChar = event.key;

    // Permitir teclas de controle como Backspace, Delete, Tab, etc.
    if (
      allowedKeys.includes(inputChar) ||
      event.key === 'Backspace' ||
      event.key === 'Tab' ||
      event.key === 'Enter' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'
    ) {
      return;
    } else {
      event.preventDefault();
    }
  }

  blockInvalidPaste(event: ClipboardEvent) {
    // Utilize o objeto ClipboardEvent diretamente
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData ? clipboardData.getData('text') : '';

    // Verificar se o texto colado é válido
    if (!/^\d*\.?\d*$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  onPageChangeAparelho(event: any): void {
    console.log('Página:', event.pageIndex);
    console.log('Itens por página:', event.pageSize);
    if (this.paginatorAparelho)
      this.dataSourceAparelhos.paginator = this.paginatorAparelho;
  }

  onPageChangeCamera(event: any): void {
    console.log('Página:', event.pageIndex);
    console.log('Itens por página:', event.pageSize);
    if (this.paginatorCamera)
      this.dataSourceCameras.paginator = this.paginatorCamera;
  }

  aparelhosCobertos: { idCamera: number; aparelhos: number[] }[] = [];
  idAcademia: number = 0;

  //PENSAR EM COMO GERAR AS CAMERAS O MAIS DISTANTES POSSÍVEIS 
  async gerarCameras() {
    this.mostrarProgresso = true;
    if (this.typerCamera.invalid) {
      console.warn('Formulário inválido.');
      return;
    }

    const alcance = this.typerCamera.value.alcance * 10;
    const fov = this.typerCamera.value.fov;
    const z = this.typerCamera.value.altura * 10;

    this.idAcademia = this.academia.id;
    let maxId: number | null = null;

    const idMax = await this.cameraService.getMaxCameraId().toPromise();
    maxId = idMax ?? 0;
    let idCamera = maxId || 0;

    const aparelhosCobertosGlobal = new Set<number>();
    let aparelhosRestantes = [...this.ListaDeAparelhos]; // Todos os aparelhos no início
    const totalAparelhosRestantes = aparelhosRestantes.length;

    let iteracaoAtual = 0;

    // Primeira metade do progresso
    while (aparelhosRestantes.length > 0) {
      idCamera++;
      let melhorCamera: any = null;
      let maxNovosCobertos = 0;
      let aparelhosCobertosAtual = new Set<number>();

      let porcentagem = ((totalAparelhosRestantes - aparelhosRestantes.length) * 50) / totalAparelhosRestantes;

      // Atualiza o progresso com a porcentagem calculada
      this.ngZone.run(() => {
        this.progressoCameras = Math.min(porcentagem, 50);
        if (iteracaoAtual % 10 === 0) {  // Atualiza a UI a cada 10 iterações
          this.cdr.detectChanges(); // Atualiza UI de forma controlada
        }
      });

      for (let pos = 0; pos <= Math.max(this.academia.width, this.academia.height) - 10; pos += Math.max(this.academia.width, this.academia.height) / 10) {
        const positions = [
          { x: pos, y: 0 }, { x: pos, y: this.academia.height - 10 },
          { x: 0, y: pos }, { x: this.academia.width - 10, y: pos }
        ];

        for (const { x, y } of positions) {
          for (let rotationY = 0; rotationY < 360; rotationY += 5) {
            iteracaoAtual++;

            const camera = new Camera(idCamera, z, fov, alcance, x, y, rotationY, this.idAcademia);

            // Atualizar sistema com a câmera temporária
            this.ListaDeCameras.push(camera);
            this.atualizaCampoCamera();
            this.drawLoopFromAparelhos();

            // Calcular aparelhos cobertos
            const novosCobertos = this.ListaDeAparelhos.filter(
              (aparelho) => aparelho.cameraId === camera.id && !aparelhosCobertosGlobal.has(aparelho.id)
            );

            if (novosCobertos.length > maxNovosCobertos) {
              maxNovosCobertos = novosCobertos.length;
              melhorCamera = camera;
              aparelhosCobertosAtual = new Set(novosCobertos.map((aparelho) => aparelho.id));
            }

            this.ListaDeCameras.pop();
          }
        }
      }

      if (melhorCamera) {
        this.ListaDeCameras.push(melhorCamera);
        this.atualizaCampoCamera();

        // Atualizar aparelhos cobertos
        aparelhosCobertosAtual.forEach((id) => aparelhosCobertosGlobal.add(id));
        aparelhosRestantes = this.ListaDeAparelhos.filter(
          (aparelho) => !aparelhosCobertosGlobal.has(aparelho.id)
        );

        if (iteracaoAtual % 10 === 0) {
          this.cdr.detectChanges(); // Atualiza UI periodicamente
        }
      } else {
        console.warn('Nenhuma melhor câmera encontrada nesta iteração.');
        break;
      }
    }

    this.dataSourceCameras.data = this.ListaDeCameras;
    this.mostrarProgresso = false;
    this.cdr.detectChanges();
  }

  async atualizarAparelhosComNovasCameras() {
    try {
      console.log('Tentando atualizar todos os aparelhos com novas câmeras responsáveis');
      
      // Mapeia a lista de aparelhos e chama a função de atualização para cada um
      const updatePromises = this.ListaDeAparelhos.map((aparelho) => {
        return this.objectService.updateAparelhoNovaCameraResponsavel(aparelho.cameraId, aparelho.id);
      });
      
      // Espera todas as promessas serem resolvidas
      const resultados = await Promise.all(updatePromises);
      
      console.log('Todos os aparelhos foram atualizados:', resultados);
    } catch (error) {
      console.error('Erro ao atualizar os aparelhos:', error);
    }
  }
  


  removerCamerasRedundantes() {
    const camerasMantidas = []; // Armazena as câmeras que serão mantidas
    const totalIteracoesRedundantes = this.ListaDeCameras.length;
    let iteracaoAtualRedundante = 0;

    for (const cameraAtual of [...this.ListaDeCameras]) {
      // Aparelhos cobertos pela câmera atual
      const aparelhosCobertos = this.ListaDeAparelhos.filter(
        (aparelho) => aparelho.cameraId === cameraAtual.id
      );

      let todosCobertosPorOutrasCameras = true;

      // Remover temporariamente a câmera do sistema
      this.ListaDeCameras = this.ListaDeCameras.filter(
        (camera) => camera.id !== cameraAtual.id
      );

      // Atualizar o sistema sem a câmera
      this.atualizaCampoCamera();
      this.drawLoopFromAparelhos();

      // Verificar se os aparelhos ainda estão cobertos por outras câmeras
      for (const aparelho of aparelhosCobertos) {
        if (aparelho.cameraId === null || aparelho.cameraId === undefined || aparelho.cameraId === 0) {
          todosCobertosPorOutrasCameras = false;
          break;
        }
      }

      if (todosCobertosPorOutrasCameras) {
        console.log(`Câmera ID ${cameraAtual.id} foi removida.`);
      } else {
        // Restaurar a câmera se algum aparelho não está coberto
        camerasMantidas.push(cameraAtual);
        console.log(`Câmera ID ${cameraAtual.id} foi mantida.`);
      }

      iteracaoAtualRedundante++;
      // Atualizar o progresso para a segunda metade (50% a 100%)
      this.progressoCameras = Math.min(50 + (iteracaoAtualRedundante / totalIteracoesRedundantes) * 50, 100);

      // Atualizar novamente o sistema após restauração
      this.ListaDeCameras = [...this.ListaDeCameras, ...camerasMantidas];
      this.atualizaCampoCamera();
      this.drawLoopFromAparelhos();
    }

    // Atualizar a lista final de câmeras mantidas
    this.ListaDeCameras = camerasMantidas;
  }





  atualizaCampoCamera() {
    this.ListaDeCampoDeVisaoCamera = this.ListaDeCameras.map(camera => {
      const visionData = camera.getVisionPointsListWithID();
      //console.log('visionData',visionData)
      return {
        id: visionData.id,
        pontos: visionData.pontos
      };
    });
  }

  adicionarCamera(): void {
    // Verifica se há câmeras na lista
    if (this.ListaDeCameras.length > 0) {
      // Obtém a última câmera da lista
      const ultimaCamera = this.ListaDeCameras[this.ListaDeCameras.length - 1];

      // Cria uma nova câmera com ID incrementado
      const novaCamera = new Camera(
        ultimaCamera.id + 1,  // Incrementa o ID da última câmera
        40,  // Definindo valor fixo para Z ou pode ser ajustado
        50,  // Definindo FOV fixo ou pode ser dinâmico
        250,  // Definindo alcance fixo ou pode ser dinâmico se necessário
        this.academia.width / 2,  // Posiciona no centro de academia
        this.academia.height / 2,  // Posiciona no centro de academia
        20,  // Definindo rotação fixa ou ajustada conforme necessário
        this.academia.id  // Mantém o ID da academia
      );

      // Adiciona a nova câmera na lista de câmeras
      this.ListaDeCameras.push(novaCamera);

      // Exibe no console a nova câmera adicionada
      console.log('Nova câmera adicionada:', novaCamera);
    } else {
      console.error('Nenhuma câmera encontrada na lista!');
    }
    this.drawLoopFromAparelhos();
  }




  gerarAparelhos() {
    if (this.ListaDeCameras.length > 0) {
      this.snackBar.open('Não pode gerar se já existir', 'Fechar', {
        duration: 3000,
        panelClass: ['mat-toolbar', 'mat-primary'], // Alerta de sucesso
      });
    }

    const aparelhos = [];
    let id = 1;

    const distanciaMin = 20; // Distância mínima entre aparelhos (em metros)
    const distanciaMax = 50; // Distância máxima entre aparelhos (em metros)
    const tamanhoMin = 10; // Dimensão mínima dos aparelhos (em metros)
    const tamanhoMax = 20; // Dimensão máxima dos aparelhos (em metros)
    const maxAparelhos = 30; // Limite máximo de aparelhos

    // Array de divisões aleatórias do enum DivisoesDeTreino
    const divisoesCorpo = Object.values(DivisoesDeTreino);

    for (let y = 20; y < (this.academia.height - 20) * 20 && aparelhos.length < maxAparelhos;) {
      for (let x = 20; x < (this.academia.width - 20) * 30 && aparelhos.length < maxAparelhos;) {
        const largura = Math.random() * (tamanhoMax - tamanhoMin) + tamanhoMin;
        const profundidade = Math.random() * (tamanhoMax - tamanhoMin) + tamanhoMin;
        const altura = Math.random() * (2 - 1) + 1;

        const larguraPixels = largura * 10;
        const profundidadePixels = profundidade * 10;

        if ((x + larguraPixels <= this.academia.width * 10) && (y + profundidadePixels <= this.academia.height * 10)) {
          let sobreposicao = false;

          for (const aparelho of aparelhos) {
            const distanciaX = Math.abs(aparelho.x - x / 10);
            const distanciaY = Math.abs(aparelho.y - y / 10);

            if (distanciaX < (aparelho.largura + largura) / 2 && distanciaY < (aparelho.profundidade + profundidade) / 2) {
              sobreposicao = true;
              break;
            }
          }

          if (!sobreposicao) {
            const novaDivisao = divisoesCorpo[Math.floor(Math.random() * divisoesCorpo.length)]; // Seleciona aleatoriamente uma divisão

            const novoAparelho = {
              id: id++,
              nome_equipamento: `Equipamento ${id}`,
              cameraId: -1,
              altura: altura,
              largura: largura,
              profundidade: profundidade,
              x: x / 10,
              y: y / 10,
              isParede: false,
              data_aquisicao: new Date(),
              status: 'ativo',
              idAcademia: this.academia.id,
              divisao: novaDivisao, // Atribui a divisão aleatória
              ocupado: false,
              temRoi: false
            };
            aparelhos.push(novoAparelho);

            // Envia para cadastro
            this.salvarAparelho(novoAparelho);

            const distanciaX = Math.random() * (distanciaMax - distanciaMin) + distanciaMin;
            x += (largura + distanciaX) * 10;
          } else {
            const distanciaY = Math.random() * (distanciaMax - distanciaMin) + distanciaMin;
            y += (profundidade + distanciaY) * 10;
            break;
          }
        } else {
          const distanciaY = Math.random() * (distanciaMax - distanciaMin) + distanciaMin;
          y += (profundidade + distanciaY) * 10;
          break;
        }
      }
    }

    this.ListaDeAparelhos = aparelhos;
  }


  salvarAparelho(aparelho: any) {
    this.objectService.cadastrarEquipamento(aparelho).subscribe({
      next: (response) => {
        this.snackBar.open('Aparelho cadastrado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['mat-toolbar', 'mat-primary'],
        });
        // Atualiza a lista de aparelhos após cada cadastro
        this.aparelhosAssociadosAcademia(this.academia.id);
      },
      error: (err) => {
        this.snackBar.open(`Erro ao cadastrar o aparelho ${aparelho.nome_equipamento}.`, 'Fechar', {
          duration: 3000,
          panelClass: ['mat-toolbar', 'mat-warn'],
        });
      },
    });
  }

  atualizarCameras() {
    if (!this.ListaDeCameras || this.ListaDeCameras.length === 0) {
      console.warn('Nenhuma câmera disponível para atualizar.');
      return;
    }
  
    this.cameraService.atualizarCameras(this.ListaDeCameras).subscribe({
      next: (response) => {
        console.log('Câmeras atualizadas com sucesso:', response);
      },
      error: (error) => {
        console.error('Erro ao atualizar câmeras:', error);
      }
    });
  }


  salvarCameras(): void {
    // Chama o serviço para salvar as câmeras com a academia associada
    console.log('dataSourceCameras', this.dataSourceCameras)
    this.cameraService.salvarCameras(this.ListaDeCameras, this.academia.id).subscribe({
      next: (response) => {
        // Sucesso: notifica o usuário e fecha o Snackbar
        this.snackBar.open('Câmeras salvas com sucesso!', 'Fechar', { duration: 3000 });

        // Após salvar, atualiza a lista de câmeras associadas à academia
        this.camerasAssociadasAcadermia(this.academia.id);
      },
      error: (error) => {
        // Erro: loga o erro e notifica o usuário
        console.error('Erro ao salvar câmeras:', error);
        this.snackBar.open('Erro ao salvar câmeras.', 'Fechar', { duration: 3000 });
      }
    });
  }

  async camerasAssociadasAcadermia(academiaId: number): Promise<void> {
    try {
      const cameras = await firstValueFrom(this.cameraService.getCamerasByAcademiaId(academiaId));
      if (cameras.length > 0) {
        this.ListaDeCameras = cameras;
        this.dataSourceCameras.data = this.ListaDeCameras;
        console.log('Câmeras recebidas da academia', this.ListaDeCameras);
      } else {
        console.log('Nenhuma câmera encontrada para essa academia.');
      }
    } catch (error) {
      console.error('Erro ao buscar câmeras:', error);
    }
  }

  async aparelhosAssociadosAcademia(academiaId: number): Promise<void> {
    try {
      const aparelhos = await firstValueFrom(this.objectService.buscarEquipamentosByAcademiaId(academiaId));
      if (aparelhos.length > 0) {
        this.ListaDeAparelhos = aparelhos;
        this.dataSourceAparelhos.data = this.ListaDeAparelhos;
        console.log('Aparelhos recebidos', this.ListaDeAparelhos);
      } else {
        console.log('Nenhum aparelho encontrado para essa academia.');
      }
    } catch (error) {
      console.error('Erro ao buscar aparelhos:', error);
    }
  }


  async ngOnInit(): Promise<void> {

    this.academiaId = (await this.academiaService.getIdAcademiaByLocalStore()) ?? 0;

    try {
      // Buscando dados da academia
      const data = await this.academiaService.fetchAcademiaById(this.academiaId);
      if (data) {
        console.log('Academia encontrada', data);
        this.academia = data;
        console.log('ACADEMIA', this.academia);
      } else {
        console.error("Academia não encontrada");
      }
    } catch (error) {
      console.error("Erro ao buscar academia:", error);
    }

    // Marca que os dados foram carregados
    this.isDataLoaded = true;

    await this.camerasAssociadasAcadermia(this.academia.id);
    await this.aparelhosAssociadosAcademia(this.academia.id)
    // Processamento das listas de aparelhos e câmera
    this.processarAparelhos();

    // Verificando a lista de corners
    console.log(this.ListaDeCornersAparelhos);

    // Atualizando os pontos de visão de todas as câmeras
    this.ListaDeCampoDeVisaoCamera = this.ListaDeCameras.map((camera) => {
      const visionData = camera.getVisionPointsListWithID();
      return {
        id: visionData.id,
        pontos: visionData.pontos,
      };
    });

    // Executando as funções que dependem dos pontos de visão e aparelhos
    this.getVisionPointsForAllCameras();
    this.drawLoopFromAparelhos();
    this.getVisionPointsForAllCameras();
    this.cdr.detectChanges();

    // Inscreva-se para receber as mudanças no estado da sidebar
    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {

    });
  }
  getNivelAcesso(): string | null {
    let teste = localStorage.getItem('nivelAcesso');
    if (teste === null) {
      return '1';
    }
    return teste
  }

  // Função para verificar a permissão e iniciar o arrasto para as câmeras
  checkPermissionAndStartDragCamera(event: MouseEvent, camera: any) {
    if (this.getNivelAcesso() === '1') {
      this.startDragCamera(event, camera);
    } else {
      event.preventDefault();  // Impede o arrasto se a permissão não for 1
      console.log('Você não tem permissão para arrastar câmeras');
    }
  }

  // Função para verificar a permissão e iniciar o arrasto para os aparelhos
  checkPermissionAndStartDragAparelho(event: MouseEvent, aparelho: any) {
    if (this.getNivelAcesso() === '1') {
      this.startDragAparelhoLista(event, aparelho);
    } else {
      event.preventDefault();  // Impede o arrasto se a permissão não for 1
      console.log('Você não tem permissão para arrastar aparelhos');
    }
  }
  processarAparelhos() {
    // Processando aparelhos e calculando corners
    console.log('Processando aparelhos', this.ListaDeAparelhos)
    this.ListaDeCornersAparelhos = this.ListaDeAparelhos.map((aparelho) => {
      return {
        id: aparelho.id,
        corners: [
          { x: aparelho.x, y: aparelho.y },
          { x: aparelho.x + aparelho.largura, y: aparelho.y },
          { x: aparelho.x, y: aparelho.y + aparelho.profundidade },
          { x: aparelho.x + aparelho.largura, y: aparelho.y + aparelho.profundidade },
        ],
      };
    });

  }


  // Esse método é chamado depois que a view é inicializada, ou seja, depois que o DOM está carregado
  async ngAfterViewInit(): Promise<void> {
    // Aguarda até que os dados estejam carregados
    await this.waitForDataLoad();

    if (isPlatformBrowser(this.platformId)) {
      this.mapContainer = document.querySelector('.map-container') as HTMLElement;
      this.getMapDimensions();
    }

    // Verifica e configura o paginator para aparelhos
    if (this.paginatorAparelho) {
      this.dataSourceAparelhos.paginator = this.paginatorAparelho;
      console.log('dataSourceAparelhos', this.dataSourceAparelhos.paginator)
      this.paginatorAparelho.pageIndex = 0; // Reseta para a página 1 (index 0)
    }

    // Verifica e configura o paginator para câmeras
    if (this.paginatorCamera) {
      this.dataSourceCameras.paginator = this.paginatorCamera;
      this.paginatorCamera.pageIndex = 0; // Reseta para a página 1 (index 0)
    }

    this.cdr.detectChanges();
  }


  private waitForDataLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkData = () => {
        if (this.isDataLoaded) {
          resolve();
        } else {
          setTimeout(checkData, 50); // Checa novamente após 50ms
        }
      };
      checkData();
    });
  }

  getPathForCamera(pontos: { x: number; y: number }[]): string {
    if (!pontos || pontos.length === 0) return '';
    return pontos
      .map((ponto, index) =>
        index === 0 ? `M ${ponto.x},${ponto.y}` : `L ${ponto.x},${ponto.y}`
      )
      .join(' ');
  }
  getMapDimensions(): void {
    // Usando as propriedades do objeto academia
    this.mapWidthPx = this.academia.width;  // Usando o valor de 'width' da academia
    this.mapHeightPx = this.academia.height;  // Usando o valor de 'height' da academia

    // Conversão de pixels para metros
    this.mapWidthMeters = this.mapWidthPx / 10;
    this.mapHeightMeters = this.mapHeightPx / 10;

    //console.log(`Largura: ${this.mapWidthMeters}m, Altura: ${this.mapHeightMeters}m`);
  }


  startDragAparelhoLista(event: MouseEvent, aparelho: Objeto): void {
    this.isDraggingAparelho = true;

    // Calcula os deslocamentos fora do ciclo de detecção de mudanças atual
    this.offsetXAparelho = event.clientX - aparelho.x * this.scaleFactor;
    this.offsetYAparelho = event.clientY - aparelho.y * this.scaleFactor;

    // Armazenando o aparelho que está sendo arrastado
    this.aparelhoEmMovimento = aparelho;
    // Impede o comportamento padrão do navegador (como seleção de texto)
    event.preventDefault();
  }


  startDragCamera(event: MouseEvent, camera: Camera): void {
    this.isDraggingCamera = true;
    this.editandoCamera = camera.id;
    console.log(camera)

    // Impede que o evento se propague para os outros elementos (evita bloquear os aparelhos)
    event.stopPropagation();

    // Calcula os deslocamentos para o clique da câmera
    this.offsetX = event.clientX - camera.x * this.scaleFactor;
    this.offsetY = event.clientY - camera.y * this.scaleFactor;
    // Armazenando a câmera que está sendo movida
    this.cameraEmMovimento = camera;

    // Impede o comportamento padrão do navegador (como seleção de texto)
    event.preventDefault();
  }
  cameraEmMovimento: any = null;
  isDraggingCamera = false;

  drawLoopFromAparelhos() {
    // Reatribuir cameraId para os aparelhos com valores negativos
    const validCameraIds = [...new Set(this.listaPoligonos.map(p => p.idCamera))].sort((a, b) => a - b);

    for (let aparelho of this.ListaDeAparelhos) {
      if (aparelho.cameraId < 0) {
        // Encontrar o menor cameraId disponível
        const nextCameraId = validCameraIds.find(id => !this.ListaDeAparelhos.some(a => a.cameraId === id));
        if (nextCameraId !== undefined) {
          aparelho.cameraId = nextCameraId; // Atribuir o menor cameraId disponível
        }
      }
    }
    // Redesenhar linhas para todos os aparelhos
    for (let aparelho of this.ListaDeAparelhos) {
      // console.log('aparelho', aparelho)
      if (this.ListaDeCameras.length > 0) {
        this.getVisionPointsForAllCameras();
        this.drawLinesFromSingleAparelho(aparelho); // Desenhando as linhas para cada aparelho
        this.findMatchingAnglesMultipleCameras(aparelho);

        this.combinarPontosComSombra(aparelho);
      } else { }
    }
    // Remover aparelhos que não atendem aos critérios
    this.removeAparelhoBehind();
  }

  removeAparelhoBehind() {
    const listaPoligonosOriginal = [...this.listaPoligonos]; // Cópia da lista original

    // Verificar aparelhos já na ListaVisaoBloqueada
    for (let i = this.ListaVisaoBloqueada.length - 1; i >= 0; i--) {
      const visaoBloqueada = this.ListaVisaoBloqueada[i];

      // Encontrar o aparelho correspondente
      const aparelho = this.ListaDeAparelhos.find(
        (a) => a.id === visaoBloqueada.idAparelho
      );

      if (!aparelho) {
        // console.warn(
        //   `Aparelho não encontrado para idAparelho=${visaoBloqueada.idAparelho} e idCamera=${visaoBloqueada.idCamera}.`
        // );
        continue; // Pular caso o aparelho não seja encontrado
      }

      let dentroDePoligonoRelacionado = false;

      // Verificar se o aparelho está dentro de algum polígono relacionado à câmera específica
      for (const poligono of listaPoligonosOriginal) {
        if (poligono.idCamera !== visaoBloqueada.idCamera) {
          continue; // Pular polígonos que não pertencem à mesma câmera
        }

        const pontosCorrigidos = [...poligono.pontos];
        [pontosCorrigidos[0], pontosCorrigidos[1]] = [pontosCorrigidos[1], pontosCorrigidos[0]];

        const pontoCentral = {
          x: aparelho.x + aparelho.largura / 2,
          y: aparelho.y + aparelho.profundidade / 2,
        };

        if (this.isPointInsidePolygon(pontoCentral, pontosCorrigidos)) {
          dentroDePoligonoRelacionado = true;
          break; // Encontrado um polígono válido, não precisa verificar mais
        }
      }

      // Se o aparelho não está dentro de nenhum polígono relacionado à câmera específica
      if (!dentroDePoligonoRelacionado) {
        this.ListaVisaoBloqueada.splice(i, 1); // Remover da lista
      }
    }


    // Continuar com a lógica de adicionar aparelhos dentro de polígonos
    for (const poligono of listaPoligonosOriginal) {
      const pontosCorrigidos = [...poligono.pontos];
      [pontosCorrigidos[0], pontosCorrigidos[1]] = [pontosCorrigidos[1], pontosCorrigidos[0]];

      const aparelhosCorrespondentes = this.ListaDeAparelhos.filter(
        (aparelho) => aparelho.cameraId === poligono.idCamera
      );

      for (const aparelho of aparelhosCorrespondentes) {
        if (aparelho.id === poligono.idParelho) continue;

        const pontoCentral = {
          x: aparelho.x + aparelho.largura / 2,
          y: aparelho.y + aparelho.profundidade / 2,
        };

        if (this.isPointInsidePolygon(pontoCentral, pontosCorrigidos)) {
          // console.log('Adicionando', aparelho.id, 'a lista bloqueada');
          this.ListaVisaoBloqueada.push({
            idCamera: aparelho.cameraId,
            idAparelho: aparelho.id,
          });

          // Atualizar as listas após todas as verificações
          this.listaPoligonos = this.listaPoligonos.filter(
            (p) => p.idParelho !== aparelho.id
          );
          this.ListalinhasCameraEncontroPontosAparelho = this.ListalinhasCameraEncontroPontosAparelho.filter(
            (linha) => linha.id !== aparelho.id
          );
          this.pontosDeSombras = this.pontosDeSombras.filter(
            (sombra) => sombra.id !== aparelho.id
          );

          const linhasEstendidasCopia = [...this.linhasEstendidas];
          this.linhasEstendidas = linhasEstendidasCopia.filter(
            (linha) => linha.id !== aparelho.id
          );

          this.drawLoopFromAparelhos();
        }
      }
    }

    // console.log('LISTA FINAL:', this.ListaVisaoBloqueada);
  }




  angleBetweenPoints(p1: Ponto, p2: Ponto) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.atan2(dy, dx);
  }

  isPointInsidePolygon(ponto: { x: number; y: number }, vertices: { x: number; y: number }[]): boolean {


    let intersectCount = 0;
    const numVertices = vertices.length;

    for (let i = 0; i < numVertices; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % numVertices];

      // Verifica se o ponto está entre as alturas do segmento
      if ((ponto.y > Math.min(v1.y, v2.y)) && (ponto.y <= Math.max(v1.y, v2.y))) {
        // Calcula a interseção no eixo X para o segmento
        const xIntersect = ((ponto.y - v1.y) * (v2.x - v1.x)) / (v2.y - v1.y) + v1.x;

        // Verifica se o ponto está à esquerda da interseção
        if (ponto.x < xIntersect) {
          intersectCount++;
        }
      }
    }

    // Se o número de interseções é ímpar, o ponto está dentro do polígono
    return intersectCount % 2 === 1;
  }



  getPointsForPolygon(pontos: { x: number, y: number }[]): string {
    return pontos.map(ponto => `${ponto.x},${ponto.y}`).join(' ');
  }
  novoPrimeiro: { x: number, y: number } = { x: 0, y: 0 };
  novoUltimo: { x: number, y: number } = { x: 0, y: 0 };
  pontosExibidos: { x: number, y: number }[] = [];
  combinarPontosComSombra(aparelho: Objeto) {
    // console.log('this.this.ListalinhasCameraEncontroPontosAparelho', this.ListalinhasCameraEncontroPontosAparelho);


    this.ListalinhasCameraEncontroPontosAparelho.forEach(linha => {
      // console.log('linha', linha.id, 'aparelho', aparelho.id)
      if (linha.id != aparelho.id) {
        return
      }
      // Filtra os pontos de sombra que correspondem ao id da linha
      const pontosSombra = this.pontosDeSombras.filter(ponto => ponto.id === linha.id);

      if (pontosSombra.length > 0) {
        // Obter o cameraId do primeiro ponto
        // console.log('pontosSombra', pontosSombra);

        if (pontosSombra.length === 2) {
          const poligono: PoligonoSombra = {
            idParelho: linha.id,
            idCamera: linha.cameraId,
            pontos: [
              linha.primeiro, // Ponto "primeiro" da linha
              linha.ultimo,   // Ponto "ultimo" da linha
              pontosSombra[0], // Primeiro ponto de sombra
              pontosSombra[1]  // Segundo ponto de sombra
            ]
          };

          const pontos: Ponto = {
            x: poligono.pontos[2].x, // Acessa o valor de 'x' corretamente
            y: poligono.pontos[2].y  // Acessa o valor de 'y' corretamente
          };


          // Encontrar o triângulo correspondente ao cameraId
          const triangulo = this.ListaDeCampoDeVisaoCamera.find(camera => {
            // console.log('Comparando camera:', camera, 'com linha:', linha.cameraId);
            return camera.id === linha.cameraId;
          });

          if (triangulo) {
            // console.warn('Triângulo encontrado:', triangulo);
          } else {
            // console.warn('Nenhum triângulo encontrado para a linha com id:', linha.id);
          }
          if (triangulo) {
            // Agora você pode passar o ponto para verificar se está dentro do triângulo
            let retornoShadow = this.isPointInsideTriangleShadow(pontos, triangulo.pontos);

            // Verificar se o ponto está dentro da visão da câmera
            const pontoDentro = retornoShadow;

            // Se o ponto não estiver dentro, apagar a sombra
            if (!pontoDentro) {

              const linhasComId = this.linhasEstendidas.filter(linha => linha.id === aparelho.id);
              const primeirosEUltimos = linhasComId.map((linha) => ({
                primeiro: linha.primeiro,
                ultimo: linha.ultimo,
              }));

              // console.log('PONTOS ESTÃO FORA', primeirosEUltimos);

              if (linhasComId.length >= 1) {
                // Atribui os valores de 'primeiro' e 'último' para os pontos do polígono
                poligono.pontos[2] = linhasComId[0].primeiro; // Primeiro ponto da primeira linha
                poligono.pontos[3] = linhasComId[0].ultimo;   // Último ponto da primeira linha

                // console.log('Polígono atualizado:', poligono);
              }

              // Opcional: Se você precisa lidar com múltiplas linhas
              if (linhasComId.length === 2) {
                // Caso existam exatamente 2 linhas com o mesmo id
                poligono.pontos[2] = linhasComId[0].primeiro; // Primeiro ponto da primeira linha
                poligono.pontos[3] = linhasComId[1].ultimo;   // Último ponto da segunda linha

                // console.log('Polígono atualizado com 2 linhas:', poligono);
              } else {
                // console.warn('Não foi possível encontrar 2 linhas com o mesmo id.');
              }
            }
          } else {
            // console.warn('Câmera não encontrada para o id:', linha.id);
          }

          // Verifica se já existe um polígono na lista para o id da linha
          // console.log(' this.listaPoligonos', this.listaPoligonos)
          const poligonoExistenteIndex = this.listaPoligonos.findIndex(p => p.idParelho === linha.id);

          if (poligonoExistenteIndex !== -1) {
            // Atualiza o polígono existente
            this.listaPoligonos[poligonoExistenteIndex].pontos = poligono.pontos;
            // console.log('atualizando', poligonoExistenteIndex)
          } else {
            // Adiciona um novo polígono se não existir
            this.listaPoligonos.push(poligono);
          }
        }
      } else {
        // console.warn('Nenhum ponto de sombra encontrado para a linha especificada.');
      }
    });

    // console.log('Lista de poligonos', this.listaPoligonos);
  }

  isPointInsideTriangleShadow(
    ponto: { x: number; y: number },
    triangulo: { x: number; y: number }[]
  ): boolean {
    if (triangulo.length !== 3) {
      console.error('O triângulo deve conter exatamente 3 pontos.');
      return false;
    }

    const [p1, p2, p3] = triangulo;

    const areaOriginal = this.calculateTriangleArea(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    const area1 = this.calculateTriangleArea(ponto.x, ponto.y, p2.x, p2.y, p3.x, p3.y);
    const area2 = this.calculateTriangleArea(ponto.x, ponto.y, p1.x, p1.y, p3.x, p3.y);
    const area3 = this.calculateTriangleArea(ponto.x, ponto.y, p1.x, p1.y, p2.x, p2.y);

    const totalArea = area1 + area2 + area3;

    // Usar uma margem de erro para a comparação
    const epsilon = 0.0001; // Tolerância de precisão
    const pontoDentro = Math.abs(totalArea - areaOriginal) < epsilon;

    if (Math.abs(totalArea - areaOriginal) < epsilon) {

    } else {
      // apagar sombra
      this.shadow = { x: 0, y: 0, largura: 0, altura: 0 };
    }

    return pontoDentro;
  }


  pontosParaPlotar: PontoSvg[] = [];
  pontoCorrespondentePrimeiro = { x: 0, y: 0 }; // Exemplo de ponto
  pontoCorrespondenteUltimo = { x: 0, y: 0 };  // Exemplo de ponto

  calcularPontos() {
    // Adiciona os pontos ao array para exibição

    this.pontosParaPlotar = [
      { cx: this.pontoCorrespondentePrimeiro.x * this.scaleFactor, cy: this.pontoCorrespondentePrimeiro.y * this.scaleFactor, r: 5 },
      { cx: this.pontoCorrespondenteUltimo.x * this.scaleFactor, cy: this.pontoCorrespondenteUltimo.y * this.scaleFactor, r: 5 }
    ];
    //console.log('calculando', this.pontosParaPlotar)
  }




  gerarPontosAoLongoDaReta(ponto1: Ponto, ponto2: Ponto, passos: number): Ponto[] {
    const pontosAoLongoDaReta: Ponto[] = [];

    for (let i = 0; i <= passos; i++) {
      const t = i / passos;
      const x = Math.round(ponto1.x + t * (ponto2.x - ponto1.x)); // Interpolação linear para o ponto x
      const y = Math.round(ponto1.y + t * (ponto2.y - ponto1.y)); // Interpolação linear para o ponto y

      pontosAoLongoDaReta.push({ x, y });
    }

    return pontosAoLongoDaReta;
  }

  findMatchingAnglesMultipleCameras(aparelho: Objeto) {
    // Encontrar a câmera associada ao aparelho
    const cameraCorners = this.ListaDeCamerasCorners.find(camera => camera.id === aparelho.cameraId);
    if (!cameraCorners) {
      // console.log("Câmera não encontrada,cameraCorners");
      return;
    }



    // Limpa as listas de linhas e sombras associadas ao aparelho
    this.linhasComAltura = [];
    this.pontosDeSombras = this.pontosDeSombras.filter(ponto => ponto.id !== aparelho.id); // Remove sombras do aparelho
    this.linhasEstendidas = this.linhasEstendidas.filter(linha => linha.id !== aparelho.id);

    //console.log('644',  this.linhasEstendidas)

    // Itera sobre cada linha em ListalinhasCameraEncontroPontosAparelho
    //console.log('647',this.ListalinhasCameraEncontroPontosAparelho, 'oi')
    this.ListalinhasCameraEncontroPontosAparelho.forEach((linha) => {
      //console.log('649 aparelho', aparelho, 'linha', linha);

      // Encontrar a câmera onde aparelho.cameraId é igual a camera.id
      const camera = this.ListaDeCameras.find(cam => cam.id === aparelho.cameraId);

      if (aparelho.id != linha.id) {
        //console.log('retornando');
        return;
      }

      if (!camera) {
        console.log('Câmera não encontrada ou sem pontos!');
        return;
      }

      // Agora, a origemCamera será o primeiro ponto da câmera encontrada
      const origemCamera = camera;
      // Calcular os ângulos para o primeiro e último ponto da linha
      const anguloPrimeiro = Math.atan2(linha.primeiro.y - origemCamera.y, linha.primeiro.x - origemCamera.x);
      const anguloUltimo = Math.atan2(linha.ultimo.y - origemCamera.y, linha.ultimo.x - origemCamera.x);
      let menorDiferencaPrimeiro = Infinity;
      let menorDiferencaUltimo = Infinity;
      let pontoCorrespondentePrimeiro: { x: number, y: number } | null = null;
      let pontoCorrespondenteUltimo: { x: number, y: number } | null = null;

      // Busca os pontos limites de visão da câmera
      const pontosCamera = cameraCorners.pontos; // Pega os pontos da câmera atual

      pontosCamera.forEach((pontoLimite) => {
        const anguloPontoLimite = Math.atan2(pontoLimite.y - origemCamera.y, pontoLimite.x - origemCamera.x);

        // Calcula a diferença entre o ângulo de interesse e o ângulo do ponto
        const diferencaPrimeiro = Math.abs(anguloPrimeiro - anguloPontoLimite);
        const diferencaUltimo = Math.abs(anguloUltimo - anguloPontoLimite);

        // Verifica o ponto mais próximo para o "primeiro" ponto
        if (diferencaPrimeiro < menorDiferencaPrimeiro) {
          menorDiferencaPrimeiro = diferencaPrimeiro;
          pontoCorrespondentePrimeiro = pontoLimite;
        }

        // Verifica o ponto mais próximo para o "último" ponto
        if (diferencaUltimo < menorDiferencaUltimo) {
          menorDiferencaUltimo = diferencaUltimo;
          pontoCorrespondenteUltimo = pontoLimite;
        }
      });

      // Salva os pontos encontrados
      if (pontoCorrespondentePrimeiro) {
        this.pontoCorrespondentePrimeiro = pontoCorrespondentePrimeiro;
      }
      if (pontoCorrespondenteUltimo) {
        this.pontoCorrespondenteUltimo = pontoCorrespondenteUltimo;
      }

      const novasLinhas = [];
      if (pontoCorrespondentePrimeiro && linha.id === aparelho.id) {
        novasLinhas.push({
          primeiro: linha.primeiro,
          ultimo: pontoCorrespondentePrimeiro,
          id: aparelho.id,
          cameraOrigem: camera.id
        });
      }

      if (pontoCorrespondenteUltimo && linha.id === aparelho.id) {
        novasLinhas.push({
          primeiro: linha.ultimo,
          ultimo: pontoCorrespondenteUltimo,
          id: aparelho.id,
          cameraOrigem: camera.id
        });
      }


      // Verificação de existência de linha com o id do aparelho
      let linhaExistente = this.linhasEstendidas.find(item => item.id === aparelho.id);

      // Lógica de verificação de altura (câmera vs. aparelho)
      if (origemCamera.z <= aparelho.altura && linha.id === aparelho.id) {

        if (!linhaExistente) {

          // Se não existir linha com o id do aparelho, cria uma nova linha
          this.linhasEstendidas.push({
            primeiro: { x: pontoCorrespondentePrimeiro!.x, y: pontoCorrespondentePrimeiro!.y },
            ultimo: { x: pontoCorrespondenteUltimo!.x, y: pontoCorrespondenteUltimo!.y },
            id: aparelho.id,
            cameraOrigem: camera.id
          });
        } else {
          // Se já existir, atualize a linha correspondente
          linhaExistente.primeiro = { x: pontoCorrespondentePrimeiro!.x, y: pontoCorrespondentePrimeiro!.y };
          linhaExistente.ultimo = { x: pontoCorrespondenteUltimo!.x, y: pontoCorrespondenteUltimo!.y };
          linhaExistente.cameraOrigem = camera.id;
        }

        this.linhasEstendidas.forEach(item => {
          if (item.id === aparelho.id) {
            this.pontosDeSombras = this.pontosDeSombras.filter(ponto => ponto.id !== item.id);
            this.pontosDeSombras.push({ x: item.primeiro.x, y: item.primeiro.y, id: item.id });
            this.pontosDeSombras.push({ x: item.ultimo.x, y: item.ultimo.y, id: item.id });
          }
        });

        return;
      }

      if (origemCamera.id == aparelho.cameraId) {

        const calcularSombra = (ponto: { x: number, y: number }) => {
          const deltaX = ponto.x - origemCamera.x;
          const deltaY = ponto.y - origemCamera.y;
          const distanciaHorizontal = Math.sqrt(deltaX ** 2 + deltaY ** 2);
          const alturaRelativa = origemCamera.z - aparelho.altura;
          const fatorProjecao = distanciaHorizontal / (alturaRelativa + 1e-6); // Evita divisão por zero
          return {
            x: ponto.x + deltaX * fatorProjecao,
            y: ponto.y + deltaY * fatorProjecao,
            id: aparelho.id
          };
        };

        // Calcula as sombras para o primeiro e último ponto
        const sombraPrimeiro = calcularSombra(linha.primeiro);
        const sombraUltimo = calcularSombra(linha.ultimo);

        const distanciaPrimeiro = Math.sqrt((linha.primeiro.x - sombraPrimeiro.x) ** 2 + (linha.primeiro.y - sombraPrimeiro.y) ** 2);
        const distanciaUltimo = Math.sqrt((linha.ultimo.x - sombraUltimo.x) ** 2 + (linha.ultimo.y - sombraUltimo.y) ** 2);

        if (distanciaPrimeiro < this.toleranceSombra && distanciaUltimo < this.toleranceSombra) {
          this.shadow = { x: 0, y: 0, largura: 0, altura: 0 };
          return;
        }
        if (linha.id === aparelho.id) {
          this.pontosDeSombras.push(sombraPrimeiro);
          this.pontosDeSombras.push(sombraUltimo);
          this.linhasEstendidas.push({
            primeiro: { x: pontoCorrespondentePrimeiro!.x, y: pontoCorrespondentePrimeiro!.y },
            ultimo: { x: pontoCorrespondenteUltimo!.x, y: pontoCorrespondenteUltimo!.y },
            id: aparelho.id,
            cameraOrigem: camera.id
          });
        }
      } else {
        // console.log('aparelho errado para a camera');
      }
    });


    //console.log('790', this.linhasEstendidas);
  }






  pontos: { x: number, y: number }[] = [];
  ListaPontosLimiteVisaoCameras: { id: number, pontos: Ponto[] }[] = [];
  drawLinesFromSingleAparelho(aparelho: Objeto) {
    // Remove todas as linhas associadas ao aparelho fornecido
    this.ListalinhasCameraEncontroPontosAparelho = this.ListalinhasCameraEncontroPontosAparelho.filter(
      (linha) => linha.id !== aparelho.id
    );

    // Reset o cameraId para permitir nova atribuição
    aparelho.cameraId = 0;

    // Declara um tipo explícito para cameraMaisProxima
    let cameraMaisProxima: {
      id: number;
      distancia: number;
      primeiroPonto: { x: number, y: number, id: number };
      ultimoPonto: { x: number, y: number, id: number };
      cameraVisao: { x: number, y: number };
    } = {
      id: -1,
      distancia: Infinity,
      primeiroPonto: { x: 0, y: 0, id: 0 },
      ultimoPonto: { x: 0, y: 0, id: 0 },
      cameraVisao: { x: 0, y: 0 },
    };

    this.ListaDeCameras.forEach((camera) => {
      const bloqueada = this.ListaVisaoBloqueada.some(
        (bloqueio) => bloqueio.idAparelho === aparelho.id && bloqueio.idCamera === camera.id
      );
      //console.log('974', this.ListaDeCameras)

      if (bloqueada) {
        // Pula para a próxima câmera se bloqueada
        //console.log(`LISTA Câmera ${camera.id} está bloqueada para o aparelho ${aparelho.id}`);
        return;
      }
      const aparelhoDentroDaVisao = this.isAparelhoWithinCameraVisionMulti(
        aparelho.x,
        aparelho.y,
        aparelho.largura,
        aparelho.profundidade,
        camera.id  // visão da câmera (deve ser um array de pontos {x, y})
      );

      if (aparelhoDentroDaVisao) {
        //console.log('esta dentro')
        const cameraCorner = this.ListaDeCamerasCorners.find((corner) => corner.id === camera.id);
        if (!cameraCorner) return;

        let primeiroPonto: { x: number, y: number, id: number } | null = null;
        let ultimoPonto: { x: number, y: number, id: number } | null = null;

        // Itera sobre os pontos limites de visão da câmera
        cameraCorner.pontos.forEach((ponto) => {
          const deltaX = ponto.x - camera.x;
          const deltaY = ponto.y - camera.y;

          const quantidadeDePassos = Math.max(Math.abs(deltaX), Math.abs(deltaY));
          let encontrouPrimeiro = false;

          for (let i = 0; i <= quantidadeDePassos; i++) {
            const t = i / quantidadeDePassos;
            const x = Math.round(camera.x + t * deltaX);
            const y = Math.round(camera.y + t * deltaY);

            if (this.isPointInsideAparelhoID(x, y, aparelho)) {
              if (!encontrouPrimeiro && (!primeiroPonto || primeiroPonto.id !== aparelho.id)) {
                primeiroPonto = { x, y, id: aparelho.id };
                encontrouPrimeiro = true;
              }
              ultimoPonto = { x, y, id: aparelho.id };
            } else if (encontrouPrimeiro) {
              break;
            }
          }
        });

        if (primeiroPonto && ultimoPonto && primeiroPonto !== ultimoPonto) {
          const cameravisao = { x: camera.x, y: camera.y };

          // Calcula a distância entre a câmera e o centro do aparelho
          const distancia = Math.sqrt(
            Math.pow(camera.x - aparelho.x, 2) + Math.pow(camera.y - aparelho.y, 2)
          );

          // Atualiza a câmera mais próxima
          if (distancia < cameraMaisProxima.distancia) {
            cameraMaisProxima = {
              id: camera.id,
              distancia,
              primeiroPonto,
              ultimoPonto,
              cameraVisao: cameravisao,
            };
          }
        }
        // Atualiza ou adiciona a linha na lista
        if (cameraMaisProxima) {
          //console.log('Trocando de câmera para o aparelho:', aparelho.id);

          // Verifica se já existe uma linha para o aparelho na lista
          const linhaExistente = this.ListalinhasCameraEncontroPontosAparelho.find(
            (linha) => linha.id === aparelho.id
          );

          if (linhaExistente) {
            // Atualiza a linha existente com as novas informações da câmera mais próxima
            linhaExistente.primeiro = cameraMaisProxima.primeiroPonto;
            linhaExistente.ultimo = cameraMaisProxima.ultimoPonto;
            linhaExistente.cameraVisao = cameraMaisProxima.cameraVisao;
          } else {
            // Se não existir uma linha, cria uma nova entrada na lista
            this.ListalinhasCameraEncontroPontosAparelho.push({
              primeiro: cameraMaisProxima.primeiroPonto,
              ultimo: cameraMaisProxima.ultimoPonto,
              id: aparelho.id,
              cameraVisao: cameraMaisProxima.cameraVisao,
              cameraId: cameraMaisProxima.id
            });
          }

          // Atualiza o `cameraId` do aparelho para refletir a câmera mais próxima
          aparelho.cameraId = cameraMaisProxima.id;

          //console.log('Câmera mais próxima atribuída:', cameraMaisProxima.id);
        }
      } else {
        // console.log("O aparelho está fora da visão da câmera.");
        this.linhasEstendidas = this.linhasEstendidas.filter(linha => linha.id !== aparelho.id, camera.id !== aparelho.cameraId);
        this.listaPoligonos = this.listaPoligonos.filter(linha => linha.idParelho !== aparelho.id, camera.id !== aparelho.cameraId);
        return
      }
    });
    //console.log('oi', this.ListalinhasCameraEncontroPontosAparelho)
  }






  isPointInsideAparelhoID(x: number, y: number, aparelho: Objeto): boolean {
    const aparelhoLeft = aparelho.x;  // Canto esquerdo do aparelho
    const aparelhoTop = aparelho.y;   // Canto superior do aparelho
    const aparelhoRight = aparelho.x + aparelho.largura;  // Canto direito do aparelho
    const aparelhoBottom = aparelho.y + aparelho.profundidade;  // Canto inferior do aparelho

    // Verifica se o ponto (x, y) está dentro da área do aparelho
    return (x >= aparelhoLeft && x <= aparelhoRight && y >= aparelhoTop && y <= aparelhoBottom);
  }
  getPolygonPoints(pontos: { x: number; y: number }[]): string {
    //console.log('pontos',pontos)
    // Calcula o centro geométrico
    const centro = pontos.reduce(
      (acc, ponto) => ({ x: acc.x + ponto.x, y: acc.y + ponto.y }),
      { x: 0, y: 0 }
    );
    centro.x /= pontos.length;
    centro.y /= pontos.length;

    // Ordena os pontos pelo ângulo em relação ao centro
    const pontosOrdenados = pontos.sort((a, b) => {
      const anguloA = Math.atan2(a.y - centro.y, a.x - centro.x);
      const anguloB = Math.atan2(b.y - centro.y, b.x - centro.x);
      return anguloA - anguloB;
    });

    // Retorna os pontos como string para o atributo `points`
    return pontosOrdenados.map(ponto => `${ponto.x},${ponto.y}`).join(' ');
  }



  getPolygonPointsList(poligono: PoligonoSombra): string {
    const pontos = poligono.pontos;

    if (pontos.length !== 4) {
      return ''; // Certifique-se de que há 4 pontos
    }

    // Calcular o centro do polígono
    const centro = pontos.reduce((centro, ponto) => {
      centro.x += ponto.x;
      centro.y += ponto.y;
      return centro;
    }, { x: 0, y: 0 });

    centro.x /= pontos.length;
    centro.y /= pontos.length;

    // Função para calcular o ângulo de cada ponto em relação ao centro
    const calcularAngulo = (ponto: { x: number, y: number }) => {
      return Math.atan2(ponto.y - centro.y, ponto.x - centro.x);
    };

    // Ordenar os pontos em sentido anti-horário (ou horário, dependendo do seu caso)
    pontos.sort((a, b) => calcularAngulo(a) - calcularAngulo(b));

    // Agora os pontos estão ordenados de forma adequada
    return `${pontos[0].x},${pontos[0].y} ` +
      `${pontos[1].x},${pontos[1].y} ` +
      `${pontos[2].x},${pontos[2].y} ` +
      `${pontos[3].x},${pontos[3].y} ` +
      `${pontos[0].x},${pontos[0].y}`; // Fechar o polígono
  }


  isPointInsideApareloID(x: number, y: number, aparelho: Objeto): boolean {
    // Pegue os limites do aparelho, incluindo a posição inicial e o tamanho
    const aparelhoLeft = aparelho.x;
    const aparelhoTop = aparelho.y;
    const aparelhoRight = aparelhoLeft + aparelho.largura;
    const aparelhoBottom = aparelhoTop + aparelho.profundidade;

    // Verifica se o ponto (x, y) está dentro dos limites do aparelho
    return (x >= aparelhoLeft && x <= aparelhoRight && y >= aparelhoTop && y <= aparelhoBottom);
  }



  isPointInsideAparelho(x: number, y: number): boolean {
    // Pegue os limites do aparelho, incluindo a posição inicial e o tamanho
    if (!this.aparelho) return false;
    const aparelhoLeft = this.aparelho.x;
    const aparelhoTop = this.aparelho.y;
    const aparelhoRight = aparelhoLeft + this.aparelho.largura;
    const aparelhoBottom = aparelhoTop + this.aparelho.profundidade;

    // Verifica se o ponto (x, y) está dentro dos limites do aparelho
    return (x >= aparelhoLeft && x <= aparelhoRight && y >= aparelhoTop && y <= aparelhoBottom);
  }




  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDraggingCamera && !this.isDraggingAparelho) {
      return; // Sai da função se nenhuma das condições for verdadeira
    }

    //atualiza as sombras

    if (this.isDraggingAparelho) {
      // this.drawLinesFromCamera();
      this.drawLoopFromAparelhos();
      // Calcula as novas posições para o aparelho
      let newX = (event.clientX - this.offsetXAparelho) / this.scaleFactor;
      let newY = (event.clientY - this.offsetYAparelho) / this.scaleFactor;

      if (this.mapContainer) {
        // Obtenha as dimensões do mapa considerando o fator de escala
        const mapWidth = this.mapContainer.offsetWidth / this.scaleFactor;
        const mapHeight = this.mapContainer.offsetHeight / this.scaleFactor;

        if (typeof newX === 'undefined' || typeof newY === 'undefined') {
          newX = this.aparelhoEmMovimento?.x ?? 0;  // Usar a posição atual do aparelho caso não tenha sido definida, ou 0 como fallback
          newY = this.aparelhoEmMovimento?.y ?? 0;  // O mesmo para newY
        }

        // Certifique-se de que newX e newY estão dentro dos limites
        newX = Math.max(0, Math.min(newX, mapWidth - this.aparelhoEmMovimento!.largura));
        newY = Math.max(0, Math.min(newY, mapHeight - this.aparelhoEmMovimento!.profundidade));

        // Se você quiser garantir que o aparelho "encoste" no limite inferior
        if (newY + this.aparelhoEmMovimento!.profundidade >= mapHeight) {
          newY = mapHeight - this.aparelhoEmMovimento!.profundidade; // Faz o aparelho encostar no limite inferior
        }
      }

      // Atualiza o aparelho em movimento diretamente
      if (this.aparelhoEmMovimento) {
        this.drawLoopFromAparelhos();
        this.aparelhoEmMovimento.x = newX;
        this.aparelhoEmMovimento.y = newY;

        // Encontrar o aparelho dentro da ListaDeAparelhos com o mesmo ID do aparelho em movimento
        let aparelhoAtualizado = this.ListaDeAparelhos.find(item => item.id === this.aparelhoEmMovimento?.id);

        if (aparelhoAtualizado) {
          // Atualiza diretamente as propriedades 'x' e 'y' do aparelho encontrado
          aparelhoAtualizado.x = newX;
          aparelhoAtualizado.y = newY;

          // Agora vamos atualizar também os corners correspondentes a esse aparelho na ListaDeCornersAparelhos
          let cornersAtualizados = this.ListaDeCornersAparelhos.find(item => item.id === aparelhoAtualizado.id);
          if (cornersAtualizados) {
            // Atualiza os corners com os novos valores de 'x' e 'y'
            cornersAtualizados.corners = [
              { x: newX, y: newY },
              { x: newX + aparelhoAtualizado.largura, y: newY },
              { x: newX, y: newY + aparelhoAtualizado.profundidade },
              { x: newX + aparelhoAtualizado.largura, y: newY + aparelhoAtualizado.profundidade }
            ];
          } else {
            console.error('Não foi possível encontrar os corners para o aparelho com id:', aparelhoAtualizado.id);
          }
        } else {
          console.error('Aparelho não encontrado com id:', this.aparelhoEmMovimento.id);
        }
      }
    }


    if (this.isDraggingCamera) {
      this.ListaDeAparelhos.forEach(aparelho => {
        aparelho.cameraId = 0; // Zera a câmera responsável
        //console.log('zerando aparelho', aparelho.id)
      });
      //console.log('aloooo');
      this.drawLoopFromAparelhos();

      // Movimentação da câmera sendo arrastada
      let newX = event.clientX - this.offsetX;
      let newY = event.clientY - this.offsetY;

      if (this.mapContainer) {
        newX = Math.max(0, Math.min(newX, this.mapContainer.offsetWidth - 10));
        newY = Math.max(0, Math.min(newY, this.mapContainer.offsetHeight - 10));
      }
      // Atualiza a posição da câmera e recalcula os pontos de visão
      this.ListaDeCampoDeVisaoCamera = this.ListaDeCampoDeVisaoCamera.filter(camera => camera.id !== this.cameraEmMovimento.id);

      // Atualiza as coordenadas apenas da câmera que está sendo movida
      this.ListaDeCameras.forEach(camera => {
        if (camera === this.cameraEmMovimento) {
          camera.x = newX;
          camera.y = newY;

          // Recalcula os pontos de visão para a câmera em movimento
          const novosPontos = camera.getVisionPointsListWithID(); // Obtém a lista de pontos da câmera
          // Atualiza ou adiciona os pontos de visão na lista
          this.ListaDeCampoDeVisaoCamera.push({
            id: this.cameraEmMovimento.id,
            pontos: novosPontos.pontos
          });
        }
      });

      // ListaDeCamerasCorners preciso atualizar isso de acordo com os novos valores

      this.getVisionPointsForAllCameras()


    }
  }



  @HostListener('document:mouseup')
  onMouseUp(): void {
    // Delay de 3 segundos

    this.isDraggingCamera = false;
    this.isDraggingAparelho = false; // Finaliza o arraste do aparelho
    this.isAparelhoWithinCameraVision(); // Verifica se o aparelho está dentro do campo de visão
  }

  stopDrag(): void {
    this.isDraggingCamera = false;
    this.cameraEmMovimento = null;  // Limpa a câmera em movimento
    //console.log('oiii')
  }

  // Função para pegar os pontos do triângulo da visão da câmera
  getVisionPoints() {

    this.pontosLimitesDeVisaoDaCamera = [];

    // Verifica se a câmera existe e se retorna pontos
    const pontos = this.camera ? this.camera.getVisionPoints() : [];

    // Verifica se há pontos suficientes para continuar o processamento
    if (pontos.length >= 3) {
      this.visaoCameraCorners = pontos;

      // Pega o ponto 1 e ponto 2
      const ponto1 = pontos[1];
      const ponto2 = pontos[2];

      // Calcula a distância euclidiana entre ponto1 e ponto2
      const quantidadeDePontos = Math.sqrt(
        Math.pow(ponto2.x - ponto1.x, 2) + Math.pow(ponto2.y - ponto1.y, 2)
      );

      // Calcula a diferença entre os pontos
      const deltaX = ponto2.x - ponto1.x;
      const deltaY = ponto2.y - ponto1.y;

      // Interpola os pontos entre ponto1 e ponto2
      for (let i = 0; i <= quantidadeDePontos; i++) {
        const t = i / quantidadeDePontos; // Normaliza o índice para o intervalo [0, 1]
        const x = Math.round(ponto1.x + t * deltaX); // Interpolação linear para x
        const y = Math.round(ponto1.y + t * deltaY); // Interpolação linear para y

        // Adiciona os pontos com a propriedade 'id'
        const pontoComId = { x, y, id: i }; // Usando o índice 'i' como id
        this.pontosLimitesDeVisaoDaCamera.push(pontoComId);
      }

      // Retorna os pontos calculados
      return pontos;
    } else {
      return [];
    }
  }


  getVisionPointsForAllCameras(): { id: number; pontos: { x: number; y: number }[] }[] {
    // Se não houver câmeras na lista, retorna uma lista vazia
    if (!this.ListaDeCameras || this.ListaDeCameras.length === 0) {
      // console.warn('Nenhuma câmera disponível para calcular pontos de visão.');
      return [];
    }

    // Mapeia cada câmera da lista de câmeras
    this.ListaDeCamerasCorners = this.ListaDeCameras.map(camera => {
      // Obtém os pontos da visão da câmera
      const pontos = camera.getVisionPoints();

      // Verifica se a função `getVisionPoints` retornou os pontos corretamente
      if (!pontos || pontos.length < 3) {
        // console.warn(`Câmera ID ${camera.id} retornou pontos inválidos.`);
        return {
          id: camera.id,
          pontos: []
        };
      }

      const ponto1 = pontos[1];  // Ponto 1 (segundo ponto)
      const ponto2 = pontos[2];  // Ponto 2 (terceiro ponto)
      const idcamera = camera.id;  // ID da câmera

      // Calcula a distância entre os pontos (ponto1 e ponto2) para determinar quantos pontos interpolar
      const quantidadeDePontos = Math.sqrt(
        Math.pow(ponto2.x - ponto1.x, 2) + Math.pow(ponto2.y - ponto1.y, 2)
      );

      // Calcula a diferença no eixo X e Y entre ponto1 e ponto2
      const deltaX = ponto2.x - ponto1.x;
      const deltaY = ponto2.y - ponto1.y;

      // Lista para armazenar os pontos interpolados
      const pontosInterpolados: { x: number; y: number }[] = [];

      // Interpola os pontos entre ponto1 e ponto2
      for (let i = 0; i <= quantidadeDePontos; i++) {
        const t = i / quantidadeDePontos;
        const x = Math.round(ponto1.x + t * deltaX);  // Calcula a coordenada X interpolada
        const y = Math.round(ponto1.y + t * deltaY);  // Calcula a coordenada Y interpolada
        pontosInterpolados.push({ x, y });  // Adiciona o ponto interpolado à lista
      }

      // Retorna a estrutura de dados para a câmera, com seu ID e os pontos interpolados
      return {
        id: idcamera,
        pontos: pontosInterpolados,
      };
    });

    // Retorna a lista de câmeras com os pontos interpolados
    //console.log('1398', this.ListaDeCamerasCorners)
    return this.ListaDeCamerasCorners;
  }


  getCameraCorners(cameraId: number): { x: number; y: number }[] {
    const cameraCorner = this.ListaDeCamerasCorners.find(corner => corner.id === cameraId);
    return cameraCorner ? cameraCorner.pontos : [];
  }
  // Função para incrementar o ângulo de rotação


  // Função para calcular a área de um triângulo dado três pontos
  calculateTriangleArea(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
  }

  isPointInsideTriangle(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number
  ): boolean {
    // Calcula a área do triângulo original
    const calculateTriangleArea = (
      x1: number, y1: number,
      x2: number, y2: number,
      x3: number, y3: number
    ): number => Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);

    const areaOriginal = calculateTriangleArea(x1, y1, x2, y2, x3, y3);

    // Calcula as áreas dos triângulos menores formados com o ponto
    const area1 = calculateTriangleArea(px, py, x2, y2, x3, y3);
    const area2 = calculateTriangleArea(px, py, x1, y1, x3, y3);
    const area3 = calculateTriangleArea(px, py, x1, y1, x2, y2);

    const totalArea = area1 + area2 + area3;

    // Usa um epsilon maior para considerar imprecisões
    const epsilon = 1e-2;

    // Retorna verdadeiro se as áreas baterem dentro do limite da precisão
    let retorno = Math.abs(totalArea - areaOriginal) < epsilon;
    // console.log('retorno',retorno)
    return retorno
  }
  isPointInsideTriangleForShadow(
    ponto: { x: number; y: number },
    triangulo: { x: number; y: number }[]
  ): boolean {
    if (triangulo.length !== 3) {
      console.error('O triângulo deve conter exatamente 3 pontos.');
      return false;
    }

    const [p1, p2, p3] = triangulo;

    const areaOriginal = this.calculateTriangleArea(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    const area1 = this.calculateTriangleArea(ponto.x, ponto.y, p2.x, p2.y, p3.x, p3.y);
    const area2 = this.calculateTriangleArea(ponto.x, ponto.y, p1.x, p1.y, p3.x, p3.y);
    const area3 = this.calculateTriangleArea(ponto.x, ponto.y, p1.x, p1.y, p2.x, p2.y);

    const totalArea = area1 + area2 + area3;

    // Usar uma margem de erro para a comparação
    const epsilon = 0.0001; // Tolerância de precisão
    const pontoDentro = Math.abs(totalArea - areaOriginal) < epsilon;

    if (Math.abs(totalArea - areaOriginal) < epsilon) {

    } else {
      // apagar sombra
      this.shadow = { x: 0, y: 0, largura: 0, altura: 0 };
    }

    return pontoDentro;
  }


  // Método dentro do componente para verificar se o aparelho está dentro da visão da câmera
  isAparelhoWithinCameraVision(): boolean {
    const visionPoints = this.getVisionPoints();  // Obter os pontos da visão da câmera

    // Coordenadas do aparelho (retângulo)
    if (!this.aparelho) return false;
    const aparelhoLeft = this.aparelho.x;
    const aparelhoTop = this.aparelho.y;
    const aparelhoRight = this.aparelho.x + this.aparelho.largura;
    const aparelhoBottom = this.aparelho.y;

    // Coordenadas dos pontos da visão (triângulo)
    const x1 = visionPoints[0].x, y1 = visionPoints[0].y;
    const x2 = visionPoints[1].x, y2 = visionPoints[1].y;
    const x3 = visionPoints[2].x, y3 = visionPoints[2].y;

    // Verifica se os 4 pontos do aparelho estão dentro da visão da câmera
    const point1Inside = this.isPointInsideTriangle(aparelhoLeft, aparelhoTop, x1, y1, x2, y2, x3, y3);
    const point2Inside = this.isPointInsideTriangle(aparelhoRight, aparelhoTop, x1, y1, x2, y2, x3, y3);
    const point3Inside = this.isPointInsideTriangle(aparelhoLeft, aparelhoBottom, x1, y1, x2, y2, x3, y3);
    const point4Inside = this.isPointInsideTriangle(aparelhoRight, aparelhoBottom, x1, y1, x2, y2, x3, y3);

    // Se todos os quatro pontos estiverem dentro, o aparelho está dentro da visão
    return point1Inside && point2Inside && point3Inside && point4Inside;
  }


  // Método dentro do componente para verificar se o aparelho está dentro da visão da câmera
  isAparelhoWithinCameraVisionMulti(aparelhoX: number, aparelhoY: number, aparelhoLargura: number, aparelhoAltura: number, cameraId: number): boolean {
    // Encontrar a câmera com o id correspondente na ListaDeCampoDeVisaoCamera
    //console.log('1514', this.ListaDeCampoDeVisaoCamera)
    const camera = this.ListaDeCampoDeVisaoCamera.find(c => c.id === cameraId);
    if (cameraId === -1) {
      console.log('Sem camera atribuida')
    }
    if (!camera) {
      console.log('Câmera não encontrada!');
      return false;
    }
    //  console.log(camera)
    // Pontos de visão da câmera
    const visionPoints = camera.pontos;

    // Coordenadas do aparelho (retângulo)
    const aparelhoLeft = aparelhoX;
    const aparelhoTop = aparelhoY;
    const aparelhoRight = aparelhoX + aparelhoLargura;
    const aparelhoBottom = aparelhoY + aparelhoAltura;

    // Coordenadas dos pontos da visão (triângulo)
    const x1 = visionPoints[0].x, y1 = visionPoints[0].y;
    const x2 = visionPoints[1].x, y2 = visionPoints[1].y;
    const x3 = visionPoints[2].x, y3 = visionPoints[2].y;

    // Verifica se os 4 pontos do aparelho estão dentro da visão da câmera
    const point1Inside = this.isPointInsideTriangle(aparelhoLeft, aparelhoTop, x1, y1, x2, y2, x3, y3);
    const point2Inside = this.isPointInsideTriangle(aparelhoRight, aparelhoTop, x1, y1, x2, y2, x3, y3);
    const point3Inside = this.isPointInsideTriangle(aparelhoLeft, aparelhoBottom, x1, y1, x2, y2, x3, y3);
    const point4Inside = this.isPointInsideTriangle(aparelhoRight, aparelhoBottom, x1, y1, x2, y2, x3, y3);

    // Se todos os quatro pontos estiverem dentro, o aparelho está dentro da visão
    return point1Inside && point2Inside && point3Inside && point4Inside;
  }

  getPointsForTriangle(campoVisao: { x: number, y: number }[]): string {
    let teste = campoVisao.map(ponto => `${ponto.x * this.scaleFactor},${ponto.y * this.scaleFactor}`).join(' ');
    //console.log('teste',teste)
    return teste
  }
  // Função para abrir o diálogo e passar dados
  openCameraDialog(elemento: any): void {
    const dialogRef = this.dialog.open(CameraDialogComponent, {
      width: '400px',
      data: {
        id: elemento.id,  // Passando o ID também
        ip_camera: elemento.ip_camera,
        port: elemento.port,
        login_camera: elemento.login_camera,
        senha_camera: elemento.senha_camera,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Configurações salvas:', result);

        // Atualizar as configurações na API
        this.cameraService.updateCamera(elemento.id, result).subscribe({
          next: (response) => {
            console.log('Câmera atualizada com sucesso:', response);
            this.camerasAssociadasAcadermia(this.academia.id);
          },
          error: (error) => {
            console.error('Erro ao atualizar a câmera:', error);
          },
        });
      }
    });
  }
  
  isCameraConfigIncomplete(elemento: any): boolean {
    return !elemento.ip_camera || !elemento.port || !elemento.login_camera || !elemento.senha_camera;
  }

}
