import 'package:flutter/material.dart';
import 'package:gymia_mobile/DetalhesAcademiaScreen.dart';
import '../services/AcademiaService.dart';

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  late Future<List<Map<String, dynamic>>> academiasFuture;
  late List<Map<String, dynamic>> academias; // Lista de academias
  List<Map<String, dynamic>> filteredAcademias = []; // Lista filtrada
  TextEditingController searchController =
      TextEditingController(); // Controlador do input

  @override
  void initState() {
    super.initState();
    // Inicializa o Future com a função fetchAcademias
    academiasFuture = AcademiaService().fetchAcademias();

    // Adiciona um then para imprimir os dados retornados
    academiasFuture.then((data) {
      //print('Dados retornados do fetchAcademias: $data');
    }).catchError((error) {
      print('Erro ao buscar academias: $error');
    });
  }

  void filterAcademias(String query) {
    setState(() {
      // Se a query estiver vazia, exibe todas as academias
      if (query.isEmpty) {
        filteredAcademias = List.from(
            academias); // Exibe todas as academias se a query estiver vazia
      } else {
        filteredAcademias = academias.where((academia) {
          // Remove espaços extras e converte para minúsculas para comparação case-insensitive
          final nome = academia['nome']?.toString().trim().toLowerCase() ?? '';
          final endereco =
              academia['endereco']?.toString().trim().toLowerCase() ?? '';
          final searchQuery =
              query.trim().toLowerCase(); // Remove espaços da pesquisa

          // Filtra academias onde o nome ou o endereço contém a query
          return nome.contains(searchQuery) || endereco.contains(searchQuery);
        }).toList();
      }

      // Exibe a lista completa em um único print
      final academiasFiltradasFormatadas = filteredAcademias
          .map((academia) => 'Nome: ${academia['nome']}')
          .join('\n');
      print('Academias filtradas:\n$academiasFiltradasFormatadas');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Academias',
          style: TextStyle(
              color: Colors.white), // Definindo a cor do texto como branco
        ),
        backgroundColor: const Color(0xFF201D48), // Cor de fundo da AppBar
      ),
      backgroundColor: const Color(0xFF141332),
      body: Center(
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: academiasFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CircularProgressIndicator();
            } else if (snapshot.hasError) {
              return Text('Erro: ${snapshot.error}');
            } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const Text('Nenhuma academia encontrada.');
            } else {
              // Inicializa apenas uma vez
              if (filteredAcademias.isEmpty) {
                academias = snapshot.data!;
                filteredAcademias = List.from(academias);
              }

              return SingleChildScrollView(
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Campo de pesquisa com altura ajustada
                          Container(
                            width: MediaQuery.of(context).size.width - 40,
                            child: TextField(
                              controller: searchController,
                              onChanged: (query) => filterAcademias(query),
                              decoration: InputDecoration(
                                labelText: 'Filtrar por nome ou endereço',
                                labelStyle:
                                    const TextStyle(color: Colors.white),
                                filled: true,
                                fillColor: const Color(0xFF201D48),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                                prefixIcon: const Icon(
                                  Icons.search,
                                  color: Colors.white,
                                ),
                              ),
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                          const SizedBox(height: 10),
                          // Tabela com altura ajustada (60% da altura da tela)
                          Container(
                            width: MediaQuery.of(context).size.width - 40,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF201D48),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              children: [
                                SizedBox(
                                  height: MediaQuery.of(context).size.height *
                                      0.6, // 60% da altura da tela
                                  child: SingleChildScrollView(
                                    child: DataTable(
                                      columns: const <DataColumn>[
                                        DataColumn(
                                          label: SizedBox(
                                            width: 100,
                                            child: Text('Academia',
                                                style: TextStyle(
                                                    color: Colors.white)),
                                          ),
                                        ),
                                        DataColumn(
                                          label: SizedBox(
                                            width: 80,
                                            child: Text('Ocupação',
                                                style: TextStyle(
                                                    color: Colors.white)),
                                          ),
                                        ),
                                      ],
                                      headingRowColor:
                                          MaterialStateProperty.all(
                                              const Color(0xFF201D48)),
                                      dataRowColor: MaterialStateProperty.all(
                                          const Color(0xFF201D48)),
                                      rows: filteredAcademias
                                          .map(
                                            (academia) => DataRow(
                                              cells: <DataCell>[
                                                DataCell(
                                                  GestureDetector(
                                                    onTap: () {
                                                      // Navegar para a tela de detalhes da academia
                                                      Navigator.push(
                                                        context,
                                                        MaterialPageRoute(
                                                          builder: (context) =>
                                                              DetalhesAcademiaScreen(
                                                            academiaId:
                                                                academia['id']
                                                                    .toString(),
                                                          ),
                                                        ),
                                                      );
                                                    },
                                                    child: Container(
                                                      padding: const EdgeInsets
                                                          .symmetric(
                                                          vertical: 10.0),
                                                      child: Column(
                                                        crossAxisAlignment:
                                                            CrossAxisAlignment
                                                                .start,
                                                        children: [
                                                          Text(
                                                            academia['nome'] ??
                                                                '',
                                                            style:
                                                                const TextStyle(
                                                                    color: Colors
                                                                        .white),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                DataCell(
                                                  Container(
                                                    padding: const EdgeInsets
                                                        .symmetric(
                                                        vertical: 10.0),
                                                    child: Text(
                                                      academia['lotacao'] !=
                                                              null
                                                          ? '${academia['lotacao']}%'
                                                          : 'N/A',
                                                      style: const TextStyle(
                                                          color: Colors.white),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          )
                                          .toList(),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }
          },
        ),
      ),
    );
  }
}
