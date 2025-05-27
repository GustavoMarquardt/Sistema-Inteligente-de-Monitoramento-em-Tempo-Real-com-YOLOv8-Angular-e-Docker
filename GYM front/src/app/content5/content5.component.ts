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
import { AcademiaEditDialogComponent } from "../academia-edit-dialog/academia-edit-dialog.component";
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-content5',
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
    MatIconModule,
],
  templateUrl: './content5.component.html',
  styleUrl: './content5.component.less'
})
export class Content5Component {
  @ViewChild('paginatorAacademias') paginatorAcademias!: MatPaginator;
  academiaForm: FormGroup;
  displayedColumnsAcademia: string[] = [
    'id', 'nome', 'width', 'height', 'altura', 'endereco', 'ip_publico_academia', 'port', 'numeroTelefone','actions'
  ]

  listaDeAcademias: Academia[] = [];
  dataSourceAcademias = new MatTableDataSource(this.listaDeAcademias);
  totalItemAcademias = this.listaDeAcademias.length;
  selectedAcademia: Academia | null = null;
  constructor(
    private fb: FormBuilder,
    private academiaService: AcademiaService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.academiaForm = this.fb.group({
      nome: ['', Validators.required],
      width: ['', Validators.required],
      height: ['', Validators.required],
      altura: ['', Validators.required],
      endereco: ['', Validators.required],
      ip_publico_academia: ['', Validators.required],
      port: ['', Validators.required],
      numeroTelefone: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    console.log(localStorage.getItem('user'));

    this.academiaService.getAllAcademias().then((academias: Academia[]) => {
      console.log('Academias:', academias);
      this.listaDeAcademias = academias;
      this.dataSourceAcademias.data = this.listaDeAcademias;
    }).catch((error) => {
      console.error('Erro ao buscar academias:', error);
    });
  }

  onPageChangeAcademias(event: any): void {
    console.log('Página:', event.pageIndex);
    console.log('Itens por página:', event.pageSize);
    if (this.paginatorAcademias)
      this.dataSourceAcademias.paginator = this.paginatorAcademias;
  }

  openAcademiaDialog(academiaId: number, $event: Event): void {
    $event.stopPropagation(); // Impede que o evento se propague para o tr
    // Procurar a academia na listaDeAcademias com o id fornecido
    const academia = this.listaDeAcademias.find(a => a.id === academiaId);
  
    if (academia) {
      const dialogRef = this.dialog.open(AcademiaEditDialogComponent, {
        width: '400px',
        data: {
          id: academia.id,
          nome: academia.nome,
          altura: academia.altura,
          width: academia.width,
          height: academia.height,
          ip_publico_academia: academia.ip_publico_academia,  // Use 'ip_academia' aqui
          port: academia.port,
        },
      });
  
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          console.log('Configurações da academia salvas:', result);
  
          // Atualizar as configurações da academia na API
          this.academiaService.updateAcademia(academia.id, result).subscribe({
            next: (response) => {
              console.log('Academia atualizada com sucesso:', response);
              this.academiaService.getAllAcademias().then((academias: Academia[]) => {
                console.log('Academias:', academias);
                this.listaDeAcademias = academias;
                this.dataSourceAcademias.data = this.listaDeAcademias;
              }).catch((error) => {
                console.error('Erro ao buscar academias:', error);
              });
            },
            error: (error) => {
              console.error('Erro ao atualizar a academia:', error);
            },
          });
        }
      });
    } else {
      console.log('Academia não encontrada com o ID:', academiaId);
    }
  }



  async OnsubmitAcademia() {
    console.log(this.academiaForm.value);
    const academia = this.academiaForm.value;
    let res = this.academiaService.createAcademia(academia);
    console.log('Resposta:', res);
    if (await res) {
      this.snackBar.open('Academia cadastrada com sucesso!', 'Fechar', {
        duration: 2000,
      });
    } else {
      this.snackBar.open('Erro ao cadastrar academia!', 'Fechar', {
        duration: 2000,
      });
    }
  }

  onRowClick(idAcademia: number): void {
    console.log('ID da academia clicado:', idAcademia);
    let academiaCliacada = idAcademia;
    // Recuperar o usuário logado do localStorage
    const user = localStorage.getItem('user');
    console.log('Usuário log', user);
    if (user) {
      const parsedUser = JSON.parse(user); // Converter para objeto
      console.log('ID do usuário logado:', parsedUser.usuario?.id); // Acessar o campo 'id' dentro de 'usuario'
      this.academiaService.atualizaAcademiaIdForUsuarioAdmin(parsedUser.usuario?.id, idAcademia).then((idAcademia: number) => {
        console.log('ID da academia atualizado para o usuário logado:', idAcademia);
        this.snackBar.open(`Você agora está na academia ${academiaCliacada}`, 'Fechar', {
          duration: 3000, // A mensagem será fechada após 3 segundos
          panelClass: ['mat-toolbar', 'mat-warn'], // Personalize o estilo do alerta
        });
      }).catch((error) => {
        this.snackBar.open('Provavelmente você já estava nessa academia', 'Fechar', {
          duration: 3000, // A mensagem será fechada após 3 segundos
          panelClass: ['mat-toolbar', 'mat-warn'], // Personalize o estilo do alerta
        });
      });
    } else {
      console.log('Nenhum usuário logado encontrado no localStorage.');
    }
  }
  


}


