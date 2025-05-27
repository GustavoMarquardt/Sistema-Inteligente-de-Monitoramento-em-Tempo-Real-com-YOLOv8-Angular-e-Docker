import { Component, OnInit, HostListener, AfterViewInit, PLATFORM_ID, Inject, ViewChild, ElementRef, Injectable, importProvidersFrom, NgZone } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import Camera from '../../objects/Camera';  // Importando a classe Camera
import { PointsPipe } from '../../objects/points.pipe';
import { isPlatformBrowser } from '@angular/common';  // Importando a função isPlatformBrowser
import { CommonModule } from '@angular/common'; // Importando o CommonModule
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
import ModeloPessoa from '../../objects/ModeloPessoa'; // Importando a classe ModeloPessoa
import HistoricoAparelho from '../../objects/HistoricoAparelho'; // Importando a classe ModeloPessoa
import Objeto from '../../objects/Objeto'
import { HistoricoAparelhoService } from '../../services/HistoricoAparelhoService';

@Component({
  selector: 'app-content3',
  imports: [
    HttpClientModule,
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSliderModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatCardModule, MatRadioModule, FormsModule, MatSliderModule, MatProgressBarModule
  ],
  standalone: true,  // Certifique-se de que o componente é standalone
  templateUrl: './content3.component.html',
  styleUrl: './content3.component.less'
})
export class Content3Component implements OnInit {
  dia: number = 15;
  academiaId: number = 3;  // ID da academia, por exemplo
  ListaDeAparelhos: Objeto[] = [];
  pessoas: ModeloPessoa[] = [];
  divisoesCorpo = Object.values(DivisoesDeTreino); // Converte enum para lista
  constructor(
    private objectService: ObjectService,
    private historicoService: HistoricoAparelhoService,
    private snackBar: MatSnackBar,
  ) {
  }

  criarPessoasAleatorias(numeroPessoas: number): void {
    for (let i = 0; i < numeroPessoas; i++) {
      // Gera uma divisão de corpo aleatória
      const divisaoAleatoria = this.divisoesCorpo[Math.floor(Math.random() * this.divisoesCorpo.length)];
      
      // Gera uma quantidade aleatória de aparelhos (entre 4 e 6)
      const aparelhosAleatorios = Math.floor(Math.random() * (6 - 4 + 1)) + 4;
      const horaChegada = this.gerarHoraAleatoria();
      // Cria uma nova pessoa e adiciona ao array
      this.pessoas.push(new ModeloPessoa(i + 1, divisaoAleatoria, false, aparelhosAleatorios,horaChegada));
    }
  }


  gerarHoraAleatoria(): number {
    const horaIntervalo1 = Math.floor(Math.random() * (7 - 6 + 1)) + 6; // Entre 6 e 7
    const horaIntervalo2 = Math.floor(Math.random() * (22 - 18 + 1)) + 18; // Entre 18 e 22
    const horaIntervalo3 = Math.floor(Math.random() * (18 - 7 + 1)) + 7; // Entre 7 e 18
  
    // Gera um número aleatório entre 0 e 1
    const sorteio = Math.random();
  
    if (sorteio < 0.33) {
      return horaIntervalo1; // 30% de chance de cair entre 6 e 7
    } else if (sorteio < 0.77) {
      return horaIntervalo2; // 40% de chance de cair entre 18 e 22
    } else {
      return horaIntervalo3; // 30% de chance de cair entre 7 e 18
    }
  }

  ngOnInit(): void {
    // Buscando a lista de aparelhos
    this.criarPessoasAleatorias(1000);
    this.objectService.buscarEquipamentosByAcademiaId(this.academiaId).subscribe(data => {
      this.ListaDeAparelhos = data;
      // Passando todas as pessoas para a simulação
    });
  }
  
