import 'package:flutter/material.dart';
import 'services/AcademiaService.dart'; // Importando a função fetchAcademiaByID
import 'package:fl_chart/fl_chart.dart'; // Importando o fl_chart
import 'package:flutter/animation.dart';

class DetalhesAcademiaScreen extends StatefulWidget {
  final String academiaId;

  const DetalhesAcademiaScreen({Key? key, required this.academiaId})
      : super(key: key);

  @override
  _DetalhesAcademiaScreenState createState() => _DetalhesAcademiaScreenState();
}

class _DetalhesAcademiaScreenState extends State<DetalhesAcademiaScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _ocupadosAnimation;
  late Animation<double> _desocupadosAnimation;

  final List<String> _divisoes = [
    "Peito",
    "Costas",
    "Ombro",
    "Bíceps",
    "Tríceps",
    "Quadríceps",
    "Posterior",
    "Panturrilha",
    "Abdômen",
    "Cardio",
  ];

  @override
  void initState() {
    super.initState();

    // Inicializando o AnimationController
    _animationController =
        AnimationController(vsync: this, duration: const Duration(seconds: 0));

    // Animando os valores dos percentuais
    _ocupadosAnimation =
        Tween<double>(begin: 0.0, end: 0.0).animate(_animationController);
    _desocupadosAnimation =
        Tween<double>(begin: 0.0, end: 0.0).animate(_animationController);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Widget _buildPieChart(
      double percentualOcupados, double percentualDesocupados) {
    return PieChart(
      PieChartData(
        sections: [
          PieChartSectionData(
            value: percentualOcupados,
            color: Color(0xFFFF6384), // Cor OCUPADO
            title: '${percentualOcupados.toStringAsFixed(2)}%',
            radius: 50,
            showTitle: true,
          ),
          PieChartSectionData(
            value: percentualDesocupados,
            color: Color(0xFF36A2EB), // Cor DISPONÍVEL
            title: '${percentualDesocupados.toStringAsFixed(2)}%',
            radius: 50,
            showTitle: true,
          ),
        ],
        borderData: FlBorderData(show: false),
        centerSpaceRadius: 40,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Detalhes',
          style: TextStyle(color: Colors.white), // Cor do texto da AppBar
        ),
        backgroundColor: const Color(0xFF201D48), // Cor de fundo da AppBar
        iconTheme: const IconThemeData(color: Colors.white), // Cor do ícone
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: AcademiaService().fetchAcademiaByID(widget.academiaId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(
              child: Text('Erro: ${snapshot.error}',
                  style: TextStyle(color: Colors.white)),
            );
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: Text('Academia não encontrada.',
                  style: TextStyle(color: Colors.white)),
            );
          } else {
            var equipamentos = snapshot.data!;
            int totalEquipamentos = equipamentos.length;
            int ocupados =
                equipamentos.where((e) => e['ocupado'] == true).length;
            int desocupados = totalEquipamentos - ocupados;

            // Calculando percentuais gerais
            double percentualOcupadosFinal =
                (ocupados / totalEquipamentos) * 100;
            double percentualDesocupadosFinal =
                (desocupados / totalEquipamentos) * 100;

            _ocupadosAnimation = Tween<double>(
              begin: _ocupadosAnimation.value,
              end: percentualOcupadosFinal,
            ).animate(_animationController);

            _desocupadosAnimation = Tween<double>(
              begin: _desocupadosAnimation.value,
              end: percentualDesocupadosFinal,
            ).animate(_animationController);

            _animationController.forward();

            return Container(
              color: const Color(0xFF141332),
              padding: const EdgeInsets.all(16.0),
              child: ListView(
                children: [
                  const Text(
                    'Lotação geral:',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 20),
                  AnimatedBuilder(
                    animation: _animationController,
                    builder: (context, child) {
                      return Column(
                        children: [
                          Container(
                            height: 250,
                            child: _buildPieChart(
                              _ocupadosAnimation.value,
                              _desocupadosAnimation.value,
                            ),
                          ),
                          const SizedBox(
                              height: 10), // Espaço entre o gráfico e a legenda
                          Row(
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 20,
                                    height: 20,
                                    color: Color(0xFF36A2EB), // Cor DISPONÍVEL
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Disponível',
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ],
                              ),
                              Expanded(
                                child:
                                    Container(), // Preenchendo o espaço restante
                              ),
                              Row(
                                children: [
                                  Container(
                                    width: 20,
                                    height: 20,
                                    color: Color(0xFFFF6384), // Cor OCUPADO
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Ocupados',
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Lotação por divisão:',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ..._divisoes.map((divisao) {
                    var equipamentosDivisao = equipamentos
                        .where((e) => e['divisao'] == divisao)
                        .toList();
                    int totalDivisao = equipamentosDivisao.length;
                    if (totalDivisao == 0) return Container();

                    int ocupadosDivisao = equipamentosDivisao
                        .where((e) => e['ocupado'] == true)
                        .length;
                    int desocupadosDivisao = totalDivisao - ocupadosDivisao;

                    double percentualOcupadosDivisao =
                        (ocupadosDivisao / totalDivisao) * 100;
                    double percentualDesocupadosDivisao =
                        (desocupadosDivisao / totalDivisao) * 100;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          divisao,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Column(
                          children: [
                            Container(
                              height: 200,
                              child: _buildPieChart(
                                percentualOcupadosDivisao,
                                percentualDesocupadosDivisao,
                              ),
                            ),
                            const SizedBox(
                                height: 10), // Espaço entre gráfico e legenda
                            Row(
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 20,
                                      height: 20,
                                      color:
                                          Color(0xFF36A2EB), // Cor DISPONÍVEL
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Disponível',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                  ],
                                ),
                                Expanded(
                                  child:
                                      Container(), // Preenchendo o espaço restante
                                ),
                                Row(
                                  children: [
                                    Container(
                                      width: 20,
                                      height: 20,
                                      color: Color(0xFFFF6384), // Cor OCUPADO
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Ocupados',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                      ],
                    );
                  }).toList(),
                ],
              ),
            );
          }
        },
      ),
    );
  }
}
