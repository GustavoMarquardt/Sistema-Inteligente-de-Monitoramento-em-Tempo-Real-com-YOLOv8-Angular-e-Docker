import { Component, OnInit, ChangeDetectorRef, Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import Chart from 'chart.js/auto';
import { ObjectService } from '../../services/ObjectService';
import Objeto from '../../objects/Objeto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DivisoesDeTreino } from '../../objects/divisoes_de_treino.enum';
import { HistoricoAparelhoService } from '../../services/HistoricoAparelhoService';
import HistoricoAparelho from '../../objects/HistoricoAparelho';
import { firstValueFrom } from 'rxjs';
import ApexCharts from 'apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HttpClientModule } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule } from '@angular/material/sort';
import { SidebarService } from '../../services/SidebarService';
import { AcademiaService } from '../../services/AcademiaService';
import HistoricoLotacao from '../../objects/HistoricoLotacao';
// Registrar o plugin
Chart.register(ChartDataLabels);

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  fill: ApexFill;
  markers: ApexMarkers;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};




interface DataItem {
  year: number;
  month: number;
  day: number;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './content1.component.html',
  styleUrls: ['./content1.component.less'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NgApexchartsModule,
    CommonModule,
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


export class Content1Component implements OnInit {

  // Corrigindo a declaração da propriedade chartOptions
  public chartOptions: Partial<ChartOptions> | undefined;

  selectedYear: number = 0;
  selectedMonth: number = 0;
  selectedDay: number = 0;
  years: number[] = [];
  months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  days: number[] = [];
  currentYear: number = new Date().getFullYear();
  chartOcupacaoLinha: any;
  ListaDeAparelhos: Objeto[] = []
  ListaDeHistorico: HistoricoAparelho[] = []
  academiaId: number = 0;
  ocupacaoChart: any;
  updateInterval: any;
  private interval: any;
  isBrowser: any;
  ocupacaoPorDivisaoChart: Chart<"doughnut", number[], string> | undefined;
  ListaDeHistoricoQuantidadePorTempo: { hora: string; contagem: number; }[] | undefined
  displayedColumnsAparelhosRank: string[] = [
    'rank',
    'nome',
    'tempo usado',

  ];
  displayedColumnsDivisaoRank: string[] = [
    'rank',
    'divisao',
    'tempo usado',
  ];

  rankingAparelhos: any[] = [];
  rankingDivisoesDeTreino: any[] = [];
  dataSourceAparelhos = new MatTableDataSource(this.rankingAparelhos);
  dataSourceDivisao = new MatTableDataSource(this.rankingDivisoesDeTreino);
  login: string | undefined;
  historicoLotacao:any;
  constructor(
    private cdRef: ChangeDetectorRef,
    private objetoService: ObjectService,
    private historicoService: HistoricoAparelhoService,
    private academiaService: AcademiaService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      window.addEventListener(
        'message',
        (e) => {
          // console.log('Mensagem recebida:', e.data);
        },
        false
      );
    } else {
      // console.log('Executando no servidor (SSR)');
    }

    if (typeof window !== 'undefined') {  // Verifica se estamos no navegador
      // console.log('ESTA MERDA ESTA UNDEFINED')
    }
  }

  async ngOnInit() {
    this.academiaId = (await this.academiaService.getIdAcademiaByLocalStore()) ?? 0;
    

    //pegar o id da academia no banco de dados
    //  await this.academiaService.fetchAcademiaById(parsedUser).then((academia) => {
    //     this.academiaId = academia?.id ?? 0;
    //   });

    await this.carregarDadosListaDeAparelhos();
    const listaIds = this.ListaDeAparelhos.map((aparelho: any) => aparelho.id);
    await this.carregarDadosUsoAparelhosPorIds(listaIds);
    await this.calcularRankAparelhoMaisUsados();
    this.gerarGraficos();

    const currentDate = new Date();
    this.selectedYear = currentDate.getFullYear();
    this.selectedMonth = currentDate.getMonth() + 1;
    this.years = Array.from({ length: 2025 - this.selectedYear + 1 }, (_, i) => this.selectedYear + i);
    this.updateDays();
    this.selectedDay = currentDate.getDate();
    // console.log('Dia Atual:', this.selectedDay);
    // this.updateChart();

    // Detecta mudanças após a inicialização
    this.cdRef.detectChanges();
    this.login = localStorage.getItem('login') ?? undefined;
    // console.log('Login:', this.login);
    // Atualiza os dados a cada X milissegundos (exemplo: 1 minuto = 60000 ms)
    this.updateInterval = setInterval(async () => {
      await this.carregarDadosListaDeAparelhos();
      const listaIds = this.ListaDeAparelhos.map((aparelho: any) => aparelho.id);
      await this.carregarDadosUsoAparelhosPorIds(listaIds);
      this.atualizarGrafico();
    }, 120000); 
    // 2 minutos = 120000
    // 1 minuto = 60000
    // 10 segundos = 10000
  }

  calcularRankAparelhoMaisUsados() {
    // Agrupar os tempos por equipamento
    const tempoPorEquipamento: { [key: number]: number } = {};

    this.ListaDeHistorico.forEach((historico) => {
      const { id_equipamento, data_inicio_uso, data_fim_uso } = historico;

      if (data_inicio_uso) {
        const inicio = new Date(data_inicio_uso).getTime();
        const fim = data_fim_uso ? new Date(data_fim_uso).getTime() : Date.now(); // Usa a data atual se data_fim_uso for undefined
        const duracao = (fim - inicio) / (1000 * 60); // Tempo em minutos

        if (!tempoPorEquipamento[id_equipamento]) {
          tempoPorEquipamento[id_equipamento] = 0;
        }
        tempoPorEquipamento[id_equipamento] += duracao;
      }
    });

    // Mapear os dados dos aparelhos com os tempos calculados
    const ranking = this.ListaDeAparelhos.map((aparelho) => {
      const tempo = tempoPorEquipamento[aparelho.id] || 0;
      return { ...aparelho, tempoUso: tempo };
    });

    // Ordenar por tempo de uso (desc) e pegar os 10 primeiros
    this.rankingAparelhos = ranking
      .sort((a, b) => b.tempoUso - a.tempoUso)
      .slice(0, 10);
    // console.log('rankingAparelhos', this.rankingAparelhos)

    this.dataSourceAparelhos.data = this.rankingAparelhos;
    this.calculateRankingDivisoesDeTreino()
  }

  calculateRankingDivisoesDeTreino() {
    // Agrupar os tempos por divisão de treino
    const tempoPorDivisao: { [key: string]: number } = {};

    // Varrendo a lista de históricos
    this.ListaDeHistorico.forEach((historico) => {
      const { equipamento, data_inicio_uso, data_fim_uso } = historico;
      const categoria = equipamento?.divisao;  // Acessando a divisão (categoria) do equipamento

      if (categoria && data_inicio_uso) {
        const inicio = new Date(data_inicio_uso).getTime();
        // Se data_fim_uso estiver faltando, usamos a data atual
        const fim = data_fim_uso ? new Date(data_fim_uso).getTime() : Date.now();

        // Verificando se a data de término é posterior à data de início
        if (fim >= inicio) {
          const duracao = (fim - inicio) / (1000 * 60);  // Tempo em minutos
          if (!tempoPorDivisao[categoria]) {
            tempoPorDivisao[categoria] = 0;
          }
          tempoPorDivisao[categoria] += duracao;
        } else {
          console.warn(`Data de término inválida para o histórico: ${historico}`);
        }
      }
    });

    // Criar um array de divisões com o tempo total e ordenar por tempo de uso (desc)
    const rankingDivisoes = Object.keys(tempoPorDivisao)
      .map((divisao) => ({
        divisao,
        tempoTotal: tempoPorDivisao[divisao]
      }))
      .sort((a, b) => b.tempoTotal - a.tempoTotal); // Ordenar de forma decrescente por tempoTotal

    // console.log('Ranking das Divisões de Treino:', rankingDivisoes);

    // Atualizar a lista de divisões de treino e sua data source para a tabela
    this.rankingDivisoesDeTreino = rankingDivisoes;
    this.dataSourceDivisao.data = this.rankingDivisoesDeTreino;  // Supondo que você tenha uma dataSource para exibição
  }


  agruparPorIntervaloDeMeiaHora(dados: any[]) {
    const mapaDeIntervalos: { [key: number]: number } = {};
    const intervaloDeMeiaHora = 30 * 60 * 1000; // 30 minutos em milissegundos

    dados.forEach((registro) => {
      const inicio = new Date(registro.data_inicio_uso).getTime();
      const fim = new Date(registro.data_fim_uso).getTime();

      // Ajusta o início para o intervalo de meia hora
      const inicioIntervalo = Math.floor(inicio / intervaloDeMeiaHora) * intervaloDeMeiaHora;

      // Conta quantos registros acontecem no mesmo intervalo
      if (!mapaDeIntervalos[inicioIntervalo]) {
        mapaDeIntervalos[inicioIntervalo] = 0;
      }
      mapaDeIntervalos[inicioIntervalo]++;

      // Conta os registros que ultrapassam o intervalo de meia hora
      if (fim > inicio) {
        const fimIntervalo = Math.floor(fim / intervaloDeMeiaHora) * intervaloDeMeiaHora;
        if (!mapaDeIntervalos[fimIntervalo]) {
          mapaDeIntervalos[fimIntervalo] = 0;
        }
        mapaDeIntervalos[fimIntervalo]++;
      }
    });

    // Organiza os dados para o gráfico
    const categorias = Object.keys(mapaDeIntervalos).map((key) => new Date(parseInt(key)));
    const registrosPorIntervalo = Object.values(mapaDeIntervalos);

    return {
      categorias,
      registrosPorIntervalo,
    };
  }
   formatDateToBrasilia(dateString: string) {
    const date = new Date(dateString);
    
    // Usando Intl.DateTimeFormat para formatar no fuso horário de Brasília (GMT-3)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo', // Fuso horário de Brasília
      hour12: true, // Usa formato de 12 horas
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
  
    return new Intl.DateTimeFormat('pt-BR', options).format(date);
  }

  async grafico3() {
    if (!this.isBrowser) return;
  
    const ApexChartsModule = await import('apexcharts');
    const ApexCharts: typeof import('apexcharts') = ApexChartsModule.default;
  
    if (typeof window !== 'undefined') {
      console.log('academia', this.academiaId);
  
      try {
        // Obtém os dados do histórico
        const historicoLotacaoResponse = await this.academiaService.getHistoricoLotacaoByAcademiaID();
  
        this.historicoLotacao = Array.isArray(historicoLotacaoResponse)
          ? historicoLotacaoResponse
          : [historicoLotacaoResponse];
  
        console.log('Dados de lotação:', this.historicoLotacao);
  
        const todasAsHoras: string[] = [];
        const contagens: number[] = [];
  
        this.historicoLotacao.forEach((item: any) => {
          const date = new Date(item.date);
          const hora = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes() < 30 ? '00' : '30'}`;
  
          const index = todasAsHoras.indexOf(hora);
          if (index === -1) {
            todasAsHoras.push(hora);
            contagens.push(item.quantidade_pessoas || 0);
          } else {
            contagens[index] += item.quantidade_pessoas || 0;
          }
        });
  
        // Opções do gráfico com zoom habilitado
        const options = {
          series: [{ name: "Pessoas", data: contagens }],
          chart: {
            height: 350,
            type: "line",
            zoom: {
              enabled: true,  // Habilitar zoom
              type: 'xy',     // Zoom tanto no eixo X quanto no Y
              // Outros parâmetros do zoom (como redefinir o zoom)
            },
            toolbar: {
              show: true,
              tools: {
                zoomin: true,
                zoomout: true,
                reset: true
              }
            }
          },
          xaxis: { type: "category", categories: todasAsHoras },
          tooltip: {
            theme: 'dark',
            style: {
              backgroundColor: '#000',
              color: '#fff'
            }
          }
        };
  
        const chartElement = document.querySelector('#chart');
  
        if (chartElement) {
          if (this.chartOcupacaoLinha) {
            // Atualiza o gráfico se já existe
            console.log("Atualizando gráfico...");
            await this.chartOcupacaoLinha.updateOptions({
              series: [{ name: "Pessoas", data: contagens }],
              xaxis: { categories: todasAsHoras }
            });
          } else {
            // Cria o gráfico se não existe
            console.log("Renderizando novo gráfico...");
            this.chartOcupacaoLinha = new ApexCharts(chartElement, options);
            await this.chartOcupacaoLinha.render().catch((err: any) => {
              console.error("Erro ao renderizar o gráfico:", err);
            });
          }
        }
      } catch (err) {
        console.error('Erro ao obter dados:', err);
      }
    }
  }
  
  

  startUpdatingGraph() {
    let intervalRuns = 0;

    this.interval = setInterval(() => {
      intervalRuns++;

      // Atualiza os labels (horários) e os dados (valores) com base na ListaDeHistorico
      this.chartOcupacaoLinha.data.labels = this.ListaDeHistorico.map(d => new Date(d.data_inicio_uso).toLocaleTimeString());
      this.chartOcupacaoLinha.data.datasets[0].data = this.ListaDeHistorico.map(d => d.id);

      // Atualiza o gráfico
      this.chartOcupacaoLinha.update();

      // Limita o gráfico para mostrar apenas os últimos 60 dados
      if (this.ListaDeHistorico.length > 60) {
        this.ListaDeHistorico.shift(); // Remove o dado mais antigo se ultrapassar o limite
      }
    }, 1000); // Atualiza a cada 1 segundo
  }


  getNewSeries(lastDate: number, yRange: { min: number, max: number }) {
    let newDate = lastDate + 1000; // Atualiza a data a cada segundo
    let newValue = Math.floor(Math.random() * (yRange.max - yRange.min + 1)) + yRange.min; // Gera valor aleatório para o gráfico

    return [{
      x: newDate, // Data no eixo X
      y: newValue  // Valor no eixo Y
    }];
  }

  // Supondo que você tenha essa função para formatar os dados
  transformarDadosParaGrafico(dados: any[]) {
    // Implementação da função para transformar os dados
    return dados.map(dado => ({
      x: new Date(dado.data_inicio_uso).getTime(),
      y: dado.equipamento.valor  // Exemplo de como transformar os dados
    }));
  }

  grafico1() {
    if (isPlatformBrowser(this.platformId)) {
      // console.log('equipamentos', this.ListaDeAparelhos);

      const ocupados = this.ListaDeAparelhos.filter(a => a.ocupado).length;
      const disponiveis = this.ListaDeAparelhos.filter(a => !a.ocupado).length;

      const ctx = document.getElementById('ocupacaoChart') as HTMLCanvasElement;
      this.ocupacaoChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Ocupados', 'Disponíveis'],
          datasets: [
            {
              data: [ocupados, disponiveis],
              backgroundColor: ['#FF6384', '#36A2EB'],
              hoverBackgroundColor: ['#FF6384', '#36A2EB']
            }
          ]
        },
        options: {
          plugins: {
            legend: {
              labels: {
                color: '#FFFFFF'  // Cor do texto da legenda
              },
              position: 'bottom' // Posição da legenda
            },
            datalabels: {
              formatter: (value, context) => {
                const total = context.chart.data.datasets[0].data.reduce(
                  (acc: number, curr: any) => acc + (curr ? curr : 0),
                  0
                );
                const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0'; // Calcula a porcentagem
                return `${percentage}%`; // Retorna a porcentagem formatada
              },
              color: '#fff', // Cor do texto
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        },
        plugins: [ChartDataLabels] // Adicione o plugin aqui
      });
      // console.log('atualizando 1');
    }
  }

  grafico2() {
    if (typeof document === 'undefined') {
      return; // Sai da função se não estiver no navegador
    }
    const divisaoCount = {
      Peito: 0,
      Costas: 0,
      Ombro: 0,
      Bíceps: 0,
      Tríceps: 0,
      Quadríceps: 0,
      Posterior: 0,
      Panturrilha: 0,
      Abdômen: 0,
      Cardio: 0
    };

    // Filtra os aparelhos ocupados e conta por divisão
    this.ListaDeAparelhos.filter(a => a.ocupado).forEach(a => {
      const divisao = a.divisao as keyof typeof DivisoesDeTreino; // Usa a divisão do enum
      if (divisaoCount[divisao] !== undefined) {
        divisaoCount[divisao] += 1;
      }
    });

    // Converte o objeto divisaoCount em arrays para usar no gráfico
    const labels = Object.keys(divisaoCount);
    const data = Object.values(divisaoCount);

    // Cria o gráfico
    const ctx = document.getElementById('ocupacaoPorDivisaoChart') as HTMLCanvasElement;
    this.ocupacaoPorDivisaoChart = new Chart<'doughnut', number[], string>(ctx, {
      type: 'doughnut',
      data: {
        labels: labels, // Divisões de treino
        datasets: [
          {
            data: data, // Contagem de aparelhos ocupados em cada divisão
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#F7464A',
              '#8E44AD', '#E74C3C', '#2ECC71', '#F39C12', '#34495E'
            ],
            hoverBackgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#F7464A',
              '#8E44AD', '#E74C3C', '#2ECC71', '#F39C12', '#34495E'
            ]
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            labels: {
              color: '#FFFFFF'  // Cor do texto da legenda
            },
            position: 'bottom'
          },
          datalabels: {
            formatter: (value, context) => {
              const total = context.dataset.data.reduce((a, b) => (a as number) + (b as number), 0);

              // Evita divisão por zero e valores zero nos dados
              if (total === 0 || value === 0) {
                return ''; // Retorna uma string vazia se o valor for zero ou o total for zero
              }

              const percentage = ((Number(value) / Number(total)) * 100).toFixed(2); // Calcula a porcentagem
              return `${percentage}%`; // Exibe a porcentagem
            },
            color: '#fff', // Cor do texto
            font: {
              weight: 'bold',
              size: 14
            }
          }
        }
      },
      plugins: [ChartDataLabels] // Certifique-se de incluir o plugin de datalabels
    });
    // console.log('atualizando 2')
  }

  gerarGraficos() {
    this.grafico1()
    this.grafico2()
    this.grafico3()
  }

  async carregarDadosListaDeAparelhos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.objetoService.buscarEquipamentosByAcademiaId(this.academiaId).subscribe({
        next: data => {
          this.ListaDeAparelhos = data;
          resolve();
        },
        error: err => {
          console.error('Erro ao carregar equipamentos:', err);
          reject(err);
        }
      });
    });
  }

  async carregarDadosUsoAparelhosPorIds(listaIds: number[]): Promise<void> {
    try {
      // Chama o método de busca e aguarda o resultado
      const data = await this.historicoService.buscarHistoricosPorIdsDiaAtual(listaIds);
      this.ListaDeHistorico = data;  // Já é do tipo HistoricoAparelho[] por causa da tipagem
    } catch (err) {
      console.error('Erro ao carregar equipamentos por IDs:', err);
      throw err; // Lança o erro, que pode ser tratado em outro lugar
    }
  }

  agruparPorIntervalo(lista: any[]) {
    const intervalos: { [key: string]: { hora: string, contagem: number } } = {};
    const agora = new Date(); // Data e hora atuais

    lista.forEach(item => {
      const data = new Date(item.data_inicio_uso);

      // Verificar se a data é menor que a atual
      if (data.getTime() < agora.getTime()) {
        const horas = data.getHours();
        const minutos = data.getMinutes();
        const intervalo = `${horas.toString().padStart(2, '0')}:${(Math.floor(minutos / 30) * 30).toString().padStart(2, '0')}`; // Exemplo: "06:00", "06:30"

        // Armazena a contagem de registros por intervalo
        if (!intervalos[intervalo]) {
          intervalos[intervalo] = {
            hora: intervalo,
            contagem: 0,
          };
        }

        intervalos[intervalo].contagem += 1; // Incrementa a contagem por 1 para cada registro encontrado
      }
    });

    // console.log('intervalos', intervalos);

    // Ordenação dos intervalos por hora
    return Object.values(intervalos).sort((a, b) => {
      const [horaA, minutoA] = a.hora.split(":").map(Number);
      const [horaB, minutoB] = b.hora.split(":").map(Number);
      return (horaA * 60 + minutoA) - (horaB * 60 + minutoB);
    });
  }




  async atualizarGrafico() {
    console.log('atualizando os dados')
    if (this.ocupacaoChart) {
      const ocupados = this.ListaDeAparelhos.filter(a => a.ocupado).length;
      const disponiveis = this.ListaDeAparelhos.filter(a => !a.ocupado).length;
  
      this.ocupacaoChart.data.datasets[0].data = [ocupados, disponiveis];
      this.ocupacaoChart.update();
    }
  
    if (this.ocupacaoPorDivisaoChart) {
      const divisaoCount = {
        Peito: 0,
        Costas: 0,
        Ombro: 0,
        Bíceps: 0,
        Tríceps: 0,
        Quadríceps: 0,
        Posterior: 0,
        Panturrilha: 0,
        Abdômen: 0,
        Cardio: 0
      };
  
      this.ListaDeAparelhos.filter(a => a.ocupado).forEach(a => {
        const divisao = a.divisao as keyof typeof divisaoCount;
        if (divisaoCount[divisao] !== undefined) {
          divisaoCount[divisao] += 1;
        }
      });
  
      const labels = Object.keys(divisaoCount);
      const data = Object.values(divisaoCount);
  
      this.ocupacaoPorDivisaoChart.data.labels = labels;
      this.ocupacaoPorDivisaoChart.data.datasets[0].data = data;
      this.ocupacaoPorDivisaoChart.update();
    }
    this.grafico3()
  }
  

  ngOnDestroy(): void {
    // Limpa o intervalo ao destruir o componente
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
  updateDays() {
    this.days = [];
    if (this.selectedMonth && this.selectedYear) {
      const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
      this.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }
  }// Função para obter os rótulos para o agrupamento (meses, dias ou horas)
  getLabelsForGrouping(grouping: 'months' | 'days' | 'hours'): string[] {
    if (grouping === 'months') {
      return [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];  // Rótulos para os meses
    } else if (grouping === 'days') {
      return Array.from({ length: 31 }, (_, i) => (i + 1).toString());  // Rótulos para os dias de 1 a 31
    } else if (grouping === 'hours') {
      return Array.from({ length: 24 }, (_, i) => (i).toString());  // Rótulos para as horas de 0 a 23
    }
    return [];
  }

  // Função para obter o título do eixo X com base no agrupamento
  getXAxisTitleForGrouping(grouping: 'months' | 'days' | 'hours'): string {
    if (grouping === 'months') {
      return 'Meses';  // Título para o agrupamento por meses
    } else if (grouping === 'days') {
      return 'Dias';  // Título para o agrupamento por dias
    } else if (grouping === 'hours') {
      return 'Horas';  // Título para o agrupamento por horas
    }
    return '';
  }

  // Atualizando a função do gráfico com as novas funções
  updateChart() {
    const data: DataItem[] = this.getChartData();  // Dados do gráfico
    const labels = this.getChartLabels();  // Rótulos do gráfico

    const months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);  // 31 dias possíveis
    const hours: number[] = Array.from({ length: 24 }, (_, i) => i);  // 24 horas possíveis

    // console.log('Ano selecionado:', this.selectedYear);
    // console.log('Mês selecionado:', this.selectedMonth);
    // console.log('Dia selecionado:', this.selectedDay);

    // Função para gerar cores entre azul e branco
    const generateBlueToWhiteColors = (numBars: number) => {
      const colors = [];
      for (let i = 0; i < numBars; i++) {
        const r = Math.round(255 * (i / numBars)); // Gradiente de vermelho (vai de 0 a 255)
        const g = Math.round(255 * (i / numBars)); // Gradiente de verde (vai de 0 a 255)
        const b = 255; // Azul constante
        colors.push(`rgb(${r}, ${g}, ${b})`);
      }
      return colors;
    };

    // Inicializando arrays para dados e rótulos filtrados
    const filteredData: number[] = new Array(31).fill(0);  // Inicializando com 31 dias
    const filteredLabels: string[] = days.map(day => day.toString());  // Rótulos para cada dia

    // Determinando o agrupamento com base no ano
    let grouping: 'months' | 'days' | 'hours' = 'months';  // Por padrão, agrupamento por meses

    // Mudando agrupamento baseado na seleção
    if (this.selectedYear) {
      if (this.selectedMonth) {
        grouping = 'days';  // Se o mês estiver selecionado, agrupar por dias
      }
      if (this.selectedDay) {
        grouping = 'hours';  // Se o dia estiver selecionado, agrupar por horas
      }
    }

    // console.log('grouping SEI LÁ:', grouping);  // Verificando o agrupamento no console

    // Agrupando dados com base na seleção (meses, dias ou horas)
    for (let i = 0; i < data.length; i++) {
      const d = data[i];

      // Verificando se a estrutura de dados está correta
      if (d && typeof d === 'object' && 'year' in d && 'month' in d && 'day' in d && 'hours' in d && 'value' in d) {
        const yearMatch = Number(this.selectedYear) === d.year;
        const month = typeof d.month === 'number' ? d.month : Number(d.month);
        const day = typeof d.day === 'number' ? d.day : Number(d.day);
        const hour = typeof d.hours === 'number' ? d.hours : Number(d.hours);

        const monthMatch = (this.selectedMonth === 0 || this.selectedMonth === month);  // Permite qualquer mês se o mês não estiver selecionado
        const dayMatch = (this.selectedDay === 0 || this.selectedDay === day);  // Permite qualquer dia se o dia não estiver selecionado
        const hourMatch = (this.selectedDay === 0 && this.selectedMonth === 0 && d.year === Number(this.selectedYear)) || (this.selectedDay !== 0 && hour === this.selectedDay);

        // Verificando se a data corresponde à seleção e agregando conforme o agrupamento
        if (yearMatch || monthMatch || dayMatch || hourMatch) {
          // console.log('Ajustando dados para o agrupamento:', grouping);
          // console.log('day:', day, 'Valor:', d.value);
          if (grouping === 'hours' && hour >= 0 && hour < 24) {
            filteredData[hour] += Number(d.value);  // Agrega dados por hora

          } else if (grouping === 'days' && day >= 1 && day <= 31) {
            // console.log('Dia:', day, 'Valor:', d.value);
            filteredData[day - 1] += Number(d.value);  // Agrega dados por dia (de 1 a 31)
          } else if (grouping === 'months') {
            filteredData[month - 1] += Number(d.value);  // Agrega dados por mês
          }
        }
      } else {
        console.error(`Dado inválido na posição ${i}:`, d);  // Depuração para dados com formato incorreto
      }
    }

    // Verificando os dados após agregação
    // console.log('Filtered Data (Após agregação):', filteredData);

    // Gerando as cores para o gráfico
    const barColors = generateBlueToWhiteColors(filteredData.length);

    // Atualizando o gráfico
    if (this.chartOcupacaoLinha) {
      this.chartOcupacaoLinha.destroy();
    }

    // Se `filteredData` contiver dados, renderize o gráfico
    if (filteredData.some(data => data > 0)) {
      // Caso haja dados válidos
      this.chartOcupacaoLinha = new Chart('myChart', {
        type: 'bar',
        data: {
          labels: this.getLabelsForGrouping(grouping),  // Obtendo os rótulos corretos (meses, dias ou horas)
          datasets: [{
            label: 'Pessoas',
            data: filteredData,  // Usando os dados filtrados
            borderColor: '#42A5F5', // Cor da borda
            backgroundColor: barColors, // Cores gradientes
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: this.getXAxisTitleForGrouping(grouping),  // Título do eixo X conforme agrupamento
              }
            },
            y: {
              title: {
                display: true,
                text: 'Valor'
              }
            }
          }
        }
      });
    } else {
      // Caso não haja dados, mostra o gráfico com mensagem
      this.chartOcupacaoLinha = new Chart('myChart', {
        type: 'bar',
        data: {
          labels: this.getLabelsForGrouping(grouping),
          datasets: [{
            label: 'Sem Dados',
            data: new Array(filteredData.length).fill(0),  // Mostra um gráfico vazio
            borderColor: '#42A5F5', // Cor da borda
            backgroundColor: barColors, // Cores gradientes
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: this.getXAxisTitleForGrouping(grouping),
              }
            },
            y: {
              title: {
                display: true,
                text: 'Valor'
              }
            }
          },
          plugins: {
            legend: {
              display: false,  // Escondendo a legenda
            },
            tooltip: {
              enabled: false  // Desativa o tooltip
            }
          }
        }
      });

      // Exibindo uma mensagem de "Nenhum dado para exibir"
      // const noDataMessage = document.createElement('div');
      // noDataMessage.textContent = 'Nenhum dado para exibir no gráfico.';
      // noDataMessage.style.textAlign = 'center';
      // noDataMessage.style.fontSize = '18px';
      // noDataMessage.style.color = '#FF0000'; // Cor vermelha para destaque
      // document.getElementById('chart-container')?.appendChild(noDataMessage);

      // console.log('Nenhum dado para exibir no gráfico.');
    }

  }


  getChartData() {
    let data: { year: number; month: number; day: number; value: number }[] = [];
    const realData = this.getRealData();

    console.log('Real Data:', realData);

    // Garantir que o mês e o dia sejam pelo menos 1 se forem 0
    const validMonth = this.selectedMonth && this.selectedMonth !== 0 ? Number(this.selectedMonth) : 1;
    const validDay = this.selectedDay && this.selectedDay !== 0 ? Number(this.selectedDay) : 1;

    console.log('Valid Month:', validMonth, 'Valid Day:', validDay);

    // Verificar os dados reais para ver se o ano 2025 está presente
    const yearsInData = realData.map(d => d.year);
    console.log('Years in Data:', yearsInData); // Verifique todos os anos presentes nos dados

    if (this.selectedDay && this.selectedMonth) {
      console.log(`Filtering by Year: ${this.selectedYear}, Month: ${validMonth}, Day: ${validDay}`);
      data = realData.map(d => {
        const randomHour = Math.floor(Math.random() * 24); // Gera hora aleatória entre 0 e 23
        d.hours = randomHour;  // Adiciona o campo 'hours'

        const yearMatch = Number(this.selectedYear);
        const selectedYear = yearMatch;

        // Filtro com hora
        const isMatch = (selectedYear === d.year && d.month === validMonth && d.day === validDay);

        //console.log(`Match: ${isMatch}, Hour: ${randomHour}`);
        return isMatch ? d : null;  // Se houver match, retorna o item, caso contrário retorna null
      }).filter(d => d !== null);  // Filtra os valores nulos
    } else if (this.selectedMonth) {
      console.log(`Filtering by Year: ${this.selectedYear}, Month: ${validMonth}`);
      data = realData.filter(d => {
        const yearMatch = d.year === Number(this.selectedYear);
        const monthMatch = d.month === validMonth;
        //console.log(`Year Match: ${yearMatch}, Month Match: ${monthMatch}`);
        return yearMatch && monthMatch;
      });
    } else {
      console.log(`ANO BUCETA: ${this.selectedYear}`);
      data = realData.filter(d => {
        const selectedYear = Number(this.selectedYear); // Garanta que seja um número
        console.log(`COMPARANDO: ${d.year} ===== ${this.selectedYear}`);
        return d.year === selectedYear;
      });
    }

    // Verificar os dados filtrados
    console.log('Filtered Data:', data);

    // Verifique se não está retornando vazio por erro
    if (data.length === 0) {
      console.log('No data found for the selected filters!');
    }

    return data;
  }



  onMonthChange() {
    this.updateDays();
    this.selectedDay = 0;  // Resetar o dia ao mudar o mês
    this.updateChart();
  }

  onDayChange() {
    this.updateChart();
  }

  onYearChange() {
    this.selectedMonth = 0;  // Resetar o mês ao mudar o ano
    this.selectedDay = 0;    // Resetar o dia ao mudar o ano
    console.log('Selected Year:', this.selectedYear);
    this.updateChart();
  }



  getRealData() {
    return [
      { year: 2024, month: 1, day: 1, value: 75, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 1, day: 2, value: 80, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 1, day: 3, value: 65, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 1, day: 4, value: 78, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 1, day: 5, value: 72, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 2, day: 1, value: 85, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 2, day: 2, value: 90, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 2, day: 3, value: 89, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 3, day: 31, value: 70, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 12, day: 22, value: 85, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 12, day: 22, value: 90, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 12, day: 22, value: 89, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 12, day: 22, value: 70, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 12, day: 22, value: 60, hours: Math.floor(Math.random() * 24) },
      { year: 2024, month: 12, day: 22, value: 65, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 5, day: 1, value: 80, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 5, day: 2, value: 85, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 1, day: 1, value: 75, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 1, day: 2, value: 80, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 1, day: 3, value: 65, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 1, day: 5, value: 78, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 2, day: 5, value: 72, hours: 15 },
      { year: 2025, month: 2, day: 5, value: 85, hours: 18 },
      { year: 2025, month: 2, day: 5, value: 90, hours: 8 },
      { year: 2025, month: 2, day: 5, value: 89, hours: 12 },
      { year: 2025, month: 3, day: 1, value: 70, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 3, day: 2, value: 75, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 3, day: 31, value: 60, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 5, day: 2, value: 65, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 5, day: 1, value: 80, hours: Math.floor(Math.random() * 24) },
      { year: 2025, month: 5, day: 2, value: 85, hours: Math.floor(Math.random() * 24) }
    ];
  }

  getChartLabels() {
    let labels: string[] = [];
    if (this.selectedDay) {
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    } else if (this.selectedMonth) {
      const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => `Dia ${i + 1}`);
    } else {
      labels = this.months.map(m => `${m}`);
    }
    return labels;
  }

}