  // Inicia a simulação para todas as pessoas
  async iniciarSimulacao(): Promise<void> {
    // Espera todas as simulações de treino para cada pessoa serem concluídas
    try {
      await Promise.all(this.pessoas.map(pessoa => this.simularTreino(pessoa)));
      console.log('Simulação concluída com sucesso!');
  
      // Exibe a mensagem de fim da simulação
      this.snackBar.open('SIMULAÇÃO FINALIZADA', 'Fechar', {
        duration: 3000, // A mensagem será fechada após 3 segundos
        panelClass: ['mat-toolbar', 'mat-warn'], // Personalize o estilo do alerta
      });
    } catch (error) {
      console.error('Erro durante a simulação:', error);
      this.snackBar.open('Erro durante a simulação', 'Fechar', {
        duration: 3000,
        panelClass: ['mat-toolbar', 'mat-warn'],
      });
    }
  }
  async simularTreinoNoAparelho(aparelho: Objeto, duracaoMinutos: number): Promise<void> {
    const tempoInicio = new Date();
    let horaInicio = tempoInicio.getHours();
    let minutoInicio = tempoInicio.getMinutes();

    const tempoFinal = new Date(tempoInicio.getTime() + duracaoMinutos * 60000);
    let horaFim = tempoFinal.getHours();
    let minutoFim = tempoFinal.getMinutes();

    // Verifica se o minuto ultrapassou 60, caso sim, ajusta a hora
    if (minutoFim >= 60) {
      minutoFim -= 60;
      horaFim += 1;
    }

    return Promise.resolve();
  }

  // Função que verifica todos os aparelhos a cada minuto
  async verificarAparelhos(aparelhosDisponiveis: Objeto[]): Promise<void> {
    for (const aparelho of aparelhosDisponiveis) {
      if (aparelho.ocupado) {
        // Aqui você verifica se o aparelho está ocupado e registra o fim de uso
        const tempoAtual = new Date();
        const horaAtual = tempoAtual.getHours();
        const minutoAtual = tempoAtual.getMinutes();

        // Aqui você registra o fim do uso no banco de dados (caso necessário)
        await this.registrarFimUsoAparelho(aparelho.id, horaAtual, minutoAtual);

        // Liberar o aparelho
        aparelho.ocupado = false;
      }
    }
  }

  async simularTreino(pessoa: ModeloPessoa): Promise<void> {
    const aparelhosDisponiveis = this.ListaDeAparelhos.filter(aparelho => aparelho.divisao === pessoa.grupo_muscular);
    let aparelhosUsados = 0;
  
    let horaAtual = 6; // 6 AM
    let minutoAtual = 0; // 00 minutos
  
    // Ajusta a hora inicial para a hora de chegada
    horaAtual = pessoa.horaChegada;
    minutoAtual = 0;
  
    // Loop que simula o treino
    while (aparelhosUsados < pessoa.quantidadeAparelhos && (horaAtual < 23 || (horaAtual === 23 && minutoAtual < 60))) {
      // Verifica a disponibilidade dos aparelhos a cada minuto
      await this.verificarAparelhos(aparelhosDisponiveis);
  
      let aparelhosLivres = aparelhosDisponiveis.filter(aparelho => !aparelho.ocupado && !pessoa.aparelhosUsados.includes(aparelho.id));
  
      if (aparelhosLivres.length === 0) {
        if (pessoa.aparelhosUsados.length === aparelhosDisponiveis.length) {
          console.log(`Pessoa ${pessoa.matricula} já usou todos os aparelhos. Repetindo o treino.`);
          pessoa.aparelhosUsados = [];  // Limpa a lista de aparelhos usados para permitir repetição
        } else {
          console.log(`Pessoa ${pessoa.matricula} aguardando aparelhos...`);
          await this.aguardarAparelho(aparelhosDisponiveis);  // Aguarda a liberação de um aparelho
          continue;
        }
      }
  
      // Escolhe um aparelho aleatório livre
      aparelhosLivres = aparelhosDisponiveis.filter(aparelho => !aparelho.ocupado && !pessoa.aparelhosUsados.includes(aparelho.id));
      const aparelho = aparelhosLivres[Math.floor(Math.random() * aparelhosLivres.length)];
  
      if (aparelho) {
        const tempoTreino = Math.floor(Math.random() * (10 - 8 + 1)) + 8;
        const horaInicio = horaAtual;
        const minutoInicio = minutoAtual;
  
        let horaFim = horaInicio;
        let minutoFim = minutoInicio + tempoTreino;
  
        if (minutoFim >= 60) {
          minutoFim -= 60;
          horaFim += 1;
        }
  
        // Registra o início do uso do aparelho
        aparelho.ocupado = true;
        await this.registrarUsoAparelho(aparelho.id, horaInicio, minutoInicio);
  
        // Atualiza a ListaDeAparelhos
        this.atualizarAparelhoNaLista(aparelho);
  
        pessoa.aparelhosUsados.push(aparelho.id);
        aparelhosUsados++;
  
        await this.simularTreinoNoAparelho(aparelho, tempoTreino);
        await this.monitorarEstadoAparelhos(aparelhosDisponiveis,minutoAtual-1,horaAtual);
  
        minutoAtual = minutoFim;
        horaAtual = horaFim;
  
        // Após o treino, libera o aparelho
        aparelho.ocupado = false;
        await this.registrarFimUsoAparelho(aparelho.id, horaFim, minutoFim);
  
        // Atualiza a ListaDeAparelhos novamente após liberar o aparelho
        this.atualizarAparelhoNaLista(aparelho);
      }
    }
    
  }
  


  // Função para monitorar o estado dos aparelhos
  async monitorarEstadoAparelhos(aparelhos: Objeto[], tempo: number,horaAtual:number): Promise<void> {
    if(tempo == -1)
      tempo =0;
    aparelhos.forEach(aparelho => {
      if (aparelho.ocupado) {
        console.log(`Aparelho ${aparelho.id} está ocupado, no tempo ${horaAtual}:${tempo}h`);
      } else {
        console.log(`Aparelho ${aparelho.id} está desocupado, no tempo ${horaAtual}:${tempo}h`);
      }
    });

  }


  // Função para atualizar o estado do aparelho na ListaDeAparelhos
  atualizarAparelhoNaLista(aparelho: Objeto): void {
    const index = this.ListaDeAparelhos.findIndex(a => a.id === aparelho.id);
    if (index !== -1) {
      this.ListaDeAparelhos[index] = aparelho;  // Atualiza o aparelho na lista
    }
  }



  async registrarUsoAparelho(aparelhoId: number, horaInicio: number, minutoInicio: number): Promise<void> {
    const dataConstante = new Date();
    dataConstante.setHours(horaInicio, minutoInicio, 0, 0);
  
    console.log(`Registrando início do uso do aparelho ${aparelhoId} às ${horaInicio}:${minutoInicio}h`);
  
    try {
      // Verifica se já existe um registro ativo para o aparelho
      const registroAtivoResponse = await firstValueFrom(this.historicoService.verificarRegistroAtivo(aparelhoId));
      console.log('Registro ativo:', registroAtivoResponse);
  
      if (registroAtivoResponse.ativo) {
        console.log(`O aparelho ${aparelhoId} já está em uso. Não é possível iniciar um novo registro.`);
        return;
      }
  
      // Cria o objeto Historico com data_inicio_uso e data_fim_uso como undefined
      const novoHistorico: Partial<HistoricoAparelho> = {
        id_equipamento: aparelhoId,
        data_inicio_uso: dataConstante,
        data_fim_uso: undefined,
      };
  
      // Chama o método para registrar o histórico no banco de dados
      const historicoCriado = await firstValueFrom(this.historicoService.registrarInicioUso(novoHistorico));
      console.log(`Início do uso do aparelho ${aparelhoId} registrado com sucesso:`, historicoCriado);
    } catch (error) {
      console.error(`Erro ao registrar início do uso do aparelho ${aparelhoId}:`, error);
      throw error;
    }
  }


// Função para registrar o fim do uso do aparelho
async registrarFimUsoAparelho(aparelhoId: number, horaFim: number, minutoFim: number): Promise<void> {
  const dataAtual = new Date();
  dataAtual.setHours(horaFim, minutoFim, 0); // Define a hora e os minutos

  console.log(`Registrando fim do uso do aparelho ${aparelhoId} às ${horaFim}:${minutoFim}h`);

  try {
    // Verifica se existe um registro ativo (sem data_fim_uso)
    const registroAtivo = await this.historicoService.verificarRegistroAtivo(aparelhoId);

    if (!registroAtivo) {
      console.log(`Não há registro ativo para o aparelho ${aparelhoId} que possa ser finalizado.`);
      return;
    }

    // Atualiza o registro ativo com a hora de término
  // Chama o método para registrar o histórico no banco de dados
  console.log('finalizandooooo',aparelhoId)
  const historicoCriado = await firstValueFrom(this.historicoService.finalizarUso(aparelhoId,dataAtual));
  console.log(`Início do uso do aparelho ${aparelhoId} registrado com sucesso:`, historicoCriado);
} catch (error) {
  console.error(`Erro ao registrar início do uso do aparelho ${aparelhoId}:`, error);
  throw error;
}
}


  async aguardarAparelho(aparelhosDisponiveis: Objeto[]): Promise<void> {
    // Aqui, podemos simular a espera por um aparelho.
    console.log(`Esperando por aparelhos disponíveis...`);
    return new Promise(resolve => setTimeout(resolve, 1000)); // Espera de 1 segundo simulando disponibilidade
  }
}
